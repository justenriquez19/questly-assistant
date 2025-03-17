import { Document } from 'mongoose';

import { PersistentChatModel } from '../shared/models/persistent-chats';
import { IChatStructure } from '../shared/interfaces/persistent-chats.interface';
import { UpdateChatParams } from '../shared/interfaces/gpt-interfaces';
import { ErrorMessages } from '../shared/constants/app.constants';

/**
 * @description Service for managing chat context persistence in the database.
 * Provides methods to retrieve, update, and delete chat contexts using MongoDB.
 */
export class ChatDataService {
  /**
   * @description Retrieve the context by chat ID.
   */
  public async getContextByChatId(currentChatId: string, currentSessionId: string): Promise<Document & IChatStructure> {
    return PersistentChatModel.findOne({ chatId: currentChatId, sessionId: currentSessionId }).exec() as Promise<Document & IChatStructure>;
  }

  /**
   * @description Updates the specified fields of the chat context.
   */
  public async updateChat(params: UpdateChatParams): Promise<Document & IChatStructure> {
    const { chatId, updateFields, sessionId } = params;

    try {
      const updatedChat = await PersistentChatModel.findOneAndUpdate(
        { chatId, sessionId },
        { $set: { ...updateFields, isFirstContact: false } },
        { new: true, runValidators: true }
      );

      if (!updatedChat) {
        throw new Error(`${ErrorMessages.ContextNotFound} ${chatId}`);
      }

      return updatedChat;
    } catch (error) {
      console.error(`${ErrorMessages.FailedUpdatingContext} ${chatId}`, error);
      throw error;
    }
  }

  /**
   * @description Deletes the chat context for the specified chat ID.
   */
  public async deleteContextByChatId(chatId: string, currentSessionId: string): Promise<void> {
    try {
      const context = await this.getContextByChatId(chatId, currentSessionId);

      if (!context) {
        throw new Error(`${ErrorMessages.ContextNotFound} ${chatId}`);
      }

      await PersistentChatModel.deleteOne({ chatId });
    } catch (error) {
      console.error(`${ErrorMessages.FailedDeletingContext} ${chatId}`, error);
      throw error;
    }
  }
}
