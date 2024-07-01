import { FunctionsListInterface } from "../interfaces/gpt-interfaces";
import {
  ADD_APPOINTMENT_DESCRIPTION,
  GET_CUSTOM_RESPONSE_DESCRIPTION,
  GET_PERSONAL_ASSISTANCE_DESCRIPTION,
  IM_HERE_DESCRIPTION,
  TALK_TO_ALE_DESCRIPTION,
  UPDATE_USER_NAME_DESCRIPTION
} from "./ales-bible.constants";
import { AppConstants, FunctionNames, PropertiesDescription } from "./app.constants";

export const ALES_PLACE_MAIN_FUNCTIONS: FunctionsListInterface = {
  list: [
    {
      name: FunctionNames.AddApointment,
        description: ADD_APPOINTMENT_DESCRIPTION,
          parameters: {
          type: AppConstants.OBJECT_KEY,
          properties: {}
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
    },
    {
      name: FunctionNames.OpenTheDoor,
        description: IM_HERE_DESCRIPTION,
          parameters: {
          type: AppConstants.OBJECT_KEY,
          properties: {}
      }
    },
    {
      name: FunctionNames.UpdateUserName,
        description: UPDATE_USER_NAME_DESCRIPTION,
          parameters: {
          type: AppConstants.OBJECT_KEY,
          properties: {
            name: {
              type: String,
              description: PropertiesDescription.UserName
            },
          }
      }
    }
  ]
};
