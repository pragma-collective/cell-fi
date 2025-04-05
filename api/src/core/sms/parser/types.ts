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
  NOMINATE = 'NOMINATE',
  ACCEPT = 'ACCEPT',
  DENY = 'DENY',
  APPROVE = 'APPROVE',
  REJECT = 'REJECT',
  REQUEST = "REQUEST",
  PAY = 'PAY',
  UNKNOWN = "UNKNOWN",
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
  username: string;
}

export interface SendCommand extends ParsedCommand {
  type: CommandType.SEND;
  amount: string;
  /** Token symbol (e.g., ETH, USDC) */
  token: string;
  recipient: string;
}

export interface NominateCommand extends ParsedCommand {
  type: CommandType.NOMINATE;
  nominee1: string;
  nominee2: string;
}

export interface NominationResponseCommand extends ParsedCommand {
  type: CommandType.ACCEPT | CommandType.DENY;
  code: string;
}

export interface TransactionApprovalCommand extends ParsedCommand {
  type: CommandType.APPROVE | CommandType.REJECT;
  code: string;
}

export interface RequestCommand extends ParsedCommand {
  type: CommandType.REQUEST;
  amount: string;
  /** Token symbol (e.g., ETH, USDC) */
  token: string;
  recipient: string;
}

export interface PayCommand extends ParsedCommand {
  type: CommandType.PAY;
  code: string;
}

export interface UnknownCommand extends ParsedCommand {
  type: CommandType.UNKNOWN;
}

export type Command = HelpCommand |
  RegisterCommand |
  SendCommand |
  NominateCommand |
  NominationResponseCommand |
  TransactionApprovalCommand |
  RequestCommand |
  PayCommand |
  UnknownCommand;