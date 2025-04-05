import { eq, inArray, and } from "drizzle-orm";
import { nanoid } from 'nanoid';
import { db } from "../../../db"
import { user } from "../../../db/schema/user"
import { transaction } from "../../../db/schema/transaction";
import { nomination } from "../../../db/schema/nomination";
import { approval } from "../../../db/schema/approval";

import { SmsParserService } from '../parser';
import { SmsSenderService } from '../sender';
import { CommandResponseService } from '../responder';

import { Command, CommandType, NominateCommand, SmsWebhookPayload, NominationResponseCommand, TransactionApprovalCommand } from '../parser/types';
import { Response, TransferStatus, ApprovalResponse } from '../responder/types';
import { createUserWallet } from '../../../util/wallet';
import { registerENSName } from '../../../util/ensRegistration';
import { createTransaction } from '../../../util/transaction';

export interface CommandProcessorDependencies {
  parserService: SmsParserService;
  senderService: SmsSenderService;
  responseService: CommandResponseService;
}

/**
 * Service that coordinates the end-to-end processing of SMS commands
 */
export class CommandProcessor {
  private parserService: SmsParserService;
  private senderService: SmsSenderService;
  private responseService: CommandResponseService;

  /**
   * Creates a new command processor
   * @param dependencies - Required service dependencies
   */
  constructor(dependencies: CommandProcessorDependencies) {
    this.parserService = dependencies.parserService;
    this.senderService = dependencies.senderService;
    this.responseService = dependencies.responseService;
  }

  /**
   * Processes an incoming webhook and sends appropriate response
   * @param webhook - The incoming webhook payload
   * @returns True if the webhook was processed successfully
   */
  public async processWebhook(webhook: SmsWebhookPayload): Promise<boolean> {
    if (!this.parserService.shouldProcessWebhook(webhook)) {
      return false;
    }

    const command = this.parserService.parseWebhook(webhook);
    const response = await this.handleCommand(command);
    const messageText = this.responseService.getResponseMessage(response);
    const sendResult = await this.senderService.sendCommandResponse(
      command.phoneNumber,
      messageText
    );

    return sendResult.success;
  }

  /**
   * Handles a command and generates an appropriate response
   * @param command - The parsed command to handle
   * @returns Promise resolving to a response object
   */
  // private async handleCommand(command: Command): Promise<Response> {
  //   switch (command.type) {
  //     case CommandType.HELP:
  //       return this.handleHelpCommand();
  //
  //     case CommandType.REGISTER:
  //       return this.handleRegisterCommand(command.phoneNumber, command.username);
  //
  //     case CommandType.SEND:
  //       return this.handleSendCommand(command);
  //
  //     case CommandType.NOMINATE:
  //       return this.handleNominateCommand(command);
  //
  //     case CommandType.APPROVE:
  //     case CommandType.DENY:
  //       return this.handleApprovalCommand(command)
  //     case CommandType.UNKNOWN:
  //     default:
  //       return this.handleUnknownCommand(command.rawMessage);
  //   }
  // }

  /**
   * Handles a command and generates an appropriate response
   * @param command - The parsed command to handle
   * @returns Promise resolving to a response object
   */
  private async handleCommand(command: Command): Promise<Response> {
    switch (command.type) {
      case CommandType.HELP:
        return this.handleHelpCommand();

      case CommandType.REGISTER:
        return this.handleRegisterCommand(command.phoneNumber, command.username);

      case CommandType.SEND:
        return this.handleSendCommand(command);

      case CommandType.NOMINATE:
        return this.handleNominateCommand(command as NominateCommand);

      case CommandType.ACCEPT:
      case CommandType.DENY:
        return this.handleNominationResponseCommand(command as NominationResponseCommand);

      case CommandType.APPROVE:
      case CommandType.REJECT:
        return this.handleTransactionApprovalCommand(command as TransactionApprovalCommand);

      case CommandType.UNKNOWN:
      default:
        return this.handleUnknownCommand(command.rawMessage);
    }
  }

