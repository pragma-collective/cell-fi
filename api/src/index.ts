import { Hono } from "hono";
import { jwt } from "hono/jwt";
import { webhook } from "./api/webhook";
import userRouter from "./routes/user";
import authRouter from "./routes/auth";
import meRouter from "./routes/me";
import transactionRouter from "./routes/transaction";
import { JWT_SECRET } from "./util/constants";

const app = new Hono();

app.use(
  "/me/*",
  jwt({
    secret: JWT_SECRET,
  })
);

// Mount the routers
app.route("/user", userRouter);
app.route("/auth", authRouter);
app.route("/me", meRouter);
app.route("/transaction", transactionRouter);
app.route("/sms-webhook", webhook);

app.get("/", async (c) => {
  return c.json({
    message: "Cell-Fi API",
  });
});

export default {
  port: 3000,
  fetch: app.fetch,
};
