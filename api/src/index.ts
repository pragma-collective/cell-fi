import { Hono } from "hono";
import { webhook } from './api/webhook'
const app = new Hono();

app.get("/", async (c) => {
  return c.json({
    message: "Cell-Fi API",
  });
});

// Routers
app.route('/sms-webhook', webhook)

export default app
