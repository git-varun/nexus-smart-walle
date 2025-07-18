// scripts/deploy-sprint3.js
const hre = require("hardhat");
const {readFileSync, writeFileSync} = require("fs");
const {join} = require("path");

const {ethers, network} = hre;

async function main() {
    console.log("🚀 Deploying Sprint 3: Session Key Module");
    console.log("Network:", network.name);

    const [deployer] = await ethers.getSigners();
    console.log("Deployer:", deployer.address);

    // Load previous deployments
    const deploymentPath = join(process.cwd(), "deployments", `${network.name}-latest.json`);
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
    await sessionKeyModule.deployed();

    const sessionKeyModuleAddress = sessionKeyModule.address;
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
    const sprint3Deployment = {
        ...previousDeployment,
        addresses: {
            ...previousDeployment.addresses,
            sessionKeyModule: sessionKeyModuleAddress
        },
        timestamp: new Date().toISOString()
    };

    // Save deployment
    const fileName = `${network.name}-${Date.now()}.json`;
    const filePath = join(process.cwd(), "deployments", fileName);
    writeFileSync(filePath, JSON.stringify(sprint3Deployment, null, 2));

    // Update latest
    const latestPath = join(process.cwd(), "deployments", `${network.name}-latest.json`);
    writeFileSync(latestPath, JSON.stringify(sprint3Deployment, null, 2));

    console.log("✅ Deployment info saved to:", fileName);

    // Summary
    console.log("\n🎉 Sprint 3 Deployment Summary");
    console.log("════════════════════════════════════════");
    console.log("Network:", network.name);
    console.log("SessionKeyModule:", sessionKeyModuleAddress);
    console.log("════════════════════════════════════════");
}

main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error("❌ Sprint 3 deployment failed:", error);
        process.exit(1);
    });
