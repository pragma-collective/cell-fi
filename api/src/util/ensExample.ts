import { ENSRegistrar } from './ens';
import * as dotenv from 'dotenv';

// Load environment variables
dotenv.config();

// Example environment variables:
// ENS_CONTRACT_ADDRESS=0x...
// RPC_PROVIDER_URL=https://...
// PRIVATE_KEY=your_private_key (optional for signing transactions)
const PRIVATE_KEY= "58fdf9457a723f6ca1ef5f7e76e859949200f40c40493566ce6fa2c414165839"
const ENS_CONTRACT_ADDRESS= "0xF329e95b66E7BF84167A0F50f76eEa17e7B1a0fc"
const RPC_PROVIDER_URL= "https://arbitrum-sepolia-rpc.publicnode.com"

async function example() {
  // Initialize with contract address and provider
  const contractAddress = ""
  const providerUrl = ""
  const privateKey = ""; // Optional: only needed for transactions

  if (!contractAddress) {
    throw new Error('ENS_CONTRACT_ADDRESS environment variable is not set');
  }

  if (!providerUrl) {
    throw new Error('RPC_PROVIDER_URL environment variable is not set');
  }

  try {
    // Create instance for read-only operations
    const ensRegistrar = new ENSRegistrar(contractAddress, providerUrl);
    
    // Example 1: Check if a name is available
    const nameToCheck = 'biks';
    const isAvailable = await ensRegistrar.isNameAvailable(nameToCheck);
    console.log(`Is "${nameToCheck}" available? ${isAvailable}`);
    
    // Example 2: Get contract metadata
    const chainId = await ensRegistrar.getChainId();
    const coinType = await ensRegistrar.getCoinType();
    const registryAddress = await ensRegistrar.getRegistry();
    
    console.log('Contract metadata:');
    console.log(`- Chain ID: ${chainId}`);
    console.log(`- Coin Type: ${coinType}`);
    console.log(`- Registry Address: ${registryAddress}`);

    // Example 3: Register a name (requires private key)
    if (privateKey) {
      const ensRegistrarWithSigner = new ENSRegistrar(contractAddress, providerUrl, privateKey);
      
      // First check if the name is available
      const nameToRegister = 'test123';
      const available = await ensRegistrarWithSigner.isNameAvailable(nameToRegister);
      
      if (available) {
        // The owner address can be different from the signer's address
        const ownerAddress = '0xdF8E22DE759346656DF41cEe3994F02973fa1216'; // Replace with actual address
        
        console.log(`Registering "${nameToRegister}" for owner ${ownerAddress}...`);
        const tx = await ensRegistrarWithSigner.registerName(nameToRegister, ownerAddress);
        
        console.log(`Transaction sent: ${tx.hash}`);
        console.log('Waiting for confirmation...');
        
        const receipt = await tx.wait();
        console.log(`Transaction confirmed in block ${receipt?.blockNumber}`);
      } else {
        console.log(`Sorry, "${nameToRegister}" is not available.`);
      }
    } else {
      console.log('Private key not provided. Skipping registration example.');
    }

    // Example 4: Listen for NameRegistered events
    ensRegistrar.onNameRegistered((label, owner, event) => {
      console.log(`Name registered: ${label}`);
      console.log(`Owner: ${owner}`);
      console.log(`Transaction hash: ${event.transactionHash}`);
    });
    
    console.log('Listening for NameRegistered events. Press Ctrl+C to exit.');
    
    // Keep the process running to receive events
    // In a real application, you might want to clean up this listener
    
  } catch (error) {
    console.error('Error in ENS example:', error);
  }
}

// Run the example
example().catch(console.error);

// To run this example:
// bun run src/util/ensExample.ts 