  /**
   * Handles a help command
   * @returns Help response
   */
  private handleHelpCommand(): Response {
    return this.responseService.createHelpResponse();
  }

  /**
   * Handles a register command
   * @param phoneNumber - The user's phone number
   * @returns Register response
   */
  private async handleRegisterCommand(phoneNumber: string, username: string): Promise<Response> {
    try {
      const user = await createUserWallet({
        phoneNumber,
        username,
      });  

      // Use the extracted utility function for ENS registration
      if (user.walletAddress) {
        const registrationResult = await registerENSName(username, user.walletAddress);
        
        // Log the result - you can customize this based on your needs
        if (registrationResult.success) {
          console.log(`ENS registration successful: ${registrationResult.message} Transaction: ${registrationResult.transactionHash}`);
        } else {
          console.warn(`ENS registration skipped or failed: ${registrationResult.message}`);
        }
      }

      return this.responseService.createRegisterResponse(
        `Your new wallet has been created: ${user.username}. You can now send tokens or use NOMINATE to add trusted contacts as an extra security layer.`,
        user.walletAddress,
      );
      
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred';
      return this.responseService.createRegisterResponse(
        errorMessage,
        undefined,
        false,
      );
    }
  }

  /**
   * Handles a send command
   * @param command - The send command to handle
   * @returns Send response
   */
  private async handleSendCommand(command: Command): Promise<Response> {
    if (command.type !== CommandType.SEND) {
      throw new Error('Invalid command type passed to handleSendCommand');
    }

    const { amount, token, recipient, phoneNumber } = command;

    const currentUser = await db.query.user.findFirst({
        where: eq(user.phoneNumber, phoneNumber),
        with: {
          approvers: {
            with: {
              nominee: true,
            }
          },
        }
      }
    );

    if (!currentUser) {
      return this.responseService.createUnknownResponse("");
    }

    const recipientUser = await db.query.user.findFirst({
      where: eq(user.username, recipient),
    });

    if (!recipientUser) {
      return this.responseService.createUnknownResponse("");
    }

    if (currentUser.requiresApproval) {
      // create transaction
      const createdTx = await db.insert(transaction)
        .values({
          userId: currentUser.id,
          type: "send",
          status: "pending",
          txHash: 'placeholder',
          amount: parseInt(amount),
          destinationAddress: recipientUser.walletAddress,
        })
        .returning();

      for (const approver of currentUser.approvers) {
        const approvalCode = nanoid(6);
        const approvalMessage = this.responseService.createApprovalRequestMessage(
          currentUser.username,
          amount,
          token,
          recipient,
          approvalCode,
        );

        await db.insert(approval)
          .values({
            transactionId: createdTx[0].id,
            approverId: approver.id,
            status: 'pending',
            code: approvalCode,
          })
          .returning();

        await this.senderService.sendMessage(
          approver.nominee.phoneNumber,
          approvalMessage,
        );
      }

      return this.responseService.createSendResponse(
        TransferStatus.PENDING_APPROVAL,
        {
          recipient,
          amount,
          token,
          pendingApproval: true
        }
      );

    } else {
      try {
        await createTransaction({
          username: currentUser.username,
          ensName: currentUser.ensName,
          destinationEnsName: recipientUser.ensName,
          amount: amount,
          type: 'send',
        });
  
        return this.responseService.createSendResponse(
          TransferStatus.AWAITING_CONFIRMATION,
          {
            recipient,
            amount,
            token,
          }
        );
      } catch(error) {
        return this.responseService.createSendResponse(
          TransferStatus.FAILED,
          {
            recipient,
            amount,
            token,
          }
        );
      }
    }
  }

