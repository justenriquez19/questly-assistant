import { ChatCompletion, ChatCompletionMessageParam, ChatCompletionTool } from 'openai/resources';
import OpenAI from 'openai';

import {
  AuxiliarMessages,
  ErrorMessages,
  GptRoles,
} from '../shared/constants/app.constants';
import {
  ChatGptHistoryBody,
  ExecuteFunctionBody,
  IChatGptApiError,
} from '../shared/interfaces/gpt-interfaces';
import { CoreUtils } from './core-utils.service';
import { IDynamicContext } from '../shared/interfaces/user-configuration.interface';

export class GptAssistant {
  public chatGpt: OpenAI;

  constructor(
    private utils: CoreUtils
  ) {
    this.chatGpt = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY,
    });
  }

  /**
   * @description Generates a GPT response using the chat history, tools, and dynamic user configuration.
   * @param {Array<ChatGptHistoryBody>} chatHistory - The conversation history.
   * @param {Array<ChatCompletionTool>} functionsList - List of tools (functions) to pass to the model.
   * @param {string} expectedBehavior - The general behavior expected from the model.
   * @param {string} targetModel - The GPT model version to use.
   * @param {boolean} shouldAddDate - Whether to append the current date and time to the system message.
   * @param {IDynamicContext} [dynamicContext] - Current context info, including whether it's active and the current message.
   * @returns {Promise<ChatCompletion>} - The GPT model's response.
   */
  public async getChatGptResponse(chatHistory: Array<ChatGptHistoryBody>, functionsList: Array<ChatCompletionTool>,
    expectedBehavior: string, targetModel: string, shouldAddDate: boolean, dynamicContext?: IDynamicContext): Promise<ChatCompletion> {
    try {
      const cleanMessages = this.utils.extractRelevantChatMessages(chatHistory);
      let currentBehavior: string = dynamicContext?.isActive ?
        `${expectedBehavior}\n\n${AuxiliarMessages.DynamicContext} ${dynamicContext.message}` : expectedBehavior;

      if (shouldAddDate) {
        const currentDateTime = this.utils.formatDate(new Date());
        currentBehavior = `${currentBehavior}\n\n[${AuxiliarMessages.CurrentDateTime} ${currentDateTime}]`;
      }

      if (functionsList.length) {
        const chatResponse = await this.chatGpt.chat.completions.create({
          model: targetModel,
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
          model: targetModel,
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
   * @description Sends a function call to GPT along with chat history and dynamic behavior context.
   * @param {ChatGptHistoryBody[]} chatHistory - The conversation history.
   * @param {ExecuteFunctionBody} functionToExecute - Function call and its result to send to GPT.
   * @param {string} expectedBehavior - The general behavior expected from the model.
   * @param {string} targetModel - The GPT model version to use.
   * @param {boolean} shouldAddDate - Whether to append the current date and time to the system message.
   * @param {IDynamicContext} [dynamicContext] - Current context info, including whether it's active and the current message.
   * @returns {Promise<ChatCompletion>} - The GPT model's response.
   */
  public async sendFunctionToChatGpt(chatHistory: ChatGptHistoryBody[], functionToExecute: ExecuteFunctionBody,
    expectedBehavior: string, targetModel: string, shouldAddDate: boolean, dynamicContext?: IDynamicContext): Promise<ChatCompletion> {
    try {
      const cleanMessages = this.utils.extractRelevantChatMessages(chatHistory);
      let currentBehavior: string = dynamicContext?.isActive ?
        `${expectedBehavior}\n\n${AuxiliarMessages.DynamicContext} ${dynamicContext.message}` : expectedBehavior;

      if (shouldAddDate) {
        const currentDateTime = this.utils.formatDate(new Date());
        currentBehavior = `${currentBehavior}\n\n[${AuxiliarMessages.CurrentDateTime} ${currentDateTime}]`;
      }

      const chatResponse = await this.chatGpt.chat.completions.create({
        model: targetModel,
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
}
