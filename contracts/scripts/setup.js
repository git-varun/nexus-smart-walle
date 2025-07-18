// contracts/scripts/setup.js
const hre = require("hardhat");
const {readFileSync} = require("fs");
const {join} = require("path");

const {network, ethers} = hre;

async function main() {
    console.log("⚙️ Setting up Smart Wallet ecosystem...");
    console.log("Network:", network.name);

    const [deployer] = await hre.ethers.getSigners();
    console.log("Deployer:", deployer.address);

    // Load deployment info
    const deploymentPath = join(process.cwd(), "deployments", `${network.name}-latest.json`);
    let deployment;

    try {
        deployment = JSON.parse(readFileSync(deploymentPath, "utf8"));
        console.log("✅ Loaded deployment info");
    } catch (error) {
        console.error("❌ Could not load deployment info. Please run deployment first.");
        process.exit(1);
    }

    // Setup contracts
    console.log("\n📍 Setting up contracts...");

    // Get contract instances
    const factory = await hre.ethers.getContractAt("SmartAccountFactory", deployment.addresses.smartAccountFactory);

    // Check if we can connect to EntryPoint (skip if mock)
    if (deployment.addresses.entryPoint !== "0x0000000000000000000000000000000000000001") {
        console.log("\n📍 Checking EntryPoint balance...");
        const entryPointBalance = await hre.ethers.provider.getBalance(deployment.addresses.entryPoint);
        console.log("EntryPoint balance:", hre.ethers.utils.formatEther(entryPointBalance));

        if (entryPointBalance < hre.ethers.utils.parseEther("0.1")) {
            console.log("💰 Funding EntryPoint...");
            const fundTx = await deployer.sendTransaction({
                to: deployment.addresses.entryPoint,
                value: hre.ethers.utils.parseEther("0.1")
            });
            await fundTx.wait();
            console.log("✅ EntryPoint funded");
        }
    } else {
        console.log("✅ Using mock EntryPoint, skipping funding");
    }

    // Create additional test accounts
    console.log("\n📍 Creating additional test accounts...");

    const testAccountSalts = [67890, 11111, 22222];
    const testAccounts = [];

    for (const salt of testAccountSalts) {
        const accountAddress = await factory.getAddress(deployer.address, salt);

        // Check if account exists
        const isDeployed = await factory.isAccountDeployed(deployer.address, salt);

        if (!isDeployed) {
            console.log(`Creating account with salt ${salt}...`);
            const createTx = await factory.createAccount(deployer.address, salt);
            await createTx.wait();
            console.log(`✅ Account created: ${accountAddress}`);
        } else {
            console.log(`✅ Account already exists: ${accountAddress}`);
        }

        testAccounts.push({
            address: accountAddress,
            salt: salt,
            owner: deployer.address
        });
    }

    // Fund test accounts
    console.log("\n📍 Funding test accounts...");

    for (const account of testAccounts) {
        const balance = await hre.ethers.provider.getBalance(account.address);

        if (balance < hre.ethers.utils.parseEther("0.01")) {
            console.log(`Funding account ${account.address}...`);
            const fundTx = await deployer.sendTransaction({
                to: account.address,
                value: hre.ethers.utils.parseEther("0.01")
            });
            await fundTx.wait();
            console.log(`✅ Account funded: ${account.address}`);
        } else {
            console.log(`✅ Account already funded: ${account.address}`);
        }
    }

    // Test mock contracts (if available)
    if (deployment.addresses.mockERC20) {
        console.log("\n📍 Testing mock ERC20...");

        const mockERC20 = await hre.ethers.getContractAt("MockERC20", deployment.addresses.mockERC20);

        // Transfer tokens to test accounts
        for (const account of testAccounts.slice(0, 2)) { // Only first 2 accounts
            const balance = await mockERC20.balanceOf(account.address);

            if (balance.eq(0)) {
                console.log(`Transferring tokens to ${account.address}...`);
                const transferTx = await mockERC20.transfer(account.address, hre.ethers.utils.parseEther("1000"));
                await transferTx.wait();
                console.log(`✅ Tokens transferred to ${account.address}`);
            } else {
                console.log(`✅ Account already has tokens: ${account.address}`);
            }
        }
    }

    // Summary
    console.log("\n🎉 Setup Summary");
    console.log("════════════════════════════════════════");
    console.log("Network:", network.name);
    console.log("EntryPoint:", deployment.addresses.entryPoint);
    console.log("Factory:", deployment.addresses.smartAccountFactory);
    console.log("Test Accounts Created:", testAccounts.length);

    testAccounts.forEach((account, index) => {
        console.log(`  ${index + 1}. ${account.address} (salt: ${account.salt})`);
    });

    console.log("════════════════════════════════════════");
    console.log("\n✅ Smart Wallet ecosystem setup complete!");
}

main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error("❌ Setup failed:", error);
        process.exit(1);
    });
