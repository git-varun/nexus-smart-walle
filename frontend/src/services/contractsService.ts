// frontend/src/services/contractService.ts
import { ethers } from 'ethers';
import { PublicClient, WalletClient } from 'viem';
import { CONTRACTS } from '../constants/contracts';

export class ContractService {
  private publicClient: PublicClient;
  private walletClient?: WalletClient;

  constructor(publicClient: PublicClient, walletClient?: WalletClient) {
    this.publicClient = publicClient;
    this.walletClient = walletClient;
  }

  // Smart Account Factory
  async getSmartAccountFactory() {
    return new ethers.Contract(
      CONTRACTS.SMART_ACCOUNT_FACTORY,
      [
        'function createAccount(address owner, uint256 salt) returns (address)',
        'function getAddress(address owner, uint256 salt) view returns (address)',
        'function isAccountDeployed(address owner, uint256 salt) view returns (bool)',
        'function getInitCode(address owner, uint256 salt) view returns (bytes)'
      ],
      this.walletClient as any
    );
  }

  // Smart Account
  async getSmartAccount(address: string) {
    return new ethers.Contract(
      address,
      [
        'function owner() view returns (address)',
        'function getNonce() view returns (uint256)',
        'function execute(address target, uint256 value, bytes calldata data)',
        'function executeBatch(address[] calldata targets, uint256[] calldata values, bytes[] calldata datas)',
        'function addModule(address module)',
        'function removeModule(address module)',
        'function isModuleEnabled(address module) view returns (bool)',
        'function getModules() view returns (address[])'
      ],
      this.walletClient as any
    );
  }

  // Session Key Module
  async getSessionKeyModule() {
    return new ethers.Contract(
      CONTRACTS.SESSION_KEY_MODULE,
      [
        'function addSessionKey(address account, address sessionKey, uint256 spendingLimit, uint256 dailyLimit, uint256 expiryTime, address[] calldata allowedTargets)',
        'function revokeSessionKey(address account, address sessionKey)',
        'function getSessionKey(address account, address sessionKey) view returns (tuple(address key, uint256 spendingLimit, uint256 dailyLimit, uint256 usedToday, uint256 lastUsedDay, uint256 expiryTime, address[] allowedTargets, bool isActive))',
        'function getActiveSessionKeys(address account) view returns (address[])',
        'function validateSessionKey(address account, address sessionKey, address target, uint256 value) returns (bool)',
        'function checkSessionKeyValidity(address account, address sessionKey, address target, uint256 value) view returns (bool, string)',
        'function getSessionKeyUsage(address account, address sessionKey) view returns (uint256, uint256, uint256, uint256)'
      ],
      this.walletClient as any
    );
  }

  // Verifying Paymaster
  async getVerifyingPaymaster() {
    return new ethers.Contract(
      CONTRACTS.VERIFYING_PAYMASTER,
      [
        'function getHash(bytes32 userOpHash, uint48 validUntil, uint48 validAfter) view returns (bytes32)',
        'function verifyingSigner() view returns (address)',
        'function getDeposit(address account) view returns (uint256)',
        'function addDepositFor(address account) payable'
      ],
      this.walletClient as any
    );
  }
}