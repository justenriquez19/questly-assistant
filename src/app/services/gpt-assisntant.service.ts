import OpenAI from 'openai';
import { Document } from 'mongoose';

import { ALES_PLACE_MAIN_FUNCTIONS } from '../shared/constants/functions.constants';
import {
  AppConstants,
  AuxiliarMessages,
  AvailableGptModels,
  ErrorMessages,
  FunctionNames,
  GptRoles
} from '../shared/constants/app.constants';
import { BOT_GENERAL_BEHAVIOR, MESSAGE_NAME_DETECTION_DESCRIPTION, WHATSAPP_NAME_DETECTION_DESCRIPTION } from '../shared/constants/ales-bible.constants';
import { ChatCompletion, ChatCompletionMessageParam } from 'openai/resources';
import {
  ChatGptHistoryBody,
  CreateChatCompletionFunction,
  ExecuteFunctionBody,
  IChatGptApiError,
  UpdateContextParams,
  ValidNameStructure
} from '../shared/interfaces/gpt-interfaces';
import { CoreUtilFunctions } from './core-utils.service';
import { IChatGptHistoryBody, IHistoryStructure, PersistentChatModel } from '../shared/models/persistent-chats';

export class GPTAssistant {
  public chatGpt: OpenAI;
  public currentFunctions: CreateChatCompletionFunction[];
  public utils: CoreUtilFunctions;

