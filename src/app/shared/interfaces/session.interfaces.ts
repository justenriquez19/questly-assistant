import { Client } from "whatsapp-web.js";
import { ExtendedMessage } from "./gpt-interfaces";

export interface SessionContext {
  client: Client;
  isClientReady: boolean;
  isProcessingMessages: boolean;
  processingUsers: Map<string, boolean>;
  qrCode: string;
  tempMessageQueue: Map<string, Array<ExtendedMessage>>;
  userMessages: Map<string, Array<ExtendedMessage>>;
  userMessageTimers: Map<string, NodeJS.Timeout>;
}

export interface TokenPayload {
  phone: string;
  isAdmin?: boolean;
}
