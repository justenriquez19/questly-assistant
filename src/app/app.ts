import { Client, Message } from 'whatsapp-web.js';
import express, { Express } from 'express';
import qrcode from 'qrcode-terminal';

import { AppConstants, AuxiliarMessages, ErrorMessages, FunctionNames, GptRoles, ResponseMessages, TimeoutDurations } from './shared/constants/app.constants';
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
  private userMessages: Map<string, ExtendedMessage[]>;
  private userMessageTimers: Map<string, NodeJS.Timeout>;
  public coreUtilFunctions: CoreUtilFunctions;

  /**
   * @description Initializes the QuestlyAIssistant with necessary services and client configuration.
   */
  constructor() {
    this.assistant = new GPTAssistant();
    this.coreUtilFunctions = new CoreUtilFunctions();
    this.userMessages = new Map();
    this.userMessageTimers = new Map();
    this.mongoService = MongoService.getInstance();
    this.client = new Client({
      webVersionCache: {
        type: AppConstants.REMOTE_KEY,
        remotePath: AppConstants.WEB_VERSION_PATCH,
      },
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
  private onQrCode(qr: string): void {
    qrcode.generate(qr, { small: true });
  }

  /**
   * @description Logs a message when the WhatsApp client is ready.
   */
  private onClientReady(): void {
    console.log(AppConstants.CLIENT_IS_READY);
  }

  /**
   * @description Processes received WhatsApp messages.
   * @param {Message} message - The message object received from WhatsApp.
   */
  private async onMessageReceived(message: ExtendedMessage): Promise<void> {
    try {
      const currentSenderId = message.from;
      const messageContent = message.body;
      console.log(`${AuxiliarMessages.MessageReceivedFrom} ${currentSenderId}: ${messageContent}`);

      this.handleMessageStorage(currentSenderId, message);
      
      this.userMessageTimers.set(currentSenderId, setTimeout(async () => {
        await this.processGroupedMessages(currentSenderId);
      }, TimeoutDurations.TimeBetweenMessages));

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
    const messages = this.userMessages.get(senderId);
    if (!messages || messages.length === 0) return;

    const combinedMessageContent = this.combineMessagesContent(messages);
    const firstMessage = messages[0];
    const userName = this.coreUtilFunctions.cutUntilSpace(firstMessage._data.notifyName);
    const isMediaDetected = this.isMediaDetectedInMessages(messages);

    if (this.isSingleEmptyMediaMessage(messages)) {
      await this.handleSingleEmptyMediaMessage(combinedMessageContent, senderId, firstMessage);
    } else {
      await this.handleTextMessage(combinedMessageContent, senderId, userName, firstMessage, isMediaDetected);
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
   * @description Checks if any message in the array contains media.
   * @param {ExtendedMessage[]} messages - The array of messages to check.
   * @returns {boolean} - True if any message contains media, false otherwise.
   */
  private isMediaDetectedInMessages(messages: ExtendedMessage[]): boolean {
    return messages.some(msg => msg.hasMedia);
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
   * @param {string} messageContent - The content of the message.
   * @param {string} senderId - The ID of the sender.
   * @param {Message} message - The message object received from WhatsApp.
   */
  private async handleSingleEmptyMediaMessage(messageContent: string, senderId: string, message: ExtendedMessage): Promise<void> {
    const processed = await this.assistant.processFunctions(messageContent, senderId, AppConstants.EMPTY_STRING);
    if (processed.functionName !== FunctionNames.FirstConcact) {
      await this.assistant.addNewMessage(ResponseMessages.MediaNotSupported, senderId, GptRoles.Assistant);
      await message.reply(ResponseMessages.MediaNotSupported);
      this.clearUserMessages(senderId);
    }
  }

  /**
   * @description Handles text messages.
   * @param {string} messageContent - The content of the received message.
   * @param {string} senderId - The ID of the sender.
   * @param {string} senderUserName - The user name of the sender.
   * @param {Message} message - The message object received from WhatsApp.
   * @param {boolean} hasMedia - Indicates if any message contains media.
   */
  private async handleTextMessage(messageContent: string, senderId: string, senderUserName: string, message: Message, hasMedia: boolean): Promise<void> {
    const processed = await this.assistant.processFunctions(messageContent, senderId, senderUserName);

    let responseText: string;
    switch (processed.functionName) {
      case FunctionNames.AddApointment:
        responseText = await this.assistant.processResponse(FunctionNames.AddApointment, ResponseMessages.RedirectToWebsite, senderId);
        break;
      case FunctionNames.FirstConcact:
        responseText = `${ResponseMessages.FirstConcact1}${senderUserName}${ResponseMessages.FirstConcact2}`;
        break;
      default:
        responseText = processed.message.content as string;
        break;
    }

    if (hasMedia) {
      responseText += `\n\n${ResponseMessages.MediaNotSupportedComplement}`;
    }

    message.reply(responseText);
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
    this.app.listen(3000, () => {
      console.log(AppConstants.SERVER_RUNNING_MESSAGE);
    });
  }
}
