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

/**
 * @description Manages sessions and initializes WhatsApp Web clients.
 */
export class SessionService {
  public sessions: Map<string, SessionContext>;

  constructor(
    private messageService: MessageService,
    private utils: CoreUtilFunctions
  ) {
    this.sessions = new Map();
  }

  /**
   * @description Automatically loads saved sessions from the session directory.
   */
  public autoLoadSessions(): void {
    const sessionsDir = AppConstants.SESSIONS_PATH_KEY;
    if (fs.existsSync(sessionsDir)) {
      const sessionDirs = fs.readdirSync(sessionsDir);
      sessionDirs.forEach((sessionId) => {
        if (!AppConstants.FOLDERS_TO_IGNORE.includes(sessionId)) {
          console.log(`${AppConstants.AUTO_LOAD_SESSION} ${sessionId}`);
          this.loadSession(sessionId);
        }
      });
    }
  }

  /**
   * @description Loads a session using the provided sessionId.
   * @param {string} sessionId - The session identifier.
   */
  private loadSession(sessionId: string): void {
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
    session.client.initialize();
    this.sessions.set(sessionId, session);
  }

  /**
    * @description Creates and initializes a new session using the user's phone number.
    * @param {string} phone - The user's phone number.
    */
  public createSession(phone: string): void {
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
      processingUsers: new Map(),
      qrCode: AppConstants.EMPTY_STRING,
      userMessages: new Map(),
      userMessageTimers: new Map(),
      tempMessageQueue: new Map(),
      isProcessingMessages: false
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
    session.client.initialize();
    this.sessions.set(sessionId, session);
  }

  /**
   * @description Creates a session for the given phone number and sends a confirmation.
   * @param {Request} req - Express request containing the phone parameter.
   * @param {Response} res - Express response to return the confirmation message.
   */
  public createSessionRoute(req: Request, res: Response): void {
    const phone = req.params.phone;
    this.createSession(phone);
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
}
