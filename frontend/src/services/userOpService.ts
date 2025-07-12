// frontend/src/services/userOpService.ts
import { ethers } from 'ethers';
import { UserOperationStruct } from '../types/account';

export class UserOpService {
  private provider: ethers.Provider;
  private entryPointAddress: string;
  private chainId: number;

  constructor(provider: ethers.Provider, entryPointAddress: string, chainId: number) {
    this.provider = provider;
    this.entryPointAddress = entryPointAddress;
    this.chainId = chainId;
  }

  /**
   * Calculate UserOperation hash
   */
  getUserOpHash(userOp: UserOperationStruct): string {
    const encoded = ethers.AbiCoder.defaultAbiCoder().encode(
      [
        'address', 'uint256', 'bytes32', 'bytes32', 'uint256',
        'uint256', 'uint256', 'uint256', 'uint256', 'bytes32'
      ],
      [
        userOp.sender,
        userOp.nonce,
        ethers.keccak256(userOp.initCode),
        ethers.keccak256(userOp.callData),
        userOp.callGasLimit,
        userOp.verificationGasLimit,
        userOp.preVerificationGas,
        userOp.maxFeePerGas,
        userOp.maxPriorityFeePerGas,
        ethers.keccak256(userOp.paymasterAndData),
      ]
    );

    const userOpHash = ethers.keccak256(encoded);

    return ethers.keccak256(
      ethers.AbiCoder.defaultAbiCoder().encode(
        ['bytes32', 'address', 'uint256'],
        [userOpHash, this.entryPointAddress, this.chainId]
      )
    );
  }

  /**
   * Build execute call data
   */
  buildExecuteCallData(target: string, value: string, data: string): string {
    const executeInterface = new ethers.Interface([
      'function execute(address target, uint256 value, bytes calldata data)'
    ]);

    return executeInterface.encodeFunctionData('execute', [target, value, data]);
  }

  /**
   * Build batch execute call data
   */
  buildBatchExecuteCallData(
    targets: string[],
    values: string[],
    datas: string[]
  ): string {
    const batchInterface = new ethers.Interface([
      'function executeBatch(address[] calldata targets, uint256[] calldata values, bytes[] calldata datas)'
    ]);

    return batchInterface.encodeFunctionData('executeBatch', [targets, values, datas]);
  }

  /**
   * Estimate gas for UserOperation
   */
  async estimateUserOpGas(userOp: Partial<UserOperationStruct>) {
    try {
      // Basic gas estimates
      let callGasLimit = '100000';
      let verificationGasLimit = '150000';
      const preVerificationGas = '21000';

      // Estimate call gas if we have call data
      if (userOp.callData && userOp.callData !== '0x' && userOp.sender) {
        try {
          const gasEstimate = await this.provider.estimateGas({
            to: userOp.sender,
            data: userOp.callData,
          });
          callGasLimit = (gasEstimate + BigInt(10000)).toString();
        } catch (error) {
          console.warn('Call gas estimation failed, using default');
        }
      }

      // Higher verification gas for account creation
      if (userOp.initCode && userOp.initCode !== '0x') {
        verificationGasLimit = '500000';
      }

      return {
        callGasLimit,
        verificationGasLimit,
        preVerificationGas
      };
    } catch (error) {
      console.error('Gas estimation failed:', error);
      return {
        callGasLimit: '100000',
        verificationGasLimit: '150000',
        preVerificationGas: '21000'
      };
    }
  }

  /**
   * Get current gas prices
   */
  async getGasPrices() {
    try {
      const feeData = await this.provider.getFeeData();

      return {
        maxFeePerGas: (feeData.maxFeePerGas || ethers.parseUnits('20', 'gwei')).toString(),
        maxPriorityFeePerGas: (feeData.maxPriorityFeePerGas || ethers.parseUnits('2', 'gwei')).toString(),
      };
    } catch (error) {
      console.warn('Failed to get gas prices, using defaults:', error);
      return {
        maxFeePerGas: ethers.parseUnits('20', 'gwei').toString(),
        maxPriorityFeePerGas: ethers.parseUnits('2', 'gwei').toString(),
      };
    }
  }
}