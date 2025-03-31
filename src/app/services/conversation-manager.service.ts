import { Document } from 'mongoose';

import { AiTools } from './ai-tools.service';
import {
  AppConstants,
  AuxiliarMessages,
  AvailableGptModels,
  FunctionNames,
  GptRoles,
} from '../shared/constants/app.constants';
import { ChatDataService } from '../data/chat-data.service';
import { CoreUtils } from './core-utils.service';
import { GptAssistant } from './gpt-assistant.service';
import { IChatGptHistoryBody, IChatStructure } from '../shared/interfaces/persistent-chats.interface';
import { IUserConfiguration } from '../shared/interfaces/user-configuration.interface';
import { PersistentChatModel } from '../shared/models/persistent-chats';
import { IProcessFunctions } from '../shared/interfaces/gpt-interfaces';

export class ConversationManager {
  constructor(
    private aiTools: AiTools,
    private assistant: GptAssistant,
    private chatDataService: ChatDataService,
    private utils: CoreUtils
  ) { }

  /**
   * @description Process the input text and generate a response from the GPT model.
   * @param {string} text - The input text from the user.
   * @param {string} currentChatId - The current chat ID.
   * @param {string} currentClientName - The current client's name.
   * @param {IUserConfiguration} userConfig - The user's current configuration.
   * @returns {Promise<IProcessFunctions>} - The function name and arguments if a function call is required, otherwise empty.
   */
  public async processFunctions(text: string, currentChatId: string, currentClientName: string,
    userConfig: IUserConfiguration): Promise<IProcessFunctions> {
    const context = await this.addNewUserMessage(text, currentChatId, currentClientName, userConfig.sessionId);
    const currentMessage = [context.chatHistory.at(-1) as IChatGptHistoryBody];
    const currentFunctions = userConfig.activeFunctions;
    const behavior = userConfig.botBehavior;
    const dynamicContext = userConfig.dynamicContext;

    const chatGptResponse = await this.assistant.getChatGptResponse(currentMessage, currentFunctions,
      behavior, AvailableGptModels.GPT_4_O, true, dynamicContext);
    let message = chatGptResponse.choices[0].message;

    if (message.tool_calls?.length) {
      const args = message.tool_calls[0].function?.arguments;
      const parseContent = JSON.parse(args);
      const functionName = message.tool_calls[0].function?.name;
      message.content = AuxiliarMessages.FunctionsToCall + functionName;

      return { functionName, args: parseContent, message, context };
    } else {
      if (this.utils.includesNameIntroduction(text)) {
        const nameReponse = await this.aiTools.isNameValid(text, true);
        if (nameReponse.isValidName) {
          const functionName = FunctionNames.GetUsersName;
          const args = { name: nameReponse.firstName };
          message.content = AuxiliarMessages.FunctionsToCall + functionName;

          return { functionName, args, message, context };
        }
      }
      message = (await this.assistant.getChatGptResponse(context.chatHistory, [],
        behavior, AvailableGptModels.GPT_4_O, true, dynamicContext)).choices[0].message;
      const manualDetectedFunction = this.utils.detectFunctionCalled(message.content);

      if (manualDetectedFunction !== null) {
        const parseContent = JSON.parse(manualDetectedFunction);
        const currentFunction = parseContent?.function;
        if (currentFunction) {
          switch (currentFunction) {
            case FunctionNames.ShouldSearchSlotsByService:
              const searchArgs = {
                startDate: parseContent.arguments.startDate,
                endDate: parseContent.arguments.endDate,
                serviceId: parseContent.arguments.serviceId
              };

              return { functionName: currentFunction, args: searchArgs, message, context };
            case FunctionNames.OrderConfirmed:
            case FunctionNames.OrderUpdated:
              const confirmationArgs = {
                arrivalTime: parseContent.arrivalTime,
                clientName: parseContent.clientName,
                paymentType: parseContent.paymentType,
                status: parseContent.status,
                summary: parseContent.summary,
                total: parseContent.total
              };

              return { functionName: currentFunction, args: confirmationArgs, message, context };
          }
        }
      }

      await this.addNewMessage(message.content as string, context.chatId, context.sessionId, GptRoles.Assistant);
    }

    return { functionName: AppConstants.EMPTY_STRING, args: {}, message, context };
  }

