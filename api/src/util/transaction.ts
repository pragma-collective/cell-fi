import { db } from "../db";
import { sql } from "drizzle-orm";
import {
  transaction,
  transactionStatus,
  transactionType,
} from "../db/schema/transaction";
import { getUserWallet } from "./wallet";
import {
  CreateTransactionParams,
  Transaction,
  TransactionQueryParams,
} from "../types/transaction";
import initiateDeveloperControlledWalletsClient from "./circleClient";
import { BLOCKCHAIN_ID } from "./constants";
const circleClient = initiateDeveloperControlledWalletsClient();

export type TransactionStatus = (typeof transactionStatus.enumValues)[number];
export type TransactionType = (typeof transactionType.enumValues)[number]; // 'send' | 'receive'

export const createTransaction = async ({
  username = "",
  ensName = "",
  destinationEnsName,
  amount,
  type,
}: CreateTransactionParams): Promise<Transaction> => {
  return await db.transaction(async (tx) => {
    try {
      // get user wallet using username or ensName
      if (!username && !ensName) {
        throw new Error("Username or ENS name is required");
      }

      const senderWallet = await getUserWallet(ensName);

      if (!senderWallet) {
        throw new Error("Sender wallet not found");
      }

      const destinationWallet = await getUserWallet(destinationEnsName);
      if (!destinationWallet) {
        throw new Error("Destination wallet not found");
      }
      const destinationAddress = destinationWallet.address;

      const sender = await tx.query.user.findFirst({
        where: (user, { eq }) =>
          eq(user.circleWalletId, senderWallet.id) &&
          eq(user.walletAddress, senderWallet.address),
      });

      if (!sender) {
        throw new Error("Sender wallet not found");
      }

      const transactionResponse = await circleClient.createTransaction({
        walletId: senderWallet.id,
        tokenId: "4b8daacc-5f47-5909-a3ba-30d171ebad98", // USDC
        destinationAddress,
        amount: [amount.toString()],
        fee: {
          type: "level",
          config: {
            feeLevel: "MEDIUM",
          },
        },
      });

      if (!transactionResponse?.data?.id || !transactionResponse?.data?.state) {
        throw new Error("Failed to create transaction");
      }

      // parse state to transaction status
      const state = transactionResponse.data.state;
      let status: TransactionStatus = "success";
      // switch (state) {
      //   case "COMPLETE":
      //     status = "success";
      //     break;
      //   case "FAILED":
      //   case "CANCELLED":
      //   case "DENIED":
      //     status = "failed";
      //     break;
      //   default:
      //     status = "pending";
      // }

      const [newTransaction] = await tx
        .insert(transaction)
        .values({
          userId: sender.id,
          type,
          destinationAddress,
          txHash: transactionResponse.data.id,
          status,
          amount: Math.round(Number(amount)),
        })
        .returning({
          id: transaction.id,
          userId: transaction.userId,
          type: transaction.type,
          destinationAddress: transaction.destinationAddress,
          txHash: transaction.txHash,
          status: transaction.status,
          amount: transaction.amount,
          createdAt: transaction.created_at,
          updatedAt: transaction.updated_at,
        });

      return {
        ...newTransaction,
        amount: newTransaction.amount.toString(),
      } as Transaction;
    } catch (error) {
      console.error("Error creating transaction:", error);
      throw error;
    }
  });
};

export const getTransactions = async (queryParams: TransactionQueryParams) => {
  const offset = (queryParams.page - 1) * queryParams.limit;
  return await db.transaction(async (tx) => {
    try {
      return tx
        .select()
        .from(transaction)
        .limit(queryParams.limit)
        .offset(offset);
    } catch (error) {
      console.error(error);
      throw error;
    }
  });
};

export const getTotalTransactions = async () => {
  return await db
    .select({ count: sql<number>`count(*)`.as("count") })
    .from(transaction)
    .then((rows) => rows[0].count);
};
