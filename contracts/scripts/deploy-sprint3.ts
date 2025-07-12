// scripts/deploy-sprint3.ts
import { ethers, network } from "hardhat";
import { writeFileSync, readFileSync } from "fs";
import { join } from "path";

async function main() {
  console.log("🚀 Deploying Sprint 3: Session Key Module");
  console.log("Network:", network.name);

  const [deployer] = await ethers.getSigners();
  console.log("Deployer:", deployer.address);

  // Load previous deployments
  const deploymentPath = join(__dirname, "..", "deployments", `${network.name}-latest.json`);
  let previousDeployment;

  try {
    previousDeployment = JSON.parse(readFileSync(deploymentPath, "utf8"));
    console.log("✅ Loaded previous deployments");
  } catch (error) {
    console.error("❌ Could not load previous deployments. Please run previous sprints first.");
    process.exit(1);
  }

  // Deploy SessionKeyModule
  console.log("\n📍 Deploying SessionKeyModule...");

  const SessionKeyModuleFactory = await ethers.getContractFactory("SessionKeyModule");
  const sessionKeyModule = await SessionKeyModuleFactory.deploy();
  await sessionKeyModule.waitForDeployment();

  const sessionKeyModuleAddress = await sessionKeyModule.getAddress();
  console.log("✅ SessionKeyModule deployed:", sessionKeyModuleAddress);

  // Test module functionality
  console.log("\n📍 Testing module functionality...");

  // Get sample smart account
  const sampleAccountAddress = previousDeployment.sampleAccount?.address;
  if (sampleAccountAddress) {
    // Initialize module for sample account
    await sessionKeyModule.init(sampleAccountAddress, "0x");
    console.log("✅ Module initialized for sample account");

    // Check initialization
    const isInitialized = await sessionKeyModule.isInitialized(sampleAccountAddress);
    console.log("✅ Module initialization verified:", isInitialized);
  }

  // Update deployment info
  const updatedDeployment = {
    ...previousDeployment,
    sprint3: {
      network: network.name,
      chainId: network.config.chainId,
      deployer: deployer.address,
      timestamp: new Date().toISOString(),
      addresses: {
        sessionKeyModule: sessionKeyModuleAddress
      },
      moduleInfo: {
        name: await sessionKeyModule.name(),
        version: await sessionKeyModule.version(),
        maxSessionKeysPerAccount: 10,
        maxTargetsPerSession: 5,
        maxSessionDuration: 30 * 24 * 3600 // 30 days
      }
    }
  };

  // Save updated deployment
  writeFileSync(deploymentPath, JSON.stringify(updatedDeployment, null, 2));
  console.log("✅ Deployment info updated");

  console.log("\n🎉 Sprint 3 Deployment Summary");
  console.log("════════════════════════════════════════");
  console.log("SessionKeyModule:", sessionKeyModuleAddress);
  console.log("Module Name:", await sessionKeyModule.name());
  console.log("Module Version:", await sessionKeyModule.version());
  console.log("Ready for frontend integration!");
  console.log("════════════════════════════════════════");

  console.log("\n📋 Next Steps:");
  console.log("1. Update frontend VITE_SESSION_KEY_MODULE environment variable");
  console.log("2. Start frontend development server: npm run dev:frontend");
  console.log("3. Test session key creation and management");
  console.log("4. Integrate with real smart account contracts");
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("❌ Sprint 3 deployment failed:", error);
    process.exit(1);
  });


getAddress(),
  sessionSigner.address,
  spendingLimit,
  dailyLimit,
  expiryTime,
  []
      );

// Revoke it
await expect(
  sessionKeyModule.revokeSessionKey(
    await smartAccount.getAddress(),
    sessionSigner.address
  )
).to.emit(sessionKeyModule, "SessionKeyRevoked")
  .withArgs(await smartAccount.getAddress(), sessionSigner.address);

const sessionKey = await sessionKeyModule.getSessionKey(
  await smartAccount.getAddress(),
  sessionSigner.address
);
expect(sessionKey.isActive).to.be.false;
    });