  /**
   * Handles a nomination response command (ACCEPT or DENY)
   * @param command - The nomination response command
   * @returns Nomination response
   */
  private async handleNominationResponseCommand(command: NominationResponseCommand): Promise<Response> {
    const { phoneNumber, code, type } = command;
    const isAccepting = type === CommandType.ACCEPT;

    const currentUser = await db.query.user.findFirst({
        where: eq(user.phoneNumber, phoneNumber),
      }
    );

    if (!currentUser) {
      return this.responseService.createUnknownResponse(`${type} ${code}`);
    }

    try {
      // Find the nominations with this code
      const nominations = await db.query.nomination.findMany({
        where: and(
          eq(nomination.code, code),
          eq(nomination.nomineeId, currentUser.id),
          eq(nomination.status, 'pending')
        ),
        with: {
          nominee: true
        }
      });

      if (nominations.length === 0) {
        return this.responseService.createUnknownResponse(`${type} ${code}`);
      }

      // Update the status of all nominations with this code for this user
      const status = isAccepting ? 'accepted' : 'rejected';
      for (const nom of nominations) {
        await db.update(nomination)
          .set({
            status,
            updated_at: new Date()
          })
          .where(
            and(
              eq(nomination.id, nom.id),
              eq(nomination.nomineeId, currentUser.id)
            )
          );
      }

      // Get the nominator information
      const nominatorId = nominations[0].userId;
      const nominator = await db.query.user.findFirst({
        where: eq(user.id, nominatorId)
      });

      if (isAccepting) {
        // If accepting, update the user's requiresApproval setting
        await db.update(user)
          .set({
            requiresApproval: true,
            updated_at: new Date()
          })
          .where(eq(user.id, nominatorId));

        // Notify the nominator
        if (nominator) {
          const acceptMessage = `${currentUser.username} has accepted your nomination as a cosigner.`;
          await this.senderService.sendMessage(nominator.phoneNumber!, acceptMessage);
        }

        return {
          message: `You have accepted the nomination as a cosigner for ${nominator ? nominator.username : 'a user'}.`,
          success: true,
          code,
          approved: true,
          nominatedBy: nominator ? nominator.username : undefined
        } as ApprovalResponse;
      } else {
        // If rejecting, notify the nominator
        if (nominator) {
          const rejectMessage = `${currentUser.username} has declined your nomination as a cosigner.`;
          await this.senderService.sendMessage(nominator.phoneNumber!, rejectMessage);
        }

        return {
          message: `You have declined the nomination as a cosigner for ${nominator ? nominator.username : 'a user'}.`,
          success: true,
          code,
          approved: false,
          nominatedBy: nominator ? nominator.username : undefined
        } as ApprovalResponse;
      }
    } catch (error) {
      console.error(`Error handling ${type} command:`, error);
      return this.responseService.createUnknownResponse(`${type} ${code}`);
    }
  }

