import path from 'path';
import WAWebJS, { Chat, MessageMedia } from 'whatsapp-web.js';

import { AiTools } from './ai-tools.service';
import { AmeliaService } from './amelia.service';
import {
  AppConstants,
  AuxiliarMessages,
  ContactsToIgnore,
  ErrorMessages,
  MediaTypes,
  RegexExpressions,
  FunctionNames,
  GptRoles,
  DefinedPaths,
  firstEverContactTypes
} from '../shared/constants/app.constants';
import { ChatDataService } from '../data/chat-data.service';
import { ConversationManager } from './conversation-manager.service';
import { CoreUtils } from './core-utils.service';
import { ExtendedMessage } from '../shared/interfaces/gpt-interfaces';
import { IProcessDynamicContext } from '../shared/interfaces/gpt-tools-interfaces';
import { IUserConfiguration } from '../shared/interfaces/user-configuration.interface';
import { OcrService } from './ocr.service';
import { SessionContext } from '../shared/interfaces/session.interfaces';
import { UserConfigDataService } from '../data/user-config-data.service';

export class MessageService {
  constructor(
    private aiTools: AiTools,
    private amelia: AmeliaService,
    private chatDataService: ChatDataService,
    private conversationManager: ConversationManager,
    private ocrService: OcrService,
    private userConfigDataService: UserConfigDataService,
    private utils: CoreUtils
  ) { }

  /**
   * @description Handles created messages for a session.
   * @param {string} sessionId - The session identifier.
   * @param {ExtendedMessage} message - The message created by the bot.
   */
  public async onMessageCreated(sessionId: string, message: ExtendedMessage, session: SessionContext): Promise<void> {
    const userConfig = await this.userConfigDataService.getConfigBySession(sessionId)

    if (!session) return;

    if (!(message.fromMe && message.author === userConfig.notificationContacts.business)) {
      return;
    }
    const messageContent = message.type as string !== MediaTypes.Order ? message.body : message._data.orderTitle;
    console.log(`${AuxiliarMessages.MessageReceivedFrom} ${GptRoles.System}: ${messageContent}`);

    if (messageContent.includes(AppConstants.NOT_REPLY)) {
      return;
    }
    let recipientPhoneNumber: string = AppConstants.EMPTY_STRING;

    if (message.fromMe && message.author === userConfig.notificationContacts.business) {
      let isAdminChat = false;

      if (message.from === message.to) {
        isAdminChat = true;
        const phoneNumberMatch = messageContent.match(RegexExpressions.GET_FIRST_TEN_NUMBERS);

        if (phoneNumberMatch) {
          recipientPhoneNumber = phoneNumberMatch[0];
        } else {
          const vCardLine = messageContent.split('\n').find((line: string) => line.includes(AppConstants.TEL_KEY));

          if (vCardLine) {
            const vCardPhoneMatch = vCardLine.match(RegexExpressions.V_CARD_PHONE_EXTRACTOR);

            if (vCardPhoneMatch) {
              recipientPhoneNumber = vCardPhoneMatch[0].replace(RegexExpressions.REMOVE_NON_DIGIT_CHAR, AppConstants.EMPTY_STRING);

              if (recipientPhoneNumber.startsWith(AppConstants.MX_PREFIX)) {
                recipientPhoneNumber = recipientPhoneNumber.substring(3);
              } else if (recipientPhoneNumber.startsWith(AppConstants.MX_SIMPLE_PREFIX)) {
                recipientPhoneNumber = recipientPhoneNumber.substring(2);
              }
            }
          }
        }
      } else {
        recipientPhoneNumber = message.to.replace(RegexExpressions.GET_PHONE_NUMBER, AppConstants.ONE_DOLLAR);
      }

      if (recipientPhoneNumber) {
        let hasUpdatedContext: boolean = false;
        let context = await this.chatDataService.getContextByChatId(recipientPhoneNumber, sessionId);

        if (context && context.shouldRespond) {
          context = await this.chatDataService.updateChat({
            chatId: recipientPhoneNumber,
            sessionId: userConfig.sessionId,
            updateFields: { shouldRespond: false, timeOfLastMessage: new Date() }
          });
          hasUpdatedContext = true;
        } else if (!context) {
          await this.conversationManager.addNewUserMessage(`${AuxiliarMessages.TempContext}${recipientPhoneNumber}`, recipientPhoneNumber, AppConstants.DEF_USER_NAME, sessionId);
          context = await this.chatDataService.updateChat({
            chatId: recipientPhoneNumber,
            sessionId: userConfig.sessionId,
            updateFields: { shouldRespond: false, shouldDeleteAfterContact: true, timeOfLastMessage: new Date() }
          });
          hasUpdatedContext = true;
        }

        if (hasUpdatedContext) {
          const correctlyDisabled = `${userConfig.responseMessages.NotificationSystem}\n\n${userConfig.responseMessages.ManualDeactivation}
          \n${recipientPhoneNumber}\n\n${userConfig.responseMessages.NoInterruptionContact}\n\n${AppConstants.NOT_REPLY}`;
          const errorDuringDisablingChat = `${userConfig.responseMessages.NotificationSystem}\n\n${userConfig.responseMessages.ManualDeactivationFailed}
          \n${recipientPhoneNumber}\n\n${userConfig.responseMessages.ManualDeactivationTryAgain}\n\n${AppConstants.NOT_REPLY}`;
          const notificationMessage = context.shouldRespond === false ? correctlyDisabled : errorDuringDisablingChat;

          if (isAdminChat) {
            const currentChat = await message.getChat();
            await this.replyToChat(currentChat, notificationMessage);
          } else {
            await this.sendNotification(session, userConfig.notificationContacts.mainContact, notificationMessage);
          }
        }
      } else {
        const contextToolResponse = await this.processDynamicContextUpdate(messageContent, userConfig);
        const dynamicConxtext = contextToolResponse?.newDynamicConxtext;
        let responseMessage: string = AppConstants.EMPTY_STRING;

        if (contextToolResponse?.shouldUpdate) {
          responseMessage = dynamicConxtext?.isActive ? `${userConfig.responseMessages.GotItBoss}\n\n${userConfig.responseMessages.CurrentDynamicContext}\n\n${dynamicConxtext?.message}` :
            `${userConfig.responseMessages.GotItBoss}\n\n${userConfig.responseMessages.DynamicContextDeleted}`;
        } else {
          responseMessage = userConfig.responseMessages.InvalidDynamicContext;
        }

        const currentChat = await message.getChat();
        await this.replyToChat(currentChat, responseMessage);
      }
    }
  }

