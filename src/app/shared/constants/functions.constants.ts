import { ToolsListInterface } from "../interfaces/gpt-interfaces";
import {
  DETECT_QUOTATION_REQUEST_DESCRIPTION,
  NOTIFY_I_HAVE_ARRIVED_DESCRIPTION,
  SEARCH_SLOTS_DESCRIPTION,
  SLOTS_PROPERTIES,
  TALK_TO_ALE_DESCRIPTION
} from "./ales-bible.constants";
import { AppConstants, FunctionNames } from "./app.constants";

export const ALES_PLACE_MAIN_FUNCTIONS: ToolsListInterface = {
  list: [
    {
      type: AppConstants.FUNCTION_TYPE,
      function: {
        name: FunctionNames.DetectQuotationRequest,
        description: DETECT_QUOTATION_REQUEST_DESCRIPTION,
        parameters: {
          type: AppConstants.OBJECT_KEY,
          properties: {}
        }
      }
    },
    {
      type: AppConstants.FUNCTION_TYPE,
      function: {
        name: FunctionNames.NotifyIHaveArrived,
        description: NOTIFY_I_HAVE_ARRIVED_DESCRIPTION,
        parameters: {
          type: AppConstants.OBJECT_KEY,
          properties: {}
        }
      }
    },
    {
      type: AppConstants.FUNCTION_TYPE,
      function: {
        name: FunctionNames.ShouldSearchSlotsByService,
        description: SEARCH_SLOTS_DESCRIPTION,
        parameters: {
          type: AppConstants.OBJECT_KEY,
          properties: {
            startDate: {
              type: AppConstants.STRING_TYPE,
              description: SLOTS_PROPERTIES.startDate,
            },
            endDate: {
              type: AppConstants.STRING_TYPE,
              description: SLOTS_PROPERTIES.endDate,
            },
            serviceId: {
              type: AppConstants.STRING_TYPE,
              description: SLOTS_PROPERTIES.serviceId,
            },
          },
          required: SLOTS_PROPERTIES.required
        }
      }
    },
    {
      type: AppConstants.FUNCTION_TYPE,
      function: {
        name: FunctionNames.TalkToAle,
        description: TALK_TO_ALE_DESCRIPTION,
        parameters: {
          type: AppConstants.OBJECT_KEY,
          properties: {}
        }
      }
    }
  ]
};
