import { FunctionsListInterface } from "../interfaces/gpt-interfaces";
import {
  TALK_TO_HUMAN_DESCRIPTION
} from "./app.main.constants";
import { AppConstants, FunctionNames } from "./app.constants";

export const APP_MAIN_FUNCTIONS: FunctionsListInterface = {
  list: [
    {
      name: FunctionNames.TalkToHuman,
        description: TALK_TO_HUMAN_DESCRIPTION,
          parameters: {
          type: AppConstants.OBJECT_KEY,
          properties: {}
      }
    }
  ]
};
