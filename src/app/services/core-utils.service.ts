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
   * @description Detects and parses a function call from a message string if it contains JSON-like data.
   * @param {string | null} message - The input message string to check and parse.
   * @returns {string | null} - Returns the parsed JSON string representing the function call if valid, or `null` if invalid or not found.
   */
  public detectFunctionCalled(message: string | null): string | null {
    if (!message || message.trim() === AppConstants.EMPTY_STRING) {
      return null;
    }

    const startsWithBrace = message.trim().startsWith(AppConstants.OPENING_BRACKET);
    const includesBracket = message.trim().includes(AppConstants.CLOSING_BRACKET);
    if (!startsWithBrace && !includesBracket) {
      return null;
    }

    try {
      let parsedMessage;
      if (startsWithBrace) {
        parsedMessage = JSON.parse(message);
      } else if (includesBracket) {
        const match = message.match(RegexExpressions.JSON_COMPARE);

        if (match) {
          const potentialJson = match[0];

          if (this.isBalancedJson(potentialJson)) {
            parsedMessage = JSON.parse(potentialJson);
          }
        } else {
          return null;
        }
      }

      if (parsedMessage?.name && typeof parsedMessage?.name === AppConstants.STRING_TYPE) {
        return JSON.stringify(parsedMessage);
      }

      return null;
    } catch (error) {
      return null;
    }
  }

  /**
   * @description Converts a date string to "DD/MM/YYYY HH:MM AM/PM" format.
   * @param {Date} dateString - The ISO date to convert.
   * @returns {string} The formatted date string.
   */
  public formatDate(dateString: Date): string {
    const date = new Date(dateString);
    const localTime = new Date(date.getTime() - 5 * 60 * 60 * 1000);

    const options: Intl.DateTimeFormatOptions = {
      day: AppConstants.TWO_DIGIT_KEY,
      month: AppConstants.TWO_DIGIT_KEY,
      year: AppConstants.NUMERIC_KEY,
      hour: AppConstants.NUMERIC_KEY,
      minute: AppConstants.TWO_DIGIT_KEY,
      hour12: true,
      timeZone: AppConstants.UTC_KEY
    };

    return new Intl.DateTimeFormat(AppConstants.MX_REGION_KEY,
      options).format(localTime).replace(AppConstants.COMMA_KEY, AppConstants.EMPTY_STRING);
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
   * @description Checks if a JSON-like string has balanced curly braces.
   * @param {string} input - The input string to check for balanced curly braces.
   * @returns {boolean} - Returns `true` if the string has balanced curly braces, `false` otherwise.
   */
  public isBalancedJson(input: string): boolean {
    const stack: string[] = [];

    for (const char of input) {
      if (char === AppConstants.OPENING_BRACKET) {
        stack.push(char);
      } else if (char === AppConstants.CLOSING_BRACKET) {
        if (stack.length === 0) {
          return false;
        }
        stack.pop();
      }
    }

    return stack.length === 0;
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
