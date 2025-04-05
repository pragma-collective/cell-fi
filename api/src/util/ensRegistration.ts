import { ENSRegistrar } from "./ens";

/**
 * Registers an ENS name for a given wallet address
 *
 * @param ensName - The ENS name to register (without .eth suffix)
 * @param walletAddress - The wallet address to register the ENS name for
 * @returns An object containing success status, message, and transaction hash if successful
 */
export async function registerENSName(
	ensName: string,
	walletAddress: string,
): Promise<{
	success: boolean;
	message: string;
	transactionHash?: string;
}> {
	const { ENS_CONTRACT_ADDRESS, RPC_PROVIDER_URL, PRIVATE_KEY } = process.env;

	try {
		// Get configuration from environment variables
		const contractAddress = ENS_CONTRACT_ADDRESS || "";
		const providerUrl = RPC_PROVIDER_URL || "";
		const privateKey = PRIVATE_KEY;

		// Check if all required configuration is present
		if (!contractAddress || !providerUrl || !privateKey) {
			return {
				success: false,
				message: "ENS registration configuration incomplete.",
			};
		}

		// Initialize ENS registrar with signer
		const ensRegistrar = new ENSRegistrar(
			contractAddress,
			providerUrl,
			privateKey,
		);

		// Check if the ENS name is available
		const isAvailable = await ensRegistrar.isNameAvailable(ensName);

		if (!isAvailable) {
			return {
				success: false,
				message: `ENS name "${ensName}" is not available.`,
			};
		}

		// Register ENS name for the wallet address
		const tx = await ensRegistrar.registerName(ensName, walletAddress);

		// Wait for transaction confirmation
		await tx.wait();

		return {
			success: true,
			message: `ENS name "${ensName}" registered successfully.`,
			transactionHash: tx.hash,
		};
	} catch (error) {
		console.error("Error registering ENS name:", error);
		return {
			success: false,
			message:
				error instanceof Error
					? error.message
					: "An unknown error occurred during ENS registration.",
		};
	}
}

