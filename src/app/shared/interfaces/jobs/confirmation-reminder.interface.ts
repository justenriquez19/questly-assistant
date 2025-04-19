/**
 * @description Payload for confirmation reminder job.
 */
export interface IConfirmationReminderJob {
  senderId: string;
  sessionId: string;
  attempt: number;
}

/**
 * @description Delay configuration for each reminder attempt.
 */
export interface IReminderDelayConfig {
  attempt: number;
  time: string;
  message: string;
}
