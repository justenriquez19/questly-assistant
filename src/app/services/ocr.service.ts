import Tesseract from 'tesseract.js';
import { Buffer } from 'buffer';
import { AppConstants, AppPatterns, AuxiliarMessages, MediaTypes, ErrorMessages, GptRoles } from '../shared/constants/app.constants';
import { ExtendedMessage } from '../shared/interfaces/gpt-interfaces';
import { GptAssistant } from './gpt-assistant.service';
import { SessionContext } from '../shared/interfaces/session.interfaces';
import { IUserConfiguration } from '../shared/interfaces/user-configuration.interface';

/**
 * @description Provides optical character recognition.
 */
export class OcrService {
  constructor(
    private assistant: GptAssistant
  ) { }

  /**
   * @description Detects a bank transfer in an image message using OCR and Tesseract for a session.
   * @param {IUserConfiguration} userConfig - The session identifier.
   * @param {ExtendedMessage} message - The image message.
   * @param {string} senderId - The sender identifier.
   * @returns {Promise<boolean>} True if bank transfer is detected.
   */
  public async detectBankTransfer(userConfig: IUserConfiguration, message: ExtendedMessage,
    senderId: string, session: SessionContext): Promise<boolean> {
    const sessionId = userConfig.sessionId;
    const responseMessages = userConfig.responseMessages;
    const currentNotificationUser = userConfig.notificationContacts.mainContact;

    if (message.type as string !== MediaTypes.Image) {
      return false;
    }
    const media = await message.downloadMedia();

    if (!media.data) {
      console.error(ErrorMessages.ImageDataNotFound);
    }
    try {
      const buffer = Buffer.from(media.data, MediaTypes.Base64);
      const { data: { text } } = await Tesseract.recognize(buffer, AppConstants.SPANISH_KEY);
      const textToAnalyze = text.toLocaleLowerCase();
      let detectedBankPattern = false;
      for (const pattern of AppPatterns.bankPatterns) {
        if (pattern.test(textToAnalyze)) {
          detectedBankPattern = true;
          break;
        }
      }

      if (detectedBankPattern) {
        const responseText = responseMessages.ThanksForYourPayment;
        await this.assistant.addNewMessage(`${MediaTypes.Image}: ${AuxiliarMessages.BankTransferPayment}`, senderId, sessionId, GptRoles.User);
        const currentClientName = (await this.assistant.addNewMessage(responseText, senderId, sessionId, GptRoles.Assistant)).clientName;
        session.client.sendMessage(message.from, responseText);
        const notificationMessage = `${responseMessages.NotificationSystem}\n\n${responseMessages.PendingMessage1} ${currentClientName}
          \n${responseMessages.PendingMessage2} ${senderId}\n\n${responseMessages.BankTransferVoucherReceived}\n\n${AppConstants.NOT_REPLY}`;
        session.client.sendMessage(currentNotificationUser, notificationMessage);
        session.client.sendMessage(currentNotificationUser, media, { caption: message._data.caption });
        return true;
      } else {
        return false;
      }
    } catch (error) {
      console.error(ErrorMessages.TesseractProccesingError, error);
      return false;
    }
  }
}