  /**
   * @description Process the response from the GPT model after executing a function.
   * @param {string} functionName - The name of the function executed.
   * @param {string} functionResponse - The response from the executed function.
   * @param {string} currentChatId - The current chat ID.
   * @returns {Promise<string>} - The content of the GPT model's response.
   */
  public async processFunction(functionName: string, functionResponse: string, currentChatId: string, userConfig: IUserConfiguration): Promise<string> {
    let context = await this.chatDataService.getContextByChatId(currentChatId, userConfig.sessionId);

    const behavior = userConfig.botBehavior;
    const dynamicContext = userConfig.dynamicContext;
    const functionToExecute = {
      functionName,
      functionResponse
    };

    const chatGptResponse = await this.assistant.sendFunctionToChatGpt(context.chatHistory,
      functionToExecute, behavior, AvailableGptModels.GPT_4_O, true, dynamicContext);
    const content = chatGptResponse.choices[0].message.content as string;
    await this.addNewMessage(content, context.chatId, context.sessionId, GptRoles.Assistant);

    return content;
  }

  /**
   * @description Set the initial context for a new chat or retrieve the existing context for an ongoing chat.
   * @param {string} text - The input text from the user.
   * @param {string} currentChatId - The current chat ID.
   * @param {string} currentClientName - The current client's name.
   * @returns {Promise<Document & IChatStructure>} - The chat context.
   */
  public async addNewUserMessage(text: string, currentChatId: string, currentClientName: string, currentSessionId: string): Promise<Document & IChatStructure> {
    let context = await this.chatDataService.getContextByChatId(currentChatId, currentSessionId);

    if (!context) {
      context = await this.generateInitialContext(text, currentChatId, currentClientName, currentSessionId);
    } else {
      if (text !== AppConstants.EMPTY_STRING) {
        context = await this.addNewMessage(text, currentChatId, currentSessionId, GptRoles.User);
      }
    }

    return context;
  }

  /**
   * @description Adds a new message to the chat history and updates the context for the given chat ID.
   * @param {string} text - The content of the message to be added.
   * @param {string} currentChatId - The ID of the current chat.
   * @param {string} roleProvided - The role of the sender (e.g., 'user', 'assistant').
   * @returns {Promise<Document & IChatStructure>} - Returns the updated context document with the new message added.
   */
  public async addNewMessage(text: string, currentChatId: string, currentSessionId: string, roleProvided: string): Promise<Document & IChatStructure> {
    let context = await this.chatDataService.getContextByChatId(currentChatId, currentSessionId);
    const currentDateTime = this.utils.formatDate(new Date());

    context.chatHistory.push({
      role: roleProvided,
      content: roleProvided === GptRoles.User ? `${text}\n\n[${AuxiliarMessages.MessageDateTime} ${currentDateTime}]` : text,
      messageDate: new Date()
    });
    context.isFirstContact = false;

    if (roleProvided === GptRoles.User) {
      context.timeOfLastMessage = new Date();
    }

    await context.save();

    return context;
  }


  /**
   * @description Generates and saves a new conversation context for a first-time chat interaction.
   * @param {string} text - The first message sent by the user.
   * @param {string} currentChatId - Unique identifier for the current chat.
   * @param {string} currentClientName - Name extracted from the client or message.
   * @param {string} currentSessionId - ID used to group messages under the same whatsapp session.
   * @returns {Promise<Document & IChatStructure>} - The newly created and saved chat context.
   */
  private async generateInitialContext(text: string, currentChatId: string, currentClientName: string, currentSessionId: string): Promise<Document & IChatStructure> {
    const processedName = (await this.aiTools.isNameValid(currentClientName)).firstName;
    const currentDateTimeTime = this.utils.formatDate(new Date());
    const newContext = new PersistentChatModel({
      sessionId: currentSessionId,
      chatId: currentChatId,
      clientName: processedName,
      timeOfLastMessage: new Date(),
      isFirstContact: true,
      shouldRespond: true,
      shouldDeleteAfterContact: false,
      chatHistory: [
        {
          role: GptRoles.System,
          content: `${AuxiliarMessages.NewConversationStarted}\n\n[${AuxiliarMessages.CurrentDateTime} ${currentDateTimeTime}]`,
          messageDate: new Date()
        },
        {
          role: GptRoles.User,
          content: processedName !== AppConstants.DEF_USER_NAME ?
            `${text}${AuxiliarMessages.MyNameIs} ${processedName}\n\n[${AuxiliarMessages.MessageDateTime} ${currentDateTimeTime}]` :
            `${text}\n\n[${AuxiliarMessages.MessageDateTime} ${currentDateTimeTime}]`,
          messageDate: new Date()
        }
      ]
    });

    await newContext.save();

    return newContext;
  }
}