  /**
   * @description Handles incoming messages for a session.
   * @param {string} sessionId - The session identifier.
   * @param {ExtendedMessage} message - The received WhatsApp message.
   */
  public async onMessageReceived(sessionId: string, message: ExtendedMessage, session: SessionContext): Promise<void> {
    try {
      const userConfig = await this.userConfigDataService.getConfigBySession(sessionId);

      if (!session) {
        console.error(` ${AppConstants.SESSION_KEY} ${sessionId} ${ErrorMessages.NotFoundLowerCase}.`);
        return;
      }
      session.client.sendPresenceAvailable();
      const currentSenderId = message.from.replace(RegexExpressions.GET_PHONE_NUMBER, AppConstants.ONE_DOLLAR);

      if ((!ContactsToIgnore.includes(currentSenderId) && !currentSenderId.includes(AppConstants.WHATSAPP_GROUP_KEY)) &&
        !firstEverContactTypes.includes(message.type)) {
        const messageContent = message.body ?? message.type;
        console.log(`${AuxiliarMessages.MessageReceivedFrom} ${currentSenderId} ${AuxiliarMessages.ToClient} ${sessionId}: ${messageContent}`);

        let context = await this.chatDataService.getContextByChatId(currentSenderId, userConfig.sessionId);

        if (context) {
          if (context.shouldDeleteAfterContact && this.utils.isMoreThanDaysAgo(context.timeOfLastMessage, 0.5)) {
            await this.chatDataService.deleteContextByChatId(currentSenderId, userConfig.sessionId);
            context = await this.chatDataService.getContextByChatId(currentSenderId, userConfig.sessionId);
          } else if (this.utils.isMoreThanDaysAgo(context.timeOfLastMessage, 0.5)) {
            if (!context.shouldRespond) {
              context.shouldRespond = true;
              context = await this.chatDataService.updateChat({
                chatId: currentSenderId,
                sessionId: userConfig.sessionId,
                updateFields: { shouldRespond: true }
              });
            } else {
              await this.conversationManager.addNewMessage(AuxiliarMessages.NewConversationStarted, currentSenderId, userConfig.sessionId, GptRoles.System);
            }
          }
        }

        if (!context || context.shouldRespond) {
          this.handleMessageStorage(session, userConfig, currentSenderId, message);
        }
      }
    } catch (error) {
      console.error(ErrorMessages.DefaultMessage, error);
    }
  }

