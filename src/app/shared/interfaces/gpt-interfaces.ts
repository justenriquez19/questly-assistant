import { Message } from "whatsapp-web.js";

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
    notifyName: string;
  };
}

export interface CreateChatCompletionFunction {
  name: string;
  description?: string;
  parameters?: {
    type: string;
    properties: object;
  };
}

export interface FunctionsListInterface {
  list: CreateChatCompletionFunction[];
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