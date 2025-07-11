// frontend/src/types/session.ts
export interface SessionKey {
  key: string
  spendingLimit: string
  dailyLimit: string
  usedToday: string
  lastUsedDay: number
  expiryTime: number
  allowedTargets: string[]
  isActive: boolean
}

export interface CreateSessionKeyParams {
  sessionKey: string
  spendingLimit: string
  dailyLimit: string
  expiryTime: number
  allowedTargets: string[]
}