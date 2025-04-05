import { db } from "../db";
import { user } from "../db/schema/user";
import initiateDeveloperControlledWalletsClient from "./circleClient";
import { BLOCKCHAIN_ID, CIRCLE_ACCOUNT_TYPE, ENS_DOMAIN } from "./constants";
import { sql } from "drizzle-orm";
import { CreateUserWalletParams } from "../types/wallet";

// Export for testing
export const getCircleClient = () => initiateDeveloperControlledWalletsClient();

export const getENSName = (username: string) => {
  return `${username}.${ENS_DOMAIN}`;
};

export const createUserWallet = async ({
  username,
  firstName,
  lastName,
  phoneNumber,
}: CreateUserWalletParams) => {
  // Start a database transaction
  return await db.transaction(async (tx) => {
    try {
      const ensName = getENSName(username);
      
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
          `You already have a wallet: ${existingUser[0].ensName}`
        );
      }

      const circleClient = getCircleClient();

      // Create Circle wallet set
      const circleWalletSetResponse = await circleClient.createWalletSet({
        name: ensName,
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
        .returning({ id: user.id, walletAddress: user.walletAddress, ensName: user.ensName, username: user.username });

      return newUser;
    } catch (error) {
      throw error;
    }
  });
};