  /**
   * @description Stores and groups received messages by sender for a session.
   * @param {SessionContext} session - Context for message session storage.
   * @param {IUserConfiguration} userConfig - User config with timeout settings.
   * @param {string} senderId - The sender's unique identifier.
   * @param {ExtendedMessage} message - The incoming message to store.
   */
  private async handleMessageStorage(session: SessionContext, userConfig: IUserConfiguration, senderId: string, message: ExtendedMessage): Promise<void> {
    if (!session) return;

    if (!session.processingUsers) {
      session.processingUsers = new Map<string, boolean>();
    }

    if (session.processingUsers.get(senderId)) {
      if (session.tempMessageQueue.has(senderId)) {
        session.tempMessageQueue.get(senderId)!.push(message);
      } else {
        session.tempMessageQueue.set(senderId, [message]);
      }
      return;
    }

    session.processingUsers.set(senderId, true);
    if (session.userMessages.has(senderId)) {
      session.userMessages.get(senderId)!.push(message);
    } else {
      session.userMessages.set(senderId, [message]);
    }

    if (session.userMessageTimers.has(senderId)) {
      clearTimeout(session.userMessageTimers.get(senderId)!);
    }

    session.userMessageTimers.set(senderId, setTimeout(async () => {
      try {
        await this.processGroupedMessages(session, userConfig, senderId);
        session.processingUsers.set(senderId, false);
        await this.processTempQueue(session, userConfig, senderId);
      } catch (error) {
        console.error(`Error processing messages for sender ${senderId}:`, error);
      } finally {
        session.processingUsers.set(senderId, false);
      }
    }, userConfig.timeoutDurations.timeBetweenMessages));
  }

  /**
   * @description Processes grouped messages and triggers chat actions.
   * @param {SessionContext} session - Current session for processing messages.
   * @param {IUserConfiguration} userConfig - User settings and timeouts.
   * @param {string} senderId - Unique identifier for the message sender.
   * @returns {Promise<void>} - Resolves when processing completes.
   */
  private async processGroupedMessages(session: SessionContext, userConfig: IUserConfiguration, senderId: string): Promise<void> {
    if (!session) return;
    const messages = session.userMessages.get(senderId);

    if (!messages || messages.length === 0) return;

    try {
      const firstMessage = messages[0];
      const userName = firstMessage._data?.notifyName;
      const mediaType = this.getFirstMediaType(messages);
      const chat = await firstMessage.getChat();
      chat.sendSeen();
      chat.sendStateTyping();

      if (this.isSingleEmptyMediaMessage(messages)) {
        await this.handleSingleEmptyMediaMessage(userConfig, session, senderId, userName, firstMessage, chat, mediaType);
      } else {
        await this.handleTextMessage(userConfig, session, messages, senderId, userName, chat, mediaType);
      }
    } catch (error) {
      console.error(`Error processing grouped messages for sender ${senderId}:`, error);
    } finally {
      this.clearUserMessages(session, senderId);
    }
  }