it("Should get active session keys", async function () {
  // Add multiple session keys
  await sessionKeyModule.addSessionKey(
    await smartAccount.getAddress(),
    sessionSigner.address,
    spendingLimit,
    dailyLimit,
    expiryTime,
    []
  );

  await sessionKeyModule.addSessionKey(
    await smartAccount.getAddress(),
    target.address,
    spendingLimit,
    dailyLimit,
    expiryTime,
    []
  );

  const activeKeys = await sessionKeyModule.getActiveSessionKeys(
    await smartAccount.getAddress()
  );
  expect(activeKeys.length).to.equal(2);
  expect(activeKeys).to.include(sessionSigner.address);
  expect(activeKeys).to.include(target.address);
});
  });

describe("Session Key Validation", function () {
  const spendingLimit = parseEther("0.1");
  const dailyLimit = parseEther("1");
  const transferAmount = parseEther("0.05");

  let expiryTime: number;

  beforeEach(async function () {
    expiryTime = Math.floor(Date.now() / 1000) + 3600; // 1 hour

    await sessionKeyModule.addSessionKey(
      await smartAccount.getAddress(),
      sessionSigner.address,
      spendingLimit,
      dailyLimit,
      expiryTime,
      [target.address]
    );
  });

  it("Should validate correct session key operation", async function () {
    expect(
      await sessionKeyModule.validateSessionKey(
        await smartAccount.getAddress(),
        sessionSigner.address,
        target.address,
        transferAmount
      )
    ).to.be.true;
  });

  it("Should reject operations with non-existent session key", async function () {
    await expect(
      sessionKeyModule.validateSessionKey(
        await smartAccount.getAddress(),
        unauthorized.address,
        target.address,
        transferAmount
      )
    ).to.be.revertedWithCustomError(sessionKeyModule, "SessionKeyNotFound");
  });

  it("Should reject operations exceeding spending limit", async function () {
    await expect(
      sessionKeyModule.validateSessionKey(
        await smartAccount.getAddress(),
        sessionSigner.address,
        target.address,
        parseEther("0.2") // Exceeds spending limit
      )
    ).to.be.revertedWithCustomError(sessionKeyModule, "SpendingLimitExceeded");
  });

  it("Should reject operations exceeding daily limit", async function () {
    // Use most of daily limit
    await sessionKeyModule.validateSessionKey(
      await smartAccount.getAddress(),
      sessionSigner.address,
      target.address,
      parseEther("0.9")
    );

    // This should exceed daily limit
    await expect(
      sessionKeyModule.validateSessionKey(
        await smartAccount.getAddress(),
        sessionSigner.address,
        target.address,
        parseEther("0.2")
      )
    ).to.be.revertedWithCustomError(sessionKeyModule, "DailyLimitExceeded");
  });

  it("Should reject operations to disallowed targets", async function () {
    await expect(
      sessionKeyModule.validateSessionKey(
        await smartAccount.getAddress(),
        sessionSigner.address,
        unauthorized.address, // Not in allowed targets
        transferAmount
      )
    ).to.be.revertedWithCustomError(sessionKeyModule, "TargetNotAllowed");
  });

  it("Should check session key validity without executing", async function () {
    const [isValid, reason] = await sessionKeyModule.checkSessionKeyValidity(
      await smartAccount.getAddress(),
      sessionSigner.address,
      target.address,
      transferAmount
    );

    expect(isValid).to.be.true;
    expect(reason).to.equal("");
  });

  it("Should return correct invalidity reason", async function () {
    const [isValid, reason] = await sessionKeyModule.checkSessionKeyValidity(
      await smartAccount.getAddress(),
      sessionSigner.address,
      target.address,
      parseEther("0.2") // Exceeds limit
    );

    expect(isValid).to.be.false;
    expect(reason).to.equal("Exceeds spending limit");
  });
});

describe("Session Key Management Operations", function () {
  const spendingLimit = parseEther("0.1");
  const dailyLimit = parseEther("1");

  let expiryTime: number;

  beforeEach(async function () {
    expiryTime = Math.floor(Date.now() / 1000) + 3600;

    await sessionKeyModule.addSessionKey(
      await smartAccount.