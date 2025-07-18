// contracts/scripts/deploy.js
const {mkdirSync, writeFileSync} = require("fs");
const {join} = require("path");
const hre = require("hardhat");

const {ethers, network} = hre;

async function main() {
    console.log("🚀 Deploying Smart Wallet contracts…");
    console.log("Network:", network.name);

    const [deployer] = await hre.ethers.getSigners();
    console.log("Deployer:", deployer.address);
    console.log("Balance:", ethers.utils.formatEther(await ethers.provider.getBalance(deployer.address)));

    const addresses = {
        entryPoint: "",
        smartAccountImplementation: "",
        smartAccountFactory: "",
        mockERC20: null,
        mockNFT: null
    };

    // 1. Deploy or use an existing EntryPoint
    console.log("\n📍 Step 1: EntryPoint setup");

    let entryPointAddress = process.env.ENTRYPOINT_ADDRESS || "";

    if (!entryPointAddress || network.name === "localhost" || network.name === "hardhat") {
        console.log("Using mock EntryPoint for testing...");
        // Use a mock address for testing since we don't have EntryPoint contract
        entryPointAddress = "0x0000000000000000000000000000000000000001";
        console.log("✅ Mock EntryPoint address:", entryPointAddress);
    } else {
        console.log("✅ Using existing EntryPoint:", entryPointAddress);
    }

    addresses.entryPoint = entryPointAddress;

    // 2. Deploy SmartAccountFactory
    console.log("\n📍 Step 2: SmartAccountFactory deployment");

    const SmartAccountFactory = await hre.ethers.getContractFactory("SmartAccountFactory");
    const factory = await SmartAccountFactory.deploy(entryPointAddress);
    await factory.deployed();

    const factoryAddress = factory.address;
    const implementationAddress = await factory.accountImplementation();

    console.log("✅ SmartAccountFactory deployed:", factoryAddress);
    console.log("✅ SmartAccount implementation:", implementationAddress);

    addresses.smartAccountFactory = factoryAddress;
    addresses.smartAccountImplementation = implementationAddress;

    // 3. Deploy test contracts (if not mainnet)
    if (network.name !== "mainnet") {
        console.log("\n📍 Step 3: Test contracts deployment");

        // Deploy MockERC20
        const MockERC20Factory = await hre.ethers.getContractFactory("MockERC20");
        const mockERC20 = await MockERC20Factory.deploy(
            "Test Token",
            "TEST",
            hre.ethers.utils.parseEther("1000000") // 1M tokens
        );
        await mockERC20.deployed();
        addresses.mockERC20 = mockERC20.address;
        console.log("✅ MockERC20 deployed:", addresses.mockERC20);

        // Deploy MockNFT
        const MockNFTFactory = await hre.ethers.getContractFactory("MockNFT");
        const mockNFT = await MockNFTFactory.deploy("Test NFT", "TNFT");
        await mockNFT.deployed();
        addresses.mockNFT = mockNFT.address;
        console.log("✅ MockNFT deployed:", addresses.mockNFT);
    }

    // 4. Create a sample account
    console.log("\n📍 Step 4: Sample account creation");

    const sampleSalt = 12345;
    const sampleAccountAddress = await factory.getAddress(deployer.address, sampleSalt);

    console.log("Creating a sample account for a deployer…");
    const createTx = await factory.createAccount(deployer.address, sampleSalt);
    await createTx.wait();

    console.log("✅ Sample account created:", sampleAccountAddress);

    // 5. Verify deployment
    console.log("\n📍 Step 5: Deployment verification");

    const account = await hre.ethers.getContractAt("SmartAccount", sampleAccountAddress);
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
    const deploymentsDir = join(process.cwd(), "deployments");
    mkdirSync(deploymentsDir, {recursive: true});

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
