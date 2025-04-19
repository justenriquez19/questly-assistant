import express, { Express, Request, Response } from 'express';

import { AgendaService } from '../worker/agenda.service';
import { AiTools } from './services/ai-tools.service';
import { AmeliaService } from './services/amelia.service';
import { AppConstants } from './shared/constants/app.constants';
import { AuthController } from './controllers/auth.controller';
import { AuthMiddleware } from './middlewares/auth.middleware';
import { ChatDataService } from './data/chat-data.service';
import { ConversationManager } from './services/conversation-manager.service';
import { CoreUtils } from './services/core-utils.service';
import { GptAssistant } from './services/gpt-assistant.service';
import { MessageService } from './services/message.service';
import { MongoService } from './data/mongodb.service';
import { OcrService } from './services/ocr.service';
import { SessionService } from './services/session.service';
import { UserConfigDataService } from './data/user-config-data.service';

/**
 * @description Central application container for Questly AI.
 * Exposes all shared services so jobs and other modules can reuse them.
 */
export class QuestlyAi {
  public agendaService: AgendaService;
  public aiTools: AiTools;
  public amelia: AmeliaService;
  public app: Express;
  public assistant: GptAssistant;
  public authController: AuthController;
  public chatDataService: ChatDataService;
  public conversationManager: ConversationManager;
  public messageService: MessageService;
  public mongoService: MongoService;
  public ocrService: OcrService;
  public port: number;
  public sessionService: SessionService;
  public userConfigDataService: UserConfigDataService;
  public utils: CoreUtils;

  /**
   * @description Initializes core dependencies and services.
   * `initializeApp()` must be called after connecting to Mongo.
   */
  constructor() {
    this.agendaService = AgendaService.getInstance();
    this.mongoService = MongoService.getInstance();
    this.chatDataService = new ChatDataService();
    this.userConfigDataService = new UserConfigDataService();
    this.amelia = new AmeliaService();
    this.authController = new AuthController();
    this.utils = new CoreUtils();
    this.assistant = new GptAssistant(this.utils);
    this.aiTools = new AiTools(this.assistant);
    this.conversationManager = new ConversationManager(this.aiTools, this.assistant, this.chatDataService, this.utils);
    this.ocrService = new OcrService(this.conversationManager);
    this.messageService = new MessageService(this.agendaService, this.aiTools, this.amelia, this.chatDataService, this.conversationManager, this.ocrService, this.userConfigDataService, this.utils);
    this.sessionService = new SessionService(this.messageService, this.userConfigDataService, this.utils);
    this.port = Number(process.env.PORT) || AppConstants.CURRENT_PORT;
    this.app = express();
  }

  /**
   * @description Initializes the app: Express, routes, sessions, and HTTP server.
   * Should be called after Mongo connection and Agenda setup.
   */
  public async initializeApp(): Promise<void> {
    this.setupMiddlewares();
    this.initializeRoutes();
    this.sessionService.autoLoadSessions();
    this.startServer();
  }

  /**
   * @description Registers Express routes.
   */
  private initializeRoutes(): void {
    this.app.get('/session/:phone/create', AuthMiddleware.verifyUserSession, (req: Request, res: Response) => {
      return this.sessionService.createSessionRoute(req, res);
    });

    this.app.get('/session/:phone/qr', AuthMiddleware.verifyUserSession, (req: Request, res: Response) => {
      return this.sessionService.getSessionQr(req, res);
    });

    this.app.post('/auth/admin/token', (req: Request, res: Response) => {
      return this.authController.generateAdminToken(req, res);
    });

    this.app.get('/session/:phone/pause', AuthMiddleware.verifyUserSession, async (req: Request, res: Response) => {
      return await this.sessionService.pauseSessionRoute(req, res);
    });

    this.app.get('/session/:phone/resume', AuthMiddleware.verifyUserSession, async (req: Request, res: Response) => {
      return await this.sessionService.resumeSessionRoute(req, res);
    });
  }

  /**
   * @description Sets up Express middlewares.
   */
  private setupMiddlewares(): void {
    this.app.use(express.json());
    this.app.use(express.urlencoded({ extended: true }));
  }

  /**
   * @description Starts the HTTP server.
   */
  private startServer(): void {
    this.app
      .listen(this.port, AppConstants.DEF_PUBLIC_IP, () => {
        console.log(AppConstants.SERVER_RUNNING_MESSAGE);
      })
      .on('error', (error: Error) => {
        console.error('Server failed to start:', error);
        process.exit(1);
      });
  }
}
