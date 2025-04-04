/**
 * @fileoverview Service for generating response messages for commands
 */
import {
  CommandResponse,
  HelpResponse,
  RegisterResponse,
  SendResponse,
  UnknownResponse,
  TransferStatus,
  Response
} from './types';

/**
 * Service responsible for generating user-friendly responses to commands
 */
export class CommandResponseService {
  /**
   * Creates a help response
   * @returns A formatted help response
   */
  public createHelpResponse(): HelpResponse {
    const availableCommands = [
      'HELP - Show available commands',
      'REGISTER - Create a new wallet',
      'SEND [amount][token] [address/ENS] - Send tokens'
    ];

    return {
      message: 'Commands: HELP (this message), REGISTER (create wallet), SEND [amount][token] [address/ENS]',
      success: true,
      availableCommands
    };
  }

  /**
   * Creates a register response
   * @param walletAddress - The created wallet address (if available)
   * @param isNewWallet - Whether this is a new wallet or existing one
   * @returns A formatted register response
   */
  public createRegisterResponse(walletAddress?: string, isNewWallet: boolean = true): RegisterResponse {
    let message: string;

    if (walletAddress && !isNewWallet) {
      message = `You already have a wallet: ${walletAddress}`;
    } else if (walletAddress) {
      message = `Your new wallet has been created: ${walletAddress}`;
    } else {
      message = "Starting wallet creation process. We'll send you confirmation once your wallet is ready.";
    }

    return {
      message,
      success: true,
      walletAddress,
      isNewWallet
    };
  }

  /**
   * Creates a send response
   * @param status - The status of the transfer
   * @param params - Parameters for the send response
   * @returns A formatted send response
   */
  public createSendResponse(
    status: TransferStatus,
    params: {
      recipient: string;
      amount: string;
      token: string;
      ensName?: string;
      transactionHash?: string;
    }
  ): SendResponse {
    const { recipient, amount, token, ensName, transactionHash } = params;
    let message: string;

    switch (status) {
      case TransferStatus.INITIATED:
        message = transactionHash
          ? `Successfully initiated transfer of ${amount} ${token} to ${ensName || recipient}. Transaction hash: ${transactionHash}`
          : `You are about to send ${amount} ${token} to ${ensName ? `${recipient} (${ensName})` : recipient}`;
        break;

      case TransferStatus.AWAITING_CONFIRMATION:
        message = `Please confirm you want to send ${amount} ${token} to ${ensName ? `${recipient} (${ensName})` : recipient}. Reply YES to confirm.`;
        break;

      case TransferStatus.FAILED:
        message = `Failed to initiate transfer of ${amount} ${token} to ${ensName || recipient}. Please try again later.`;
        break;

      case TransferStatus.INVALID:
        message = `Invalid transfer request. Please check the recipient address and try again.`;
        break;
    }

    return {
      message,
      success: status === TransferStatus.INITIATED || status === TransferStatus.AWAITING_CONFIRMATION,
      status,
      recipient,
      amount,
      token,
      ensName,
      transactionHash
    };
  }

  /**
   * Creates a response for an unknown command
   * @param originalCommand - The unrecognized command
   * @returns A formatted unknown command response
   */
  public createUnknownResponse(originalCommand: string): UnknownResponse {
    return {
      message: 'Command not recognized. Text HELP to see available commands.',
      success: false,
      originalCommand,
      suggestions: ['HELP', 'REGISTER', 'SEND [amount][token] [address/ENS]']
    };
  }

  /**
   * Extracts just the message text from any response type
   * @param response - The command response object
   * @returns The message text to send to the user
   */
  public getResponseMessage(response: Response): string {
    return response.message;
  }
}

export function createCommandResponseService(): CommandResponseService {
  return new CommandResponseService();
}