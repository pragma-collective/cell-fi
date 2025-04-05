import { Hono } from "hono";
import { webhook } from "./api/webhook";
import userRouter from "./routes/user";
import { ensRouter } from "./routes/ens";

const app = new Hono();

// Mount the user router
app.route("/user", userRouter);

// Mount the ENS router
app.route("/ens", ensRouter);

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
