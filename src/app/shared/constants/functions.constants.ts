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
    },
    {
      name: 'validate_curp',
      description: "Se detona la llamada de este función cuando se detecte el ingreso de un CURP válido de 18 caracteres con la nomenclatura correcta",
      parameters: {
        type: AppConstants.OBJECT_KEY,
        properties: {
          curp: {
            type: 'string',
            description: "El CURP que será validado. Debe contener 18 caracteres alfanuméricos."
          }
        }
      },
      required: ["curp"]
    }
  ]
};
