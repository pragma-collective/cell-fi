
export interface CommandResponse {
  message: string;
  success: boolean;
}

export interface HelpResponse extends CommandResponse {
  availableCommands: string[];
}

export interface RegisterResponse extends CommandResponse {
  walletAddress?: string;
  isNewWallet: boolean;
}

export enum TransferStatus {
  INITIATED = 'INITIATED',
  FAILED = 'FAILED',
  AWAITING_CONFIRMATION = 'AWAITING_CONFIRMATION',
  INVALID = 'INVALID'
}

export interface SendResponse extends CommandResponse {
  status: TransferStatus;
  transactionHash?: string;
  recipient: string;
  ensName?: string;
  amount: string;
  token: string;
}

export interface UnknownResponse extends CommandResponse {
  originalCommand: string;
  suggestions: string[];
}

export type Response =
  | HelpResponse
  | RegisterResponse
  | SendResponse
  | UnknownResponse;