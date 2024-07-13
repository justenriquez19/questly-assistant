import { FunctionsListInterface } from "../interfaces/gpt-interfaces";
import {
  GET_PERSONAL_ASSISTANCE_DESCRIPTION,
  NOTIFY_I_HAVE_ARRIVED_DESCRIPTION,
  TALK_TO_ALE_DESCRIPTION
} from "./ales-bible.constants";
import { AppConstants, FunctionNames } from "./app.constants";

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
    }
  ]
};
