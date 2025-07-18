// Basic test to verify JavaScript setup
const {expect} = require("chai");
const hre = require("hardhat");

const {ethers} = hre;

describe("Basic JavaScript Setup", function () {
    it("Should work with JavaScript", async function () {
        const [owner] = await ethers.getSigners();
        expect(owner.address).to.not.be.undefined;
    });

    it("Should compile contracts", async function () {
        const SmartAccountFactory = await ethers.getContractFactory("SmartAccountFactory");
        expect(SmartAccountFactory).to.not.be.undefined;
    });

    it("Should deploy SmartAccount", async function () {
        // Mock entry point address for testing
        const mockEntryPoint = "0x0000000000000000000000000000000000000001";

        const SmartAccountFactory = await ethers.getContractFactory("SmartAccountFactory");
        const factory = await SmartAccountFactory.deploy(mockEntryPoint);
        await factory.deployed();

        expect(factory.address).to.not.be.undefined;
    });
});
