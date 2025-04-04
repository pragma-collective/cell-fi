import { initiateDeveloperControlledWalletsClient } from "@circle-fin/developer-controlled-wallets";

export default function initDeveloperControlledWalletsClient() {
  if (!process.env.CIRCLE_API_KEY) {
    throw new Error("CIRCLE_API_KEY is missing from the env");
  }

  if (!process.env.CIRCLE_ENTITY_SECRET) {
    throw new Error("CIRCLE_ENTITY_SECRET is missing from the env");
  }

  return initiateDeveloperControlledWalletsClient({
    apiKey: process.env.CIRCLE_API_KEY,
    entitySecret: process.env.CIRCLE_ENTITY_SECRET,
  });
}
