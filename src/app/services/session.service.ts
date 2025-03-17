import { Client, LocalAuth } from 'whatsapp-web.js';
import { Request, Response } from 'express';
import { toDataURL } from 'qrcode';
import fs from 'fs';
import path from 'path';

import { AppConstants, ErrorMessages } from '../shared/constants/app.constants';
import { CoreUtilFunctions } from './core-utils.service';
import { ExtendedMessage } from '../shared/interfaces/gpt-interfaces';
import { MessageService } from './message.service';
import { SessionContext } from '../shared/interfaces/session.interfaces';
import { UserConfigDataService } from '../data/user-config-data.service';

/**
 * @description Manages sessions and initializes WhatsApp Web clients.
 */
export class SessionService {
  public sessions: Map<string, SessionContext>;

  constructor(
    private messageService: MessageService,
    private userConfigDataService: UserConfigDataService,
    private utils: CoreUtilFunctions
  ) {
    this.sessions = new Map();
  }

  /**
   * @description Automatically loads saved sessions from the session directory.
   */
  public async autoLoadSessions(): Promise<void> {
    const sessionsDir = AppConstants.SESSIONS_PATH_KEY;

    if (fs.existsSync(sessionsDir)) {
      const sessionDirs = fs.readdirSync(sessionsDir);

      for (const sessionId of sessionDirs) {
        if (!AppConstants.FOLDERS_TO_IGNORE.includes(sessionId)) {
          const config = await this.userConfigDataService.getConfigBySession(sessionId);

          await this.loadSession(sessionId, config.isPaused);
        }
      }
    }
  }


  /**
   * @description Loads a session using the provided sessionId.
   * @param {string} sessionId - The session identifier.
   */
  private async loadSession(sessionId: string, isPaused: boolean): Promise<void> {
    if (this.sessions.has(sessionId)) {
      console.log(`Session ${sessionId} is already loaded.`);

      return;
    }

    const session: SessionContext = {
      client: new Client({
        authStrategy: new LocalAuth({
          dataPath: path.join(AppConstants.SESSIONS_PATH_KEY, sessionId)
        }),
        puppeteer: {
          args: [
            AppConstants.PUPPETEER_PATCH_NO_SANDBOX,
            AppConstants.PUPPETEER_PATCH_NO_UID
          ]
        },
        webVersionCache: {
          type: AppConstants.REMOTE_KEY,
          remotePath: AppConstants.WEB_VERSION_PATCH
        }
      }),
      isClientReady: false,
      isProcessingMessages: false,
      processingUsers: new Map(),
      qrCode: AppConstants.EMPTY_STRING,
      tempMessageQueue: new Map(),
      userMessages: new Map(),
      userMessageTimers: new Map()
    };
    session.client.on(AppConstants.QR_KEY, async (qr: string) => {
      session.qrCode = await toDataURL(qr);
      console.log(`QR generated for auto-loaded session ${sessionId} at ${new Date()}`);
    });
    session.client.on(AppConstants.READY_KEY, () => {
      session.isClientReady = true;
      console.log(`Client for auto-loaded session ${sessionId} is ready at ${new Date()}`);
    });
    session.client.on(AppConstants.MESSAGE_KEY, (message: ExtendedMessage) => {
      this.messageService.onMessageReceived(sessionId, message, session);
    });
    session.client.on(AppConstants.MESSAGE_CREATE_KEY, (message: ExtendedMessage) => {
      this.messageService.onMessageCreated(sessionId, message, session);
    });

    if (!isPaused) {
      await session.client.initialize();

      console.log(`${AppConstants.AUTO_LOAD_SESSION} ${sessionId}`);
    } else {
      console.log(`Session ${sessionId} is paused. Created but not initialized.`);
    }

    this.sessions.set(sessionId, session);
  }

