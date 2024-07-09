import { FunctionsListInterface } from "../interfaces/gpt-interfaces";
import {
  GET_CUSTOM_RESPONSE_DESCRIPTION,
  GET_PERSONAL_ASSISTANCE_DESCRIPTION,
  NOTIFY_I_HAVE_ARRIVED_DESCRIPTION,
  TALK_TO_ALE_DESCRIPTION,
  DETECT_CLIENT_NAME_DESCRIPTION
} from "./ales-bible.constants";
import { AppConstants, FunctionNames, PropertiesDescription } from "./app.constants";

export const ALES_PLACE_MAIN_FUNCTIONS: FunctionsListInterface = {
  list: [
    {
      name: FunctionNames.NotifyIHaveArrived,
        description: NOTIFY_I_HAVE_ARRIVED_DESCRIPTION,
          parameters: {
          type: AppConstants.OBJECT_KEY,
          properties: {}
      }
    },
    {
      name: FunctionNames.DetectClientName,
        description: DETECT_CLIENT_NAME_DESCRIPTION,
          parameters: {
          type: AppConstants.OBJECT_KEY,
          properties: {
            name: {
              type: String,
              description: PropertiesDescription.UserName
            },
          }
      }
    },
    {
      name: FunctionNames.TalkToAle,
        description: TALK_TO_ALE_DESCRIPTION,
          parameters: {
          type: AppConstants.OBJECT_KEY,
          properties: {}
      }
    },
    {
      name: FunctionNames.GetPersonalAssistance,
        description: GET_PERSONAL_ASSISTANCE_DESCRIPTION,
          parameters: {
          type: AppConstants.OBJECT_KEY,
          properties: {}
      }
    },
    {
      name: FunctionNames.GetCustomResponse,
        description: GET_CUSTOM_RESPONSE_DESCRIPTION,
          parameters: {
          type: AppConstants.OBJECT_KEY,
          properties: {}
      }
    }
  ]
};
