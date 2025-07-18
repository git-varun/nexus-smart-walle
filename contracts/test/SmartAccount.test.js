// contracts/test/SmartAccount.test.js
const {expect} = require("chai");
const hre = require("hardhat");

const {ethers} = hre;
const {parseEther, keccak256, toUtf8Bytes} = ethers.utils;

describe("SmartAccount", function () {
    let smartAccount;
    let factory;
    let mockERC20;
    let mockNFT;

    let owner;
    let user;
    let attacker;

    const SALT = 12345;
    const MOCK_ENTRYPOINT = "0x0000000000000000000000000000000000000001";

    beforeEach(async function () {
        [owner, user, attacker] = await ethers.getSigners();

        // Deploy SmartAccountFactory with mock EntryPoint
        const SmartAccountFactory = await ethers.getContractFactory("SmartAccountFactory");
        factory = await SmartAccountFactory.deploy(MOCK_ENTRYPOINT);
        await factory.deployed();

        // Deploy test contracts
        const MockERC20Factory = await ethers.getContractFactory("MockERC20");
        mockERC20 = await MockERC20Factory.deploy("Test Token", "TEST", parseEther("1000000"));
        await mockERC20.deployed();

        const MockNFTFactory = await ethers.getContractFactory("MockNFT");
        mockNFT = await MockNFTFactory.deploy("Test NFT", "TNFT");
        await mockNFT.deployed();

        // Create SmartAccount
        await factory.createAccount(owner.address, SALT);
        const accountAddress = await factory.getAddress(owner.address, SALT);
        smartAccount = await ethers.getContractAt("SmartAccount", accountAddress);

        // Fund the account
        await owner.sendTransaction({
            to: accountAddress,
            value: parseEther("1")
        });
    });

    describe("Deployment", function () {
        it("Should set the right owner", async function () {
            expect(await smartAccount.owner()).to.equal(owner.address);
        });

        it("Should set the right EntryPoint", async function () {
            expect(await smartAccount.entryPoint()).to.equal(MOCK_ENTRYPOINT);
        });

        it("Should start with nonce 0", async function () {
            expect(await smartAccount.getNonce()).to.equal(0);
        });

        it("Should be initialized", async function () {
            expect(await smartAccount.isInitialized()).to.be.true;
        });
    });

    describe("Ownership", function () {
        it("Should allow owner to transfer ownership", async function () {
            await smartAccount.connect(owner).transferOwnership(user.address);
            expect(await smartAccount.owner()).to.equal(user.address);
        });

        it("Should not allow non-owner to transfer ownership", async function () {
            await expect(
                smartAccount.connect(attacker).transferOwnership(attacker.address)
            ).to.be.revertedWith("Ownable: caller is not the owner");
        });
    });

    describe("Execution", function () {
        it("Should execute single transaction", async function () {
            const initialBalance = await mockERC20.balanceOf(user.address);
            const transferAmount = parseEther("100");

            // First transfer tokens to the smart account
            await mockERC20.transfer(smartAccount.address, transferAmount);

            // Prepare transaction data
            const transferData = mockERC20.interface.encodeFunctionData("transfer", [
                user.address,
                transferAmount
            ]);

            // Execute transaction
            await smartAccount.connect(owner).execute(
                mockERC20.address,
                0,
                transferData
            );

            expect(await mockERC20.balanceOf(user.address)).to.equal(
                initialBalance.add(transferAmount)
            );
        });

        it("Should execute batch transactions", async function () {
            const transferAmount = parseEther("100");

            // Transfer tokens to smart account
            await mockERC20.transfer(smartAccount.address, transferAmount.mul(2));

            // Prepare batch transaction data
            const targets = [mockERC20.address, mockERC20.address];
            const values = [0, 0];
            const datas = [
                mockERC20.interface.encodeFunctionData("transfer", [user.address, transferAmount]),
                mockERC20.interface.encodeFunctionData("transfer", [attacker.address, transferAmount])
            ];

            // Execute batch transaction
            await smartAccount.connect(owner).executeBatch(targets, values, datas);

            expect(await mockERC20.balanceOf(user.address)).to.equal(transferAmount);
            expect(await mockERC20.balanceOf(attacker.address)).to.equal(transferAmount);
        });

        it("Should not allow non-owner to execute transactions", async function () {
            const transferData = mockERC20.interface.encodeFunctionData("transfer", [
                user.address,
                parseEther("100")
            ]);

            await expect(
                smartAccount.connect(attacker).execute(
                    mockERC20.address,
                    0,
                    transferData
                )
            ).to.be.revertedWith("Ownable: caller is not the owner");
        });
    });

    describe("Signature Validation", function () {
        it("Should validate owner signature", async function () {
            const message = "Test message";
            const messageHash = keccak256(toUtf8Bytes(message));
            const signature = await owner.signMessage(message);

            const isValid = await smartAccount.isValidSignature(messageHash, signature);
            expect(isValid).to.equal("0x1626ba7e"); // EIP-1271 magic value
        });

        it("Should reject invalid signature", async function () {
            const message = "Test message";
            const messageHash = keccak256(toUtf8Bytes(message));
            const signature = await attacker.signMessage(message);

            const isValid = await smartAccount.isValidSignature(messageHash, signature);
            expect(isValid).to.equal("0xffffffff"); // Invalid signature
        });
    });

    describe("Receive Ether", function () {
        it("Should receive ether", async function () {
            const initialBalance = await ethers.provider.getBalance(smartAccount.address);
            const sendAmount = parseEther("0.5");

            await owner.sendTransaction({
                to: smartAccount.address,
                value: sendAmount
            });

            const finalBalance = await ethers.provider.getBalance(smartAccount.address);
            expect(finalBalance).to.equal(initialBalance.add(sendAmount));
        });
    });

    describe("Nonce Management", function () {
        it("Should increment nonce after execution", async function () {
            const initialNonce = await smartAccount.getNonce();

            await smartAccount.connect(owner).execute(
                user.address,
                parseEther("0.1"),
                "0x"
            );

            const finalNonce = await smartAccount.getNonce();
            expect(finalNonce).to.equal(initialNonce.add(1));
        });
    });
});
