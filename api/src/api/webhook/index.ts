import { Hono } from 'hono';
import { env } from 'hono/adapter'
import { createSmsSenderService } from "../../core/sms/sender"
import { createSmsParserService } from "../../core/sms/parser"
import { createCommandResponseService } from '../../core/sms/responder';
import { createCommandProcessor } from '../../core/sms/processor';

export const webhook = new Hono();

webhook.post('/', async (c) => {
  const body = await c.req.json();
  const { SMS_API_KEY, SMS_BASE_URL, SENDER_MOBILE } = env<{
    SMS_API_KEY: string,
    SENDER_MOBILE: string,
    SMS_BASE_URL: string
  }>(c);

  const parser = createSmsParserService();
  const smsSender = createSmsSenderService({
    apiKey: SMS_API_KEY,
    defaultSender: SENDER_MOBILE,
    baseUrl: SMS_BASE_URL,
  });
  const responder = createCommandResponseService();
  const processor = createCommandProcessor({
    parserService: parser,
    senderService: smsSender,
    responseService: responder,
  });

  // todo(jhudiel) - error handling
  await processor.processWebhook(body);
});