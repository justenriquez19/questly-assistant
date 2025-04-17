import { AppConstants, AvailableGptModels, ErrorMessages, GptRoles, GptToolsMessages } from "../shared/constants/app.constants";
import { ChatGptHistoryBody, ValidNameStructure } from "../shared/interfaces/gpt-interfaces";
import { DYNAMIC_CONTEXT_DETECTION_TOOL, MESSAGE_NAME_DETECTION_DESCRIPTION, WHATSAPP_NAME_DETECTION_DESCRIPTION } from "../shared/constants/funcition.constants";
import { DynamicContextToolResponse } from "../shared/interfaces/gpt-tools-interfaces";
import { GptAssistant } from "./gpt-assistant.service";
import { IUserConfiguration } from "../shared/interfaces/user-configuration.interface";

export class AiTools {
  constructor(
    private assistant: GptAssistant
  ) { }

  /**
   * @description Validates if a given name is considered valid using GPT evaluation.
   * @param {string} name - The name to validate.
   * @param {boolean} [isMessageDetection] - Whether the name comes from a user message or a WhatsApp profile.
   * @returns {Promise<ValidNameStructure>} - Result with validity status and extracted first name if valid.
   */
  public async isNameValid(name: string, isMessageDetection?: boolean): Promise<ValidNameStructure> {
    const defaultResponse = {
      isValidName: false,
      firstName: AppConstants.DEF_USER_NAME
    };

    if (!name?.length) return defaultResponse;

    const chatHistory: ChatGptHistoryBody[] = [{ content: name, role: GptRoles.User }];
    const expectedBehavior = isMessageDetection ? MESSAGE_NAME_DETECTION_DESCRIPTION : WHATSAPP_NAME_DETECTION_DESCRIPTION;
    const targetGptModel = AvailableGptModels.GPT4_1_M;

    try {
      const chatResponse = await this.assistant.getChatGptResponse(chatHistory, [], expectedBehavior, targetGptModel, false);
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
    const targetGptModel = AvailableGptModels.GPT4_1_M;

    try {
      const chatResponse = await this.assistant.getChatGptResponse(chatHistory, [], expectedBehavior, targetGptModel, false);
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