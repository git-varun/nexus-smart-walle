// frontend/src/types/transaction.ts
export interface Transaction {
  hash: string
  userOpHash: string
  status: 'pending' | 'success' | 'failed'
  timestamp: number
  target: string
  value: string
  gasUsed?: string
  gasCost?: string
  method?: string
}

export interface ExecuteTransactionParams {
  target: string
  value: string
  data: string
}

export interface BatchExecuteParams {
  targets: string[]
  values: string[]
  datas: string[]
}