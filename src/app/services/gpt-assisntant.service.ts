import OpenAI from 'openai';
import { Document } from 'mongoose';

import { ALES_PLACE_MAIN_FUNCTIONS } from '../shared/constants/functions.constants';
import { AppConstants, AuxiliarMessages, AvailableGptModels, ErrorMessages, FunctionNames, GptRoles, ResponseMessages } from '../shared/constants/app.constants';
import { BOT_BEHAVIOR_DESCRIPTION } from '../shared/constants/ales-bible.constants';
import { ChatCompletion, ChatCompletionMessageParam } from 'openai/resources';
import { ChatGptHistoryBody, CreateChatCompletionFunction, ExecuteFunctionBody, IChatGptApiError } from '../shared/interfaces/gpt-interfaces';
import { IHistoryStructure, PersistentChatModel } from '../shared/models/persistent-chats';

export class GPTAssistant {
  public chatGpt: OpenAI;
  public currentFunctions: CreateChatCompletionFunction[];

  constructor() {
    this.chatGpt = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY,
    });
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
    let chatGptResponse: ChatCompletion;
    const context = await this.setInitialContext(text, currentChatId, currentClientName);

    if (!context.isFirstContact) {
      chatGptResponse = await this.getChatGptResponse(context.chatHistory, this.currentFunctions, BOT_BEHAVIOR_DESCRIPTION);
    } else {
      context.chatHistory.push({
        role: GptRoles.Assistant,
        content: `${ResponseMessages.FirstConcact1}${currentClientName}${ResponseMessages.FirstConcact2}`
      });
      await context.save();

      return {
        functionName: FunctionNames.FirstConcact,
        args: null,
        message: { content: AppConstants.MESSAGE_KEY }
      };
    }
    const message = chatGptResponse.choices[0].message;

    // Add system message to chat history
    if (message.content) {
      context.timeOfLastMessage = new Date();
      context.chatHistory.push({
        role: message.role,
        content: message.content as string
      });
    }
    await context.save();

    if (message.function_call) {
      const functionName = message.function_call.name;
      const args = message.function_call.arguments;
      message.content = AuxiliarMessages.FunctionsToCall + functionName;

      return { functionName, args, message };
    }

    return { functionName: null, args: null, message };
  }

  /**
   * @description Process the response from the GPT model after executing a function.
   * @param {string} functionName - The name of the function executed.
   * @param {string} functionResponse - The response from the executed function.
   * @param {string} currentChatId - The current chat ID.
   * @returns {Promise<string>} - The content of the GPT model's response.
   */
  public async processResponse(functionName: string, functionResponse: string, currentChatId: string): Promise<string> {
    let context = await this.getContextByChatId(currentChatId);
    const functionToExecute = {
      functionName,
      functionResponse
    };
    const chatGptResponse = await this.sendFunctionToChatGpt(context.chatHistory, functionToExecute);

    // Add system message to chat history
    context.timeOfLastMessage = new Date();
    context.chatHistory.push({
      role: chatGptResponse.choices[0].message.role,
      content: chatGptResponse.choices[0].message.content as string
    });

    await context.save();

    return chatGptResponse.choices[0].message.content as string;
  }

  /**
   * @description Get the GPT model's response based on the chat history and expected behavior.
   * @param {ChatGptHistoryBody[]} chatHistory - The chat history.
   * @param {CreateChatCompletionFunction[]} functionsList - The list of functions.
   * @param {string} expectedBehavior - The expected behavior for the GPT model.
   * @returns {Promise<ChatCompletion>} - The GPT model's response.
   */
  private async getChatGptResponse(chatHistory: ChatGptHistoryBody[], functionsList: CreateChatCompletionFunction[], expectedBehavior: string): Promise<ChatCompletion> {
    try {
      const chatResponse = await this.chatGpt.chat.completions.create({
        model: AvailableGptModels.GPT_4_O,
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
   * @returns {Promise<ChatCompletion>} - The GPT model's response.
   */
  private async sendFunctionToChatGpt(chatHistory: ChatGptHistoryBody[], functionToExecute: ExecuteFunctionBody): Promise<ChatCompletion> {
    try {
      const chatResponse = await this.chatGpt.chat.completions.create({
        model: AvailableGptModels.GPT_4_O,
        messages: [
          {
            role: GptRoles.System,
            content: BOT_BEHAVIOR_DESCRIPTION
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
  private async setInitialContext(text: string, currentChatId: string, currentClientName: string): Promise<Document & IHistoryStructure> {
    let context = await this.getContextByChatId(currentChatId);

    if (!context) {
      context = await this.createInitialContext(text, currentChatId, currentClientName);
    } else {
      if (text !== AppConstants.EMPTY_STRING) {
        context.chatHistory.push({
          role: GptRoles.User,
          content: text
        });
      }
      context.isFirstContact = false;
    }

    await context.save();

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

    context.chatHistory.push({
      role: roleProvided,
      content: text
    });
    context.isFirstContact = false;

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
  public async createInitialContext(text: string, currentChatId: string, currentClientName: string): Promise<Document & IHistoryStructure> {
    const newContext = new PersistentChatModel({
      chatId: currentChatId,
      clientName: currentClientName,
      timeOfLastMessage: new Date(),
      isFirstContact: true,
      shouldRespond: true,
      chatHistory: [
        {
          role: GptRoles.User,
          content: `${text}${AuxiliarMessages.MyNameIs} ${currentClientName}`
        }
      ]
    });

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
   * @description Updates the `shouldRespond` property of the chat context.
   * @param {string} currentChatId - The ID of the current chat.
   * @param {boolean} newShouldRespondValue - The new value for the `shouldRespond` property.
   * @returns {Promise<Document & IHistoryStructure>} - Returns the updated context document.
   * @throws {Error} If the context for the given chat ID is not found.
   */
  public async updateShouldRespond(currentChatId: string, newShouldRespondValue: boolean): Promise<Document & IHistoryStructure> {
    try {
      const context = await this.getContextByChatId(currentChatId);

      if (!context) {
        throw new Error(`${ErrorMessages.ContextNotFound} ${currentChatId}`);
      }
      context.shouldRespond = newShouldRespondValue;
      context.isFirstContact = false;

      await context.save();

      return context;
    } catch (error) {
      console.error(`${ErrorMessages.FailedUpdatingContext} ${currentChatId}`, error);
      throw error;
    }
  }
}
