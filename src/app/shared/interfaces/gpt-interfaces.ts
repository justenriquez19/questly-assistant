import { ChatCompletionMessage, ChatCompletionTool } from "openai/resources";
import { Message } from "whatsapp-web.js";

import { IChatStructure } from "./persistent-chats.interface";
import { IUserConfiguration } from "./user-configuration.interface";

export interface IProcessFunctions {
  args: Record<string, string>;
  context: IChatStructure;
  functionName: string;
  message: ChatCompletionMessage;
}

export interface ChatGptHistoryBody {
  content: string;
  role: string;
}

export interface HistoryStructure {
  chatHistory: ChatGptHistoryBody[];
  chatId: string;
  clientName: string;
  isFirstContact: boolean;
  shouldRespond: boolean;
  timeOfLastMessage: Date;
}

export interface ExtendedMessage extends Message {
  _data: {
    caption: string;
    itemCount: number;
    notifyName: string;
    orderTitle: string;
  };
}

export interface ToolsListInterface {
  list: ChatCompletionTool[];
}

export interface FunctionCallBody extends ChatGptHistoryBody {
  name: string;
}

export interface ExecuteFunctionBody {
  functionName: string;
  functionResponse: string;
}

export interface IChatGptApiError {
  response?: {
    status: number;
  };
  message: string;
}

export interface UpdateChatParams {
  chatId: string;
  sessionId: string;
  updateFields: Partial<IChatStructure>;
}

export interface UpdateUserConfigParams {
  sessionId: string;
  updateFields: Partial<IUserConfiguration>;
}

export interface ValidNameStructure {
  isValidName: boolean;
  firstName: string;
}
