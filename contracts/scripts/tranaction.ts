// contracts/scripts/simulation.ts
import { ethers } from "ethers";
import { AlchemyBundlerService } from "./alchemy-bundler";
import { PaymasterService } from "./paymaster-utils";
import { buildUserOperation, UserOperationStruct } from "./userOp-utils";

/**
 * End-to-end simulation of gasless transactions
 */

export class E2ESimulation {
  private bundler: AlchemyBundlerService;
  private paymaster: PaymasterService;
  private provider: ethers.Provider;
  private signer: ethers.Signer;
  private entryPointAddress: string;
  private chainId: number;

  constructor(
    alchemyApiKey: string,
    paymasterAddress: string,
    provider: ethers.Provider,
    signer: ethers.Signer,
    entryPointAddress: string,
    chainId: number
  ) {
    this.bundler = new AlchemyBundlerService(alchemyApiKey);
    this.paymaster = new PaymasterService(paymasterAddress, signer, provider);
    this.provider = provider;
    this.signer = signer;
    this.entryPointAddress = entryPointAddress;
    this.chainId = chainId;
  }

  /**
   * Simulate complete gasless transaction flow
   */
  async simulateGaslessTransaction(params: {
    accountAddress: string;
    nonce: string;
    target: string;
    value: bigint;
    data: string;
    initCode?: string;
  }): Promise<{
    userOpHash: string;
    receipt: any;
    gasUsed: bigint;
    success: boolean;
  }> {
    console.log("🚀 Starting gasless transaction simulation...");

    try {
      // Step 1: Check paymaster deposit
      console.log("📋 Step 1: Checking paymaster deposit...");
      const depositInfo = await this.paymaster.checkDeposit(params.accountAddress);

      if (depositInfo.isInsufficient) {
        console.log("💰 Adding deposit to paymaster...");
        await this.paymaster.addDeposit(params.accountAddress, ethers.parseEther("0.1"));
      }

      // Step 2: Build UserOperation with paymaster
      console.log("📋 Step 2: Building UserOperation...");

      const callData = this.encodeExecuteCall(params.target, params.value, params.data);

      // Build initial UserOp without paymaster data
      const initialUserOp = await buildUserOperation(
        {
          sender: params.accountAddress,
          nonce: params.nonce,
          initCode: params.initCode,
          callData: callData
        },
        this.provider,
        this.signer,
        this.entryPointAddress,
        this.chainId
      );

      // Step 3: Get gas estimates from bundler
      console.log("📋 Step 3: Estimating gas...");
      const gasEstimates = await this.bundler.estimateUserOperationGas(initialUserOp);

      // Update UserOp with better gas estimates
      initialUserOp.callGasLimit = gasEstimates.callGasLimit;
      initialUserOp.verificationGasLimit = gasEstimates.verificationGasLimit;
      initialUserOp.preVerificationGas = gasEstimates.preVerificationGas;

      // Step 4: Generate paymaster data
      console.log("📋 Step 4: Generating paymaster signature...");
      const userOpHash = this.getUserOpHash(initialUserOp);
      const paymasterData = await this.paymaster.createPaymasterData(userOpHash);

      // Update UserOp with paymaster data
      initialUserOp.paymasterAndData = paymasterData;

      // Step 5: Send UserOperation
      console.log("📋 Step 5: Sending UserOperation to bundler...");
      const userOpHashResult = await this.bundler.sendUserOperation(initialUserOp);

      // Step 6: Wait for transaction
      console.log("📋 Step 6: Waiting for transaction to be mined...");
      const receipt = await this.bundler.waitForUserOperation(userOpHashResult);

      console.log("✅ Gasless transaction completed successfully!");

      return {
        userOpHash: userOpHashResult,
        receipt,
        gasUsed: BigInt(receipt.actualGasUsed || "0"),
        success: receipt.success || false
      };

    } catch (error) {
      console.error("❌ Gasless transaction failed:", error);
      throw error;
    }
  }

  /**
   * Simulate batch gasless transactions
   */
  async simulateBatchGaslessTransaction(params: {
    accountAddress: string;
    nonce: string;
    transactions: Array<{
      target: string;
      value: bigint;
      data: string;
    }>;
    initCode?: string;
  }): Promise<{
    userOpHash: string;
    receipt: any;
    gasUsed: bigint;
    success: boolean;
  }> {
    console.log("🚀 Starting batch gasless transaction simulation...");

    try {
      // Encode batch call data
      const callData = this.encodeBatchExecuteCall(params.transactions);

      return await this.simulateGaslessTransaction({
        accountAddress: params.accountAddress,
        nonce: params.nonce,
        target: params.accountAddress, // Call to self for batch execution
        value: 0n,
        data: callData,
        initCode: params.initCode
      });

    } catch (error) {
      console.error("❌ Batch gasless transaction failed:", error);
      throw error;
    }
  }

