import { Hono } from "hono";
import { validator } from "hono/validator";
import {
  createTransaction,
  getTotalTransactions,
  getTransactions,
} from "../util/transaction";
import { CreateTransactionParams } from "../types/transaction";

const transactionRouter = new Hono();

transactionRouter.post(
  "/",
  validator("json", (value, c) => {
    const {
      username,
      ensName,
      destinationEnsName,
      amount,
      type,
    }: CreateTransactionParams = value;
    if (!username || !ensName || !destinationEnsName || !amount || !type) {
      return c.json({ message: "Missing required fields" }, 400);
    }
    return {
      username,
      ensName,
      destinationEnsName,
      type,
      amount,
    };
  }),
  async (c) => {
    try {
      const requestData = await c.req.json();
      const transaction = await createTransaction(requestData);
      return c.json(transaction);
    } catch (error) {
      console.error("Error creating transaction:", error);
      return c.json(JSON.stringify(error), 500);
    }
  }
);

transactionRouter.get("/", async (c) => {
  try {
    const queryParams = await c.req.query();
    const page = parseInt(queryParams?.page) ?? 0;
    const limit = parseInt(queryParams?.limit) ?? 20;
    const search = queryParams?.search ?? "";

    const transactions = await getTransactions({
      page,
      limit,
      search,
    });

    const totalCount = await getTotalTransactions();

    return c.json({
      transactions,
      pagination: {
        page,
        limit,
        totalCount,
        totalPages: Math.ceil(totalCount / limit),
      },
    });
  } catch (error) {
    console.error(error);
    throw error;
  }
});

export default transactionRouter;