  /**
   * @description Combines content of multiple messages into a single string.
   * @param {Array<ExtendedMessage>} messages - Array of messages.
   * @returns {string} Combined message content.
   */
  private combineMessagesContent(messages: Array<ExtendedMessage>): string {
    return messages.map(msg => {
      const { body, type, _data } = msg;
      if (!body) {
        if (type as string === MediaTypes.Order) {
          return `${AuxiliarMessages.OrderRequest} ${_data.orderTitle} (${AuxiliarMessages.OrderQuantity} ${_data.itemCount})`;
        }
        return type as string === MediaTypes.VoiceMessage ? `*${MediaTypes.Audio}*` : `*${type}*`;
      }
      if (type as string === MediaTypes.E2ENotification || type as string === MediaTypes.NotificationTemplate) {
        return AppConstants.EMPTY_STRING;
      }
      return type as string === MediaTypes.Chat ? body : `*${type}* ${body}`;
    }).join(AppConstants.BLANK_SPACE);
  }

  /**
   * @description Determines the media type of a group of messages.
   * @param {Array<ExtendedMessage>} messages - Array of messages.
   * @returns {string} Media type.
   */
  private getFirstMediaType(messages: Array<ExtendedMessage>): string {
    const relevantMessages = messages.filter((msg: ExtendedMessage) => {
      return msg.type as string !== MediaTypes.Chat &&
        msg.type as string !== MediaTypes.E2ENotification &&
        msg.type as string !== MediaTypes.NotificationTemplate;
    });
    if (relevantMessages?.length === 0) {
      return MediaTypes.Chat;
    }
    const firstType = relevantMessages[0].type;
    const allSameType = relevantMessages.every((msg: ExtendedMessage) => {
      return msg.type === firstType;
    });
    return allSameType ? firstType : MediaTypes.Mixed;
  }

  /**
   * @description Checks if the messages array contains a single empty media message.
   * @param {Array<ExtendedMessage>} messages - Array of messages.
   * @returns {boolean} True if a single empty media message is present.
   */
  private isSingleEmptyMediaMessage(messages: Array<ExtendedMessage>): boolean {
    return messages.length === 1 && messages[0].hasMedia && messages[0].body === AppConstants.EMPTY_STRING;
  }

  /**
   * @description Handles a single empty media message by sending appropriate responses.
   * @param {IUserConfiguration} userConfig - User config with session and response settings.
   * @param {SessionContext} session - Session context storing message data and states.
   * @param {string} senderId - Unique identifier for the sender.
   * @param {string} userName - Sender's name for personalization.
   * @param {ExtendedMessage} message - Received empty media message object.
   * @param {Chat} currentChat - Chat instance to send responses.
   * @param {string} mediaType - Media type in the message (e.g., image).
   * @returns {Promise<void>} - Resolves when processing is complete.
   */
  private async handleSingleEmptyMediaMessage(userConfig: IUserConfiguration, session: SessionContext, senderId: string,
    userName: string, message: ExtendedMessage, currentChat: Chat, mediaType: string): Promise<void> {
    const sessionId = userConfig.sessionId;
    const messageType = message.type;
    const responseMessages = userConfig.responseMessages;
    let messageByMediaType: string;
    let responseText: string;
    let isBankTransferImage = false;
    let context = await this.chatDataService.getContextByChatId(senderId, userConfig.sessionId) || await this.conversationManager.addNewUserMessage(`*${mediaType}*`, senderId, userName, sessionId);

    if (mediaType === MediaTypes.Image) {
      isBankTransferImage = await this.ocrService.detectBankTransfer(userConfig, message, senderId, session);
    }

    if (context.isFirstContact && userConfig.utilities.firstTimeWelcome) {
      const validatedUserName = (await this.aiTools.isNameValid(userName)).firstName;
      messageByMediaType = isBankTransferImage ? AppConstants.EMPTY_STRING : this.getErrorMessageByMediaType(messageType, false, userConfig);
      const messageByUsername = validatedUserName !== AppConstants.DEF_USER_NAME
        ? `${responseMessages.Hello} ${responseMessages.FirstContact1}${validatedUserName}${responseMessages.FirstContact2}`
        : `${responseMessages.Hello} ${responseMessages.FirstContactWithNoName}`;
      responseText = messageByMediaType !== AppConstants.EMPTY_STRING ? `${messageByUsername}\n\n${messageByMediaType}` : messageByUsername;
      await this.conversationManager.addNewMessage(responseText, senderId, sessionId, GptRoles.Assistant);
      await this.replyToChat(currentChat, responseText);
    } else {
      if (!isBankTransferImage) {
        messageByMediaType = this.getErrorMessageByMediaType(messageType, true, userConfig);
        await this.conversationManager.addNewMessage(`*${messageType}*`, senderId, sessionId, GptRoles.User);
        await this.conversationManager.addNewMessage(messageByMediaType, senderId, sessionId, GptRoles.Assistant);
        await this.replyToChat(currentChat, messageByMediaType);
      }
    }
  }

