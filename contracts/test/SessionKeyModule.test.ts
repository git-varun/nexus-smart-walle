// contracts/test/SessionKeyModule.test.ts
import { expect } from "chai";
import { ethers } from "hardhat";
import {
  SessionKeyModule,
  SmartAccount,
  SmartAccountFactory,
  IEntryPoint
} from "../typechain-types";
import { SignerWithAddress } from "@nomiclabs/hardhat-ethers/signers";
import { parseEther, ZeroAddress } from "ethers";

describe("SessionKeyModule", function () {
  let sessionKeyModule: SessionKeyModule;
  let smartAccount: SmartAccount;
  let factory: SmartAccountFactory;
  let entryPoint: IEntryPoint;

  let owner: SignerWithAddress;
  let sessionSigner: SignerWithAddress;
  let target: SignerWithAddress;
  let unauthorized: SignerWithAddress;

  const SALT = 12345;

  beforeEach(async function () {
    [owner, sessionSigner, target, unauthorized] = await ethers.getSigners();

    // Deploy EntryPoint
    const EntryPointFactory = await ethers.getContractFactory("EntryPoint");
    entryPoint = await EntryPointFactory.deploy();
    await entryPoint.waitForDeployment();

    // Deploy SessionKeyModule
    const SessionKeyModuleFactory = await ethers.getContractFactory("SessionKeyModule");
    sessionKeyModule = await SessionKeyModuleFactory.deploy();
    await sessionKeyModule.waitForDeployment();

    // Deploy SmartAccountFactory
    const SmartAccountFactory = await ethers.getContractFactory("SmartAccountFactory");
    factory = await SmartAccountFactory.deploy(await entryPoint.getAddress());
    await factory.waitForDeployment();

    // Create SmartAccount
    await factory.createAccount(owner.address, SALT);
    const accountAddress = await factory.getAddress(owner.address, SALT);
    smartAccount = await ethers.getContractAt("SmartAccount", accountAddress);

    // Initialize module for the account
    await sessionKeyModule.init(await smartAccount.getAddress(), "0x");
  });

  describe("Module Initialization", function () {
    it("Should initialize module correctly", async function () {
      expect(await sessionKeyModule.isInitialized(await smartAccount.getAddress())).to.be.true;
      expect(await sessionKeyModule.name()).to.equal("SessionKeyModule");
      expect(await sessionKeyModule.version()).to.equal("1.0.0");
    });

    it("Should not allow initialization with zero address", async function () {
      await expect(
        sessionKeyModule.init(ZeroAddress, "0x")
      ).to.be.revertedWith("SessionKeyModule: invalid account");
    });

    it("Should deinitialize correctly", async function () {
      await sessionKeyModule.deinit(await smartAccount.getAddress());
      expect(await sessionKeyModule.isInitialized(await smartAccount.getAddress())).to.be.false;
    });
  });

  describe("Session Key Management", function () {
    const spendingLimit = parseEther("0.1");
    const dailyLimit = parseEther("1");
    const duration = 24 * 3600; // 24 hours

    let expiryTime: number;

    beforeEach(function () {
      expiryTime = Math.floor(Date.now() / 1000) + duration;
    });

    it("Should add session key successfully", async function () {
      await expect(
        sessionKeyModule.addSessionKey(
          await smartAccount.getAddress(),
          sessionSigner.address,
          spendingLimit,
          dailyLimit,
          expiryTime,
          [target.address]
        )
      ).to.emit(sessionKeyModule, "SessionKeyAdded")
        .withArgs(
          await smartAccount.getAddress(),
          sessionSigner.address,
          spendingLimit,
          dailyLimit,
          expiryTime
        );

      const sessionKey = await sessionKeyModule.getSessionKey(
        await smartAccount.getAddress(),
        sessionSigner.address
      );

      expect(sessionKey.key).to.equal(sessionSigner.address);
      expect(sessionKey.spendingLimit).to.equal(spendingLimit);
      expect(sessionKey.dailyLimit).to.equal(dailyLimit);
      expect(sessionKey.expiryTime).to.equal(expiryTime);
      expect(sessionKey.isActive).to.be.true;
    });

    it("Should not allow invalid session key parameters", async function () {
      // Invalid session key address
      await expect(
        sessionKeyModule.addSessionKey(
          await smartAccount.getAddress(),
          ZeroAddress,
          spendingLimit,
          dailyLimit,
          expiryTime,
          []
        )
      ).to.be.revertedWith("SessionKeyModule: invalid session key");

      // Daily limit less than spending limit
      await expect(
        sessionKeyModule.addSessionKey(
          await smartAccount.getAddress(),
          sessionSigner.address,
          parseEther("1"),
          parseEther("0.5"), // Less than spending limit
          expiryTime,
          []
        )
      ).to.be.revertedWith("SessionKeyModule: daily limit too low");

      // Expired time
      await expect(
        sessionKeyModule.addSessionKey(
          await smartAccount.getAddress(),
          sessionSigner.address,
          spendingLimit,
          dailyLimit,
          Math.floor(Date.now() / 1000) - 3600, // Past time
          []
        )
      ).to.be.revertedWith("SessionKeyModule: invalid expiry time");
    });

    it("Should revoke session key", async function () {
      // Add session key first
      await sessionKeyModule.addSessionKey(
        await smartAccount.getAddress(),
        sessionSigner.address,
        spendingLimit,
        dailyLimit,
        expiryTime,
        []
      );
    });

    it("Should update session key limits", async function () {
      const newSpendingLimit = parseEther("0.2");
      const newDailyLimit = parseEther("2");

      await expect(
        sessionKeyModule.updateSessionKeyLimits(
          await smartAccount.getAddress(),
          sessionSigner.address,
          newSpendingLimit,
          newDailyLimit
        )
      ).to.emit(sessionKeyModule, "SessionKeyLimitsUpdated");

      const sessionKey = await sessionKeyModule.getSessionKey(
        await smartAccount.getAddress(),
        sessionSigner.address
      );

      expect(sessionKey.spendingLimit).to.equal(newSpendingLimit);
      expect(sessionKey.dailyLimit).to.equal(newDailyLimit);
    });

    it("Should extend session key expiry", async function () {
      const newExpiryTime = expiryTime + 3600; // Add 1 hour

      await expect(
        sessionKeyModule.extendSessionKey(
          await smartAccount.getAddress(),
          sessionSigner.address,
          newExpiryTime
        )
      ).to.emit(sessionKeyModule, "SessionKeyExtended");

      const sessionKey = await sessionKeyModule.getSessionKey(
        await smartAccount.getAddress(),
        sessionSigner.address
      );

      expect(sessionKey.expiryTime).to.equal(newExpiryTime);
    });

    it("Should get session key usage statistics", async function () {
      const [usedToday, remainingDaily, remainingPerTx, timeUntilExpiry] =
        await sessionKeyModule.getSessionKeyUsage(
          await smartAccount.getAddress(),
          sessionSigner.address
        );

      expect(usedToday).to.equal(0);
      expect(remainingDaily).to.equal(dailyLimit);
      expect(remainingPerTx).to.equal(spendingLimit);
      expect(timeUntilExpiry).to.be.gt(0);
    });

    it("Should emergency revoke all session keys", async function () {
      // Add another session key
      await sessionKeyModule.addSessionKey(
        await smartAccount.getAddress(),
        target.address,
        spendingLimit,
        dailyLimit,
        expiryTime,
        []
      );

      await expect(
        sessionKeyModule.emergencyRevokeAll(await smartAccount.getAddress())
      ).to.emit(sessionKeyModule, "EmergencyRevokeAll")
        .withArgs(await smartAccount.getAddress(), 2);

      const activeKeys = await sessionKeyModule.getActiveSessionKeys(
        await smartAccount.getAddress()
      );
      expect(activeKeys.length).to.equal(0);
    });
  });

  describe("Interface Support", function () {
    it("Should support required interfaces", async function () {
      // Check IModule interface
      expect(
        await sessionKeyModule.supportsInterface("0x945b8148") // IModule
      ).to.be.true;

      // Check ISessionKeyModule interface
      expect(
        await sessionKeyModule.supportsInterface("0x12345678") // Mock interface ID
      ).to.be.false;
    });
  });
});