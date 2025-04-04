import { db } from "../db";
import { user } from "../db/schema/user";
import initiateDeveloperControlledWalletsClient from "./circleClient";

const circleClient = initiateDeveloperControlledWalletsClient();

export const createUserWallet = async ({
  username,
  ensName,
  firstName,
  lastName,
  phoneNumber,
}: {
  username: string;
  ensName: string;
  firstName: string;
  lastName: string;
  phoneNumber: string;
}) => {
  const circleWalletSetResponse = await circleClient.createWalletSet({
    name: ensName ?? username,
  });

  const circleWalletSet = circleWalletSetResponse.data;

  const circleWallet = await circleClient.createWallets({
    blockchains: ["MATIC-AMOY"],
    accountType: "SCA",
    count: 1,
    walletSetId: circleWalletSet?.walletSet?.id ?? "",
  });

  if (!circleWallet.data?.wallets?.[0]?.id) {
    throw new Error("Failed to create Circle wallet");
  }

  const [newUser] = await db
    .insert(user)
    .values({
      username,
      ensName,
      firstName,
      lastName,
      phoneNumber,
      walletAddress: circleWallet.data.wallets[0].address,
    })
    .returning({ id: user.id });

  return newUser;
};
