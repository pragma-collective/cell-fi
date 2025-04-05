import axios, { AxiosError, AxiosInstance } from 'axios';
import {
  SmsSenderConfig,
  SendSmsParams,
} from './types';

export class SmsSenderService {
  private client: AxiosInstance;
  private config: SmsSenderConfig;

  /**
   * Creates a new SMS sender service
   * @param config - Configuration for the SMS service
   */
  constructor(config: SmsSenderConfig) {
    this.config = {
      ...config,
      baseUrl: config.baseUrl,
    };

    this.client = axios.create({
      headers: {
        'Content-Type': 'application/json',
        "x-api-key": this.config.apiKey,
      }
    });
  }

  /**
   * Sends an SMS message
   * @param to - Recipient phone number
   * @param content - Message content
   * @param from - Optional sender number (falls back to default)
   * @returns Promise resolving to send result
   */
  public async sendMessage(to: string, content: string, from?: string) {
    const params: SendSmsParams = {
      to,
      content,
      from: from || this.config.defaultSender
    };

    try {
      const response = await this.client.post(this.config.baseUrl!, params);
      return {
        success: true,
        messageId: response.data.id || '',
        rawResponse: response.data
      };
    } catch (error) {
      // Handle error
      // todo(jhudiel) - queue for potential retry
      const axiosError = error as AxiosError;
      const errorMessage = axiosError?.response ? axiosError.response.data : axiosError.message || 'Unknown error';
      console.error("Unable to send message: ", errorMessage);
      return {
        success: false,
        error: errorMessage,
        rawResponse: axiosError.response?.data
      };
    }
  }

  /**
   * Sends a response to a command
   * @param phoneNumber - The user's phone number
   * @param responseMessage - The message to send
   * @returns Promise resolving to send result
   */
  public async sendCommandResponse(phoneNumber: string, responseMessage: string) {
    return this.sendMessage(phoneNumber, responseMessage);
  }
}

export function createSmsSenderService(config: SmsSenderConfig): SmsSenderService {
  return new SmsSenderService(config);
}