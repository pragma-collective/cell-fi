/**
 * @fileoverview Command processor that ties together parsing, handling, and responding
 */
import { SmsParserService } from '../parser';
import { SmsSenderService } from '../sender';
import { CommandResponseService } from '../responder';
import { Command, CommandType, SmsWebhookPayload } from '../parser/types';
import { Response, TransferStatus } from '../responder/types';

/**
 * Dependencies required by the command processor
 */
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
    // Check if this is a webhook we should process
    if (!this.parserService.shouldProcessWebhook(webhook)) {
      return false;
    }

    // Parse the command
    const command = this.parserService.parseWebhook(webhook);

    // Generate response
    const response = await this.handleCommand(command);

    console.log(response);
    // Extract the message text
    const messageText = this.responseService.getResponseMessage(response);
    console.log(messageText)
    // Send the response back to the user
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
  private async handleCommand(command: Command): Promise<Response> {
    switch (command.type) {
      case CommandType.HELP:
        return this.handleHelpCommand();

      case CommandType.REGISTER:
        return this.handleRegisterCommand(command.phoneNumber);

      case CommandType.SEND:
        return this.handleSendCommand(command);

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
  private async handleRegisterCommand(phoneNumber: string): Promise<Response> {
    // todo (joe/albert):
    //  - create wallet
    //  - create identity
    return this.responseService.createRegisterResponse();
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

    const { amount, token, recipient } = command;

    // For now, simulate awaiting confirmation
    return this.responseService.createSendResponse(
      TransferStatus.AWAITING_CONFIRMATION,
      {
        recipient,
        amount,
        token,
      }
    );
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
