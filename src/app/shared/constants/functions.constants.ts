import { FunctionsListInterface } from "../interfaces/gpt-interfaces";
import { ADD_APPOINTMENT_DESCRIPTION } from "./ales-bible.constants";

export const ALES_PLACE_MAIN_FUNCTIONS: FunctionsListInterface = {
  list: [
    {
      name: "add_apointment",
        description: ADD_APPOINTMENT_DESCRIPTION,
          parameters: {
          type: "object",
          properties: {}
      },
    }
  ]
};

export const EMPTY_FUNCTIONS = {
  list: [
    {
      name: "function_name",
        description: "desc",
          parameters: {
          type: "object",
          properties: {}
      },
    }
  ]
};
