import { Client, LocalAuth, Message } from 'whatsapp-web.js';
import { toDataURL } from 'qrcode';
import express, { Express, Response } from 'express';

import { ADD_APPOINTMENT_BEHAVIOR_DESCRIPTION } from './shared/constants/ales-bible.constants';
import {
  AppConstants,
  AuxiliarMessages,
  ErrorMessages,
  FunctionNames,
  GptRoles,
  MediaNotSupportedResponses,
  MediaTypes,
  NotificationContacts,
  RegexExpressions,
  ResponseMessages,
  TimeoutDurations
} from './shared/constants/app.constants';
import { CoreUtilFunctions } from './services/core-utils.service';
import { ExtendedMessage } from './shared/interfaces/gpt-interfaces';
import { GPTAssistant } from './services/gpt-assisntant.service';
import { MongoService } from './services/mongodb.service';

/**
 * @description Handles WhatsApp bot interactions and server initialization.
 */
export class QuestlyAIssistant {
  private app!: Express;
  private assistant: GPTAssistant;
  private client: Client;
  private mongoService: MongoService;
  private port: number;
  private qrCode: string;
  private userMessages: Map<string, ExtendedMessage[]>;
  private userMessageTimers: Map<string, NodeJS.Timeout>;
  private utils: CoreUtilFunctions;

  /**
   * @description Initializes the QuestlyAIssistant with necessary services and client configuration.
   */
  constructor() {
    this.assistant = new GPTAssistant();
    this.mongoService = MongoService.getInstance();
    this.port = Number(process.env.PORT) || AppConstants.CURRENT_PORT;
    this.qrCode = AppConstants.EMPTY_STRING;
    this.userMessages = new Map();
    this.userMessageTimers = new Map();
    this.utils = new CoreUtilFunctions();
    this.client = new Client({
      authStrategy: new LocalAuth(),
      puppeteer: {
        args: [
          AppConstants.PUPPETEER_PATCH_NO_SANDBOX,
          AppConstants.PUPPETEER_PATCH_NO_UID
        ]
      },
      webVersionCache: {
        type: AppConstants.REMOTE_KEY,
        remotePath: AppConstants.WEB_VERSION_PATCH
      }
    });

    this.initialize();
  }

  /**
   * @description Initializes the MongoDB connection, Express app, and WhatsApp client.
   */
  private initialize(): void {
    this.mongoService.connect();
    this.app = express();
    this.initializeClient();
    this.initializeRoutes();
    this.startServer();
  }

  /**
   * @description Sets up event listeners for the WhatsApp client.
   */
  private initializeClient(): void {
    this.client.on(AppConstants.QR_KEY, this.onQrCode.bind(this));
    this.client.on(AppConstants.READY_KEY, this.onClientReady.bind(this));
    this.client.on(AppConstants.MESSAGE_KEY, this.onMessageReceived.bind(this));
    this.client.initialize();
  }

  /**
   * @description Generates and displays the QR code for WhatsApp Web authentication.
   * @param {string} qr - The QR code string to be generated and displayed.
   */
  private async onQrCode(qr: string): Promise<void> {
    this.qrCode = await toDataURL(qr);
  }

  /**
   * @description Logs a message when the WhatsApp client is ready.
   */
  private onClientReady(): void {
    console.log(AppConstants.CLIENT_IS_READY);
  }

  /**
   * @description Processes received WhatsApp messages.
   * @param {ExtendedMessage} message - The message object received from WhatsApp.
   */
  private async onMessageReceived(message: ExtendedMessage): Promise<void> {
    try {
      const currentSenderId = message.from.replace(RegexExpressions.GET_JUST_NUMBER, AppConstants.ONE_DOLLAR);
      const messageContent = message.body;
      console.log(`${AuxiliarMessages.MessageReceivedFrom} ${currentSenderId}: ${messageContent}`);

      let context = await this.assistant.getContextByChatId(currentSenderId);

      if (context) {
        if (!context.shouldRespond && this.utils.isMoreThanDaysAgo(context.timeOfLastMessage, 0.5)) {
          context.shouldRespond = true;
          context = await this.assistant.updateShouldRespond(currentSenderId, true);
        }
      }

      if (!context || context.shouldRespond) {
        this.handleMessageStorage(currentSenderId, message);

        this.userMessageTimers.set(currentSenderId, setTimeout(async () => {
          await this.processGroupedMessages(currentSenderId);
        }, TimeoutDurations.TimeBetweenMessages));
      }
    } catch (error) {
      console.error(ErrorMessages.DefaultMessage, error);
    }
  }

