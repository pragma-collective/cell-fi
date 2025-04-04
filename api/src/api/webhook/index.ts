import { Hono } from 'hono';

import { createSmsSenderService } from "../../core/sms/sender"
import { createSmsParserService } from "../../core/sms/parser"
import { createCommandResponseService } from '../../core/sms/responder';
import { createCommandProcessor } from '../../core/sms/processor';

export const webhook = new Hono();

webhook.post('/', async (c) => {
  const body = await c.req.json();

  const parser = createSmsParserService();
  const smsSender = createSmsSenderService({
    apiKey: '',
    defaultSender: '',
    baseUrl: '',
  });
  const responder = createCommandResponseService();
  const processor = createCommandProcessor({
    parserService: parser,
    senderService: smsSender,
    responseService: responder,
  });

  try {
    await processor.processWebhook(body);
  } catch (error) {

  }
});