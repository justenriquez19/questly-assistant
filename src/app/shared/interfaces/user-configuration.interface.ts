import { Document } from "mongoose";

export interface IActiveUtilities {
  isActive: boolean;
  triggers: Array<string>;
}

export interface IUtilities {
  detectConfirmationPhase: IActiveUtilities;
  firstTimeWelcome: boolean;
  shouldSplitMessages: boolean;
}

export interface IDynamicContext {
  isActive: boolean;
  message: string;
}

export interface IActiveFunctions {
  type: 'function';
  function: {
    name: string;
    description: string;
    parameters: {
      type: string;
      properties: Record<string, any>;
      required?: Array<string>;
    }
  }
}

export interface IUserConfiguration extends Document {
  activeFunctions: Array<IActiveFunctions>;
  botBehavior: string;
  dynamicContext: IDynamicContext;
  isPaused: boolean;
  mediaNotSupportedResponses: Record<string, string>;
  responseMessages: Record<string, string>;
  sessionId: string;
  utilities: IUtilities;
  timeoutDurations: {
    timeBetweenMessages: number;
  };
  notificationContacts: {
    business: string;
    mainContact: string;
    testContact: string;
  };
  definedPaths: {
    bellLocation: string;
  };
}
