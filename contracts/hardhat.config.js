require("@nomicfoundation/hardhat-toolbox");
require("hardhat-gas-reporter");
require("solidity-coverage");
require("hardhat-contract-sizer");
require("@nomiclabs/hardhat-ethers");
require("dotenv").config();

const config = {
    solidity: {
        version: "0.8.24",
        settings: {
            optimizer: {
                enabled: true,
                runs: 200,
            },
            viaIR: true,
        },
    },
    networks: {

        localhost: {
            url: "http://127.0.0.1:8545",
            chainId: 31337,
        },
        hardhat: {
            chainId: 31337,
            accounts: {
                count: 10,
                accountsBalance: "10000000000000000000000", // 10k ETH
            },
        },
        baseSepolia: {
            url: process.env.BASE_SEPOLIA_RPC_URL || "https://sepolia.base.org",
            accounts: process.env.PRIVATE_KEY ? [process.env.PRIVATE_KEY] : [],
            chainId: 84532,
            gasPrice: 1000000000, // 1 gwei
        },
    },
    etherscan: {
        apiKey: {
            baseSepolia: process.env.ETHERSCAN_API_KEY || "",
        },
        customChains: [
            {
                network: "baseSepolia",
                chainId: 84532,
                urls: {
                    apiURL: "https://api-sepolia.basescan.org/api",
                    browserURL: "https://sepolia.basescan.org/",
                },
            },
        ],
    },
    gasReporter: {
        enabled: process.env.REPORT_GAS !== undefined,
        currency: "USD",
        gasPrice: 1,
        coinmarketcap: process.env.COINMARKETCAP_API_KEY,
    },
    contractSizer: {
        alphaSort: true,
        disambiguatePaths: false,
        runOnCompile: true,
        strict: true,
        only: ["SmartAccount", "VerifyingPaymaster", "SessionKeyModule"]
    },
    mocha: {
        timeout: 60000,
    },
};

module.exports = config;
