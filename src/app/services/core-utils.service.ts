import crypto from 'crypto';

import { AppConstants, AppPatterns, RegexExpressions } from '../shared/constants/app.constants';
import { ChatGptHistoryBody } from '../shared/interfaces/gpt-interfaces';

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

    try {
      const potentialJson = this.extractJsonFromMessage(message);

      if (!potentialJson || !this.isBalancedJson(potentialJson)) {
        return null;
      }

      const parsedMessage = JSON.parse(potentialJson);

      if (parsedMessage?.function && typeof parsedMessage?.function === AppConstants.STRING_TYPE) {
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
      weekday: AppConstants.LONG_KEY,
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

  public obfuscatePhone(phone: string): string {
    return crypto.createHash('sha256').update(phone).digest('hex').slice(0, 8);
  }

  /**
   * @description Replaces placeholders in a given string with corresponding values from the replacements object.
   * @param {string} text - The input string containing placeholders in the format ${key}.
   * @param {Record<string, string>} replacements - An object mapping keys to their replacement values.
   * @returns {string} - The formatted string with replaced placeholders.
   */
  public replacePlaceholders(text: string, replacements: Record<string, string>): string {
    return text.replace(/\${(.*?)}/g, (_, key) => replacements[key] || `\${${key}}`);
  }

  /**
   * @description Filters an array of messages to include only the required fields (role and content).
   * @param {Array<ChatGptHistoryBody>} messages - The original messages array.
   * @returns {Array<ChatGptHistoryBody>} - The sanitized messages array.
   */
  public extractRelevantChatMessages(messages: Array<ChatGptHistoryBody>): Array<ChatGptHistoryBody> {
    return messages.map(({ role, content }) => ({ role, content }));
  }

  /**
   * @description Extracts a JSON string from a given message by identifying the first valid JSON structure.
   * @param {string} message - The input string that may contain a JSON object.
   * @returns {string | null} - The extracted JSON string if found; otherwise, `null`.
   */
  private extractJsonFromMessage(message: string): string | null {
    let startIndex = message.indexOf(AppConstants.OPENING_BRACKET);
    if (startIndex === -1) return null;

    let braceCount = 0;
    for (let i = startIndex; i < message.length; i++) {
      if (message[i] === AppConstants.OPENING_BRACKET) braceCount++;
      if (message[i] === AppConstants.CLOSING_BRACKET) braceCount--;

      if (braceCount === 0) {
        return message.substring(startIndex, i + 1);
      }
    }

    return null;
  }

  /**
   * @description Waits for 2.5, 3, or 3.5 seconds to simulate a human delay.
   * @returns {Promise<void>} - Resolves after the chosen delay.
   */
  public async delayRandom(): Promise<void> {
    const secondsOptions = [2500, 3000, 3500];
    const delay = secondsOptions[Math.floor(Math.random() * secondsOptions.length)];

    return new Promise(resolve => setTimeout(resolve, delay));
  }
}