  constructor() {
    this.chatGpt = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY,
    });
    this.utils = new CoreUtilFunctions;
    this.currentFunctions = ALES_PLACE_MAIN_FUNCTIONS.list;
  }

  /**
   * @description Process the input text and generate a response from the GPT model.
   * @param {string} text - The input text from the user.
   * @param {string} currentChatId - The current chat ID.
   * @param {string} currentClientName - The current client's name.
   * @returns {Promise<any>} - The function name and arguments if a function call is required, otherwise null.
   */
  public async processFunctions(text: string, currentChatId: string, currentClientName: string) {
    const context = await this.addNewUserMessage(text, currentChatId, currentClientName);
    const currentMessage = [context.chatHistory.at(-1) as IChatGptHistoryBody];
    const chatGptResponse = await this.getChatGptResponse(currentMessage, this.currentFunctions,
      BOT_GENERAL_BEHAVIOR, AvailableGptModels.GPT_3_5_TURBO_16K_0613);
    let message = chatGptResponse.choices[0].message;

    if (message.function_call) {
      let args;
      const functionName = message.function_call.name;
      message.content = AuxiliarMessages.FunctionsToCall + functionName;

      return { functionName, args, message, context };
    } else {
      if (this.utils.includesNameIntroduction(text)) {
        const nameReponse = await this.isNameValid(text, true);
        if (nameReponse.isValidName) {
          const functionName = FunctionNames.GetUsersName;
          const args = {name: nameReponse.firstName};
          message.content = AuxiliarMessages.FunctionsToCall + functionName;

          return { functionName, args, message, context };
        }
      }
      message = (await this.getChatGptResponse(context.chatHistory, [],
        BOT_GENERAL_BEHAVIOR, AvailableGptModels.GPT_4_O)).choices[0].message;

      await this.addNewMessage(message.content as string, context.chatId, GptRoles.Assistant);
    }

    return { functionName: null, args: null, message, context };
  }

  /**
   * @description Process the response from the GPT model after executing a function.
   * @param {string} functionName - The name of the function executed.
   * @param {string} functionResponse - The response from the executed function.
   * @param {string} currentChatId - The current chat ID.
   * @param {string} expectedBehavior - The expected behavior for the GPT model.
   * @returns {Promise<string>} - The content of the GPT model's response.
   */
  public async processResponse(functionName: string, functionResponse: string, currentChatId: string, expectedBehavior?: string): Promise<string> {
    let context = await this.getContextByChatId(currentChatId);
    const functionToExecute = {
      functionName,
      functionResponse
    };
    const chatGptResponse = await this.sendFunctionToChatGpt(context.chatHistory, functionToExecute, expectedBehavior);
    const content = chatGptResponse.choices[0].message.content as string;
    await this.addNewMessage(content, context.chatId, GptRoles.Assistant);

    return content;
  }

  /**
   * @description Get the GPT model's response based on the chat history and expected behavior.
   * @param {ChatGptHistoryBody[]} chatHistory - The chat history.
   * @param {CreateChatCompletionFunction[]} functionsList - The list of functions.
   * @param {string} expectedBehavior - The expected behavior for the GPT model.
   * @param {string} targetGptModel - The GPT model version to target.
   * @returns {Promise<ChatCompletion>} - The GPT model's response.
   */
  private async getChatGptResponse(chatHistory: ChatGptHistoryBody[], functionsList: CreateChatCompletionFunction[],
    expectedBehavior: string, targetGptModel: string): Promise<ChatCompletion> {
    try {
      const currentDateTime = this.utils.formatDate(new Date());
      expectedBehavior = `${expectedBehavior}\n\n[${AuxiliarMessages.CurrentDateTime} ${currentDateTime}]`;
      if (functionsList.length) {
        const chatResponse = await this.chatGpt.chat.completions.create({
          model: targetGptModel,
          messages: [
            {
              role: GptRoles.System,
              content: expectedBehavior
            },
            ...chatHistory as []
          ],
          functions: functionsList,
          function_call: AppConstants.AUTO_KEY,
        });

        return chatResponse;
      } else {
        const chatResponse = await this.chatGpt.chat.completions.create({
          model: targetGptModel,
          messages: [
            {
              role: GptRoles.System,
              content: expectedBehavior
            },
            ...chatHistory as []
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
   * @param {string} expectedBehavior - The expected behavior for the GPT model.
   * @returns {Promise<ChatCompletion>} - The GPT model's response.
   */
  private async sendFunctionToChatGpt(chatHistory: ChatGptHistoryBody[], functionToExecute: ExecuteFunctionBody, expectedBehavior?: string): Promise<ChatCompletion> {
    try {
      const behavior = expectedBehavior ? BOT_GENERAL_BEHAVIOR + expectedBehavior : BOT_GENERAL_BEHAVIOR;
      const currentDateTime = this.utils.formatDate(new Date());
      const currentBehavior = `${behavior}\n\n[${AuxiliarMessages.CurrentDateTime} ${currentDateTime}]`;
      const chatResponse = await this.chatGpt.chat.completions.create({
        model: AvailableGptModels.GPT_4_O,
        messages: [
          {
            role: GptRoles.System,
            content: currentBehavior
          },
          ...chatHistory as ChatCompletionMessageParam[],
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
   * @returns {Promise<Document & IHistoryStructure>} - The chat context.
   */
  public async addNewUserMessage(text: string, currentChatId: string, currentClientName: string): Promise<Document & IHistoryStructure> {
    let context = await this.getContextByChatId(currentChatId);

    if (!context) {
      context = await this.generateInitialContext(text, currentChatId, currentClientName);
    } else {
      if (text !== AppConstants.EMPTY_STRING) {
        context = await this.addNewMessage(text, currentChatId, GptRoles.User);
      }
    }

    return context;
  }

  /**
   * @description Adds a new message to the chat history and updates the context for the given chat ID.
   * @param {string} text - The content of the message to be added.
   * @param {string} currentChatId - The ID of the current chat.
   * @param {string} roleProvided - The role of the sender (e.g., 'user', 'assistant').
   * @returns {Promise<Document & IHistoryStructure>} - Returns the updated context document with the new message added.
   */
  public async addNewMessage(text: string, currentChatId: string, roleProvided: string): Promise<Document & IHistoryStructure> {
    let context = await this.getContextByChatId(currentChatId);
    const currentDateTime = this.utils.formatDate(new Date());

    context.chatHistory.push({
      role: roleProvided,
      content: roleProvided === GptRoles.User ? `${text}'\n\n[${AuxiliarMessages.MessageDateTime} ${currentDateTime}]` : text,
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
   * @description Retrieve the context by chat ID.
   * @param {string} currentChatId - The current chat ID.
   * @returns {Promise<Document & IHistoryStructure>} - The chat context.
   */
  public async getContextByChatId(currentChatId: string): Promise<Document & IHistoryStructure> {
    return PersistentChatModel.findOne({ chatId: currentChatId }).exec() as Promise<Document & IHistoryStructure>;
  }

  /**
   * @description Create the initial context for a new chat.
   * @param {string} text - The input text from the user.
   * @param {string} currentChatId - The current chat ID.
   * @param {string} currentClientName - The current client's name.
   * @returns {Promise<Document & IHistoryStructure>} - The new chat context.
   */
  private async generateInitialContext(text: string, currentChatId: string, currentClientName: string): Promise<Document & IHistoryStructure> {
    const processedName = (await this.isNameValid(currentClientName)).firstName;
    const currentDateTimeTime = this.utils.formatDate(new Date());
    const newContext = new PersistentChatModel({
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
   * @description Updates the specified fields of the chat context.
   * @param {UpdateContextParams} params - The parameters including chat ID and fields to update.
   * @returns {Promise<Document & IHistoryStructure>} - Returns the updated context document.
   * @throws {Error} If the context for the given chat ID is not found.
   */
  public async updateContext(params: UpdateContextParams): Promise<Document & IHistoryStructure> {
    const { chatId, updateFields } = params;

    try {
      const context = await this.getContextByChatId(chatId);

      if (!context) {
        throw new Error(`${ErrorMessages.ContextNotFound} ${chatId}`);
      }

      Object.assign(context, updateFields);
      context.isFirstContact = false;

      await context.save();

      return context;
    } catch (error) {
      console.error(`${ErrorMessages.FailedUpdatingContext} ${chatId}`, error);
      throw error;
    }
  }

  /**
   * @description Deletes the chat context for the specified chat ID.
   * @param {string} chatId - The chat ID for which the context should be deleted.
   * @returns {Promise<void>} - Returns a promise that resolves when the context is deleted.
   * @throws {Error} If the context for the given chat ID is not found.
   */
  public async deleteContextByChatId(chatId: string): Promise<void> {
    try {
      const context = await this.getContextByChatId(chatId);

      if (!context) {
        throw new Error(`${ErrorMessages.ContextNotFound} ${chatId}`);
      }

      await PersistentChatModel.deleteOne({ chatId });
    } catch (error) {
      console.error(`${ErrorMessages.FailedDeletingContext} ${chatId}`, error);
      throw error;
    }
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
}