  /**
   * @description Stores and groups received messages by sender ID.
   * @param {string} senderId - The ID of the sender.
   * @param {ExtendedMessage} message - The received message.
   */
  private handleMessageStorage(senderId: string, message: ExtendedMessage): void {
    if (this.userMessages.has(senderId)) {
      this.userMessages.get(senderId)!.push(message);
      clearTimeout(this.userMessageTimers.get(senderId)!);
    } else {
      this.userMessages.set(senderId, [message]);
    }
  }

  /**
   * @description Processes grouped messages for a sender when the timer expires.
   * @param {string} senderId - The ID of the sender.
   */
  private async processGroupedMessages(senderId: string): Promise<void> {
    let userName: string = AppConstants.DEF_USER_NAME;
    const messages = this.userMessages.get(senderId);
    if (!messages || messages.length === 0) return;

    const combinedMessageContent = this.combineMessagesContent(messages);
    const firstMessage = messages[0];
    if (firstMessage._data?.notifyName) {
      userName = this.utils.cutUntilSpace(firstMessage._data.notifyName) ?? firstMessage._data.notifyName;
    }
    const mediaType = this.getFirstMediaType(messages);

    if (this.isSingleEmptyMediaMessage(messages)) {
      await this.handleSingleEmptyMediaMessage(senderId, userName, firstMessage);
    } else {
      await this.handleTextMessage(combinedMessageContent, senderId, userName, firstMessage, mediaType);
    }

    this.clearUserMessages(senderId);
  }

  /**
   * @description Combines the content of multiple messages into a single string.
   * @param {ExtendedMessage[]} messages - The array of messages to combine.
   * @returns {string} - The combined message content.
   */
  private combineMessagesContent(messages: ExtendedMessage[]): string {
    return messages.map(msg => msg.body).join(AppConstants.BLANK_SPACE);
  }

  /**
   * @description Checks if any message in the array contains media and returns the type of the first media message.
   * @param {ExtendedMessage[]} messages - The array of messages to check.
   * @returns {string | null} - The type of the first media message if detected, otherwise null.
   */
  private getFirstMediaType(messages: ExtendedMessage[]): string {
    const mediaMessage = messages.find(msg => msg.hasMedia);
    return mediaMessage ? mediaMessage.type : AppConstants.EMPTY_STRING;
  }

  /**
   * @description Checks if the messages array contains a single empty media message.
   * @param {ExtendedMessage[]} messages - The array of messages to check.
   * @returns {boolean} - True if it contains a single empty media message, false otherwise.
   */
  private isSingleEmptyMediaMessage(messages: ExtendedMessage[]): boolean {
    return messages.length === 1 && messages[0].hasMedia && messages[0].body === AppConstants.EMPTY_STRING;
  }

  /**
   * @description Handles a single empty media message by replying with a specific response.
   * @param {string} senderId - The ID of the sender.
   * @param {string} userName - The user name of the sender.
   * @param {Message} message - The message object received from WhatsApp.
   */
  private async handleSingleEmptyMediaMessage(senderId: string, userName: string, message: ExtendedMessage): Promise<void> {
    let messageByMediaType: string;
    let responseText: string;
    let context = await this.assistant.getContextByChatId(senderId);
    const messageType = message.type as string;

    if (!context) {
      context = await this.assistant.createInitialContext(AppConstants.EMPTY_STRING, senderId, userName);
    }

    if (context.isFirstContact) {
      messageByMediaType = this.getErrorMessageByMediaType(messageType, false);
      if (userName !== AppConstants.DEF_USER_NAME) {
        responseText = `${ResponseMessages.FirstContact1}${userName}${ResponseMessages.FirstContact2}\n\n${messageByMediaType}`;
      } else {
        responseText = `${ResponseMessages.FirstContactWithNoName}\n\n${messageByMediaType}`;
      }
      context.chatHistory.push({
        role: GptRoles.Assistant,
        content: responseText
      });
      context.isFirstContact = false;
      await context.save();

      await message.reply(responseText);
    } else {
      messageByMediaType = this.getErrorMessageByMediaType(messageType, true);
      await this.assistant.addNewMessage(messageByMediaType, senderId, GptRoles.Assistant);
      await message.reply(messageByMediaType);
    }

    this.clearUserMessages(senderId);
  }