  /**
   * Test complete flow with account creation
   */
  async testCompleteFlow(params: {
    owner: string;
    salt: number;
    factoryAddress: string;
    target: string;
    value: bigint;
    data: string;
  }): Promise<void> {
    console.log("🧪 Testing complete flow with account creation...");

    try {
      // Step 1: Calculate account address
      const factoryInterface = new ethers.Interface([
        "function getAddress(address owner, uint256 salt) view returns (address)"
      ]);

      const factory = new ethers.Contract(
        params.factoryAddress,
        factoryInterface,
        this.provider
      );

      const accountAddress = await factory.getAddress(params.owner, params.salt);
      console.log("📍 Account address:", accountAddress);

      // Step 2: Create initCode
      const initCodeInterface = new ethers.Interface([
        "function createAccount(address owner, uint256 salt) returns (address)"
      ]);

      const initCode = ethers.concat([
        params.factoryAddress,
        initCodeInterface.encodeFunctionData("createAccount", [params.owner, params.salt])
      ]);

      // Step 3: Execute gasless transaction with account creation
      const result = await this.simulateGaslessTransaction({
        accountAddress,
        nonce: "0", // First transaction
        target: params.target,
        value: params.value,
        data: params.data,
        initCode
      });

      console.log("✅ Complete flow test successful!");
      console.log("UserOp Hash:", result.userOpHash);
      console.log("Gas Used:", result.gasUsed.toString());
      console.log("Success:", result.success);

    } catch (error) {
      console.error("❌ Complete flow test failed:", error);
      throw error;
    }
  }

  // Helper methods
  private encodeExecuteCall(target: string, value: bigint, data: string): string {
    const executeInterface = new ethers.Interface([
      "function execute(address target, uint256 value, bytes calldata data)"
    ]);

    return executeInterface.encodeFunctionData("execute", [target, value, data]);
  }

  private encodeBatchExecuteCall(transactions: Array<{
    target: string;
    value: bigint;
    data: string;
  }>): string {
    const targets = transactions.map(tx => tx.target);
    const values = transactions.map(tx => tx.value);
    const datas = transactions.map(tx => tx.data);

    const batchInterface = new ethers.Interface([
      "function executeBatch(address[] calldata targets, uint256[] calldata values, bytes[] calldata datas)"
    ]);

    return batchInterface.encodeFunctionData("executeBatch", [targets, values, datas]);
  }

  private getUserOpHash(userOp: UserOperationStruct): string {
    const encoded = ethers.AbiCoder.defaultAbiCoder().encode(
      [
        "address", "uint256", "bytes32", "bytes32", "uint256",
        "uint256", "uint256", "uint256", "uint256", "bytes32"
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
        ["bytes32", "address", "uint256"],
        [userOpHash, this.entryPointAddress, this.chainId]
      )
    );
  }

  /**
   * Send UserOperation to bundler
  */
  async sendUserOperation(userOp: UserOperationStruct): Promise<string> {
    try {
      const result = await this.alchemyClient.request({
        method: "eth_sendUserOperation",
        params: [userOp, await this.getEntryPointAddress()]
      });

      console.log("UserOperation sent:", result);
      return result;
    } catch (error) {
      console.error("Failed to send UserOperation:", error);
      throw error;
    }
  }

  /**
   * Get UserOperation receipt
   */
  async getUserOperationReceipt(userOpHash: string): Promise<any> {
    try {
      const receipt = await this.alchemyClient.request({
        method: "eth_getUserOperationReceipt",
        params: [userOpHash]
      });

      return receipt;
    } catch (error) {
      console.error("Failed to get UserOperation receipt:", error);
      throw error;
    }
  }

  /**
   * Wait for UserOperation to be mined
   */
  async waitForUserOperation(
    userOpHash: string,
    timeout: number = 60000
  ): Promise<any> {
    const startTime = Date.now();

    while (Date.now() - startTime < timeout) {
      try {
        const receipt = await this.getUserOperationReceipt(userOpHash);
        if (receipt) {
          return receipt;
        }
      } catch (error) {
        // Receipt not yet available
      }

      // Wait 2 seconds before checking again
      await new Promise(resolve => setTimeout(resolve, 2000));
    }

    throw new Error("UserOperation timeout");
  }

  /**
   * Estimate UserOperation gas
   */
  async estimateUserOperationGas(userOp: Partial<UserOperationStruct>): Promise<{
    callGasLimit: string;
    verificationGasLimit: string;
    preVerificationGas: string;
  }> {
    try {
      const estimates = await this.alchemyClient.request({
        method: "eth_estimateUserOperationGas",
        params: [userOp, await this.getEntryPointAddress()]
      });

      return {
        callGasLimit: estimates.callGasLimit,
        verificationGasLimit: estimates.verificationGasLimit,
        preVerificationGas: estimates.preVerificationGas,
      };
    } catch (error) {
      console.error("Failed to estimate gas:", error);
      // Return defaults
      return {
        callGasLimit: "100000",
        verificationGasLimit: "150000",
        preVerificationGas: "21000",
      };
    }
  }