  /**
    * @description Creates and initializes a new session using the user's phone number.
    * @param {string} phone - The user's phone number.
    */
  public async createSession(phone: string): Promise<void> {
    const sessionId = this.utils.obfuscatePhone(phone);

    if (this.sessions.has(sessionId)) {
      console.log(`Session for phone ${phone} already exists.`);
      return;
    }
    const session: SessionContext = {
      client: new Client({
        authStrategy: new LocalAuth({
          dataPath: path.join(AppConstants.SESSIONS_PATH_KEY, sessionId)
        }),
        puppeteer: {
          args: [
            AppConstants.PUPPETEER_PATCH_NO_SANDBOX,
            AppConstants.PUPPETEER_PATCH_NO_UID
          ]
        },
        webVersionCache: {
          type: AppConstants.REMOTE_KEY,
          remotePath: AppConstants.WEB_VERSION_PATCH
        }
      }),
      isClientReady: false,
      isProcessingMessages: false,
      processingUsers: new Map(),
      qrCode: AppConstants.EMPTY_STRING,
      tempMessageQueue: new Map(),
      userMessages: new Map(),
      userMessageTimers: new Map()
    };
    session.client.on(AppConstants.QR_KEY, async (qr: string) => {
      session.qrCode = await toDataURL(qr);
      console.log(`QR generated for session ${sessionId} at ${new Date()}`);
    });
    session.client.on(AppConstants.READY_KEY, () => {
      session.isClientReady = true;
      console.log(`Client for session ${sessionId} is ready at ${new Date()}`);
    });
    session.client.on(AppConstants.MESSAGE_KEY, (message: ExtendedMessage) => {
      this.messageService.onMessageReceived(sessionId, message, session);
    });
    session.client.on(AppConstants.MESSAGE_CREATE_KEY, (message: ExtendedMessage) => {
      this.messageService.onMessageCreated(sessionId, message, session);
    });

    await session.client.initialize();

    this.sessions.set(sessionId, session);
  }

  /**
   * @description Creates a session for the given phone number and sends a confirmation.
   * @param {Request} req - Express request containing the phone parameter.
   * @param {Response} res - Express response to return the confirmation message.
   */
  public async createSessionRoute(req: Request, res: Response): Promise<void> {
    const phone = req.params.phone;

    await this.createSession(phone);
    res.send(`Session created for phone ${phone}.`);
  }

  /**
   * Handles the QR code request for a session.
   * @param {Request} req - Express request object.
   * @param {Response} res - Express response object.
   */
  public async getSessionQr(req: Request, res: Response): Promise<void> {
    const phone = req.params.phone;
    const sessionId = this.utils.obfuscatePhone(phone);
    const session = this.sessions.get(sessionId);

    if (!session) {
      res.status(404).send('Session not found. Create the session first.');
      return;
    }

    if (session.isClientReady) {
      res.send(AppConstants.NO_QR_NEEDED);
    } else if (session.qrCode) {
      res.send(`<h1>Scan the QR code for session ${phone}</h1><img src="${session.qrCode}" />`);
    } else {
      res.send(ErrorMessages.shouldRereshQrView);
    }
  }

  /**
   * @description Temporarily disconnects a session to save resources.
   * @param {string} sessionId - The session identifier.
   */
  public async pauseSession(sessionId: string): Promise<boolean> {
    const session = this.sessions.get(sessionId);

    if (!session) {
      console.log(`Session ${sessionId} not found.`);
      return false;
    }

    await session.client.destroy();
    await this.userConfigDataService.updateUserConfiguration({
      sessionId,
      updateFields: { isPaused: true },
    });

    console.log(`Session ${sessionId} has been paused.`);

    return true;
  }


  /**
   * @description Resumes a previously paused session without requiring a new QR code.
   * @param {string} sessionId - The session identifier.
   */
  public async resumeSession(sessionId: string): Promise<boolean> {
    const session = this.sessions.get(sessionId);
    const config = await this.userConfigDataService.getConfigBySession(sessionId);

    if (!session || !config.isPaused) {
      console.log(`Session ${sessionId} is not paused or does not exist.`);
      return false;
    }

    await session.client.initialize();
    await this.userConfigDataService.updateUserConfiguration({
      sessionId,
      updateFields: { isPaused: false },
    });

    console.log(`Session ${sessionId} has been resumed.`);
    return true;
  }

  /**
   * @description API route to pause a session.
   */
  public async pauseSessionRoute(req: Request, res: Response): Promise<void> {
    const phone = req.params.phone;
    const sessionId = this.utils.obfuscatePhone(phone);

    await this.pauseSession(sessionId);
    res.send(`Session for phone ${phone} has been paused.`);
  }

  /**
   * @description API route to resume a session.
   */
  public async resumeSessionRoute(req: Request, res: Response): Promise<void> {
    const phone = req.params.phone;
    const sessionId = this.utils.obfuscatePhone(phone);

    await this.resumeSession(sessionId);
    res.send(`Session for phone ${phone} has been resumed.`);
  }
}
