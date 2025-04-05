import { Hono } from "hono";
import { jwt } from "hono/jwt";
import { webhook } from "./api/webhook";
import userRouter from "./routes/user";
import authRouter from "./routes/auth";
import meRouter from "./routes/me";
import { JWT_SECRET } from "./util/constants";

const app = new Hono();

app.use(
  '/me/*',
  jwt({
    secret: JWT_SECRET,
  })
)

// Mount the routers
app.route("/user", userRouter);
app.route("/auth", authRouter);
app.route("/me", meRouter);

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
