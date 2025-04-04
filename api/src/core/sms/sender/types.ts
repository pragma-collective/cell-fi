export interface SmsSenderConfig {
  apiKey: string;
  defaultSender: string;
  baseUrl?: string;
}

export interface SendSmsParams {
  to: string;
  content: string;
  from?: string;
}

export interface SmsProviderResponse {
  id: string;
  status: string;
  [key: string]: any;
}

export interface SendResult {
  success: boolean;
  messageId?: string;
  error?: string;
  rawResponse?: any;
}

export interface FailedMessageRequest {
  params: SendSmsParams;
  timestamp: Date;
  error: string;
}