  /**
   * @description Processes text messages, sending responses and notifications.
   * @param {IUserConfiguration} userConfig - User settings with response messages.
   * @param {SessionContext} session - Session context with message data.
   * @param {Array<ExtendedMessage>} messages - Array of messages to process.
   * @param {string} senderId - Unique identifier of the sender.
   * @param {string} senderUserName - Sender's name for personalization.
   * @param {Chat} currentChat - Chat instance used to send replies.
   * @param {string} mediaType - Type of media in the messages.
   * @returns {Promise<void>} - Resolves when processing is complete.
   */
  private async handleTextMessage(userConfig: IUserConfiguration, session: SessionContext, messages: Array<ExtendedMessage>,
    senderId: string, senderUserName: string, currentChat: Chat, mediaType: string): Promise<void> {
    try {
      const messagesToCombine: Array<ExtendedMessage> = [];
      const responseMessages = userConfig.responseMessages;
      const sessionId = userConfig.sessionId;
      const currentNotificationUser = userConfig.notificationContacts.mainContact;
      let isBankTransferImage = false;

      for (const message of messages) {
        const isBankTransfer = await this.ocrService.detectBankTransfer(userConfig, message, senderId, session);

        if (isBankTransfer) {
          isBankTransferImage = true;
        } else {
          messagesToCombine.push(message);
        }
      }
      const messageContent = this.combineMessagesContent(messagesToCombine);
      const processed = await this.conversationManager.processFunctions(messageContent, senderId, senderUserName, userConfig);
      let responseText: string;
      let currentClientName: string;
      let notificationMessage: string;
      let imagePath: string;
      let media: MessageMedia;
      switch (processed.functionName) {
        case FunctionNames.TalkToHuman:
          await this.chatDataService.updateChat({
            chatId: senderId,
            sessionId: userConfig.sessionId,
            updateFields: { shouldRespond: false }
          });
          responseText = responseMessages.StopConversation;
          currentClientName = (await this.conversationManager.addNewMessage(responseText, senderId, sessionId, GptRoles.Assistant)).clientName;
          notificationMessage = `${responseMessages.NotificationSystem}\n\n${responseMessages.PendingMessage1} ${currentClientName}
            \n${responseMessages.PendingMessage2} ${senderId}\n\n${responseMessages.AskTalkingToYou}
            \n${responseMessages.NoInterruptionContact}\n\n${AppConstants.NOT_REPLY}`;
          await this.sendNotification(session, currentNotificationUser, notificationMessage);
          break;
        case FunctionNames.GetUsersName:
          currentClientName = processed.args?.name as string;
          await this.chatDataService.updateChat({
            chatId: senderId,
            sessionId: userConfig.sessionId,
            updateFields: { clientName: currentClientName }
          });
          responseText = await this.conversationManager.processFunction(FunctionNames.GetUsersName, `${responseMessages.YourNameIs} ${currentClientName}`, senderId, userConfig);
          break;
        case FunctionNames.NotifyIHaveArrived:
          responseText = responseMessages.WelcomeCustomer;
          currentClientName = (await this.conversationManager.addNewMessage(responseText, senderId, sessionId, GptRoles.Assistant)).clientName;
          imagePath = path.join(process.cwd(), DefinedPaths.BellLocation);
          media = MessageMedia.fromFilePath(imagePath);

          await this.replyToChat(currentChat, media);

          notificationMessage = `${responseMessages.NotificationSystem}\n\n*${currentClientName}* ${responseMessages.OpenTheDoor}
            \n${AppConstants.NOT_REPLY}`;

          await this.sendNotification(session, currentNotificationUser, notificationMessage);
          break;
        case FunctionNames.DetectQuotationRequest:
          await this.chatDataService.updateChat({
            chatId: senderId,
            sessionId: userConfig.sessionId,
            updateFields: { shouldRespond: false }
          });
          responseText = mediaType !== MediaTypes.Chat ? responseMessages.QuotationWithImageResponse : responseMessages.QuotationResponse;
          currentClientName = (await this.conversationManager.addNewMessage(responseText, senderId, sessionId, GptRoles.Assistant)).clientName;
          notificationMessage = `${responseMessages.NotificationSystem}\n\n${responseMessages.PendingMessage1} *${currentClientName}*
          \n${responseMessages.PendingMessage2} ${senderId}\n\n${responseMessages.NotifyQuotationRequest}\n\n"${messageContent}"`;

          if (mediaType !== MediaTypes.Chat) {
            notificationMessage = notificationMessage + `\n${responseMessages.AttachMedia}\n\n${AppConstants.NOT_REPLY}`;
          } else {
            notificationMessage = notificationMessage + `\n\n${AppConstants.NOT_REPLY}`;
          }
          await this.sendNotification(session, currentNotificationUser, notificationMessage);
          for (const message of messages) {
            if (message.hasMedia) {
              const media = await message.downloadMedia();
              await this.sendNotification(session, currentNotificationUser, media);
            }
          }
          mediaType = MediaTypes.Chat;
          break;
        case FunctionNames.ShouldSearchSlotsByService:
          const startDate = processed.args.startDate;
          const endDate = processed.args.endDate;
          const serviceId = Number(processed.args.serviceId);
          const response = await this.amelia.getSlots(serviceId, startDate, endDate);
          let availabilityMessage: string = AppConstants.EMPTY_STRING;

          if (response.length) {
            availabilityMessage = `${AuxiliarMessages.AvailableDates}${serviceId}:\n\n${response}\n\n${AuxiliarMessages.summarizeDates}`;
          } else {
            availabilityMessage = AuxiliarMessages.NotAvailableDates;
          }
          responseText = await this.conversationManager.processFunction(FunctionNames.ShouldSearchSlotsByService, availabilityMessage, senderId, userConfig);
          break;
        case FunctionNames.OrderConfirmed:
        case FunctionNames.OrderUpdated:
          const isOrderConfirmed = processed.functionName === FunctionNames.OrderConfirmed;
          const orderMessage = isOrderConfirmed ? responseMessages.OrderConfirmed : responseMessages.OrderUpdated;
          const requestType = isOrderConfirmed ? responseMessages.HasMadeAnOrder : responseMessages.HasUpdateAnOrder;
          const arrivalTime = processed.args.arrivalTime;
          const orderSummary = processed.args.summary;
          const orderTotal = processed.args.total;
          const paymentType = processed.args.paymentType;
          const clientName = processed.args.clientName;
          const replacements = { arrivalTime: arrivalTime, orderSummary: orderSummary, orderTotal: orderTotal, paymentType: paymentType };

          const orderStatus = this.utils.replacePlaceholders(orderMessage, replacements);

          await this.replyToChat(currentChat, orderStatus);
          let chatConfig = await this.conversationManager.addNewMessage(orderStatus, senderId, sessionId, GptRoles.Assistant);

          if (chatConfig.clientName !== clientName) {
            chatConfig = await this.chatDataService.updateChat({
              chatId: senderId,
              sessionId: userConfig.sessionId,
              updateFields: { clientName: clientName }
            });
          }

          notificationMessage = `${responseMessages.NotificationSystem}\n\n${responseMessages.PendingMessage1} *${chatConfig.clientName}*
          \n${responseMessages.PendingMessage2} ${senderId}\n\n${requestType}\n\n📝 Resumen:\n\n${orderSummary}\n\n💵 Total: ${orderTotal}\n\n🔄 Tipo de pago: ${paymentType}\n\n⏱️ Pasarán por el: ${arrivalTime}`;

          await this.sendNotification(session, currentNotificationUser, notificationMessage);

          responseText = responseMessages.ConfirmationResponse;
          await this.conversationManager.addNewMessage(responseText, senderId, sessionId, GptRoles.Assistant)

          await new Promise(resolve => setTimeout(resolve, 300));
          await currentChat.sendStateTyping();
          await this.utils.delayRandom();
          break;
        case FunctionNames.DetectMenuRequest:
          responseText = responseMessages.MenuShared;
          await this.conversationManager.addNewMessage(responseText, senderId, sessionId, GptRoles.Assistant);
          imagePath = path.join(process.cwd(), DefinedPaths.MenuLocation);
          media = MessageMedia.fromFilePath(imagePath);

          await this.replyToChat(currentChat, media);
          break;
        default:
          responseText = processed.message.content as string;
          break;
      }

      if ((mediaType !== MediaTypes.Chat && !isBankTransferImage) || mediaType === MediaTypes.Mixed) {
        const messageByMediaType = this.getErrorMessageByMediaType(mediaType, false, userConfig);

        if (messageByMediaType !== AppConstants.EMPTY_STRING) {
          responseText += `\n\n${messageByMediaType}`;
        }
      }

      if (userConfig.utilities.shouldSplitMessages) {
        const parts = responseText.split("⏭️").map(p => p.trim());

        for (let i = 0; i < parts.length; i++) {
          const part = parts[i];
          await this.replyToChat(currentChat, part);

          const isLast = i === parts.length - 1;

          if (!isLast) {
            await new Promise(resolve => setTimeout(resolve, 300));
            await currentChat.sendStateTyping();
            await this.utils.delayRandom();
          }
        }

        currentChat.clearState();
      } else {
        await this.replyToChat(currentChat, responseText);
      }

      if (processed.context.isFirstContact && userConfig.utilities.firstTimeWelcome) {
        responseText = processed.context.clientName !== AppConstants.DEF_USER_NAME
          ? `${responseMessages.ByTheWay} ${responseMessages.FirstContact1}${processed.context.clientName}${responseMessages.FirstContact2}`
          : `${responseMessages.ByTheWay} ${responseMessages.FirstContactWithNoName}`;
        const number = `${AppConstants.MX_PREFIX}${senderId}${AppConstants.WHATSAPP_USER_KEY}`;
        session.client.sendMessage(number, responseText);
        await this.conversationManager.addNewMessage(responseText, senderId, sessionId, GptRoles.Assistant);
        await this.chatDataService.updateChat({
          chatId: senderId,
          sessionId: userConfig.sessionId,
          updateFields: { isFirstContact: false }
        });
      }
    } catch (error) {
      console.error(ErrorMessages.DefaultMessage, error);
    }
  }

