import { describe, test, expect, mock, beforeEach } from "bun:test";
import { createUserWallet, getENSName } from "../wallet";
import { CreateUserWalletParams } from "../../types/wallet";
import { BLOCKCHAIN_ID, CIRCLE_ACCOUNT_TYPE, ENS_DOMAIN } from "../constants";

// Create mock objects outside
const mockCircleClient = {
  createWalletSet: mock(() => ({
    data: {
      walletSet: {
        id: "mock-wallet-set-id"
      }
    }
  })),
  createWallets: mock(() => ({
    data: {
      wallets: [{
        id: "mock-wallet-id",
        address: "0x1234567890abcdef"
      }]
    }
  }))
};

const mockTx = {
  select: mock(() => mockTx as any),
  from: mock(() => mockTx as any),
  where: mock(() => mockTx as any),
  limit: mock(() => []),
  insert: mock(() => mockTx as any),
  values: mock(() => mockTx as any),
  returning: mock(() => [{
    id: "mock-user-id",
    walletAddress: "0x1234567890abcdef",
    ensName: `testuser.${ENS_DOMAIN}`
  }])
};

// Mock the getCircleClient function directly
mock.module("../wallet", () => {
  const actual = require("../wallet");
  return {
    ...actual,
    getCircleClient: () => mockCircleClient
  };
});

// Mock the database module
mock.module("../../db", () => ({
  db: {
    transaction: async (callback: (tx: any) => Promise<any>) => {
      return callback(mockTx);
    }
  }
}));

describe("Wallet Utilities", () => {
  beforeEach(() => {
    // Reset all mocks
    mockCircleClient.createWalletSet.mockReset();
    mockCircleClient.createWallets.mockReset();
    Object.values(mockTx).forEach(mockFn => mockFn.mockReset());

    // Reset chainable mock implementations
    mockTx.select.mockImplementation(() => mockTx);
    mockTx.from.mockImplementation(() => mockTx);
    mockTx.where.mockImplementation(() => mockTx);
    mockTx.insert.mockImplementation(() => mockTx);
    mockTx.values.mockImplementation(() => mockTx);
    
    // Set default mock implementations
    mockTx.limit.mockImplementation(() => []);
    mockTx.returning.mockImplementation(() => [{
      id: "mock-user-id",
      walletAddress: "0x1234567890abcdef",
      ensName: `testuser.${ENS_DOMAIN}`
    }]);

    // Set default Circle client implementations
    mockCircleClient.createWalletSet.mockImplementation(() => ({
      data: {
        walletSet: {
          id: "mock-wallet-set-id"
        }
      }
    }));
    mockCircleClient.createWallets.mockImplementation(() => ({
      data: {
        wallets: [{
          id: "mock-wallet-id",
          address: "0x1234567890abcdef"
        }]
      }
    }));
  });

  describe("getENSName", () => {
    test("should format username with ENS domain", () => {
      const username = "testuser";
      const ensName = getENSName(username);
      expect(ensName).toBe(`testuser.${ENS_DOMAIN}`);
    });
  });

  describe("createUserWallet", () => {
    test("should create a new user wallet successfully", async () => {
      const userData: CreateUserWalletParams = {
        username: "testuser",
        firstName: "Test",
        lastName: "User",
        phoneNumber: "+1234567890"
      };

      const result = await createUserWallet(userData);

      // Verify Circle wallet set was created
      expect(mockCircleClient.createWalletSet).toHaveBeenCalledWith({
        name: `testuser.${ENS_DOMAIN}`
      });

      // Verify Circle wallet was created
      expect(mockCircleClient.createWallets).toHaveBeenCalledWith({
        blockchains: [BLOCKCHAIN_ID],
        accountType: CIRCLE_ACCOUNT_TYPE,
        count: 1,
        walletSetId: "mock-wallet-set-id"
      });

      // Verify user was inserted with correct data
      expect(mockTx.insert).toHaveBeenCalled();
      expect(mockTx.values).toHaveBeenCalledWith({
        username: "testuser",
        ensName: `testuser.${ENS_DOMAIN}`,
        firstName: "Test",
        lastName: "User",
        phoneNumber: "+1234567890",
        walletAddress: "0x1234567890abcdef",
        circleWalletId: "mock-wallet-id"
      });

      // Verify the return value matches the actual implementation
      expect(result).toEqual({
        id: "mock-user-id",
        walletAddress: "0x1234567890abcdef",
        ensName: `testuser.${ENS_DOMAIN}`
      });
    });

    test("should throw error if user already exists", async () => {
      // Mock existing user
      mockTx.limit.mockImplementationOnce(() => [{
        id: "existing-id",
        username: "existing",
        ensName: `existing.${ENS_DOMAIN}`,
        walletAddress: "0xexisting",
        circleWalletId: "existing-wallet-id"
      }] as any);

      const userData: CreateUserWalletParams = {
        username: "existing",
        firstName: "Test",
        lastName: "User",
        phoneNumber: "+1234567890"
      };

      await expect(createUserWallet(userData)).rejects.toThrow(
        `You already have a wallet: existing.${ENS_DOMAIN}`
      );
    });

    test("should throw error if Circle wallet set creation fails", async () => {
      // Override the default mock for this test
      mockCircleClient.createWalletSet.mockImplementationOnce(() => ({
        data: { 
          walletSet: {
            id: "" // Empty string instead of null to satisfy type
          }
        }
      }));

      const userData: CreateUserWalletParams = {
        username: "testuser",
        firstName: "Test",
        lastName: "User",
        phoneNumber: "+1234567890"
      };

      await expect(createUserWallet(userData)).rejects.toThrow(
        "Failed to create Circle wallet set"
      );
    });

    test("should throw error if Circle wallet creation fails", async () => {
      // Override the default mock for this test
      mockCircleClient.createWallets.mockImplementationOnce(() => ({
        data: {
          wallets: []
        }
      }));

      const userData: CreateUserWalletParams = {
        username: "testuser",
        firstName: "Test",
        lastName: "User",
        phoneNumber: "+1234567890"
      };

      await expect(createUserWallet(userData)).rejects.toThrow(
        "Failed to create Circle wallet"
      );
    });
  });
});