  // /**
  //  * Handles a transaction approval command (APPROVE or REJECT)
  //  * @param command - The transaction approval command
  //  * @returns Transaction approval response
  //  */
  // private async handleTransactionApprovalCommand(command: TransactionApprovalCommand): Promise<Response> {
  //   const { phoneNumber, code, type } = command;
  //   const isApproving = type === CommandType.APPROVE;
  //
  //   const currentUser = await db.query.user.findFirst({
  //       where: eq(user.phoneNumber, phoneNumber),
  //     }
  //   );
  //
  //   if (!currentUser) {
  //     return this.responseService.createUnknownResponse(`${type} ${code}`);
  //   }
  //
  //   try {
  //     // Find the approval record with this code for this user
  //     const approvals = await db
  //       .select()
  //       .from(approval)
  //       .where(
  //         and(
  //           eq(approval.code, code),
  //           eq(approval.approverId, currentUser.id),
  //           eq(approval.status, 'pending')
  //         )
  //       );
  //
  //     if (approvals.length === 0) {
  //       return this.responseService.createUnknownResponse(`${type} ${code}`);
  //     }
  //
  //     // Get the approval record
  //     const approvalRecord = approvals[0];
  //
  //     // Find the associated transaction
  //     const transactions = await db
  //       .select()
  //       .from(transaction)
  //       .where(eq(transaction.id, approvalRecord.transactionId));
  //
  //     if (transactions.length === 0) {
  //       return this.responseService.createUnknownResponse(`${type} ${code}`);
  //     }
  //
  //     // Call the transaction approval handler with the found records
  //     return this.handleTransactionApproval(approvalRecord, isApproving);
  //   } catch (error) {
  //     console.error(`Error handling ${type} command:`, error);
  //     return this.responseService.createUnknownResponse(`${type} ${code}`);
  //   }
  // }
  //
  // /**
  //  * Handles a transaction approval command (APPROVE or REJECT)
  //  * @param command - The transaction approval command
  //  * @returns Transaction approval response
  //  */
  // private async handleTransactionApprovalCommand(command: TransactionApprovalCommand): Promise<Response> {
  //   const { phoneNumber, code, type } = command;
  //   const isApproving = type === CommandType.APPROVE;
  //
  //   const currentUser = await db.query.user.findFirst({
  //       where: eq(user.phoneNumber, phoneNumber),
  //
  //     }
  //   );
  //
  //   if (!currentUser) {
  //     return this.responseService.createUnknownResponse(`${type} ${code}`);
  //   }
  //
  //   try {
  //     // Find the approval record with this code for this user
  //     const app = await db
  //       .select()
  //       .from(approval)
  //       .where(
  //         and(
  //           eq(approval.code, code),
  //           eq(approval.approverId, phoneNumber)
  //         )
  //       )
  //       .limit(1);
  //
  //     if (approval.length === 0) {
  //       return this.responseService.createUnknownResponse(`${type} ${code}`);
  //     }
  //
  //     // Get the approval record
  //     const approvalRecord = approval[0];
  //
  //     // Find the associated transaction
  //     const transaction = await db
  //       .select()
  //       .from(transactions)
  //       .where(eq(transactions.id, approvalRecord.transactionId))
  //       .limit(1);
  //
  //     if (transaction.length === 0) {
  //       return this.responseService.createUnknownResponse(`${type} ${code}`);
  //     }
  //
  //     // Call the transaction approval handler with the found records
  //     return this.handleTransactionApproval(approvalRecord, isApproving);
  //   } catch (error) {
  //     console.error(`Error handling ${type} command:`, error);
  //     return this.responseService.createUnknownResponse(`${type} ${code}`);
  //   }
  // }

  /**
   * Handles an approval command (APPROVE or DENY)
   * @param command - The approval command
   * @returns Approval response
   */
  // private async handleApprovalCommand(command: ApprovalCommand): Promise<Response> {
  //   const { phoneNumber, code, type } = command;
  //   const isAccepting = type === CommandType.ACCEPT;
  //
  //   try {
  //     const currentUser = await db.query.user.findFirst({
  //         where: eq(user.phoneNumber, phoneNumber),
  //       }
  //     );
  //
  //     if (!currentUser) {
  //       console.error(`Error handling ${type} command: No current user found`);
  //       return this.responseService.createUnknownResponse(`${type} ${code}`);
  //     }
  //
  //     // Check if user is nominated
  //     const result = await db.select()
  //       .from(approval)
  //       .where(
  //         and(
  //           eq(approval.code, code),
  //           eq(approval.approverId, currentUser.id),
  //         )
  //       );
  //
  //     if (result.length < 1) {
  //       throw new Error('')
  //     }
  //
  //     const nomineeApproval = result[0];
  //
  //     return await this.handleTransactionApproval(
  //       nomineeApproval,
  //       isAccepting,
  //     );
  //   } catch (error) {
  //     console.error(`Error handling ${type} command`, error);
  //     return this.responseService.createUnknownResponse(`${type} ${code}`);
  //   }
  // }

