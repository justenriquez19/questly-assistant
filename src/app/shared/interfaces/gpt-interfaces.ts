import { ChatCompletionTool } from "openai/resources";
import { Message } from "whatsapp-web.js";

import { IHistoryStructure } from "../models/persistent-chats";

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

export interface UpdateContextParams {
  chatId: string;
  updateFields: Partial<IHistoryStructure>;
}

export interface ValidNameStructure {
  isValidName: boolean;
  firstName: string;
}
