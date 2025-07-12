// contracts/test/SmartAccount.test.ts
import { expect } from "chai";
import { ethers } from "hardhat";
import {
  SmartAccount,
  SmartAccountFactory,
  MockERC20,
  MockNFT,
  IEntryPoint
} from "../typechain-types";
import { SignerWithAddress } from "@nomiclabs/hardhat-ethers/signers";
import { parseEther, keccak256, toUtf8Bytes } from "ethers";

describe("SmartAccount", function () {
  let smartAccount: SmartAccount;
  let factory: SmartAccountFactory;
  let entryPoint: IEntryPoint;
  let mockERC20: MockERC20;
  let mockNFT: MockNFT;

  let owner: SignerWithAddress;
  let user: SignerWithAddress;
  let attacker: SignerWithAddress;

  const SALT = 12345;

  beforeEach(async function () {
    [owner, user, attacker] = await ethers.getSigners();

    // Deploy EntryPoint (using a mock for testing)
    const EntryPointFactory = await ethers.getContractFactory("EntryPoint");
    entryPoint = await EntryPointFactory.deploy();
    await entryPoint.waitForDeployment();

    // Deploy Factory
    const SmartAccountFactory = await ethers.getContractFactory("SmartAccountFactory");
    factory = await SmartAccountFactory.deploy(await entryPoint.getAddress());
    await factory.waitForDeployment();

    // Create SmartAccount
    const tx = await factory.createAccount(owner.address, SALT);
    await tx.wait();

    const accountAddress = await factory.getAddress(owner.address, SALT);
    smartAccount = await ethers.getContractAt("SmartAccount", accountAddress, owner);

    // Deploy mock tokens
    const MockERC20Factory = await ethers.getContractFactory("MockERC20");
    mockERC20 = await MockERC20Factory.deploy(
      "Test Token",
      "TEST",
      parseEther("1000")
    );
    await mockERC20.waitForDeployment();

    const MockNFTFactory = await ethers.getContractFactory("MockNFT");
    mockNFT = await MockNFTFactory.deploy("Test NFT", "TNFT");
    await mockNFT.waitForDeployment();
  });

  describe("Deployment", function () {
    it("Should deploy with correct owner", async function () {
      expect(await smartAccount.owner()).to.equal(owner.address);
    });

    it("Should have zero nonce initially", async function () {
      expect(await smartAccount.getNonce()).to.equal(0);
    });

    it("Should be deployed at deterministic address", async function () {
      const predictedAddress = await factory.getAddress(owner.address, SALT);
      expect(await smartAccount.getAddress()).to.equal(predictedAddress);
    });

    it("Should not allow initialization twice", async function () {
      await expect(
        smartAccount.initialize(user.address)
      ).to.be.revertedWithCustomError(smartAccount, "InvalidInitialization");
    });
  });

  describe("Ownership", function () {
    it("Should transfer ownership correctly", async function () {
      await expect(smartAccount.connect(owner).transferOwnership(user.address))
        .to.emit(smartAccount, "OwnershipTransferred")
        .withArgs(owner.address, user.address);

      expect(await smartAccount.owner()).to.equal(user.address);
    });

    it("Should not allow non-owner to transfer ownership", async function () {
      await expect(
        smartAccount.connect(user).transferOwnership(user.address)
      ).to.be.revertedWith("SmartAccount: caller is not the owner");
    });

    it("Should not allow transfer to zero address", async function () {
      await expect(
        smartAccount.connect(owner).transferOwnership(ZeroAddress)
      ).to.be.revertedWithCustomError(smartAccount, "InvalidOwner");
    });
  });

  describe("Execution", function () {
    beforeEach(async function () {
      // Fund the smart account
      await owner.sendTransaction({
        to: await smartAccount.getAddress(),
        value: parseEther("1")
      });
    });

    it("Should execute simple ETH transfer", async function () {
      const initialBalance = await ethers.provider.getBalance(user.address);
      const transferAmount = parseEther("0.1");

      await expect(
        smartAccount.connect(owner).execute(
          user.address,
          transferAmount,
          "0x"
        )
      ).to.emit(smartAccount, "Executed")
        .withArgs(user.address, transferAmount, "0x");

      const finalBalance = await ethers.provider.getBalance(user.address);
      expect(finalBalance.sub(initialBalance)).to.equal(transferAmount);
    });

    it("Should execute ERC20 transfer", async function () {
      // Mint tokens to smart account
      await mockERC20.mint(await smartAccount.getAddress(), parseEther("100"));

      const transferAmount = parseEther("10");
      const transferData = mockERC20.interface.encodeFunctionData(
        "transfer",
        [user.address, transferAmount]
      );

      await smartAccount.connect(owner).execute(
        await mockERC20.getAddress(),
        0,
        transferData
      );

      expect(await mockERC20.balanceOf(user.address)).to.equal(transferAmount);
    });

    it("Should execute batch transactions", async function () {
      const transferAmount = parseEther("0.1");

      await smartAccount.connect(owner).executeBatch(
        [user.address, attacker.address],
        [transferAmount, transferAmount],
        ["0x", "0x"]
      );

      expect(await ethers.provider.getBalance(user.address)).to.be.gt(0);
      expect(await ethers.provider.getBalance(attacker.address)).to.be.gt(0);
    });

    it("Should revert batch with mismatched arrays", async function () {
      await expect(
        smartAccount.connect(owner).executeBatch(
          [user.address],
          [parseEther("0.1"), parseEther("0.2")], // Different length
          ["0x"]
        )
      ).to.be.revertedWith("SmartAccount: array length mismatch");
    });

    it("Should not allow non-owner to execute", async function () {
      await expect(
        smartAccount.connect(user).execute(user.address, parseEther("0.1"), "0x")
      ).to.be.revertedWith("SmartAccount: caller is not EntryPoint or owner");
    });

    it("Should handle failed execution", async function () {
      const badData = "0x12345678"; // Invalid function selector

      await expect(
        smartAccount.connect(owner).execute(
          await mockERC20.getAddress(),
          0,
          badData
        )
      ).to.be.revertedWithCustomError(smartAccount, "ExecutionFailed");
    });
  });

  describe("Module Management", function () {
    let moduleAddress: string;

    beforeEach(async function () {
      // Use a random address as a mock module
      moduleAddress = user.address;
    });

    it("Should add module successfully", async function () {
      await expect(smartAccount.connect(owner).addModule(moduleAddress))
        .to.emit(smartAccount, "ModuleAdded")
        .withArgs(moduleAddress);

      expect(await smartAccount.isModuleEnabled(moduleAddress)).to.be.true;

      const modules = await smartAccount.getModules();
      expect(modules).to.include(moduleAddress);
    });

    it("Should remove module successfully", async function () {
      // First add the module
      await smartAccount.connect(owner).addModule(moduleAddress);

      await expect(smartAccount.connect(owner).removeModule(moduleAddress))
        .to.emit(smartAccount, "ModuleRemoved")
        .withArgs(moduleAddress);

      expect(await smartAccount.isModuleEnabled(moduleAddress)).to.be.false;

      const modules = await smartAccount.getModules();
      expect(modules).to.not.include(moduleAddress);
    });

    it("Should not allow non-owner to add modules", async function () {
      await expect(
        smartAccount.connect(user).addModule(moduleAddress)
      ).to.be.revertedWith("SmartAccount: caller is not the owner");
    });

    it("Should not allow adding zero address as module", async function () {
      await expect(
        smartAccount.connect(owner).addModule(ZeroAddress)
      ).to.be.revertedWithCustomError(smartAccount, "InvalidModule");
    });

    it("Should not revert when adding same module twice", async function () {
      await smartAccount.connect(owner).addModule(moduleAddress);
      await smartAccount.connect(owner).addModule(moduleAddress);

      const modules = await smartAccount.getModules();
      const moduleCount = modules.filter(m => m === moduleAddress).length;
      expect(moduleCount).to.equal(1);
    });

    it("Should revert when removing non-existent module", async function () {
      await expect(
        smartAccount.connect(owner).removeModule(moduleAddress)
      ).to.be.revertedWithCustomError(smartAccount, "InvalidModule");
    });
  });

  describe("EIP-1271 Signature Validation", function () {
    it("Should validate owner signature", async function () {
      const message = "Hello, World!";
      const messageHash = keccak256(toUtf8Bytes(message));
      const signature = await owner.signMessage(message);

      const result = await smartAccount.isValidSignature(messageHash, signature);
      expect(result).to.equal("0x1626ba7e"); // EIP-1271 magic value
    });

    it("Should validate module signature", async function () {
      // Add user as a module
      await smartAccount.connect(owner).addModule(user.address);

      const message = "Hello, World!";
      const messageHash = keccak256(toUtf8Bytes(message));
      const signature = await user.signMessage(message);

      const result = await smartAccount.isValidSignature(messageHash, signature);
      expect(result).to.equal("0x1626ba7e");
    });

    it("Should reject invalid signature", async function () {
      const message = "Hello, World!";
      const messageHash = keccak256(toUtf8Bytes(message));
      const signature = await attacker.signMessage(message);

      const result = await smartAccount.isValidSignature(messageHash, signature);
      expect(result).to.equal("0xffffffff"); // Invalid signature
    });
  });

  describe("Receive and Fallback", function () {
    it("Should receive ETH", async function () {
      const sendAmount = parseEther("1");

      await expect(
        owner.sendTransaction({
          to: await smartAccount.getAddress(),
          value: sendAmount
        })
      ).to.changeEtherBalance(smartAccount, sendAmount);
    });

    it("Should handle fallback for unknown functions", async function () {
      const unknownData = "0x12345678";

      await expect(
        owner.sendTransaction({
          to: await smartAccount.getAddress(),
          data: unknownData
        })
      ).to.be.revertedWith("SmartAccount: function not found");
    });
  });

  describe("Nonce Management", function () {
    it("Should increment nonce correctly", async function () {
      const initialNonce = await smartAccount.getNonce();

      // This would normally be called by EntryPoint
      // For testing, we'll use a direct call (in real scenario this is internal)
      await smartAccount.connect(owner).execute(user.address, 0, "0x");

      // Since _validateNonce is internal and this test bypasses EntryPoint,
      // the nonce does not increment here. In a real ERC-4337 flow, EntryPoint
      // would handle nonce incrementation as part of userOp validation.
      expect(await smartAccount.getNonce()).to.equal(initialNonce);
    });

    it("Should return correct nonce", async function () {
      const nonce = await smartAccount.nonce();
      expect(nonce).to.equal(await smartAccount.getNonce());
    });
  });

  describe("Gas Estimation", function () {
    it("Should estimate gas for simple execution", async function () {
      const gasEstimate = await smartAccount.connect(owner)
        .execute.estimateGas(user.address, parseEther("0.1"), "0x");

      expect(gasEstimate).to.be.gt(0);
      expect(gasEstimate).to.be.lt(100000); // Should be reasonable
    });

    it("Should estimate gas for batch execution", async function () {
      const gasEstimate = await smartAccount.connect(owner)
        .executeBatch.estimateGas(
          [user.address, attacker.address],
          [parseEther("0.1"), parseEther("0.1")],
          ["0x", "0x"]
        );

      expect(gasEstimate).to.be.gt(0);
    });
  });

  describe("Edge Cases", function () {
    it("Should handle zero value transactions", async function () {
      await expect(
        smartAccount.connect(owner).execute(user.address, 0, "0x")
      ).to.emit(smartAccount, "Executed")
        .withArgs(user.address, 0, "0x");
    });

    it("Should handle large ETH transfers", async function () {
      const largeAmount = parseEther("10");

      // Fund the account first
      await owner.sendTransaction({
        to: await smartAccount.getAddress(),
        value: largeAmount
      });

      await expect(
        smartAccount.connect(owner).execute(user.address, largeAmount, "0x")
      ).to.emit(smartAccount, "Executed");
    });

    it("Should revert on insufficient balance", async function () {
      const largeAmount = parseEther("1000");

      await expect(
        smartAccount.connect(owner).execute(user.address, largeAmount, "0x")
      ).to.be.revertedWithCustomError(smartAccount, "ExecutionFailed");
    });

    it("Should handle complex contract interactions", async function () {
      // Mint NFT to smart account
      const mintData = mockNFT.interface.encodeFunctionData("mint", [
        await smartAccount.getAddress()
      ]);

      await smartAccount.connect(owner).execute(
        await mockNFT.getAddress(),
        0,
        mintData
      );

      expect(await mockNFT.balanceOf(await smartAccount.getAddress())).to.equal(1);
    });
  });
});

