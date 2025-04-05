import { ethers } from 'ethers';

// The ABI of the ENS registrar contract
const ENS_REGISTRAR_ABI = [
  {
    "inputs": [{"internalType": "address", "name": "_registry", "type": "address"}],
    "stateMutability": "nonpayable",
    "type": "constructor"
  },
  {
    "anonymous": false,
    "inputs": [
      {"indexed": true, "internalType": "string", "name": "label", "type": "string"},
      {"indexed": true, "internalType": "address", "name": "owner", "type": "address"}
    ],
    "name": "NameRegistered",
    "type": "event"
  },
  {
    "inputs": [{"internalType": "string", "name": "label", "type": "string"}],
    "name": "available",
    "outputs": [{"internalType": "bool", "name": "", "type": "bool"}],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [],
    "name": "chainId",
    "outputs": [{"internalType": "uint256", "name": "", "type": "uint256"}],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [],
    "name": "coinType",
    "outputs": [{"internalType": "uint256", "name": "", "type": "uint256"}],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [
      {"internalType": "string", "name": "label", "type": "string"},
      {"internalType": "address", "name": "owner", "type": "address"}
    ],
    "name": "register",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [],
    "name": "registry",
    "outputs": [{"internalType": "contract IL2Registry", "name": "", "type": "address"}],
    "stateMutability": "view",
    "type": "function"
  }
];

export class ENSRegistrar {
  private contract: ethers.Contract;
  private provider: ethers.Provider;
  private signer: ethers.Signer | null;

  /**
   * Creates an instance of the ENS Registrar contract
   * @param contractAddress The address of the ENS Registrar contract
   * @param providerUrl The provider URL (e.g., Infura, Alchemy)
   * @param privateKey Optional private key for signing transactions
   */
  constructor(contractAddress: string, providerUrl: string, privateKey?: string) {
    this.provider = new ethers.JsonRpcProvider(providerUrl);
    
    if (privateKey) {
      this.signer = new ethers.Wallet(privateKey, this.provider);
      this.contract = new ethers.Contract(contractAddress, ENS_REGISTRAR_ABI, this.signer);
    } else {
      this.signer = null;
      this.contract = new ethers.Contract(contractAddress, ENS_REGISTRAR_ABI, this.provider);
    }
  }

  /**
   * Checks if a name is available for registration
   * @param label The ENS name to check (without .eth suffix)
   * @returns Promise<boolean> indicating if the name is available
   */
  async isNameAvailable(label: string): Promise<boolean> {
    try {
      return await this.contract.available(label);
    } catch (error) {
      console.error('Error checking name availability:', error);
      throw error;
    }
  }

  /**
   * Registers an ENS name
   * @param label The ENS name to register (without .eth suffix)
   * @param ownerAddress The address that will own the name
   * @returns Promise<ethers.TransactionResponse> The transaction response
   */
  async registerName(label: string, ownerAddress: string): Promise<ethers.TransactionResponse> {
    if (!this.signer) {
      throw new Error('Cannot register name: no signer provided');
    }

    try {
      const tx = await this.contract.register(label, ownerAddress);
      return tx;
    } catch (error) {
      console.error('Error registering name:', error);
      throw error;
    }
  }

  /**
   * Gets the chain ID supported by this registrar
   * @returns Promise<bigint> The chain ID
   */
  async getChainId(): Promise<bigint> {
    try {
      return await this.contract.chainId();
    } catch (error) {
      console.error('Error getting chain ID:', error);
      throw error;
    }
  }

  /**
   * Gets the coin type supported by this registrar
   * @returns Promise<bigint> The coin type
   */
  async getCoinType(): Promise<bigint> {
    try {
      return await this.contract.coinType();
    } catch (error) {
      console.error('Error getting coin type:', error);
      throw error;
    }
  }

  /**
   * Gets the registry address
   * @returns Promise<string> The registry address
   */
  async getRegistry(): Promise<string> {
    try {
      return await this.contract.registry();
    } catch (error) {
      console.error('Error getting registry address:', error);
      throw error;
    }
  }

  /**
   * Listen for NameRegistered events
   * @param callback The callback function to execute when an event is emitted
   * @returns The event listener that can be removed later
   */
  onNameRegistered(callback: (label: string, owner: string, event: ethers.EventLog) => void) {
    return this.contract.on('NameRegistered', (label, owner, event) => {
      callback(label, owner, event);
    });
  }
}

// Example usage:
// const ensRegistrar = new ENSRegistrar(
//   '0xYourContractAddress',
//   'https://eth-mainnet.g.alchemy.com/v2/YOUR_API_KEY'
// );
// 
// // Read-only operations
// const isAvailable = await ensRegistrar.isNameAvailable('myname');
// 
// // Write operations (require signer)
// const ensRegistrarWithSigner = new ENSRegistrar(
//   '0xYourContractAddress',
//   'https://eth-mainnet.g.alchemy.com/v2/YOUR_API_KEY',
//   'your_private_key'
// );
// const tx = await ensRegistrarWithSigner.registerName('myname', '0xYourAddress');
// const receipt = await tx.wait();
