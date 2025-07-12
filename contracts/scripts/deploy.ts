// contracts/scripts/deploy.ts
import { ethers, network } from "hardhat";
import { writeFileSync, mkdirSync } from "fs";
import { join } from "path";

interface DeploymentAddresses {
  entryPoint: string;
  smartAccountImplementation: string;
  smartAccountFactory: string;
  mockERC20?: string;
  mockNFT?: string;
}

async function main() {
  console.log("🚀 Deploying Smart Wallet contracts...");
  console.log("Network:", network.name);

  const [deployer] = await ethers.getSigners();
  console.log("Deployer:", deployer.address);
  console.log("Balance:", ethers.utils.formatEther(await ethers.provider.getBalance(deployer.address)));

  const addresses: DeploymentAddresses = {
    entryPoint: "",
    smartAccountImplementation: "",
    smartAccountFactory: ""
  };

  // 1. Deploy or use an existing EntryPoint
  console.log("\n📍 Step 1: EntryPoint setup");

  let entryPointAddress = process.env.ENTRYPOINT_ADDRESS||"";

  if (!entryPointAddress || network.name === "localhost" || network.name === "hardhat") {
    console.log("Deploying new EntryPoint...");
    const EntryPointFactory = await ethers.getContractFactory("EntryPoint");
    const entryPoint = await EntryPointFactory.deploy();
    await entryPoint.waitForDeployment();
    entryPointAddress = await entryPoint.getAddress();
    console.log("✅ EntryPoint deployed:", entryPointAddress);
  } else {
    console.log("✅ Using existing EntryPoint:", entryPointAddress);
  }

  addresses.entryPoint = entryPointAddress;

  // 2. Deploy SmartAccountFactory
  console.log("\n📍 Step 2: SmartAccountFactory deployment");

  const SmartAccountFactory = await ethers.getContractFactory("SmartAccountFactory");
  const factory = await SmartAccountFactory.deploy(entryPointAddress);
  await factory.waitForDeployment();

  const factoryAddress = await factory.getAddress();
  const implementationAddress = await factory.accountImplementation();

  console.log("✅ SmartAccountFactory deployed:", factoryAddress);
  console.log("✅ SmartAccount implementation:", implementationAddress);

  addresses.smartAccountFactory = factoryAddress;
  addresses.smartAccountImplementation = implementationAddress;

  // 3. Deploy test contracts (if not mainnet)
  if (network.name !== "mainnet") {
    console.log("\n📍 Step 3: Test contracts deployment");

    // Deploy MockERC20
    const MockERC20Factory = await ethers.getContractFactory("MockERC20");
    const mockERC20 = await MockERC20Factory.deploy(
      "Test Token",
      "TEST",
      ethers.utils.parseEther("1000000") // 1M tokens
    );
    await mockERC20.waitForDeployment();
    addresses.mockERC20 = await mockERC20.getAddress();
    console.log("✅ MockERC20 deployed:", addresses.mockERC20);

    // Deploy MockNFT
    const MockNFTFactory = await ethers.getContractFactory("MockNFT");
    const mockNFT = await MockNFTFactory.deploy("Test NFT", "TNFT");
    await mockNFT.waitForDeployment();
    addresses.mockNFT = await mockNFT.getAddress();
    console.log("✅ MockNFT deployed:", addresses.mockNFT);
  }

  // 4. Create sample account
  console.log("\n📍 Step 4: Sample account creation");

  const sampleSalt = 12345;
  const sampleAccountAddress = await factory.getAddress(deployer.address, sampleSalt);

  console.log("Creating sample account for deployer...");
  const createTx = await factory.createAccount(deployer.address, sampleSalt);
  await createTx.wait();

  console.log("✅ Sample account created:", sampleAccountAddress);

  // 5. Verify deployment
  console.log("\n📍 Step 5: Deployment verification");

  const account = await ethers.getContractAt("SmartAccount", sampleAccountAddress);
  const accountOwner = await account.owner();
  const accountNonce = await account.getNonce();

  console.log("Account owner:", accountOwner);
  console.log("Account nonce:", accountNonce.toString());
  console.log("Is deployed:", await factory.isAccountDeployed(deployer.address, sampleSalt));

  // 6. Save deployment addresses
  console.log("\n📍 Step 6: Saving deployment info");

  const deploymentInfo = {
    network: network.name,
    chainId: network.config.chainId,
    deployer: deployer.address,
    timestamp: new Date().toISOString(),
    addresses,
    sampleAccount: {
      address: sampleAccountAddress,
      owner: deployer.address,
      salt: sampleSalt
    }
  };

  // Create deployments directory
  const deploymentsDir = join(__dirname, "..", "deployments");
  mkdirSync(deploymentsDir, { recursive: true });

  // Save to file
  const fileName = `${network.name}-${Date.now()}.json`;
  const filePath = join(deploymentsDir, fileName);
  writeFileSync(filePath, JSON.stringify(deploymentInfo, null, 2));

  // Save latest deployment
  const latestPath = join(deploymentsDir, `${network.name}-latest.json`);
  writeFileSync(latestPath, JSON.stringify(deploymentInfo, null, 2));

  console.log("✅ Deployment info saved to:", fileName);

  // 7. Summary
  console.log("\n🎉 Deployment Summary");
  console.log("════════════════════════════════════════");
  console.log("Network:", network.name);
  console.log("EntryPoint:", addresses.entryPoint);
  console.log("Factory:", addresses.smartAccountFactory);
  console.log("Implementation:", addresses.smartAccountImplementation);
  console.log("Sample Account:", sampleAccountAddress);

  if (addresses.mockERC20) {
    console.log("MockERC20:", addresses.mockERC20);
  }
  if (addresses.mockNFT) {
    console.log("MockNFT:", addresses.mockNFT);
  }

  console.log("════════════════════════════════════════");

  // 8. Next steps
  console.log("\n📋 Next Steps:");
  console.log("1. Verify contracts on Etherscan: npm run verify:base-sepolia");
  console.log("2. Update frontend .env with contract addresses");
  console.log("3. Fund the sample account with test ETH");
  console.log("4. Test the frontend integration");
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("❌ Deployment failed:", error);
    process.exit(1);
  });
