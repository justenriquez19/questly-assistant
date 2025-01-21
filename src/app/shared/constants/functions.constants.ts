import { ToolsListInterface } from "../interfaces/gpt-interfaces";
import {
  TALK_TO_HUMAN_DESCRIPTION,
} from "./ales-bible.constants";
import { AppConstants, FunctionNames } from "./app.constants";

export const ALES_PLACE_MAIN_FUNCTIONS: ToolsListInterface = {
  list: [
    {
      type: AppConstants.FUNCTION_TYPE,
      function: {
        name: FunctionNames.TalkToHuman,
        description: TALK_TO_HUMAN_DESCRIPTION,
        parameters: {
          type: AppConstants.OBJECT_KEY,
          properties: {}
        }
      }
    }
  ]
};
