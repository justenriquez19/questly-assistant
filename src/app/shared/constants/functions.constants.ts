import { FunctionsListInterface } from "../interfaces/gpt-interfaces";
import { ADD_APPOINTMENT_DESCRIPTION, TALK_TO_HUMAN_DESCRIPTION } from "./ales-bible.constants";
import { AppConstants, FunctionNames } from "./app.constants";

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
      name: FunctionNames.TalkToHuman,
        description: TALK_TO_HUMAN_DESCRIPTION,
          parameters: {
          type: AppConstants.OBJECT_KEY,
          properties: {}
      }
    }
  ]
};
