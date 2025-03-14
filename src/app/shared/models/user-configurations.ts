import mongoose, { Schema } from 'mongoose';
import { IUserConfiguration } from '../interfaces/user-configuration.interface';

const FunctionParametersSchema = new Schema(
  {
    type: { type: String, required: true },
    properties: { type: Schema.Types.Mixed, required: true },
    required: { type: [String], required: false }
  },
  { _id: false }
);

const ActiveFunctionSchema = new Schema(
  {
    type: { type: Schema.Types.Mixed, required: true },
    function: {
      name: { type: String, required: true },
      description: { type: String, required: true },
      parameters: { type: FunctionParametersSchema, required: true }
    }
  },
  { _id: false }
);

const UtilitiesSchema = new Schema(
  {
    firstTimeWelcome: { type: Boolean, required: true }
  },
  { _id: false }
);

const DynamicContextSchema = new Schema(
  {
    isActive: { type: Boolean, required: true },
    message: { type: String, required: true }
  },
  { _id: false }
);

const UserConfigurationSchema = new Schema<IUserConfiguration>(
  {
    activeFunctions: { type: [ActiveFunctionSchema], required: true },
    botBehavior: { type: String, required: true },
    dynamicContext: { type: DynamicContextSchema, required: true },
    mediaNotSupportedResponses: { type: Schema.Types.Mixed, required: true },
    responseMessages: { type: Schema.Types.Mixed, required: true },
    sessionId: { type: String, required: true },
    utilities: { type: UtilitiesSchema, required: true },
    timeoutDurations: {
      timeBetweenMessages: { type: Number, required: true }
    },
    notificationContacts: {
      business: { type: String, required: true },
      mainContact: { type: String, required: true },
      testContact: { type: String, required: true }
    },
    definedPaths: {
      bellLocation: { type: String, required: true }
    }
  }
);

export const UserConfigurationModel = mongoose.model<IUserConfiguration>('userConfigurations', UserConfigurationSchema);
