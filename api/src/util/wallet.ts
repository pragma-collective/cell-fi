import { db } from "../db";
import { user } from "../db/schema/user";
import initiateDeveloperControlledWalletsClient from "./circleClient";
import { BLOCKCHAIN_ID, CIRCLE_ACCOUNT_TYPE } from "./constants";
import { sql } from "drizzle-orm";
import { CreateUserWalletParams } from "../types/wallet";
const circleClient = initiateDeveloperControlledWalletsClient();

export const createUserWallet = async ({
  username,
  ensName,
  firstName,
  lastName,
  phoneNumber,
}: CreateUserWalletParams) => {
  // Start a database transaction
  return await db.transaction(async (tx) => {
    try {
      // Check if user already exists
      const existingUser = await tx
        .select()
        .from(user)
        .where(
          sql`${user.username} = ${username} OR ${user.phoneNumber} = ${phoneNumber}`
        )
        .limit(1);

      if (existingUser.length > 0) {
        throw new Error(
          "User with this username or phone number already exists"
        );
      }

      // Create Circle wallet set
      const circleWalletSetResponse = await circleClient.createWalletSet({
        name: ensName ?? username,
      });

      if (!circleWalletSetResponse.data?.walletSet?.id) {
        throw new Error("Failed to create Circle wallet set");
      }

      // Create Circle wallet
      const circleWallet = await circleClient.createWallets({
        blockchains: [BLOCKCHAIN_ID],
        accountType: CIRCLE_ACCOUNT_TYPE,
        count: 1,
        walletSetId: circleWalletSetResponse.data.walletSet.id,
      });

      if (
        !circleWallet.data?.wallets?.[0]?.id ||
        !circleWallet.data.wallets[0].address
      ) {
        throw new Error("Failed to create Circle wallet");
      }

      // Insert user with wallet address
      const [newUser] = await tx
        .insert(user)
        .values({
          username,
          ensName,
          firstName,
          lastName,
          phoneNumber,
          walletAddress: circleWallet.data.wallets[0].address,
          circleWalletId: circleWallet.data.wallets[0].id,
        })
        .returning({ id: user.id });

      return newUser;
    } catch (error) {
      // If anything fails, the transaction will be rolled back automatically
      // We should also handle cleanup of any created Circle resources here
      if (error instanceof Error) {
        throw new Error(`User creation failed: ${error.message}`);
      }
      throw error;
    }
  });
};