  /**
   * Handles a transaction approval command (APPROVE or REJECT)
   * @param command - The transaction approval command
   * @returns Transaction approval response
   */
  private async handleTransactionApprovalCommand(command: TransactionApprovalCommand): Promise<Response> {
    const { phoneNumber, code, type } = command;
    const isApproving = type === CommandType.APPROVE;

    const currentUser = await db.query.user.findFirst({
        where: eq(user.phoneNumber, phoneNumber)
      }
    );

    if (!currentUser) {
      return this.responseService.createUnknownResponse(`${type} ${code}`);
    }

    try {
      // Find the approval record with this code for this user
      const approvals = await db
        .select()
        .from(approval)
        .where(
          and(
            eq(approval.code, code),
            eq(approval.approverId, currentUser.id)
          )
        )
        .limit(1);

      if (approvals.length === 0) {
        return this.responseService.createUnknownResponse(`${type} ${code}`);
      }

      // Get the approval record
      const approvalRecord = approvals[0];

      // Find the associated transaction
      const transactions = await db
        .select()
        .from(transaction)
        .where(eq(transaction.id, approvalRecord.transactionId))
        .limit(1);

      if (transactions.length === 0) {
        return this.responseService.createUnknownResponse(`${type} ${code}`);
      }

      // Call the transaction approval handler with the found records
      return this.handleTransactionApproval(approvalRecord, isApproving);
    } catch (error) {
      console.error(`Error handling ${type} command:`, error);
      return this.responseService.createUnknownResponse(`${type} ${code}`);
    }
  }

  /**
   * Handles a transaction approval/rejection
   * @param currentUserApproval - approval record
   * @param isApproving - Whether the approver is approving
   * @returns Approval response
   */
  private async handleTransactionApproval(
    currentUserApproval: any,
    isApproving: boolean
  ): Promise<Response> {
    try {
      const status = isApproving ? 'accepted' : 'rejected';

      if (!currentUserApproval) {
        return this.responseService.createUnknownResponse(
          `${isApproving ? 'APPROVE' : 'REJECT'} code`
        );
      }

      // 1. Get the transaction first to check its current status
      const tx = await db.query.transaction.findFirst({
        where: eq(transaction.id, currentUserApproval.transactionId),
        with: {
          owner: true,
        },
      });

      if (!tx) {
        return this.responseService.createUnknownResponse(
          `${isApproving ? 'APPROVE' : 'REJECT'} ${currentUserApproval.code}`
        );
      }

      // Check if the transaction is already completed or failed
      if (tx.status === 'success' || tx.status === 'failed') {
        // Transaction already processed
        const statusText = tx.status === 'success' ? 'approved' : 'rejected';
        return {
          message: `This transaction has already been ${statusText}.`,
          success: true
        } as Response;
      }

      // 2. Update the current user's approval status
      await db
        .update(approval)
        .set({
          status,
          updated_at: new Date()
        })
        .where(and(
          eq(approval.approverId, currentUserApproval.id),
          eq(approval.code, currentUserApproval.code),
        ));

      // 3. Handle rejection case
      if (!isApproving) {
        // Fetch the transaction again to make sure we're working with the latest state
        const updatedTx = await db.query.transaction.findFirst({
          where: eq(transaction.id, currentUserApproval.transactionId),
        });

        // Only update if the transaction isn't already completed or failed
        if (updatedTx && updatedTx.status !== 'success' && updatedTx.status !== 'failed') {
          await db
            .update(transaction)
            .set({
              status: 'failed', // rejected status
              updated_at: new Date()
            })
            .where(eq(transaction.id, currentUserApproval.transactionId));

          // Notify the initiator about the rejection
          const rejectionMessage = this.responseService.createSendResponse(
            TransferStatus.REJECTED,
            {
              amount: tx.amount.toString(),
              token: 'USDC',
              recipient: '',
            }
          ).message;

          await this.senderService.sendMessage(tx.owner.phoneNumber, rejectionMessage);
        }

        return {
          message: `You rejected the transaction of ${tx.amount} USDC`,
          success: true
        } as Response;
      }

      // 4. Handle approval - check if all approvals are complete
      const allApprovals = await db
        .select()
        .from(approval)
        .where(eq(approval.transactionId, tx.id));

      const allApproved = allApprovals.every(a => a.status === 'accepted');

      if (allApproved) {
        // Fetch the transaction again to make sure we're working with the latest state
        const latestTx = await db.query.transaction.findFirst({
          where: eq(transaction.id, currentUserApproval.transactionId),
        });

        // Only update if the transaction isn't already completed or failed
        if (latestTx && latestTx.status !== 'success' && latestTx.status !== 'failed') {
          const currentUser = await db.query.user.findFirst({
            where: eq(user.id, latestTx.userId)
          });

          if (!currentUser || !currentUser.phoneNumber) {
            return this.responseService.createUnknownResponse("Invalid user");
          }

          const recepientUser = await db.query.user.findFirst({
            where: eq(user.walletAddress, latestTx.destinationAddress)
          });

          if (!recepientUser) {
            return this.responseService.createUnknownResponse("Invalid recepient");
          }

          await createTransaction({
            username: currentUser.username,
            ensName: currentUser.ensName,
            destinationEnsName: recepientUser.ensName,
            amount: latestTx.amount.toString(),
            type: 'send',
          });

          // Notify the initiator
          const successMessage = this.responseService.createSendResponse(
            TransferStatus.APPROVED,
            {
              recipient: '',
              amount: latestTx.amount.toString(),
              token: 'USDC',
            }
          ).message;

          await this.senderService.sendMessage(currentUser.phoneNumber, successMessage);
        }

        // Return response to the approver
        return {
          message: `You approved the transaction of ${tx.amount} USDC. The transaction has been executed.`,
          success: true
        } as Response;
      } else {
        return {
          message: `You approved the transaction of ${tx.amount} USDC.`,
          success: true
        } as Response;
      }
    } catch (error) {
      console.error("Failed transaction approval", error instanceof Error ? error?.message : error);
      return this.responseService.createUnknownResponse("");
    }
  }

