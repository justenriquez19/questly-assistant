import { Document } from 'mongoose';

import { UserConfigurationModel } from '../shared/models/user-configurations';
import { IUserConfiguration } from '../shared/interfaces/user-configuration.interface';
import { UpdateUserConfigParams } from '../shared/interfaces/gpt-interfaces';

/**
 * @description Service for managing user configuration settings in the database.
 * Provides methods to retrieve, update, and delete user configuration using MongoDB.
 */
export class UserConfigDataService {
  /**
   * @description Fetches user configuration by session ID.
   * @param {string} currentSessionId - Session ID for config lookup.
   * @returns {Promise<Document & IUserConfiguration>} - The configuration document.
   */
  public async getConfigBySession(currentSessionId: string): Promise<Document & IUserConfiguration> {
    return UserConfigurationModel.findOne({ sessionId: currentSessionId }).lean().exec() as Promise<Document & IUserConfiguration>;
  }

  /**
   * @description Updates a user's configuration.
   */
  public async updateUserConfiguration(params: UpdateUserConfigParams): Promise<Document & IUserConfiguration> {
    const { sessionId, updateFields } = params;

    try {
      const updatedConfig = await UserConfigurationModel.findOneAndUpdate(
        { sessionId },
        { $set: { ...updateFields } },
        { new: true, runValidators: true }
      );

      if (!updatedConfig) {
        throw new Error(`No configuration found for session ${sessionId}`);
      }

      return updatedConfig;
    } catch (error) {
      console.error(`Error updating configuration for session ${sessionId}:`, error);
      throw error;
    }
  }
}
