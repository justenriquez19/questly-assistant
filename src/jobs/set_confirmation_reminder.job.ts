import { Job } from 'agenda';

import { AI_SYSTEM } from '../index';
import { IConfirmationReminderJob, IReminderDelayConfig } from '../app/shared/interfaces/jobs/confirmation-reminder.interface';
import { ErrorMessages, WarningMessages } from '../app/shared/constants/app.constants';

/**
 * @description Job that handles sending confirmation reminders to users.
 * Uses a single job instance that reprograms itself until confirmation is received or max attempts are reached.
 */
export class ConfirmationReminderJob {
  constructor() { }

  /**
   * @description Entry point for the Agenda job. Sends a reminder if confirmation is pending.
   * @param {Job<IConfirmationReminderJob>} job - Agenda job instance with job-specific data.
   * @returns {Promise<void>}
   */
  public async handle(job: Job<IConfirmationReminderJob>): Promise<void> {
    if (!AI_SYSTEM) {
      console.warn(WarningMessages.WebSystemNotFound);
      return;
    }

    const { senderId, sessionId } = job.attrs.data;
    const attempt = job.attrs.data.attempt ?? 0;

    try {
      const userConfig = await AI_SYSTEM.userConfigDataService.getConfigBySession(sessionId);
      const context = await AI_SYSTEM.chatDataService.getContextByChatId(senderId, sessionId);
      const reminderConfig = userConfig.utilities.detectConfirmationPhase;
      const delays: Array<IReminderDelayConfig> | undefined = reminderConfig?.delays;

      if (!context) return this.stopJob(job);
      if (!context.isConfirmationPhase) return this.stopJob(job);
      if (!delays) return this.stopJob(job);

      const session = AI_SYSTEM.sessionService.getSessionById(sessionId);
      if (!session) return this.stopJob(job);

      const currentDelay = delays.find((delay) => delay.attempt === attempt);
      if (!currentDelay) return this.stopJob(job);

      await AI_SYSTEM.conversationManager.sendNotification(session, senderId, currentDelay.message);

      if (attempt >= delays.length - 1) {
        return this.stopJob(job);
      }

      job.attrs.data.attempt = attempt + 1;
      await job.schedule(currentDelay.time).save();
    } catch (error) {
      console.error(`${ErrorMessages.ErrorSettingReminder} ${senderId}: `, error);
    }
  }

  /**
   * @description Stops the job and logs the reason.
   * @param {Job} job - Agenda job to remove.
   */
  private async stopJob(job: Job<IConfirmationReminderJob>): Promise<void> {
    await job.remove();
  }
}
