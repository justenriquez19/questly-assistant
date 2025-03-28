import { ChatCompletion, ChatCompletionMessageParam, ChatCompletionTool } from 'openai/resources';
import { Document } from 'mongoose';
import OpenAI from 'openai';

import {
  AppConstants,
  AuxiliarMessages,
  AvailableGptModels,
  ErrorMessages,
  FunctionNames,
  GptRoles,
  GptToolsMessages
} from '../shared/constants/app.constants';
import {
  ChatGptHistoryBody,
  ExecuteFunctionBody,
  IChatGptApiError,
  ValidNameStructure
} from '../shared/interfaces/gpt-interfaces';
import { ChatDataService } from '../data/chat-data.service';
import { CoreUtilFunctions } from './core-utils.service';
import { DYNAMIC_CONTEXT_DETECTION_TOOL, MESSAGE_NAME_DETECTION_DESCRIPTION, WHATSAPP_NAME_DETECTION_DESCRIPTION } from '../shared/constants/funcition.constants';
import { DynamicContextToolResponse } from '../shared/interfaces/gpt-tools-interfaces';
import { IChatGptHistoryBody, IChatStructure } from '../shared/interfaces/persistent-chats.interface';
import { IUserConfiguration } from '../shared/interfaces/user-configuration.interface';
import { PersistentChatModel } from '../shared/models/persistent-chats';

export class GptAssistant {
  public chatGpt: OpenAI;

