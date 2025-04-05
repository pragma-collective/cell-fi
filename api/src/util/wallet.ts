import { db } from "../db";
import { user } from "../db/schema/user";
import initiateDeveloperControlledWalletsClient from "./circleClient";
import { BLOCKCHAIN_ID, CIRCLE_ACCOUNT_TYPE, ENS_DOMAIN } from "./constants";
import { sql } from "drizzle-orm";
import { CreateUserWalletParams } from "../types/wallet";
import { ENSRegistrar, ENSResolver } from "./ens";

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
      const { ENS_CONTRACT_ADDRESS, RPC_PROVIDER_URL, PRIVATE_KEY } =
        process.env;

      const contractAddress = ENS_CONTRACT_ADDRESS || "";
      const providerUrl = RPC_PROVIDER_URL || "";
      const privateKey = PRIVATE_KEY;

      if (!contractAddress || !providerUrl || !privateKey) {
        console.error("ENS registration configuration incomplete.");
        throw new Error("Something went wrong. Please try again.");
      }

      const ensRegistrar = new ENSRegistrar(
        contractAddress,
        providerUrl,
        privateKey
      );

      // Check if the ENS name is available
      const isAvailable = await ensRegistrar.isNameAvailable(username);

      const ensName = getENSName(username);

      if (!isAvailable) {
        throw new Error("Username is not available.");
      }

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
        .returning({
          id: user.id,
          walletAddress: user.walletAddress,
          ensName: user.ensName,
          username: user.username,
        });

      return newUser;
    } catch (error) {
      throw error;
    }
  });
};

export const getUserWallet = async (ensName: string) => {
  try {
    const { SEPOLIA_PROVIDER_URL } = process.env;

    const providerUrl = SEPOLIA_PROVIDER_URL || "";

    if (!providerUrl) {
      console.error("ENS registration configuration incomplete.");
      throw new Error("Something went wrong. Please try again.");
    }

    const ensResolver = new ENSResolver(providerUrl);
    const walletAddress = await ensResolver.resolveName(ensName);
    if (!walletAddress) {
      throw new Error("Wallet address not found");
    }

    const circleClient = getCircleClient();
    const userWallet = await circleClient.listWallets({
      address: walletAddress,
      blockchain: BLOCKCHAIN_ID,
    });

    return userWallet.data?.wallets?.[0] || null;
  } catch (error) {
    console.error("Error getting user wallet:", error);
    throw error;
  }
};
