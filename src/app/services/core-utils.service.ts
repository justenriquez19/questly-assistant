import { AppConstants, AppPatterns, RegexExpressions } from "../shared/constants/app.constants";

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
    if (input === null || input === undefined) {
      return AppConstants.EMPTY_STRING;
    }

    const str = String(input);

    return str.split(AppConstants.BLANK_SPACE)[0];
  }

  /**
   * @description Removes any non-alphabetic characters from the input string.
   * @param {string} input - The string to be processed.
   * @returns {string} The cleaned string with only alphabetic characters.
   */
  public removeNonAlphabetic(input: string): string {
    if (input === null || input === undefined) {
      return AppConstants.EMPTY_STRING;
    }

    const str = String(input);

    return str.replace(RegexExpressions.REMOVE_NON_ALPHABETIC_CHAR, AppConstants.EMPTY_STRING);
  }

  /**
   * @description Checks if the input string contains any non-whitespace characters.
   * @param {string} input - The string to be validated.
   * @returns {boolean} True if the string contains non-whitespace characters, false otherwise.
   */
  public isNotOnlyWhitespace(input: string): boolean {
    return input.trim().length > 0;
  }

  /**
   * @description Checks if the given date is more than the specified number of days ago from the current time.
   * @param {Date} date - The date to check.
   * @param {number} days - The number of days to check against. For example, 0.5 for 12 hours, 1 for 24 hours.
   * @returns {boolean} Returns true if the date is more than the specified number of days ago, otherwise false.
   */
  public isMoreThanDaysAgo(date: Date, days: number): boolean {
    const now = new Date();
    const millisecondsInADay = 24 * 60 * 60 * 1000;
    const timeDifference = now.getTime() - date.getTime();
    const daysInMillis = days * millisecondsInADay;

    return timeDifference > daysInMillis;
  }

  /**
   * @description Checks if a text includes phrases that indicate the sender wants to reveal their name.
   * @param {string} text - The text to analyze.
   * @returns {boolean} True if the text includes any phrase indicating the name, false otherwise.
   */
  public includesNameIntroduction(text: string): boolean {
    const lowerCaseText = text.toLowerCase();
    for (const pattern of AppPatterns.namePatterns) {
      if (pattern.test(lowerCaseText)) {
        return true;
      }
    }

    return false;
  }
}
