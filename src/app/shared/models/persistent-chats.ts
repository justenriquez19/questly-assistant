import mongoose, { Schema, Document } from 'mongoose';

export interface IChatGptHistoryBody {
    content: string;
    messageDate: Date;
    role: string;
}

export interface IHistoryStructure extends Document {
    chatHistory: IChatGptHistoryBody[];
    chatId: string;
    clientName: string;
    isFirstContact: boolean;
    shouldRespond: boolean;
    timeOfLastMessage: Date;
}

const ChatGptHistoryBodySchema = new Schema<IChatGptHistoryBody>({
    content: { type: String, required: true },
    messageDate: { type: Date, required: true },
    role: { type: String, required: true }
});

const HistoryStructureSchema = new Schema<IHistoryStructure>({
    chatHistory: [ChatGptHistoryBodySchema],
    chatId: { type: String, required: true },
    clientName: { type: String, required: true },
    isFirstContact: { type: Boolean, required: true },
    shouldRespond: { type: Boolean, required: true },
    timeOfLastMessage: { type: Date, required: true }
});

export const PersistentChatModel = mongoose.model<IHistoryStructure>('persistentChats', HistoryStructureSchema);
