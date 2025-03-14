import mongoose, { Schema } from 'mongoose';

import { IChatGptHistoryBody, IChatStructure } from '../interfaces/persistent-chats.interface';


const ChatGptHistoryBodySchema = new Schema<IChatGptHistoryBody>({
    content: { type: String, required: true },
    messageDate: { type: Date, required: true },
    role: { type: String, required: true }
});

const HistoryStructureSchema = new Schema<IChatStructure>({
    chatHistory: [ChatGptHistoryBodySchema],
    chatId: { type: String, required: true },
    clientName: { type: String, required: true },
    isFirstContact: { type: Boolean, required: true },
    sessionId: { type: String, required: true },
    shouldDeleteAfterContact: { type: Boolean, required: true },
    shouldRespond: { type: Boolean, required: true },
    timeOfLastMessage: { type: Date, required: true }
});

export const PersistentChatModel = mongoose.model<IChatStructure>('persistentChats', HistoryStructureSchema);
