import { AppConstants } from "../shared/constants/app.constants";

export class CoreUtilFunctions {
  /**
   * @description Constructor for the UsefulFunctions class.
   */
  constructor() { }

  /**
   * @description Cuts the input string at the first space and returns the first segment.
   * @param {string} input - The string to be processed.
   * @returns {string} The substring before the first space.
   */
  public cutUntilSpace(input: string): string {
    return input.split(AppConstants.BLANK_SPACE)[0];
  }
}