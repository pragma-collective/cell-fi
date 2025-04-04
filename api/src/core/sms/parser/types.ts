export interface SmsWebhookPayload {
  type: string;
  data: {
    content: string;
    contact: string;
  };
}

export enum CommandType {
  HELP = "HELP",
  REGISTER = "REGISTER",
  SEND = "SEND",
  UNKNOWN = "UNKNOWN"
}


export interface ParsedCommand {
  type: CommandType;
  rawMessage: string;
  phoneNumber: string;
}

export interface HelpCommand extends ParsedCommand {
  type: CommandType.HELP;
}

export interface RegisterCommand extends ParsedCommand {
  type: CommandType.REGISTER;
}

export interface SendCommand extends ParsedCommand {
  type: CommandType.SEND;
  amount: string;
  /** Token symbol (e.g., ETH, USDC) */
  token: string;
  recipient: string;
}

export interface UnknownCommand extends ParsedCommand {
  type: CommandType.UNKNOWN;
}

export type Command = HelpCommand | RegisterCommand | SendCommand | UnknownCommand;