  /**
   * @description Clears stored messages and timers for a sender in a session.
   * @param {string} session - 
   * @param {string} senderId - The sender identifier.
   */
  private clearUserMessages(session: SessionContext, senderId: string): void {
    if (!session) return;
    session.userMessages.delete(senderId);
    if (session.userMessageTimers.has(senderId)) {
      clearTimeout(session.userMessageTimers.get(senderId)!);
      session.userMessageTimers.delete(senderId);
    }
  }

  /**
   * @description Processes all messages queued temporarily for a sender.
   * @param {SessionContext} session - Session holding the temporary message queue.
   * @param {IUserConfiguration} userConfig - Configuration settings for the session.
   * @param {string} senderId - Unique identifier for the sender.
   * @returns {Promise<void>} - Resolves when all queued messages are processed.
   */
  private async processTempQueue(session: SessionContext, userConfig: IUserConfiguration, senderId: string): Promise<void> {
    if (!session) return;

    if (session.tempMessageQueue.has(senderId)) {
      const tempMessages = session.tempMessageQueue.get(senderId)!;
      session.tempMessageQueue.delete(senderId);

      for (const message of tempMessages) {
        await this.handleMessageStorage(session, userConfig, senderId, message);
      }
    }
  }

  /**
   * @description Sends a response message to a chat for a session.
   * @param {Chat} currentChat - The chat object.
   * @param {string} response - The response message.
   */
  private async replyToChat(currentChat: Chat, response: WAWebJS.MessageContent): Promise<void> {
    try {
      await currentChat.sendMessage(response);
    } catch (error) {
      console.error(ErrorMessages.ReplyMessageFailed, error);
    }
  }

