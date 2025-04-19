import { Agenda } from 'agenda';
import { ConfirmationReminderJob } from '../jobs/set_confirmation_reminder.job';
import { JobList } from '../app/shared/constants/app.constants';

/**
 * @description Singleton service for managing background tasks using Agenda.
 */
export class AgendaService {
  private reminderJob: ConfirmationReminderJob;
  private static _instance: AgendaService;
  private agendaInstance!: Agenda;

  /**
   * @description Private constructor to prevent direct instantiation.
   */
  private constructor() {
    this.reminderJob = new ConfirmationReminderJob();
  }

  /**
   * @description Returns the singleton instance of AgendaService.
   * @returns {AgendaService} The AgendaService instance.
   */
  public static getInstance(): AgendaService {
    if (!AgendaService._instance) {
      AgendaService._instance = new AgendaService();
    }

    return AgendaService._instance;
  }

  /**
   * @description Initializes Agenda and defines background tasks.
   * @returns {Promise<void>} A promise that resolves when Agenda is ready.
   */
  public async initialize(): Promise<void> {
    const mongoURL = process.env.MONGO_URL as string;

    this.agendaInstance = new Agenda({
      db: {
        address: mongoURL,
        collection: 'agendaJobs'
      }
    });

    this.defineJobs();

    await this.agendaInstance.start();
    console.log('✅ AgendaService initialized');
  }

  /**
   * @description Defines jobs available for Agenda. Only defined in web process.
   */
  private defineJobs(): void {
    if (process.env.PROCESS_TYPE === 'web') {
      this.agendaInstance.define(JobList.SetConfirmationReminder, this.reminderJob.handle.bind(this.reminderJob));
    }
  }

  /**
   * @description Schedules a one-time job at a specific time (e.g. 'in 2 minutes').
   * @param {string} when - Time string (e.g. 'in 2 minutes').
   * @param {string} jobName - Job name.
   * @param {any} data - Payload for the job.
   */
  public async scheduleJob(when: string, jobName: string, data: any): Promise<void> {
    await this.agendaInstance.schedule(when, jobName, data);
  }

  /**
   * @description Gracefully stops the Agenda instance.
   */
  public async stop(): Promise<void> {
    if (this.agendaInstance) {
      await this.agendaInstance.stop();
      console.log('🛑 AgendaService stopped');
    }
  }

  /**
   * @description Returns the internal Agenda instance (if needed directly).
   */
  public getInstance(): Agenda {
    return this.agendaInstance;
  }
}