  constructor(
    private chatDataService: ChatDataService,
    private utils: CoreUtilFunctions
  ) {
    this.chatGpt = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY,
    });
  }

  /**
   * @description Process the input text and generate a response from the GPT model.
   * @param {string} text - The input text from the user.
   * @param {string} currentChatId - The current chat ID.
   * @param {string} currentClientName - The current client's name.
   * @returns {Promise<any>} - The function name and arguments if a function call is required, otherwise null.
   */
  public async processFunctions(text: string, currentChatId: string, currentClientName: string, userConfig: IUserConfiguration) {
    const context = await this.addNewUserMessage(text, currentChatId, currentClientName, userConfig.sessionId);
    const currentMessage = [context.chatHistory.at(-1) as IChatGptHistoryBody];
    const currentFunctions = userConfig.activeFunctions;
    const botBehavior = userConfig.botBehavior;
    const dynamicContext = userConfig.dynamicContext;
    const botGeneralBehavior = dynamicContext.isActive ? `${botBehavior}\n\n${AuxiliarMessages.DynamicContext} ${dynamicContext.message}` : botBehavior;

    const chatGptResponse = await this.getChatGptResponse(currentMessage, currentFunctions,
      botGeneralBehavior, AvailableGptModels.GPT_4_O);
    let message = chatGptResponse.choices[0].message;

    if (message.tool_calls?.length) {
      const args = message.tool_calls[0].function?.arguments;
      const parseContent = JSON.parse(args);
      const functionName = message.tool_calls[0].function?.name;
      message.content = AuxiliarMessages.FunctionsToCall + functionName;

      return { functionName, args: parseContent, message, context };
    } else {
      if (this.utils.includesNameIntroduction(text)) {
        const nameReponse = await this.isNameValid(text, true);
        if (nameReponse.isValidName) {
          const functionName = FunctionNames.GetUsersName;
          const args = { name: nameReponse.firstName };
          message.content = AuxiliarMessages.FunctionsToCall + functionName;

          return { functionName, args, message, context };
        }
      }
      message = (await this.getChatGptResponse(context.chatHistory, [],
        botGeneralBehavior, AvailableGptModels.GPT_4_O)).choices[0].message;
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

    return { functionName: null, args: null, message, context };
  }

  /**
   * @description Process the response from the GPT model after executing a function.
   * @param {string} functionName - The name of the function executed.
   * @param {string} functionResponse - The response from the executed function.
   * @param {string} currentChatId - The current chat ID.
   * @returns {Promise<string>} - The content of the GPT model's response.
   */
  public async processResponse(functionName: string, functionResponse: string, currentChatId: string, userConfig: IUserConfiguration): Promise<string> {
    let context = await this.chatDataService.getContextByChatId(currentChatId, userConfig.sessionId);
    const functionToExecute = {
      functionName,
      functionResponse
    };
    const chatGptResponse = await this.sendFunctionToChatGpt(context.chatHistory, functionToExecute, userConfig);
    const content = chatGptResponse.choices[0].message.content as string;
    await this.addNewMessage(content, context.chatId, context.sessionId, GptRoles.Assistant);

    return content;
  }

  /**
   * @description Get the GPT model's response based on the chat history and expected behavior.
   * @param {ChatGptHistoryBody[]} chatHistory - The chat history.
   * @param {ChatCompletionTool[]} functionsList - The list of functions.
   * @param {string} botGeneralBehavior - The expected behavior for the GPT model.
   * @param {string} targetGptModel - The GPT model version to target.
   * @returns {Promise<ChatCompletion>} - The GPT model's response.
   */
  private async getChatGptResponse(chatHistory: ChatGptHistoryBody[], functionsList: ChatCompletionTool[],
    botGeneralBehavior: string, targetGptModel: string): Promise<ChatCompletion> {
    try {
      const currentDateTime = this.utils.formatDate(new Date());
      const currentBehavior = `${botGeneralBehavior}\n\n[${AuxiliarMessages.CurrentDateTime} ${currentDateTime}]`;
      const cleanMessages = this.utils.extractRelevantChatMessages(chatHistory);
      if (functionsList.length) {
        const chatResponse = await this.chatGpt.chat.completions.create({
          model: targetGptModel,
          messages: [
            {
              role: GptRoles.System,
              content: currentBehavior
            },
            ...cleanMessages as []
          ],
          tools: functionsList
        });

        return chatResponse;
      } else {
        const chatResponse = await this.chatGpt.chat.completions.create({
          model: targetGptModel,
          messages: [
            {
              role: GptRoles.System,
              content: currentBehavior
            },
            ...cleanMessages as []
          ]
        });

        return chatResponse;
      }
    } catch (error: unknown) {
      if (this.isGptApiError(error)) {
        this.handleError(error);
      } else {
        console.error(ErrorMessages.UnexpectedError, error);
      }
      throw error;
    }
  }

  /**
   * @description Send the function execution result to the GPT model and get a response.
   * @param {ChatGptHistoryBody[]} chatHistory - The chat history.
   * @param {ExecuteFunctionBody} functionToExecute - The function to execute.
   * @param {IUserConfiguration} userConfig - The user's current configuration.
   * @returns {Promise<ChatCompletion>} - The GPT model's response.
   */
  private async sendFunctionToChatGpt(chatHistory: ChatGptHistoryBody[], functionToExecute: ExecuteFunctionBody,
    userConfig: IUserConfiguration): Promise<ChatCompletion> {
    try {
      const botBehavior = userConfig.botBehavior;
      const dynamicContext = userConfig.dynamicContext;
      const botGeneralBehavior = dynamicContext.isActive ? `${botBehavior}\n\n${AuxiliarMessages.DynamicContext} ${dynamicContext.message}` : botBehavior;
      const currentDateTime = this.utils.formatDate(new Date());
      const currentBehavior = `${botGeneralBehavior}\n\n[${AuxiliarMessages.CurrentDateTime} ${currentDateTime}]`;
      const cleanMessages = this.utils.extractRelevantChatMessages(chatHistory);
      const chatResponse = await this.chatGpt.chat.completions.create({
        model: AvailableGptModels.GPT_4_O,
        messages: [
          {
            role: GptRoles.System,
            content: currentBehavior
          },
          ...cleanMessages as ChatCompletionMessageParam[],
          {
            role: GptRoles.Function,
            name: functionToExecute.functionName,
            content: functionToExecute.functionResponse,
          }
        ]
      });

      return chatResponse;
    } catch (error: unknown) {
      if (this.isGptApiError(error)) {
        this.handleError(error);
      } else {
        console.error(ErrorMessages.UnexpectedError, error);
      }
      throw error;
    }
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
   * @description Create the initial context for a new chat.
   * @param {string} text - The input text from the user.
   * @param {string} currentChatId - The current chat ID.
   * @param {string} currentClientName - The current client's name.
   * @returns {Promise<Document & IChatStructure>} - The new chat context.
   */
  private async generateInitialContext(text: string, currentChatId: string, currentClientName: string, currentSessionId: string): Promise<Document & IChatStructure> {
    const processedName = (await this.isNameValid(currentClientName)).firstName;
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

  /**
   * @description Handle errors from API calls.
   * @param {IChatGptApiError} error - The error object.
   */
  private handleError(error: IChatGptApiError) {
    if (error.response && error.response.status === 429) {
      console.error(ErrorMessages.RateLimitError, error.message);
    } else {
      console.error(ErrorMessages.CallingError, error);
    }
  }

  /**
   * @description Check if an error is an IChatGptApiError.
   * @param {unknown} error - The error to check.
   * @returns {boolean} - True if the error is an IChatGptApiError, false otherwise.
   */
  private isGptApiError(error: unknown): error is IChatGptApiError {
    return typeof error === 'object' && error !== null && 'message' in error;
  }

  /**
   * @description Check if a given name is common or valid using the GPT model.
   * @param {string} name - The name to check.
   * @returns {Promise<ValidNameStructure>} - Object indicating if the name is valid and the name itself.
   */
  public async isNameValid(name: string, isMessageDetection?: boolean): Promise<ValidNameStructure> {
    const defaultResponse = {
      isValidName: false,
      firstName: AppConstants.DEF_USER_NAME
    };

    if (!name?.length) return defaultResponse;

    const chatHistory: ChatGptHistoryBody[] = [{ content: name, role: GptRoles.User }];
    const expectedBehavior = isMessageDetection ? MESSAGE_NAME_DETECTION_DESCRIPTION : WHATSAPP_NAME_DETECTION_DESCRIPTION;
    const targetGptModel = AvailableGptModels.GPT_4_O;

    try {
      const chatResponse = await this.getChatGptResponse(chatHistory, [], expectedBehavior, targetGptModel);
      const responseContent = chatResponse.choices[0].message.content;

      if (!responseContent) return defaultResponse;

      const parsedResponse = JSON.parse(responseContent.trim());

      return {
        isValidName: parsedResponse.isValidName,
        firstName: parsedResponse.isValidName ? parsedResponse.firstName : AppConstants.DEF_USER_NAME
      };
    } catch (error) {
      console.error(`${ErrorMessages.NameObtentionFailed} ${name}`, error);
      return defaultResponse;
    }
  }

  /**
   * @description Determines if the user's dynamic context should be updated based on message content.
   * @param {string} messageContent - The message to evaluate for context updates.
   * @param {IUserConfiguration} userConfig - The user's current configuration.
   * @returns {Promise<DynamicContextToolResponse>} - Indicates whether an update is needed and the new context.
   */
  public async shouldUpdateDynamicContext(messageContent: string, userConfig: IUserConfiguration): Promise<DynamicContextToolResponse> {
    const defaultResponse = {
      shouldUpdate: false,
      contextUpdated: AppConstants.EMPTY_STRING
    };

    if (!messageContent?.length) return defaultResponse;

    const dynamicContext = userConfig.dynamicContext.isActive ? userConfig.dynamicContext.message : AppConstants.EMPTY_STRING;
    const currentDirective = `${GptToolsMessages.CurrentContext} ${dynamicContext}`;
    const tentativeInstruction = `${GptToolsMessages.TentativeNewInstruction} ${messageContent}`;
    const chatHistory: ChatGptHistoryBody[] = [{ content: currentDirective, role: GptRoles.System }, { content: tentativeInstruction, role: GptRoles.User }];
    const expectedBehavior = DYNAMIC_CONTEXT_DETECTION_TOOL;
    const targetGptModel = AvailableGptModels.GPT_4_O;

    try {
      const chatResponse = await this.getChatGptResponse(chatHistory, [], expectedBehavior, targetGptModel);
      const responseContent = chatResponse.choices[0].message.content;

      if (!responseContent) return defaultResponse;

      const parsedResponse = JSON.parse(responseContent.trim());

      return {
        shouldUpdate: parsedResponse.shouldUpdate,
        contextUpdated: parsedResponse.contextUpdated
      };
    } catch (error) {
      console.error(`${ErrorMessages.FailedUpdatingDynamicContext} ${userConfig.sessionId}`, error);
      return defaultResponse;
    }
  }
}
