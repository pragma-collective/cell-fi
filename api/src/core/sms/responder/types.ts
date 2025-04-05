
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
  AWAITING_CONFIRMATION = 'AWAITING_CONFIRMATION',
  PENDING_APPROVAL = 'PENDING_APPROVAL', // New status
  APPROVED = 'APPROVED', // New status
  REJECTED = 'REJECTED', // New status
  FAILED = 'FAILED',
  INVALID = 'INVALID'
}

export interface SendResponse extends CommandResponse {
  status: TransferStatus;
  transactionHash?: string;
  recipient: string;
  ensName?: string;
  amount: string;
  token: string;
  pendingApproval?: boolean;
}

// Add new response types for nominations
export interface NominateResponse extends CommandResponse {
  nominees: string[];
  code: string;
}

export interface ApprovalResponse extends CommandResponse {
  code: string;
  approved: boolean;
  nominatedBy?: string;
}

export interface RequestResponse extends CommandResponse {
  paymentCode: string;
}

export interface UnknownResponse extends CommandResponse {
  originalCommand: string;
  suggestions: string[];
}

export type Response =
  | HelpResponse
  | RegisterResponse
  | SendResponse
  | NominateResponse
  | ApprovalResponse
  | RequestResponse
  | UnknownResponse;