  /**
   * Handles a nominate command
   * @param command - The nominate command
   * @returns Nominate response
   */
  private async handleNominateCommand(command: NominateCommand): Promise<Response> {
    const { phoneNumber, nominee1, nominee2 } = command;

    const currentUser = await db.query.user.findFirst({
        where: eq(user.phoneNumber, phoneNumber),
        with: {
          approvers: {
            with: {
              nominee: true,
            }
          },
        }
      }
    );

    const nominees = await db.query.user.findMany({
      where: inArray(user.username, [nominee1, nominee2]),
    });

    if (!currentUser || nominees.length < 2) {
      // todo(jhudiel) - error
      return this.responseService.createGenericResponse("Unable to nominate cosigners. Please try again later", "");
    }

    try {
      const code = nanoid(6);
      const nomineeMessage = this.responseService.createNomineeNotification(currentUser.username, code);
      await Promise.all(nominees.map((n) => {
        return db.insert(nomination).values({
          userId: currentUser.id,
          nomineeId: n.id,
          code,
          status: 'pending'
        });
      }));

      await Promise.all(nominees.map((n) => {
        if (n?.phoneNumber) {
          return this.senderService.sendMessage(n.phoneNumber!, nomineeMessage);
        }
      }));

      return this.responseService.createNominateResponse([nominee1, nominee2], code);
    } catch (error) {
      console.error('Error processing nomination:', error);
      return this.responseService.createNominateResponse([], '', false);
    }
  }

  /**
   * Handles an unknown command
   * @param rawMessage - The original message
   * @returns Unknown command response
   */
  private handleUnknownCommand(rawMessage: string): Response {
    return this.responseService.createUnknownResponse(rawMessage);
  }
}

export function createCommandProcessor(dependencies: CommandProcessorDependencies): CommandProcessor {
  return new CommandProcessor(dependencies);
}
