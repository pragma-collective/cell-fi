import {
  // CommandResponse,
  HelpResponse,
  RegisterResponse,
  SendResponse,
  UnknownResponse,
  TransferStatus,
  Response,
  NominateResponse,
  ApprovalResponse
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
      'SEND [amount][token] [address/ENS] - Send tokens',
      'NOMINATE [phone1] [phone2] - Nominate cosigners for transactions',
      'ACCEPT [code] - Accept a nomination',
      'DENY [code] - Deny a nomination'
    ];

    return {
      message: 'Commands: HELP (this message), REGISTER (create wallet), SEND [amount][token] [address/ENS], NOMINATE [phone1] [phone2], ACCEPT/DENY [code], REQUEST [amount][token] [address/ENS]',
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
  public createRegisterResponse(
    message: string,
    walletAddress?: string, 
    isNewWallet: boolean = true
  ): RegisterResponse {

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
      pendingApproval?: boolean;
    }
  ): SendResponse {
    const { recipient, amount, token, ensName, transactionHash, pendingApproval } = params;
    let message: string;

    switch (status) {
      case TransferStatus.INITIATED:
        message = transactionHash
          ? `Successfully initiated transfer of ${amount} ${token} to ${ensName || recipient}. Transaction hash: ${transactionHash}`
          : `You are about to send ${amount} ${token} to ${ensName ? `${recipient} (${ensName})` : recipient}`;
        break;

      case TransferStatus.AWAITING_CONFIRMATION:
        message = `Successfully initiated transfer of ${amount} ${token} to ${ensName || recipient}.`;
        // message = `Please confirm you want to send ${amount} ${token} to ${ensName ? `${recipient} (${ensName})` : recipient}. Reply YES to confirm.`;
        break;

      case TransferStatus.PENDING_APPROVAL:
        message = `Your transaction of ${amount} ${token} to ${ensName || recipient} is pending approval from your nominated cosigners.`;
        break;

      case TransferStatus.APPROVED:
        // message = `Your transaction of ${amount} ${token} to ${ensName || recipient} has been approved and executed. Transaction hash: ${transactionHash}`;
        message = `Your transaction of ${amount} ${token} has been approved and executed.`;
        break;

      case TransferStatus.REJECTED:
        // message = `Your transaction of ${amount} ${token} to ${ensName || recipient} was rejected by a cosigner.`;
        message = `Your recent transaction of ${amount} ${token} was rejected by a cosigner.`;
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
      success: [
        TransferStatus.INITIATED,
        TransferStatus.AWAITING_CONFIRMATION,
        TransferStatus.PENDING_APPROVAL,
        TransferStatus.APPROVED
      ].includes(status),
      status,
      recipient,
      amount,
      token,
      ensName,
      transactionHash,
      pendingApproval
    };
  }

  /**
   * Creates a nominate response
   * @param nominees - Array of nominee phone numbers
   * @param code - Unique nomination code
   * @param success - Whether the nomination was successfully created
   * @returns A formatted nominate response
   */
  public createNominateResponse(nominees: string[], code: string, success: boolean = true): NominateResponse {
    const message = success
      ? `You've nominated ${nominees.join(' and ')} as cosigners for your transactions. They will receive a message to accept or deny. Nomination code: ${code}`
      : `Failed to nominate cosigners. Please try again.`;

    return {
      message,
      success,
      nominees,
      code
    };
  }

  /**
   * Creates a transaction approval request message
   * @param username - Phone number of the transaction initiator
   * @param amount - Amount being sent
   * @param token - Token being sent
   * @param recipient - Recipient address
   * @param codeIdentifier - Transaction approval code
   * @returns Message to send to approvers
   */
  public createApprovalRequestMessage(
    username: string,
    amount: string,
    token: string,
    recipient: string,
    codeIdentifier: string
  ): string {
    return `${username} is trying to send ${amount} ${token} to ${recipient}. Reply APPROVE ${codeIdentifier} to authorize or REJECT ${codeIdentifier} to deny.`;
  }

  /**
   * Creates a nominee notification message
   * @param nominatorPhone - Phone number of the nominator
   * @param code - Unique nomination code
   * @returns Message to send to a nominee
   */
  public createNomineeNotification(nominatorPhone: string, code: string): string {
    return `${nominatorPhone} has nominated you as a cosigner for their transactions. Reply ACCEPT ${code} to confirm or DENY ${code} to decline.`;
  }

  /**
   * Creates a response for a requested payment
   * @param type - The original command type
   * @param params - Payment request parameters
   * @returns A formatted payment request response
   */
  public createPaymentRequestedResponse(
    params: {
      paymentCode: string;
      amount: string;
      recipient: string;
    }
  ): Response {
    const { paymentCode, amount, recipient } = params;

    return {
      message: 'Payment request created successfully. The recipient will be notified.',
      success: true,
      paymentCode,
      amount,
      recipient,
    };
  }

  /**
   * Creates a message to notify the recipient about a payment request
   * @param requester - Phone number of the payment requester
   * @param amount - Amount requested
   * @param paymentCode - Unique payment code
   * @returns Message to send to the payment recipient
   */
  public createPaymentRecipientNotification(
    requester: string,
    amount: number,
    paymentCode: string
  ): string {
    return `${requester} has requested a payment of ${amount}USDC from you. Reply with PAY ${paymentCode} to proceed with payment`;
  }

  public createPaymentRequesterNotification(
    recipient: string,
    code: string,
  ): string {
    return `${recipient} has made their payment for your payment request: ${code}`
  }

  public createSendRecipientNotification(
    sender: string,
    amount: string,
  ): string {
    return `You have received ${amount}USDC from ${sender}.`
  }

  /**
   * Creates a message to notify the payer about payment made
   * @param recipientNumber - Phone number of the payment requester
   * @param amount - Amount requested
   * @returns Message to send to the payment recipient
   */
  public createPaidResponseNotification(
    recipientNumber: string,
    amount: number,
  ): Response {
    return {
      message: `Thank you for successfully making a payment!`,
      success: true,
      paymentCode: '',
      amount: amount.toString(),
      recipient: recipientNumber,
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
   * Creates a response for an unknown command
   * @param originalCommand - The unrecognized command
   * @returns A formatted unknown command response
   */
  public createGenericResponse(message: string, originalCommand: string): UnknownResponse {
    return {
      message,
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