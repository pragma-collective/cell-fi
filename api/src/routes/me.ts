import { Hono } from "hono";
import { db } from "../db";

const meRouter = new Hono();

meRouter.get(
  "/",
  async (c) => {
    const payload = c.get('jwtPayload');

    const user = await db.query.user.findFirst({
      where: (user, { eq }) => eq(user.id, payload.userId),
    });

    if (!user) {
      return c.json({ error: "User not found" }, 404);
    }

    return c.json(user);
  }
);

export default meRouter;
