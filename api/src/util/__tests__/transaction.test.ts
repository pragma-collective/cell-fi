import { describe, test, expect, mock, beforeEach } from "bun:test";
import { BLOCKCHAIN_ID, ENS_DOMAIN } from "../constants";

// Set up mocks BEFORE importing the modules that use them
const MOCK_WALLET_ID = "123e4567-e89b-12d3-a456-426614174000";

const mockCircleClient = {
  getWalletTokenBalance: mock(({ id }: { id: string }) => ({
    data: {
      tokenBalances: [
        {
          token: {
            id: "e4f549f9-a910-59b1-b5cd-8f972871f5db",
            blockchain: BLOCKCHAIN_ID,
            name: "Polygon-Amoy",
            symbol: "MATIC-AMOY",
            decimals: 18,
            isNative: true,
            updateDate: "2023-06-29T02:37:14Z",
            createDate: "2023-06-29T02:37:14Z",
          },
          amount: "0",
          updateDate: "2023-11-17T16:54:55Z",
        },
        {
          token: {
            id: "7adb2b7d-c9cd-5164-b2d4-b73b088274dc",
            blockchain: BLOCKCHAIN_ID,
            tokenAddress: "0x9999f7fea5938fd3b1e26a12c3f2fb024e194f97",
            standard: "ERC20",
            name: "USD Coin",
            symbol: "USDC",
            decimals: 6,
            isNative: false,
            updateDate: "2023-10-18T14:29:44Z",
            createDate: "2023-10-18T14:29:44Z",
          },
          amount: "10",
          updateDate: "2023-11-17T16:54:55Z",
        },
      ],
    },
  })),
  createTransaction: mock(() => ({
    data: {
      id: "1af639ce-c8b2-54a6-af49-7aebc95aaac1",
      state: "COMPLETE",
    },
  })),
};

// Mock the Circle client module BEFORE importing modules that use it
mock.module("../circleClient", () => ({
  default: () => mockCircleClient,
}));

// Now import the modules that use the mocked dependencies
import { createTransaction } from "../transaction";

const mockTx = {
  query: {
    user: {
      findFirst: mock(() => ({
        id: "mock-user-id",
        walletAddress: "0x1234567890abcdef",
        ensName: `testuser.${ENS_DOMAIN}`,
      })),
    },
  },
  select: mock(() => mockTx as any),
  from: mock(() => mockTx as any),
  where: mock(() => mockTx as any),
  limit: mock(() => []),
  insert: mock(() => mockTx as any),
  values: mock(() => mockTx as any),
  returning: mock(() => [
    {
      id: "mock-transaction-id",
      userId: "mock-user-id",
      destinationAddress: "0x1234567890abcdef",
      txHash: "mock-tx-hash",
      amount: "29",
      status: "success",
      createdAt: new Date(),
      updatedAt: new Date(),
    },
  ]),
};

mock.module("../../db", () => ({
  db: {
    transaction: async (callback: (tx: any) => Promise<any>) => {
      return callback(mockTx);
    },
  },
}));

