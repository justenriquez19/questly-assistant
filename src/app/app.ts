import express, { Express, Request, Response } from 'express';

import { AmeliaService } from './services/amelia.service';
import { AppConstants } from './shared/constants/app.constants';
import { AuthController } from './controllers/auth.controller';
import { AuthMiddleware } from './middlewares/auth.middleware';
import { CoreUtilFunctions } from './services/core-utils.service';
import { GptAssistant } from './services/gpt-assistant.service';
import { MessageService } from './services/message.service';
import { MongoService } from './services/mongodb.service';
import { OcrService } from './services/ocr.service';
import { SessionService } from './services/session.service';

/**
 * @description Handles WhatsApp bot interactions and server initialization for multiple sessions.
 */
export class QuestlyAi {
  public amelia: AmeliaService;
  public app: Express;
  public assistant: GptAssistant;
  public authController: AuthController;
  public messageService: MessageService;
  public mongoService: MongoService;
  public ocrService: OcrService;
  public port: number;
  public sessionService: SessionService;
  public utils: CoreUtilFunctions;

  /**
   * @description Initializes the main application services and dependencies.
   */
  constructor() {
    this.mongoService = MongoService.getInstance();
    this.amelia = new AmeliaService();
    this.assistant = new GptAssistant();
    this.authController = new AuthController();
    this.utils = new CoreUtilFunctions();
    this.ocrService = new OcrService(this.assistant);
    this.messageService = new MessageService(this.assistant, this.amelia, this.utils, this.ocrService);
    this.sessionService = new SessionService(this.messageService, this.utils);
    this.port = Number(process.env.PORT) || AppConstants.CURRENT_PORT;
    this.app = express();
    this.initialize();
  }

  /**
   * @description Initializes app by connecting to MongoDB, setting up Express, loading sessions/routes, then starting server.
   */
  private async initialize(): Promise<void> {
    try {
      await this.mongoService.connect();
      this.setupMiddlewares();
      this.initializeRoutes();
      this.sessionService.autoLoadSessions();
      this.startServer();
    } catch (error) {
      console.error('Error initializing QuestlyAI:', error);
      process.exit(1);
    }
  }

  /**
   * @description Registers routes for session creation and QR code retrieval.
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
  }

  /**
   * @description Configures necessary middlewares for Express.
   */
  private setupMiddlewares(): void {
    this.app.use(express.json());
    this.app.use(express.urlencoded({ extended: true }));
  }

  /**
   * @description Starts the Express server on the defined port and IP, logging a startup message.
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
