import { Client, Message } from 'whatsapp-web.js';
import express, { Express } from 'express';
import qrcode from 'qrcode-terminal';

import { AppConstants, AuxiliarMessages, ErrorMessages, FunctionNames, ResponseMessages, TimeoutDurations } from './shared/constants/app.constants';
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

      if (this.userMessages.has(currentSenderId)) {
        this.userMessages.get(currentSenderId)!.push(message);
        clearTimeout(this.userMessageTimers.get(currentSenderId)!);
      } else {
        this.userMessages.set(currentSenderId, [message]);
      }

      this.userMessageTimers.set(currentSenderId, setTimeout(async () => {
        await this.processGroupedMessages(currentSenderId);
      }, TimeoutDurations.TimeBetweenMessages));

    } catch (error) {
      console.error(ErrorMessages.DefaultMessage, error);
    }
  }

  /**
   * @description Processes grouped messages for a sender when the timer expires.
   * @param {string} senderId - The ID of the sender.
   */
  private async processGroupedMessages(senderId: string): Promise<void> {
    const messages = this.userMessages.get(senderId);
    if (!messages || messages.length === 0) return;

    const combinedMessageContent = messages.map(msg => msg.body).join(AppConstants.BLANK_SPACE);
    const firstMessage = messages[0];
    const userName = this.coreUtilFunctions.cutUntilSpace(firstMessage._data.notifyName);

    try {
      if (firstMessage.hasMedia) {
        await this.handleMediaMessage(combinedMessageContent, senderId, userName, firstMessage);
      } else {
        await this.handleTextMessage(combinedMessageContent, senderId, userName, firstMessage);
      }
    } catch (error) {
      console.error(ErrorMessages.DefaultMessage, error);
    } finally {
      this.userMessages.delete(senderId);
      this.userMessageTimers.delete(senderId);
    }
  }

  /**
   * @description Handles messages with media content.
   * @param {string} messageContent - The content of the received message.
   * @param {string} senderId - The ID of the sender.
   * @param {string} senderUser - The user name of the sender.
   * @param {Message} message - The message object received from WhatsApp.
   */
  private async handleMediaMessage(messageContent: string, senderId: string, senderUser: string, message: Message): Promise<void> {
    await this.assistant.processFunctions(messageContent, senderId, senderUser);
    const finalResponse = await this.assistant.processResponse(FunctionNames.MediaDetected, ResponseMessages.MeidaNotAllowed, senderId);
    message.reply(finalResponse);
  }

  /**
   * @description Handles text messages.
   * @param {string} messageContent - The content of the received message.
   * @param {string} senderId - The ID of the sender.
   * @param {string} senderUserName - The user name of the sender.
   * @param {Message} message - The message object received from WhatsApp.
   */
  private async handleTextMessage(messageContent: string, senderId: string, senderUserName: string, message: Message): Promise<void> {
    const processed = await this.assistant.processFunctions(messageContent, senderId, senderUserName);

    switch (processed.functionName) {
      case FunctionNames.AddApointment:
        await this.replyCallingFunction(FunctionNames.AddApointment, ResponseMessages.RedirectToWebsite, senderId, message);
        break;

      case FunctionNames.FirstConcact:
        const firstContactResponse = `${ResponseMessages.FirstConcact1}${senderUserName}${ResponseMessages.FirstConcact2}`;
        message.reply(firstContactResponse);
        break;

      default:
        message.reply(processed.message.content as string);
        break;
    }
  }

  /**
   * @description Replies to the sender using a provided function behavior that is processed by the assistant.
   * @param {string} functionName - The name of the function being processed.
   * @param {string} responseText - The text of the response to be sent.
   * @param {string} senderId - The ID of the sender.
   * @param {Message} message - The message object to reply to.
   */
  private async replyCallingFunction(functionName: string, responseText: string, senderId: string, message: Message): Promise<void> {
    const response = await this.assistant.processResponse(functionName, responseText, senderId);
    message.reply(response);
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
