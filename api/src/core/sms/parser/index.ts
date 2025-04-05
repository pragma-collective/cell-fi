import {
  Command,
  CommandType,
  HelpCommand,
  NominateCommand, PayCommand,
  RegisterCommand,
  RequestCommand,
  SendCommand,
  SmsWebhookPayload,
  UnknownCommand
} from './types';

/**
 * Service responsible for parsing SMS messages into structured commands
 */
export class SmsParserService {
  private readonly WEBHOOK_TYPE_SMS = "message.phone.received";

  /**
   * Determines if a webhook payload should be processed
   * @param payload - The webhook payload to check
   * @returns True if the payload should be processed
   */
  public shouldProcessWebhook(payload: SmsWebhookPayload): boolean {
    return payload.type === this.WEBHOOK_TYPE_SMS;
  }

  /**
   * Parses a webhook payload into a structured command
   * @param payload - The webhook payload to parse
   * @returns A structured command object
   */
  public parseWebhook(payload: SmsWebhookPayload): Command {
    if (!this.shouldProcessWebhook(payload)) {
      return this.createUnknownCommand(payload.data.contact, payload.data.content);
    }

    const message = payload.data.content.trim();
    const phoneNumber = payload.data.contact;

    return this.parseMessage(message, phoneNumber);
  }

  /**
   * Parses a message into a structured command
   * @param message - The message to parse
   * @param phoneNumber - The sender's phone number
   * @returns A structured command object
   */
  public parseMessage(message: string, phoneNumber: string): Command {
    const parts = message.split(/\s+/);
    if (parts.length === 0) {
      return this.createUnknownCommand(phoneNumber, message);
    }

    const commandText = parts[0].toUpperCase();

    switch (commandText) {
      case CommandType.HELP:
        return this.parseHelpCommand(message, phoneNumber);
      case CommandType.REGISTER:
        return this.parseRegisterCommand(message, phoneNumber, parts);
      case CommandType.SEND:
        return this.parseSendCommand(message, phoneNumber, parts);
      case CommandType.NOMINATE:
        return this.parseNominateCommand(message, phoneNumber, parts);
      case CommandType.ACCEPT:
      case CommandType.DENY:
        return this.parseNominationResponseCommand(message, phoneNumber, parts, commandText as CommandType.ACCEPT | CommandType.DENY);
      case CommandType.APPROVE:
      case CommandType.REJECT:
        return this.parseTransactionApprovalCommand(message, phoneNumber, parts, commandText as CommandType.APPROVE | CommandType.REJECT);
      case CommandType.REQUEST:
        return this.parseRequestCommand(message, phoneNumber, parts);
      case CommandType.PAY:
        return this.parsePayCommand(message, phoneNumber, parts);
      default:
        return this.createUnknownCommand(phoneNumber, message);
    }
  }

  /**
   * Creates a help command
   * @param message - The original message
   * @param phoneNumber - The sender's phone number
   * @returns A help command
   * @private
   */
  private parseHelpCommand(message: string, phoneNumber: string): HelpCommand {
    return {
      type: CommandType.HELP,
      rawMessage: message,
      phoneNumber
    };
  }

  /**
   * Creates a register command
   * @param message - The original message
   * @param phoneNumber - The sender's phone number
   * @returns A register command
   * @private
   */
  private parseRegisterCommand(message: string, phoneNumber: string, parts: string[]): RegisterCommand {
    return {
      type: CommandType.REGISTER,
      rawMessage: message,
      phoneNumber,
      username: parts[1] || 'Unknown username',
    };
  }

  /**
   * Parses a send command
   * @param message - The original message
   * @param phoneNumber - The sender's phone number
   * @param parts - The message split into parts
   * @returns A send command if valid, otherwise an unknown command
   * @private
   */
  private parseSendCommand(message: string, phoneNumber: string, parts: string[]): SendCommand | UnknownCommand {
    if (parts.length < 3) {
      return this.createUnknownCommand(phoneNumber, message);
    }

    const amountTokenStr = parts[1];
    const recipient = parts[2];

    // Parse amount and token - assuming format like "10USDC" or "0.1ETH"
    const re = /^(\d+\.?\d*)([A-Za-z]+)$/;
    const matches = amountTokenStr.match(re);

    if (!matches || matches.length !== 3) {
      return this.createUnknownCommand(phoneNumber, message);
    }

    const amount = matches[1];
    const token = matches[2].toUpperCase();

    // Basic validation
    const amountFloat = parseFloat(amount);
    if (isNaN(amountFloat) || amountFloat <= 0) {
      return this.createUnknownCommand(phoneNumber, message);
    }

    return {
      type: CommandType.SEND,
      rawMessage: message,
      phoneNumber,
      amount,
      token,
      recipient
    };
  }

