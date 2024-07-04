import { Client, LocalAuth, Message, MessageMedia} from 'whatsapp-web.js';
import { toDataURL } from 'qrcode';
import express, { Express, Response } from 'express';
import path from 'path';
import Tesseract from 'tesseract.js';

import { ADD_APPOINTMENT_BEHAVIOR_DESCRIPTION } from './shared/constants/ales-bible.constants';
import {
  AppConstants,
  AuxiliarMessages,
  DefinedPaths,
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
  private currentNotificationUser: string;
  private isProcessingMessages: boolean;
  private mongoService: MongoService;
  private port: number;
  private qrCode: string;
  private tempMessageQueue: Map<string, ExtendedMessage[]>;
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
    this.tempMessageQueue = new Map();
    this.isProcessingMessages = false;
    this.currentNotificationUser = NotificationContacts.MainContact;
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
    this.client.on(AppConstants.MESSAGE_CREATE_KEY, this.onMessageCreated.bind(this));
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
      const currentSenderId = message.from.replace(RegexExpressions.GET_PHONE_NUMBER, AppConstants.ONE_DOLLAR);
      if (currentSenderId !== NotificationContacts.Broadcast) {
        const messageContent = message.body;
        console.log(`${AuxiliarMessages.MessageReceivedFrom}${currentSenderId}: ${messageContent}`);

        let context = await this.assistant.getContextByChatId(currentSenderId);

        if (context) {
          if (context.shouldDeleteAfterContact && this.utils.isMoreThanDaysAgo(context.timeOfLastMessage, 0.5)) {
            await this.assistant.deleteContextByChatId(currentSenderId);
            context = await this.assistant.getContextByChatId(currentSenderId);
          } else if (!context.shouldRespond && this.utils.isMoreThanDaysAgo(context.timeOfLastMessage, 0.5)) {
            context.shouldRespond = true;
            context = await this.assistant.updateContext({
              chatId: currentSenderId,
              updateFields: { shouldRespond: true }
            });
          }
        }

        if (!context || context.shouldRespond) {
          this.handleMessageStorage(currentSenderId, message);
        }
      }
    } catch (error) {
      console.error(ErrorMessages.DefaultMessage, error);
    }
  }

  /**
   * @description Handles the creation of messages from the bot's own number and performs specific actions based on the message content.
   * @param {ExtendedMessage} message - The message object received from WhatsApp.
   */
  private async onMessageCreated(message: ExtendedMessage): Promise<void> {
    try {
      if (message.fromMe && message.from === message.to) {
        const messageContent = message.body;
        console.log(`${AuxiliarMessages.MessageReceivedFrom}${GptRoles.System}: ${messageContent}`);

        if (messageContent.includes(AppConstants.NOT_REPLY)) {
          return;
        }

        let phoneNumber: string | null = null;

        const phoneNumberMatch = messageContent.match(RegexExpressions.GET_FIRST_TEN_NUMBERS);
        if (phoneNumberMatch) {
          phoneNumber = phoneNumberMatch[0];
        } else {
          const vCardLine = messageContent.split('\n').find(line => line.includes(AppConstants.TEL_KEY));
          if (vCardLine) {
            const vCardPhoneMatch = vCardLine.match(RegexExpressions.V_CARD_PHONE_EXTRACTOR);
            if (vCardPhoneMatch) {
              phoneNumber = vCardPhoneMatch[0].replace(RegexExpressions.REMOVE_NON_DIGIT_CHAR, AppConstants.EMPTY_STRING);
              if (phoneNumber.startsWith(AppConstants.MX_PREFIX)) {
                phoneNumber = phoneNumber.substring(3);
              } else if (phoneNumber.startsWith(AppConstants.MX_SIMPLE_PREFIX)) {
                phoneNumber = phoneNumber.substring(2);
              }
            }
          }
        }

        if (phoneNumber) {
          let context = await this.assistant.getContextByChatId(phoneNumber);
          if (context) {
            context = await this.assistant.updateContext({
              chatId: phoneNumber,
              updateFields: { shouldRespond: false }
            });
          } else {
            context = await this.assistant.addNewUserMessage(`${AuxiliarMessages.TempContext}${phoneNumber}`, phoneNumber, AppConstants.DEF_USER_NAME);
            await this.assistant.updateContext({
              chatId: phoneNumber,
              updateFields: { shouldRespond: false, shouldDeleteAfterContact: true, timeOfLastMessage: new Date() }
            });
          }
          const responseText = `${ResponseMessages.NotificationSystem}\n\n${ResponseMessages.ManualDeactivation}\n\n${phoneNumber}
            \n${ResponseMessages.NoInterruptionContact}\n\n${AppConstants.NOT_REPLY}`;

          await message.reply(responseText);

          return;
        }
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
    if (this.isProcessingMessages) {
      if (this.tempMessageQueue.has(senderId)) {
        this.tempMessageQueue.get(senderId)!.push(message);
      } else {
        this.tempMessageQueue.set(senderId, [message]);
      }
      return;
    }

    if (this.userMessages.has(senderId)) {
      this.userMessages.get(senderId)!.push(message);
      if (this.userMessageTimers.has(senderId)) {
        clearTimeout(this.userMessageTimers.get(senderId)!);
      }
    } else {
      this.userMessages.set(senderId, [message]);
    }

    this.userMessageTimers.set(senderId, setTimeout(async () => {
      this.isProcessingMessages = true;
      await this.processGroupedMessages(senderId);
      this.isProcessingMessages = false;

      this.processTempQueue(senderId);
    }, TimeoutDurations.TimeBetweenMessages));
  }

  /**
   * @description Processes grouped messages for a sender when the timer expires.
   * @param {string} senderId - The ID of the sender.
   */
  private async processGroupedMessages(senderId: string): Promise<void> {
    const messages = this.userMessages.get(senderId);
    if (!messages || messages.length === 0) return;

    const firstMessage = messages[0];
    const userName = this.getUserName(firstMessage._data?.notifyName);
    const mediaType = this.getFirstMediaType(messages);

    if (this.isSingleEmptyMediaMessage(messages)) {
      await this.handleSingleEmptyMediaMessage(senderId, userName, firstMessage, mediaType);
    } else {
      await this.handleTextMessage(messages, senderId, userName, firstMessage, mediaType);
    }

    this.clearUserMessages(senderId);
  }

  /**
   * @description Combines the content of multiple messages into a single string.
   * @param {ExtendedMessage[]} messages - The array of messages to combine.
   * @returns {string} - The combined message content.
   */
  private combineMessagesContent(messages: ExtendedMessage[]): string {
    return messages.map(msg => {
      if (!msg.body) {
        return msg.type as string === MediaTypes.VoiceMessage ? `*${MediaTypes.Audio}*` : `*${msg.type}*`;
      }
      return msg.body;
    }).join(AppConstants.BLANK_SPACE);
  }

  /**
   * @description Checks if all non-chat messages are of the same type and returns that type, otherwise returns 'chat' if there is a mix of types.
   * @param {ExtendedMessage[]} messages - The array of messages to check.
   * @returns {string} - The type of the non-chat messages if they are all the same, otherwise 'chat'.
   */
  private getFirstMediaType(messages: ExtendedMessage[]): string {
    const nonChatMessages = messages.filter(msg => msg.type as string !== MediaTypes.Chat);

    if (nonChatMessages.length === 0) {
      return MediaTypes.Chat;
    }

    const firstType = nonChatMessages[0].type;
    const allSameType = nonChatMessages.every(msg => msg.type === firstType);

    return allSameType ? firstType : MediaTypes.Mixed;
  }

  /**
   * @description Checks if the messages array contains a single empty media message.
   * @param {ExtendedMessage[]} messages - The array of messages to check.
   * @returns {boolean} - True if it contains a single empty media message, false otherwise.
   */
  private isSingleEmptyMediaMessage(messages: ExtendedMessage[]): boolean {
    return messages.length === 1 && messages[0].hasMedia;
  }

  /**
   * @description Handles a single empty media message by replying with a specific response.
   * @param {string} senderId - The ID of the sender.
   * @param {string} userName - The user name of the sender.
   * @param {Message} message - The message object received from WhatsApp.
   * @param {string} mediaType - Indicates the message main media type.
   */
  private async handleSingleEmptyMediaMessage(senderId: string, userName: string, message: ExtendedMessage, mediaType: string): Promise<void> {
    let messageByMediaType: string;
    let responseText: string;
    const context = await this.assistant.getContextByChatId(senderId) || await this.assistant.addNewUserMessage(`*${mediaType}*`, senderId, userName);
    const messageType = message.type as string;
    let isBankTransferImage = false;

    if (mediaType === MediaTypes.Image) {
      isBankTransferImage = await this.detectBankTransfer(message, senderId);
    }

    if (context.isFirstContact) {
      messageByMediaType = isBankTransferImage ? AppConstants.EMPTY_STRING : this.getErrorMessageByMediaType(messageType, false);
      const messageByUsername = userName !== AppConstants.DEF_USER_NAME
        ? `${ResponseMessages.FirstContact1}${userName}${ResponseMessages.FirstContact2}`
        : `${ResponseMessages.FirstContactWithNoName}`;
      responseText = messageByMediaType !== AppConstants.EMPTY_STRING ? `${messageByUsername}\n\n${messageByMediaType}` : messageByUsername;

      await this.assistant.addNewMessage(responseText, senderId, GptRoles.Assistant);
      await message.reply(responseText);
    } else {
      if (!isBankTransferImage) {
        messageByMediaType = this.getErrorMessageByMediaType(messageType, true);

        await this.assistant.addNewMessage(`*${messageType}*`, senderId, GptRoles.User);
        await this.assistant.addNewMessage(messageByMediaType, senderId, GptRoles.Assistant);
        await message.reply(messageByMediaType);
      }
    }

    this.clearUserMessages(senderId);
  }

  /**
   * @description Handles text messages received from WhatsApp.
   * @param {ExtendedMessage[]} messages - The array of received messages.
   * @param {string} senderId - The ID of the sender.
   * @param {string} senderUserName - The user name of the sender.
   * @param {Message} message - The message object received from WhatsApp.
   * @param {string} mediaType - Indicates the message main media type.
   */
  private async handleTextMessage(messages: ExtendedMessage[], senderId: string, senderUserName: string, message: Message, mediaType: string): Promise<void> {
    try {
      const messagesToCombine = [];
      let isBankTransferImage = false;
      
      for (const message of messages) {
        const isBankTransfer = await this.detectBankTransfer(message, senderId);
        if (isBankTransfer) {
          isBankTransferImage = true;
        } else {
          messagesToCombine.push(message);
        }
      }

      const messageContent = this.combineMessagesContent(messagesToCombine);
      const processed = await this.assistant.processFunctions(messageContent, senderId, senderUserName);

      let responseText: string;
      let currentClientName: string;
      let notificationMessage: string;
      switch (processed.functionName) {
        case FunctionNames.AddApointment:
          responseText = await this.assistant.processResponse(FunctionNames.AddApointment, ResponseMessages.RedirectToWebsite, senderId, ADD_APPOINTMENT_BEHAVIOR_DESCRIPTION);
          break;
        case FunctionNames.FirstConcact:
          responseText = senderUserName !== AppConstants.DEF_USER_NAME
            ? `${ResponseMessages.FirstContact1}${senderUserName}${ResponseMessages.FirstContact2}`
            : `${ResponseMessages.FirstContactWithNoName}`;

          await this.assistant.addNewMessage(responseText, senderId, GptRoles.Assistant);
          break;
        case FunctionNames.TalkToAle:
        case FunctionNames.GetPersonalAssistance:
          await this.assistant.updateContext({
            chatId: senderId,
            updateFields: { shouldRespond: false }
          });
          responseText = ResponseMessages.StopConversation;
          currentClientName = (await this.assistant.addNewMessage(responseText, senderId, GptRoles.Assistant)).clientName;
          notificationMessage = `${ResponseMessages.NotificationSystem}\n\n${ResponseMessages.PendingMessage1} ${currentClientName}
            \n${ResponseMessages.PendingMessage2} ${senderId}\n\n${ResponseMessages.AskTalkingToYou}
            \n${ResponseMessages.NoInterruptionContact}\n\n${AppConstants.NOT_REPLY}`;
          await this.sendNotification(this.currentNotificationUser, notificationMessage);
          break;
        case FunctionNames.GetCustomResponse:
          responseText = ResponseMessages.GetCustomResponse;
          await this.assistant.addNewMessage(responseText, senderId, GptRoles.Assistant);
          break;
        case FunctionNames.UpdateUserName:
          await this.assistant.updateContext({
            chatId: senderId,
            updateFields: { clientName: processed.args.name }
          });
          responseText = await this.assistant.processResponse(FunctionNames.UpdateUserName, `${ResponseMessages.YourNameIs} ${processed.args.name}`, senderId);
          break;
        case FunctionNames.NotifyIHaveArrived:
          responseText = ResponseMessages.WelcomeCustomer;
          currentClientName = (await this.assistant.addNewMessage(responseText, senderId, GptRoles.Assistant)).clientName;
          const imagePath = path.join(__dirname, DefinedPaths.BellLocation);
          const media = MessageMedia.fromFilePath(imagePath);
          const number = `${AppConstants.MX_PREFIX}${senderId}${AppConstants.WHATSAPP_USER_KEY}`;
          this.client.sendMessage(number, media)
          notificationMessage = `${ResponseMessages.NotificationSystem}\n\n${currentClientName} ${ResponseMessages.OpenTheDoor}
            \n${AppConstants.NOT_REPLY}`;
          await this.sendNotification(this.currentNotificationUser, notificationMessage);
          break;
        default:
          responseText = processed.message.content as string;
          break;
      }

      if ((mediaType !== MediaTypes.Chat && !isBankTransferImage) || mediaType === MediaTypes.Mixed) {
        const messageByMediaType = this.getErrorMessageByMediaType(mediaType, false);
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
    if (this.userMessageTimers.has(senderId)) {
      clearTimeout(this.userMessageTimers.get(senderId)!);
      this.userMessageTimers.delete(senderId);
    }
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

  /**
   * Procesa los mensajes en la cola temporal después de que se complete el procesamiento actual.
   * @param {string} senderId - El ID del remitente.
   */
  private processTempQueue(senderId: string): void {
    if (this.tempMessageQueue.has(senderId)) {
      const tempMessages = this.tempMessageQueue.get(senderId)!;
      this.tempMessageQueue.delete(senderId);
      for (const message of tempMessages) {
        this.handleMessageStorage(senderId, message);
      }
    }
  }

  /**
   * @description Processes the user's name, ensuring it is not empty and falls back to a default name if necessary.
   * @param {string} notifyName - The name to be processed.
   * @param {string} defaultName - The default name to use if the processed name is empty.
   * @returns {string} The processed user name or the default name if the processed name is empty.
   */
  private getUserName(notifyName: string | undefined): string {
    if (!notifyName) {
      return AppConstants.DEF_USER_NAME;
    }

    const processedName = this.utils.processString(notifyName);

    return processedName ? processedName : AppConstants.DEF_USER_NAME;
  }

  /**
   * @description Detects a bank transfer in an image message using OCR and Tesseract. If a transfer is detected, sends notification messages.
   * @param {ExtendedMessage} message - The extended message containing the received message data.
   * @param {string} senderId - The identifier of the message sender.
   * @returns {Promise<boolean>} - Returns `true` if a bank transfer is detected in the image message, otherwise returns `false`.
   */
  private async detectBankTransfer(message: ExtendedMessage, senderId: string): Promise<boolean> {
    if (message.type as string !== MediaTypes.Image) {
      return false;
    }

    const media = await message.downloadMedia();
    if (!media.data) {
      console.error(ErrorMessages.ImageDataNotFound);
    }

    try {
      const buffer = Buffer.from(media.data, MediaTypes.Base64);
      const { data: { text } } = await Tesseract.recognize(buffer, AppConstants.SPANISH_KEY);

      if (text.includes(AppConstants.TRANSFER_KEY)) {
        const responseText = ResponseMessages.ThanksForYourPayment;
        await this.assistant.addNewMessage(`${MediaTypes.Image}: ${AuxiliarMessages.BankTransferPayment}`, senderId, GptRoles.User);
        const currentClientName = (await this.assistant.addNewMessage(responseText, senderId, GptRoles.Assistant)).clientName;
        await this.client.sendMessage(message.from, responseText);

        const notificationMessage = `${ResponseMessages.NotificationSystem}\n\n${ResponseMessages.PendingMessage1} ${currentClientName}
          \n${ResponseMessages.PendingMessage2} ${senderId}\n\n${ResponseMessages.BankTransferVoucherReceived}\n\n${AppConstants.NOT_REPLY}`;
        await this.client.sendMessage(this.currentNotificationUser, notificationMessage);
        await this.client.sendMessage(this.currentNotificationUser, media, { caption: message._data.caption });


        return true;
      } else {
        return false;
      }
    } catch (error) {
      console.error(ErrorMessages.TesseractProccesingError, error);

      return false;
    }
  }
}
