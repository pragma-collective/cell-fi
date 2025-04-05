import { ENSRegistrar, ENSResolver } from "./ens";
import * as dotenv from "dotenv";

// Load environment variables
dotenv.config();

// Example environment variables:
// ENS_CONTRACT_ADDRESS=0x...
// RPC_PROVIDER_URL=https://...
// PRIVATE_KEY=your_private_key (optional for signing transactions)
const PRIVATE_KEY = "";
const ENS_CONTRACT_ADDRESS = "";
const RPC_PROVIDER_URL = "https://arbitrum-sepolia-rpc.publicnode.com";
const SEPOLIA_RPC_URL = "https://ethereum-sepolia-rpc.publicnode.com";

async function example() {
  // Initialize with contract address and provider
  const ensResolver = new ENSResolver(SEPOLIA_RPC_URL);
  ensResolver.resolveName("biksbiks.cellfi.eth").then((address) => {
    console.log("Resolved address:", address);
  });
}

// Run the example
example().catch(console.error);

// To run this example:
// bun run src/util/ensExample.ts