  /**
   * Parses a nominate command
   * @param message - The original message
   * @param phoneNumber - The sender's phone number
   * @param parts - The message split into parts
   * @returns A nominate command if valid, otherwise an unknown command
   * @private
   */
  private parseNominateCommand(message: string, phoneNumber: string, parts: string[]): NominateCommand | UnknownCommand {
    if (parts.length !== 3) {
      return this.createUnknownCommand(phoneNumber, message);
    }

    const nominee1 = parts[1];
    const nominee2 = parts[2];

    // // Basic validation - ensure phone numbers are in a reasonable format
    // // This is a simple format check - adjust as needed for your phone number format
    // const phoneRegex = /^\+?\d{10,15}$/;
    // if (!phoneRegex.test(nominee1) || !phoneRegex.test(nominee2)) {
    //   return this.createUnknownCommand(phoneNumber, message);
    // }

    return {
      type: CommandType.NOMINATE,
      rawMessage: message,
      phoneNumber,
      nominee1,
      nominee2
    };
  }

  /**
   * Parses a nomination response command (ACCEPT or DENY)
   * @param message - The original message
   * @param phoneNumber - The sender's phone number
   * @param parts - The message split into parts
   * @param commandType - Either ACCEPT or DENY
   * @returns A nomination response command if valid, otherwise an unknown command
   * @private
   */
  private parseNominationResponseCommand(
    message: string,
    phoneNumber: string,
    parts: string[],
    commandType: CommandType.ACCEPT | CommandType.DENY
  ) {
  // ): NominationResponseCommand | UnknownCommand {
    if (parts.length !== 2) {
      return this.createUnknownCommand(phoneNumber, message);
    }

    const code = parts[1];

    // Basic validation - ensure code is in the expected format
    // const codeRegex = /^[A-Za-z0-9]{6,10}$/;
    // if (!codeRegex.test(code)) {
    //   return this.createUnknownCommand(phoneNumber, message);
    // }

    return {
      type: commandType,
      rawMessage: message,
      phoneNumber,
      code
    };
  }

  /**
   * Creates an unknown command
   * @param phoneNumber - The sender's phone number
   * @param message - The original message
   * @returns An unknown command
   * @private
   */
  private createUnknownCommand(phoneNumber: string, message: string): UnknownCommand {
    return {
      type: CommandType.UNKNOWN,
      rawMessage: message,
      phoneNumber
    };
  }

  /**
   * Parses a transaction approval command (APPROVE or REJECT)
   * @param message - The original message
   * @param phoneNumber - The sender's phone number
   * @param parts - The message split into parts
   * @param commandType - Either APPROVE or REJECT
   * @returns A transaction approval command if valid, otherwise an unknown command
   * @private
   */
  private parseTransactionApprovalCommand(
    message: string,
    phoneNumber: string,
    parts: string[],
    commandType: CommandType.APPROVE | CommandType.REJECT
  ) {
  // ): TransactionApprovalCommand | UnknownCommand {
    if (parts.length !== 2) {
      return this.createUnknownCommand(phoneNumber, message);
    }

    const code = parts[1];

    // // Basic validation - ensure code is in the expected format
    // const codeRegex = /^[A-Za-z0-9]{6,10}$/;
    // if (!codeRegex.test(code)) {
    //   return this.createUnknownCommand(phoneNumber, message);
    // }

    return {
      type: commandType,
      rawMessage: message,
      phoneNumber,
      code
    };
  }

  /**
   * Parses a transaction approval command (APPROVE or REJECT)
   * @param message - The original message
   * @param phoneNumber - The sender's phone number
   * @param parts - The message split into parts
   * @returns A request payment command if valid, otherwise an unknown command
   * @private
   */
  private parseRequestCommand(
    message: string,
    phoneNumber: string,
    parts: string[],
  ): RequestCommand | UnknownCommand {
    if (parts.length < 3) {
      return this.createUnknownCommand(phoneNumber, message);
    }

    const amountTokenStr = parts[1];
    const recipient = parts[2];

    // Parse amount and token - assuming format like "10USDC" or "0.1ETH"
    const re = /^(\d+\.?\d*)([A-Za-z]+)$/;
    const matches = amountTokenStr.match(re);

    if (!matches || matches.length !== 3) {
      return this.createUnknownCommand(phoneNumber, message);
    }

    const amount = matches[1];
    const token = matches[2].toUpperCase();

    // Basic validation
    const amountFloat = parseFloat(amount);
    if (isNaN(amountFloat) || amountFloat <= 0) {
      return this.createUnknownCommand(phoneNumber, message);
    }

    return {
      type: CommandType.REQUEST,
      rawMessage: message,
      phoneNumber,
      amount,
      token,
      recipient
    };
  }

  private parsePayCommand(
    message: string,
    phoneNumber: string,
    parts: string[],
  ): PayCommand | UnknownCommand {
    if (parts.length < 2) {
      return this.createUnknownCommand(phoneNumber, message);
    }

    const code = parts[1];

    return {
      type: CommandType.PAY,
      rawMessage: message,
      phoneNumber,
      code
    };

  }
}

/**
 * Creates a new SMS parser service
 * @returns A new SMS parser service instance
 */
export function createSmsParserService(): SmsParserService {
  return new SmsParserService();
}
