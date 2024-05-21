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

  /**
   * @description Checks if the input string contains any non-whitespace characters.
   * @param {string} input - The string to be validated.
   * @returns {boolean} True if the string contains non-whitespace characters, false otherwise.
   */
  public isNotOnlyWhitespace(input: string): boolean {
    return input.trim().length > 0;
  }
}