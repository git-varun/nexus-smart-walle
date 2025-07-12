// contracts/scripts/setup.ts
import { ethers, network } from "hardhat";
import { readFileSync } from "fs";
import { join } from "path";
import chai from "chai";
import { solidity } from "ethereum-waffle";
import chaiAsPromised from "chai-as-promised";
chai.use(solidity);
chai.use(chaiAsPromised);

async function main() {
  console.log("⚙️ Setting up Smart Wallet ecosystem...");
  console.log("Network:", network.name);

  const [deployer] = await ethers.getSigners();
  console.log("Deployer:", deployer.address);

  try {
    // Load deployment info
    const deploymentPath = join(__dirname, "..", "deployments", `${network.name}-latest.json`);
    const deployment = JSON.parse(readFileSync(deploymentPath, "utf8"));

    // Get contract instances
    const factory = await ethers.getContractAt(
      "SmartAccountFactory",
      deployment.addresses.smartAccountFactory
    );

    const sampleAccount = await ethers.getContractAt(
      "SmartAccount",
      deployment.sampleAccount.address
    );

    console.log("\n📋 Current Status:");
    console.log("Factory address:", await factory.getAddress());
    console.log("Sample account:", deployment.sampleAccount.address);
    console.log("Account owner:", await sampleAccount.owner());
    console.log("Account nonce:", (await sampleAccount.getNonce()).toString());

    // Fund sample account if needed
    const accountBalance = await ethers.provider.getBalance(deployment.sampleAccount.address);
    console.log("Account balance:", ethers.formatEther(accountBalance), "ETH");

    if (accountBalance < ethers.parseEther("0.1")) {
      console.log("\n💰 Funding sample account...");
      const fundTx = await deployer.sendTransaction({
        to: deployment.sampleAccount.address,
        value: ethers.parseEther("1.0") // Send 1 ETH
      });
      await fundTx.wait();

      const newBalance = await ethers.provider.getBalance(deployment.sampleAccount.address);
      console.log("✅ Account funded! New balance:", ethers.formatEther(newBalance), "ETH");
    }

    // Test contracts setup
    if (deployment.addresses.mockERC20) {
      console.log("\n🪙 Setting up test ERC20...");
      const mockERC20 = await ethers.getContractAt("MockERC20", deployment.addresses.mockERC20);

      // Mint tokens to sample account
      const mintTx = await mockERC20.mint(
        deployment.sampleAccount.address,
        ethers.parseEther("1000") // 1000 TEST tokens
      );
      await mintTx.wait();

      const tokenBalance = await mockERC20.balanceOf(deployment.sampleAccount.address);
      console.log("✅ ERC20 tokens minted:", ethers.formatEther(tokenBalance), "TEST");
    }

    if (deployment.addresses.mockNFT) {
      console.log("\n🖼️ Setting up test NFT...");
      const mockNFT = await ethers.getContractAt("MockNFT", deployment.addresses.mockNFT);

      // Mint NFT to sample account
      const mintTx = await mockNFT.mint(deployment.sampleAccount.address);
      await mintTx.wait();

      const nftBalance = await mockNFT.balanceOf(deployment.sampleAccount.address);
      console.log("✅ NFT minted! Balance:", nftBalance.toString());
    }

    // Test basic functionality
    console.log("\n🧪 Testing basic functionality...");

    // Test simple execution
    const testRecipient = "0x742A4A0BfF7C58e3b52F6c51ede22f7B8F4CAb0E"; // Random address
    const testAmount = ethers.parseEther("0.01");

    const executeTx = await sampleAccount.execute(testRecipient, testAmount, "0x");
    await executeTx.wait();

    console.log("✅ Test execution successful!");
    console.log("Sent", ethers.formatEther(testAmount), "ETH to", testRecipient);

    // Final status
    const finalBalance = await ethers.provider.getBalance(deployment.sampleAccount.address);
    const finalNonce = await sampleAccount.getNonce();

    console.log("\n📊 Final Status:");
    console.log("Account balance:", ethers.formatEther(finalBalance), "ETH");
    console.log("Account nonce:", finalNonce.toString());

    console.log("\n🎉 Setup complete! The Smart Wallet is ready for use.");
    console.log("\n📋 Frontend Environment Variables:");
    console.log(`VITE_SMART_ACCOUNT_FACTORY=${deployment.addresses.smartAccountFactory}`);
    console.log(`VITE_ENTRY_POINT=${deployment.addresses.entryPoint}`);
    if (deployment.addresses.mockERC20) {
      console.log(`VITE_MOCK_ERC20=${deployment.addresses.mockERC20}`);
    }
    if (deployment.addresses.mockNFT) {
      console.log(`VITE_MOCK_NFT=${deployment.addresses.mockNFT}`);
    }

  } catch (error) {
    console.error("❌ Setup failed:", error);
    process.exit(1);
  }
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("❌ Setup script failed:", error);
    process.exit(1);
  });