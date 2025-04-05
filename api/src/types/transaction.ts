import { TransactionType, TransactionStatus } from "../util/transaction";

export interface CreateTransactionParams {
  username?: string;
  ensName?: string;
  destinationEnsName: string;
  amount: number;
  type: TransactionType;
}

export interface Transaction {
  id: string;
  userId: string;
  destinationAddress: string;
  txHash: string;
  amount: string;
  type: TransactionType;
  status: TransactionStatus;
  createdAt: Date;
  updatedAt: Date;
}

export interface TransactionQueryParams {
  page: number;
  limit: number;
  search?: string;
}
