import { ENSRegistrar } from './ens';
import { createUserWallet } from './wallet';
import * as dotenv from 'dotenv';
import { db } from '../db';
import { user } from '../db/schema/user';
import { sql } from 'drizzle-orm';

// Load environment variables
dotenv.config();

const contractAddress = process.env.ENS_CONTRACT_ADDRESS || '';
const providerUrl = process.env.RPC_PROVIDER_URL || '';
const privateKey = process.env.PRIVATE_KEY;

if (!contractAddress || !providerUrl) {
  console.warn('ENS_CONTRACT_ADDRESS or RPC_PROVIDER_URL environment variables are not set. ENS functionality will be limited.');
}

/**
 * Creates a new wallet and registers an ENS name for a user
 * 
 * @param username - The username for the account
 * @param ensName - The ENS name to register (without .eth suffix)
 * @param firstName - User's first name
 * @param lastName - User's last name
 * @param phoneNumber - User's phone number
 * @returns The created user with wallet address and ENS name
 */
export async function createUserWithENS({
  username,
  ensName,
  firstName,
  lastName,
  phoneNumber
}: {
  username: string,
  ensName: string,
  firstName: string,
  lastName: string,
  phoneNumber: string
}) {
  try {
    // Check if ENS integration is properly configured
    if (!contractAddress || !providerUrl || !privateKey) {
      throw new Error('ENS integration is not properly configured');
    }

    // Initialize ENS registrar with signer
    const ensRegistrar = new ENSRegistrar(contractAddress, providerUrl, privateKey);

    // Check if the ENS name is available
    const isAvailable = await ensRegistrar.isNameAvailable(ensName);
    if (!isAvailable) {
      throw new Error(`ENS name "${ensName}" is not available`);
    }

    // Create wallet for user
    const newUser = await createUserWallet({
      username,
      ensName,
      firstName,
      lastName,
      phoneNumber
    });

    if (!newUser?.id) {
      throw new Error('Failed to create user wallet');
    }

    // Fetch the complete user data including wallet address
    const userData = await db.select().from(user).where(sql`${user.id} = ${newUser.id}`).limit(1);
    
    if (!userData.length || !userData[0].walletAddress) {
      throw new Error('User wallet address is missing');
    }

    // Register ENS name
    const tx = await ensRegistrar.registerName(ensName, userData[0].walletAddress);
    
    // Wait for transaction confirmation
    await tx.wait();

    return {
      user: userData[0],
      ensTransaction: tx.hash
    };
  } catch (error) {
    console.error('Error creating user with ENS:', error);
    throw error;
  }
}

/**
 * Checks if an ENS name is available
 * 
 * @param ensName - The ENS name to check (without .eth suffix)
 * @returns Promise<boolean> indicating if the name is available
 */
export async function isENSNameAvailable(ensName: string): Promise<boolean> {
  try {
    if (!contractAddress || !providerUrl) {
      throw new Error('ENS integration is not properly configured');
    }
    
    const ensRegistrar = new ENSRegistrar(contractAddress, providerUrl);
    return await ensRegistrar.isNameAvailable(ensName);
  } catch (error) {
    console.error('Error checking ENS name availability:', error);
    throw error;
  }
}

/**
 * Listen for NameRegistered events
 * 
 * @param callback Function to call when a name is registered
 * @returns The event listener that can be removed later
 */
export function onENSNameRegistered(
  callback: (label: string, owner: string, event: any) => void
) {
  try {
    if (!contractAddress || !providerUrl) {
      throw new Error('ENS integration is not properly configured');
    }
    
    const ensRegistrar = new ENSRegistrar(contractAddress, providerUrl);
    return ensRegistrar.onNameRegistered(callback);
  } catch (error) {
    console.error('Error setting up ENS event listener:', error);
    throw error;
  }
} 