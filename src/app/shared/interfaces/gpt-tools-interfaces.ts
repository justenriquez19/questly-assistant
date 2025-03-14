import { IDynamicContext } from "./user-configuration.interface";

export interface IProcessDynamicContext {
  newDynamicConxtext: IDynamicContext;
  shouldUpdate: boolean;
}

export interface DynamicContextToolResponse {
  contextUpdated: string;
  shouldUpdate: boolean;
}
