import { db } from "../db";
import { eq, sql } from "drizzle-orm";
import { user } from "../db/schema/user";
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

      const senderWallet = await getUserWallet(username, ensName);

      if (!senderWallet?.address) {
        throw new Error("Sender wallet address is missing");
      }

      const destinationWallet = await getUserWallet("", destinationEnsName);
      if (!destinationWallet?.address) {
        throw new Error("Destination wallet address is missing");
      }
      const destinationAddress = destinationWallet.address;

      const sender = await tx.query.user.findFirst({
        where: eq(user.walletAddress, senderWallet.address.toLowerCase()),
      });

      if (!sender) {
        throw new Error("User not found");
      }

      const walletTokenResponse = await circleClient.getWalletTokenBalance({
        id: senderWallet?.id ?? "",
      });

      if (!walletTokenResponse.data?.tokenBalances?.length) {
        throw new Error("Failed to get wallet token balance");
      }

      const tokenBalance = walletTokenResponse.data?.tokenBalances?.find(
        (tokenBalance) => {
          return (
            tokenBalance.token.symbol === "USDC" &&
            tokenBalance.token.blockchain === BLOCKCHAIN_ID
          );
        }
      );

      const transactionResponse = await circleClient.createTransaction({
        walletId: senderWallet?.id ?? "",
        tokenId: tokenBalance?.token.id ?? "",
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
      let status: TransactionStatus;
      switch (state) {
        case "COMPLETE":
          status = "success";
          break;
        case "FAILED":
        case "CANCELLED":
        case "DENIED":
          status = "failed";
          break;
        default:
          status = "pending";
      }

      const [newTransaction] = await tx
        .insert(transaction)
        .values({
          userId: senderWallet.id,
          type,
          destinationAddress,
          txHash: transactionResponse.data.id,
          status,
          amount: Math.round(amount),
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