  /**
   * @description Sends a notification message to a specified phone number using the session's client.
   * @param {string} phoneNumber - The target phone number.
   * @param {string} message - The notification message.
   */
  private async sendNotification(session: SessionContext, phoneNumber: string, message: any): Promise<void> {
    try {
      if (!session) { return; }
      await session.client.sendMessage(phoneNumber, message);
    } catch (error) {
      console.error(`${ErrorMessages.NotificationFailed} ${phoneNumber}`, error);
    }
  }

  /**
   * @description Returns an error message based on the media type and message context.
   * @param {string} messageType - Type of the media (e.g., Image, Video).
   * @param {boolean} isSingleEmptyMediaMessage - True if the message is a single empty media.
   * @param {IUserConfiguration} userConfig - Config with media error response settings.
   * @returns {string} - The error message or an empty string.
   */
  private getErrorMessageByMediaType(messageType: string, isSingleEmptyMediaMessage: boolean, userConfig: IUserConfiguration): string {
    const mediaNotSupportedResponses = userConfig.mediaNotSupportedResponses;
    switch (messageType) {
      case MediaTypes.Sticker:
        return isSingleEmptyMediaMessage ? mediaNotSupportedResponses.Sticker : AppConstants.EMPTY_STRING;
      case MediaTypes.Image:
        return isSingleEmptyMediaMessage ? mediaNotSupportedResponses.Image : mediaNotSupportedResponses.ImageComplement;
      case MediaTypes.Video:
        return isSingleEmptyMediaMessage ? mediaNotSupportedResponses.Video : mediaNotSupportedResponses.VideoComplement;
      case MediaTypes.Audio:
        return isSingleEmptyMediaMessage ? mediaNotSupportedResponses.Audio : mediaNotSupportedResponses.AudioComplement;
      case MediaTypes.VoiceMessage:
        return isSingleEmptyMediaMessage ? mediaNotSupportedResponses.Audio : mediaNotSupportedResponses.AudioComplement;
      case MediaTypes.NotificationTemplate:
      case MediaTypes.E2ENotification:
      case MediaTypes.Order:
        return AppConstants.EMPTY_STRING;
      default:
        return isSingleEmptyMediaMessage ? mediaNotSupportedResponses.Default : mediaNotSupportedResponses.DefaultComplement;
    }
  }

  /**
   * @description Updates the user's dynamic context if needed based on message content.
   * @param {string} messageContent - Message that may trigger a context update.
   * @param {IUserConfiguration} userConfig - User's current configuration.
   * @returns {Promise<IProcessDynamicContext>} - Updated dynamic context and update status.
   */
  private async processDynamicContextUpdate(messageContent: string, userConfig: IUserConfiguration): Promise<IProcessDynamicContext> {
    const dynamicToolResponse = await this.aiTools.shouldUpdateDynamicContext(messageContent, userConfig);

    if (dynamicToolResponse.shouldUpdate) {
      const newDynamicConxtext = {
        isActive: dynamicToolResponse.contextUpdated !== AppConstants.EMPTY_STRING,
        message: dynamicToolResponse.contextUpdated || AuxiliarMessages.DynamicContextDisabled
      };

      await this.userConfigDataService.updateUserConfiguration({
        sessionId: userConfig.sessionId,
        updateFields: { dynamicContext: newDynamicConxtext }
      });

      return {
        newDynamicConxtext,
        shouldUpdate: true
      };
    }

    return {
      newDynamicConxtext: { isActive: false, message: AuxiliarMessages.DynamicContextDisabled },
      shouldUpdate: false
    };
  }
}
