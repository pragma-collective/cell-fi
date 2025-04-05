import { Hono } from "hono";
import { webhook } from "./api/webhook";
import userRouter from "./routes/user";
import authRouter from "./routes/auth";

const app = new Hono();

// Mount the routers
app.route("/user", userRouter);
app.route("/auth", authRouter);

app.get("/", async (c) => {
  return c.json({
    message: "Cell-Fi API",
  });
});

// Routers
app.route("/sms-webhook", webhook);

export default {
  port: 3000,
  fetch: app.fetch,
};
