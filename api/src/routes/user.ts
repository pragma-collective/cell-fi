import { Hono } from "hono";
import { validator } from "hono/validator";
import { createUserWallet } from "../util/wallet";

const userRouter = new Hono();

userRouter.post(
  "/",
  validator("json", (value, c) => {
    const { username, firstName, lastName, phoneNumber } = value;
    if (!username ||  !phoneNumber) {
      return c.json({ message: "Missing required fields" }, 400);
    }
    return {
      username,
      firstName,
      lastName,
      phoneNumber,
    };
  }),
  async (c) => {
    const { username, firstName, lastName, phoneNumber } = await c.req.json();
    const user = await createUserWallet({
      username,
      firstName,
      lastName,
      phoneNumber,
    });
    return c.json(user);
  }
);

export default userRouter;
