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