  /**
   * @description Handles text messages received from WhatsApp.
   * @param {string} messageContent - The content of the received message.
   * @param {string} senderId - The ID of the sender.
   * @param {string} senderUserName - The user name of the sender.
   * @param {Message} message - The message object received from WhatsApp.
   * @param {boolean} mediaType - Indicates if any message contains media.
   */
  private async handleTextMessage(messageContent: string, senderId: string, senderUserName: string, message: Message, mediaType: string): Promise<void> {
    try {
      const processed = await this.assistant.processFunctions(messageContent, senderId, senderUserName);

      let responseText: string;
      switch (processed.functionName) {
        case FunctionNames.AddApointment:
          responseText = await this.assistant.processResponse(FunctionNames.AddApointment, ResponseMessages.RedirectToWebsite, senderId, ADD_APPOINTMENT_BEHAVIOR_DESCRIPTION);
          break;
        case FunctionNames.FirstConcact:
          if (senderUserName !== AppConstants.DEF_USER_NAME) {
            responseText = `${ResponseMessages.FirstContact1}${senderUserName}${ResponseMessages.FirstContact2}`;
          } else {
            responseText = ResponseMessages.FirstContactWithNoName;
          }
          break;
        case FunctionNames.TalkToHuman:
          await this.assistant.updateShouldRespond(senderId, false);
          responseText = ResponseMessages.StopConversation;
          await this.assistant.addNewMessage(responseText, senderId, GptRoles.Assistant);
          const notificationMessage = `${ResponseMessages.PendingMessage1}${senderUserName}${ResponseMessages.PendingMessage2} ${senderId} ${ResponseMessages.PendingMessage3}`;
          await this.sendNotification(NotificationContacts.TestContact, notificationMessage);
          break;
        case FunctionNames.GetCustomResponse:
          responseText = ResponseMessages.GetCustomResponse;
          await this.assistant.addNewMessage(responseText, senderId, GptRoles.Assistant);
          break;
        default:
          responseText = processed.message.content as string;
          break;
      }

      if (mediaType !== AppConstants.EMPTY_STRING) {
        const messageType = message.type as string;
        const messageByMediaType = this.getErrorMessageByMediaType(messageType, false);
        if (messageByMediaType !== AppConstants.EMPTY_STRING) {
          responseText += `\n\n${messageByMediaType}`;
        }
      }

      await message.reply(responseText);
    } catch (error) {
      console.error(ErrorMessages.DefaultMessage, error);
    }
  }

  /**
   * @description Clears the stored messages and timers for a specific sender.
   * @param {string} senderId - The ID of the sender.
   */
  private clearUserMessages(senderId: string): void {
    this.userMessages.delete(senderId);
    this.userMessageTimers.delete(senderId);
  }

  /**
   * @description Starts the Express server.
   */
  private startServer(): void {
    this.app.listen(this.port, AppConstants.DEF_PUBLIC_IP, () => {
      console.log(AppConstants.SERVER_RUNNING_MESSAGE);
    });
  }

  /**
   * @description Initializes the Express routes.
   */
  private initializeRoutes(): void {
    this.app.get(AppConstants.QR_ROUTE, (_, res) => this.getQrCode(res));
  }  

  /**
   * @description Handles the request for the QR code.
   * @param {Response} res - The response object.
   */
  private async getQrCode(res: Response): Promise<void> {
    if (this.qrCode) {
      res.send(`${AppConstants.QR_CODE_GEN_01}${this.qrCode} ${AppConstants.QR_CODE_GEN_02}`);
    } else {
      res.send(ErrorMessages.shouldRereshQrView);
    }
  }

  /**
   * @description Sends a notification to a specified phone number.
   * @param {string} phoneNumber - The phone number to send the notification to.
   * @param {string} message - The message to send.
   */
  private async sendNotification(phoneNumber: string, message: string): Promise<void> {
    try {
      await this.client.sendMessage(phoneNumber, message);
    } catch (error) {
      console.error(`${ErrorMessages.NotificationFailed} ${phoneNumber}`, error);
    }
  }

  /**
   * @description Gets the error message based on the media type.
   * @param {string} messageType - The type of the media message.
   * @param {boolean} isSingleEmptyMediaMessage - Indicates if it's a single empty media message.
   * @returns {string} - The error message for the specified media type.
   */
  private getErrorMessageByMediaType(messageType: string, isSingleEmptyMediaMessage: boolean): string {
    switch (messageType) {
      case MediaTypes.Sticker:
        return isSingleEmptyMediaMessage ? MediaNotSupportedResponses.Sticker : AppConstants.EMPTY_STRING;
      case MediaTypes.Image:
        return isSingleEmptyMediaMessage ? MediaNotSupportedResponses.Image : MediaNotSupportedResponses.ImageComplement;
      case MediaTypes.Video:
        return isSingleEmptyMediaMessage ? MediaNotSupportedResponses.Video : MediaNotSupportedResponses.VideoComplement;
      case MediaTypes.Audio:
        return isSingleEmptyMediaMessage ? MediaNotSupportedResponses.Audio : MediaNotSupportedResponses.AudioComplement;
      case MediaTypes.VoiceMessage:
        return isSingleEmptyMediaMessage ? MediaNotSupportedResponses.Audio : MediaNotSupportedResponses.AudioComplement;
      default:
        return isSingleEmptyMediaMessage ? MediaNotSupportedResponses.Default : MediaNotSupportedResponses.DefaultComplement;
    }
  }
}
