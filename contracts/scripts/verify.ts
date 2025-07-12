// contracts/scripts/verify.ts
import { run, network } from "hardhat";
import { readFileSync } from "fs";
import { join } from "path";

async function main() {
  console.log("🔍 Verifying contracts on", network.name);

  try {
    // Load latest deployment
    const deploymentPath = join(__dirname, "..", "deployments", `${network.name}-latest.json`);
    const deployment = JSON.parse(readFileSync(deploymentPath, "utf8"));

    console.log("📄 Loaded deployment info from:", deploymentPath);

    // Verify EntryPoint (only if we deployed it)
    if (network.name === "localhost" || network.name === "hardhat") {
      console.log("\n🔍 Verifying EntryPoint...");
      try {
        await run("verify:verify", {
          address: deployment.addresses.entryPoint,
          constructorArguments: []
        });
        console.log("✅ EntryPoint verified");
      } catch (error: any) {
        console.log("⚠️ EntryPoint verification failed:", error.message);
      }
    }

    // Verify SmartAccount Implementation
    console.log("\n🔍 Verifying SmartAccount implementation...");
    try {
      await run("verify:verify", {
        address: deployment.addresses.smartAccountImplementation,
        constructorArguments: [deployment.addresses.entryPoint]
      });
      console.log("✅ SmartAccount implementation verified");
    } catch (error: any) {
      console.log("⚠️ SmartAccount verification failed:", error.message);
    }

    // Verify SmartAccountFactory
    console.log("\n🔍 Verifying SmartAccountFactory...");
    try {
      await run("verify:verify", {
        address: deployment.addresses.smartAccountFactory,
        constructorArguments: [deployment.addresses.entryPoint]
      });
      console.log("✅ SmartAccountFactory verified");
    } catch (error: any) {
      console.log("⚠️ SmartAccountFactory verification failed:", error.message);
    }

    // Verify test contracts
    if (deployment.addresses.mockERC20) {
      console.log("\n🔍 Verifying MockERC20...");
      try {
        await run("verify:verify", {
          address: deployment.addresses.mockERC20,
          constructorArguments: [
            "Test Token",
            "TEST",
            "1000000000000000000000000" // 1M tokens in wei
          ]
        });
        console.log("✅ MockERC20 verified");
      } catch (error: any) {
        console.log("⚠️ MockERC20 verification failed:", error.message);
      }
    }

    if (deployment.addresses.mockNFT) {
      console.log("\n🔍 Verifying MockNFT...");
      try {
        await run("verify:verify", {
          address: deployment.addresses.mockNFT,
          constructorArguments: ["Test NFT", "TNFT"]
        });
        console.log("✅ MockNFT verified");
      } catch (error: any) {
        console.log("⚠️ MockNFT verification failed:", error.message);
      }
    }

    console.log("\n🎉 Verification complete!");

  } catch (error) {
    console.error("❌ Verification failed:", error);
    process.exit(1);
  }
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("❌ Verification script failed:", error);
    process.exit(1);
  });