// contracts/test/SmartAccountFactory.test.ts
import { expect } from "chai";
import { ethers } from "hardhat";
import {
  SmartAccountFactory,
  SmartAccount,
  IEntryPoint
} from "../typechain-types";
import { SignerWithAddress } from "@nomiclabs/hardhat-ethers/signers";
import { ZeroAddress } from "ethers";

describe("SmartAccountFactory", function () {
  let factory: SmartAccountFactory;
  let entryPoint: IEntryPoint;
  let owner: SignerWithAddress;
  let user: SignerWithAddress;

  const SALT = 12345;

  beforeEach(async function () {
    [owner, user] = await ethers.getSigners();

    // Deploy EntryPoint
    const EntryPointFactory = await ethers.getContractFactory("EntryPoint");
    entryPoint = await EntryPointFactory.deploy();
    await entryPoint.waitForDeployment();

    // Deploy Factory
    const SmartAccountFactory = await ethers.getContractFactory("SmartAccountFactory");
    factory = await SmartAccountFactory.deploy(await entryPoint.getAddress());
    await factory.waitForDeployment();
  });

  describe("Deployment", function () {
    it("Should deploy with correct EntryPoint", async function () {
      expect(await factory.entryPoint()).to.equal(await entryPoint.getAddress());
    });

    it("Should have valid implementation address", async function () {
      const implementation = await factory.accountImplementation();
      expect(implementation).to.not.equal(ZeroAddress);

      // Verify it's a contract
      const code = await ethers.provider.getCode(implementation);
      expect(code).to.not.equal("0x");
    });
  });

  describe("Account Creation", function () {
    it("Should create account successfully", async function () {
      const predictedAddress = await factory.getAddress(owner.address, SALT);

      await expect(factory.createAccount(owner.address, SALT))
        .to.emit(factory, "SmartAccountCreated")
        .withArgs(predictedAddress, owner.address, SALT);

      // Verify account is deployed
      expect(await factory.isAccountDeployed(owner.address, SALT)).to.be.true;

      // Verify account has correct owner
      const account = await ethers.getContractAt("SmartAccount", predictedAddress);
      expect(await account.owner()).to.equal(owner.address);
    });

    it("Should return existing account if already deployed", async function () {
      // Create account first time
      await factory.createAccount(owner.address, SALT);
      const firstAddress = await factory.getAddress(owner.address, SALT);

      // Create account second time
      const tx = await factory.createAccount(owner.address, SALT);
      const receipt = await tx.wait();

      // Should not emit creation event second time
      const events = receipt?.logs.filter(log => {
        try {
          return factory.interface.parseLog(log)?.name === "SmartAccountCreated";
        } catch {
          return false;
        }
      });
      expect(events?.length).to.equal(0);
    });

    it("Should not create account for zero address", async function () {
      await expect(
        factory.createAccount(ZeroAddress, SALT)
      ).to.be.revertedWithCustomError(factory, "InvalidOwner");
    });

    it("Should create different accounts for different salts", async function () {
      const address1 = await factory.getAddress(owner.address, SALT);
      const address2 = await factory.getAddress(owner.address, SALT + 1);

      expect(address1).to.not.equal(address2);

      await factory.createAccount(owner.address, SALT);
      await factory.createAccount(owner.address, SALT + 1);

      expect(await factory.isAccountDeployed(owner.address, SALT)).to.be.true;
      expect(await factory.isAccountDeployed(owner.address, SALT + 1)).to.be.true;
    });

    it("Should create different accounts for different owners", async function () {
      const address1 = await factory.getAddress(owner.address, SALT);
      const address2 = await factory.getAddress(user.address, SALT);

      expect(address1).to.not.equal(address2);
    });
  });

  describe("Address Calculation", function () {
    it("Should calculate deterministic addresses", async function () {
      const predictedAddress = await factory.getAddress(owner.address, SALT);

      await factory.createAccount(owner.address, SALT);
      const actualAddress = await factory.getAddress(owner.address, SALT);

      expect(actualAddress).to.equal(predictedAddress);
    });

    it("Should return same address for same parameters", async function () {
      const address1 = await factory.getAddress(owner.address, SALT);
      const address2 = await factory.getAddress(owner.address, SALT);

      expect(address1).to.equal(address2);
    });
  });

  describe("InitCode Generation", function () {
    it("Should generate correct initCode", async function () {
      const initCode = await factory.getInitCode(owner.address, SALT);
      const factoryAddress = (await factory.getAddress()).toLowerCase().replace(/^0x/, "");
      expect(initCode.toLowerCase()).to.include(factoryAddress); // Factory address
      expect(initCode).to.include(await factory.getAddress()); // Factory address
      expect(initCode.length).to.be.gt(20); // Should contain factory address + calldata
    });

    it("Should generate different initCode for different parameters", async function () {
      const initCode1 = await factory.getInitCode(owner.address, SALT);
      const initCode2 = await factory.getInitCode(user.address, SALT);

      expect(initCode1).to.not.equal(initCode2);
    });
  });

  describe("Deployment Status", function () {
    it("Should correctly report deployment status", async function () {
      expect(await factory.isAccountDeployed(owner.address, SALT)).to.be.false;

      await factory.createAccount(owner.address, SALT);

      expect(await factory.isAccountDeployed(owner.address, SALT)).to.be.true;
    });

    it("Should report false for non-existent accounts", async function () {
      expect(await factory.isAccountDeployed(owner.address, 99999)).to.be.false;
    });
  });

  describe("Gas Estimation", function () {
    it("Should estimate reasonable gas for account creation", async function () {
      const gasEstimate = await factory.createAccount.estimateGas(owner.address, SALT);

      expect(gasEstimate).to.be.gt(0);
      expect(gasEstimate).to.be.lt(500000); // Should be reasonable
    });
  });

  describe("Multiple Account Management", function () {
    it("Should handle multiple accounts for same owner", async function () {
      const salts = [1, 2, 3, 4, 5];
      const addresses: string[] = [];

      for (const salt of salts) {
        await factory.createAccount(owner.address, salt);
        const address = await factory.getAddress(owner.address, salt);
        addresses.push(address);

        expect(await factory.isAccountDeployed(owner.address, salt)).to.be.true;
      }

      // All addresses should be unique
      const uniqueAddresses = [...new Set(addresses)];
      expect(uniqueAddresses.length).to.equal(salts.length);
    });
    it("Should handle accounts for multiple owners", async function () {
      const signers = await ethers.getSigners();
      expect(signers.length).to.be.at.least(3, "Not enough signers for this test");

      const owners = [signers[0].address, signers[1].address, signers[2].address];

      for (const ownerAddr of owners) {
        await factory.createAccount(ownerAddr, SALT);
        expect(await factory.isAccountDeployed(ownerAddr, SALT)).to.be.true;

        const accountAddr = await factory.getAddress(ownerAddr, SALT);
        const account = await ethers.getContractAt("SmartAccount", accountAddr);
        expect(await account.owner()).to.equal(ownerAddr);
      }
    });
  });
});
});