import { Document } from "mongoose";

export interface IChatGptHistoryBody {
  content: string;
  messageDate: Date;
  role: string;
}

export interface IChatStructure extends Document {
  chatHistory: IChatGptHistoryBody[];
  chatId: string;
  clientName: string;
  isFirstContact: boolean;
  sessionId: string;
  shouldDeleteAfterContact: boolean;
  shouldRespond: boolean;
  timeOfLastMessage: Date;
}