describe("Transcation Utilities", () => {
  beforeEach(() => {
    mockCircleClient.createTransaction.mockReset();
    mockCircleClient.getWalletTokenBalance.mockReset();

    mockTx.query.user.findFirst.mockImplementation(() => ({
      id: "mock-user-id",
      walletAddress: "0x1234567890abcdef",
      ensName: `testuser.${ENS_DOMAIN}`,
      circleWalletId: "e4f549f9-a910-59b1-b5cd-8f972871f5db",
    }));
    mockTx.select.mockImplementation(() => mockTx);
    mockTx.from.mockImplementation(() => mockTx);
    mockTx.where.mockImplementation(() => mockTx);
    mockTx.insert.mockImplementation(() => mockTx);
    mockTx.values.mockImplementation(() => mockTx);

    mockTx.limit.mockImplementation(() => []);
    mockTx.returning.mockImplementation(() => [
      {
        id: "mock-transaction-id",
        destinationAddress: "0x1234567890abcdef",
        userId: "mock-user-id",
        type: "send",
        txHash: "mock-tx-hash",
        amount: "29",
        status: "success",
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    ]);
  });

  mockCircleClient.getWalletTokenBalance.mockImplementation(() => ({
    data: {
      tokenBalances: [
        {
          token: {
            id: "e4f549f9-a910-59b1-b5cd-8f972871f5db",
            blockchain: BLOCKCHAIN_ID,
            name: "Polygon-Amoy",
            symbol: "MATIC-AMOY",
            decimals: 18,
            isNative: true,
            updateDate: "2023-06-29T02:37:14Z",
            createDate: "2023-06-29T02:37:14Z",
          },
          amount: "0",
          updateDate: "2023-11-17T16:54:55Z",
        },
        {
          token: {
            id: "7adb2b7d-c9cd-5164-b2d4-b73b088274dc",
            blockchain: BLOCKCHAIN_ID,
            tokenAddress: "0x9999f7fea5938fd3b1e26a12c3f2fb024e194f97",
            standard: "ERC20",
            name: "USD Coin",
            symbol: "USDC",
            decimals: 6,
            isNative: false,
            updateDate: "2023-10-18T14:29:44Z",
            createDate: "2023-10-18T14:29:44Z",
          },
          amount: "10",
          updateDate: "2023-11-17T16:54:55Z",
        },
      ],
    },
  }));

  mockCircleClient.createTransaction.mockImplementation(() => ({
    data: {
      id: "1af639ce-c8b2-54a6-af49-7aebc95aaac1",
      state: "COMPLETED",
    },
  }));
});

describe("createTransaction", () => {
  test("should create transaction successfully", async () => {
    const userData = {
      id: "mock-user-id",
      walletAddress: "0x1234567890abcdef",
      ensName: `testuser.${ENS_DOMAIN}`,
      circleWalletId: MOCK_WALLET_ID, // Use valid UUID
    };

    mockTx.query.user.findFirst.mockImplementation(() => userData);

    mockCircleClient.getWalletTokenBalance.mockImplementation(({ id }) => ({
      data: {
        tokenBalances: [
          {
            token: {
              id: "e4f549f9-a910-59b1-b5cd-8f972871f5db",
              blockchain: BLOCKCHAIN_ID,
              name: "Polygon-Amoy",
              symbol: "MATIC-AMOY",
              decimals: 18,
              isNative: true,
              updateDate: "2023-06-29T02:37:14Z",
              createDate: "2023-06-29T02:37:14Z",
            },
            amount: "0",
            updateDate: "2023-11-17T16:54:55Z",
          },
          {
            token: {
              id: "7adb2b7d-c9cd-5164-b2d4-b73b088274dc",
              blockchain: BLOCKCHAIN_ID,
              tokenAddress: "0x9999f7fea5938fd3b1e26a12c3f2fb024e194f97",
              standard: "ERC20",
              name: "USD Coin",
              symbol: "USDC",
              decimals: 6,
              isNative: false,
              updateDate: "2023-10-18T14:29:44Z",
              createDate: "2023-10-18T14:29:44Z",
            },
            amount: "10",
            updateDate: "2023-11-17T16:54:55Z",
          },
        ],
      },
    }));

    mockCircleClient.createTransaction.mockImplementation(() => ({
      data: {
        id: "1af639ce-c8b2-54a6-af49-7aebc95aaac1", // Valid UUID
        state: "COMPLETE",
        walletId: MOCK_WALLET_ID,
      },
    }));

    const result = await createTransaction({
      userId: userData.id,
      destinationAddress: "0x1234567890abcd22",
      amount: "200",
      type: "send",
    });

    expect(mockCircleClient.getWalletTokenBalance).toHaveBeenCalledWith({
      id: userData.circleWalletId,
    });

    expect(mockCircleClient.createTransaction).toHaveBeenCalledWith({
      walletId: userData.circleWalletId,
      tokenId: "mock-token-id",
      destinationAddress: "0x1234567890abcd22",
      amount: ["200"],
      fee: {
        type: "level",
        config: {
          feeLevel: "MEDIUM",
        },
      },
    });

    expect(result).toEqual({
      id: "mock-transaction-id",
      userId: "mock-user-id",
      destinationAddress: "0x1234567890abcdef",
      txHash: "mock-tx-hash",
      type: "send",
      amount: "29",
      status: "success",
      createdAt: expect.any(Date),
      updatedAt: expect.any(Date),
    });
  });
});
