// contracts/contracts/paymaster/VerifyingPaymaster.sol
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "@account-abstraction/contracts/core/BasePaymaster.sol";
import "@account-abstraction/contracts/interfaces/PackedUserOperation.sol";
import "@openzeppelin/contracts/utils/cryptography/ECDSA.sol";
import "@openzeppelin/contracts/utils/cryptography/MessageHashUtils.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "../interfaces/IPaymaster.sol";

/**
 * @title VerifyingPaymaster
 * @dev Paymaster that verifies signatures before sponsoring gas
 * @author Smart Wallet Team
 */
contract VerifyingPaymaster is Ownable, BasePaymaster, IVerifyingPaymaster {
    using ECDSA for bytes32;
    using MessageHashUtils for bytes32;

    // Storage
    address private _verifyingSigner;
    mapping(address => uint256) private _deposits;
    mapping(bytes32 => bool) private _usedHashes;

    // Constants
    uint256 public constant VALID_TIMESTAMP_OFFSET = 20;
    uint256 public constant SIGNATURE_OFFSET = 84;

    // Events
    event SignerChanged(address indexed previousSigner, address indexed newSigner);
    event DepositAdded(address indexed account, uint256 amount);
    event DepositWithdrawn(address indexed account, uint256 amount);
    event UserOperationSponsored(address indexed sender, bytes32 userOpHash, uint256 actualGasCost);

    /**
     * @dev Constructor
     * @param _entryPoint EntryPoint contract address
     * @param _owner Owner of the paymaster
     * @param _initialSigner Initial verifying signer
     */
    constructor(
        IEntryPoint _entryPoint,
        address _owner,
        address _initialSigner
    ) BasePaymaster(_entryPoint) Ownable(_owner) {
        if (_initialSigner == address(0)) revert InvalidSigner();
        _verifyingSigner = _initialSigner;
        emit SignerChanged(address(0), _initialSigner);
    }

    /**
     * @dev Set the verifying signer address
     * @param newSigner New signer address
     */
    function setVerifyingSigner(address newSigner) external override onlyOwner {
        if (newSigner == address(0)) revert InvalidSigner();
        address oldSigner = _verifyingSigner;
        _verifyingSigner = newSigner;
        emit SignerChanged(oldSigner, newSigner);
    }

    /**
     * @dev Add deposit for gas sponsorship
     * @param account Account to add deposit for
     */
    function addDepositFor(address account) external payable override {
        if (account == address(0)) revert InvalidSigner();
        _deposits[account] += msg.value;
        emit DepositAdded(account, msg.value);
    }

    /**
     * @dev Withdraw deposit
     * @param account Account to withdraw from
     * @param amount Amount to withdraw
     */
    function withdrawDepositTo(address account, uint256 amount) external override onlyOwner {
        if (_deposits[account] < amount) revert InsufficientDeposit();

        _deposits[account] -= amount;
        payable(account).transfer(amount);

        emit DepositWithdrawn(account, amount);
    }

    /**
     * @dev Get deposit amount for account
     * @param account Account address
     * @return Deposit amount
     */
    function getDeposit(address account) external view override returns (uint256) {
        return _deposits[account];
    }

    /**
     * @dev Get the verifying signer address
     * @return Signer address
     */
    function verifyingSigner() external view override returns (address) {
        return _verifyingSigner;
    }

    /**
     * @dev Validate UserOperation and return validation data
     * @param userOp UserOperation to validate
     * @param userOpHash Hash of the UserOperation
     * @param maxCost Maximum gas cost for this operation
     * @return validationData Packed validation data
     * @return context Context data for postOp
     */
    function _validatePaymasterUserOp(
        PackedUserOperation calldata userOp,
        bytes32 userOpHash,
        uint256 maxCost
    ) internal override returns (bytes memory context, uint256 validationData) {
        // Extract paymaster data
        bytes calldata paymasterAndData = userOp.paymasterAndData;

        if (paymasterAndData.length < SIGNATURE_OFFSET) {
            revert PaymasterDataTooShort();
        }

        // Extract timestamp and signature from paymasterAndData
        uint48 validUntil = uint48(bytes6(paymasterAndData[VALID_TIMESTAMP_OFFSET:VALID_TIMESTAMP_OFFSET + 6]));
        uint48 validAfter = uint48(bytes6(paymasterAndData[VALID_TIMESTAMP_OFFSET + 6:VALID_TIMESTAMP_OFFSET + 12]));
        bytes calldata signature = paymasterAndData[SIGNATURE_OFFSET:];

        // Verify signature
        bytes32 hash = keccak256(abi.encodePacked(
            "\x19Ethereum Signed Message:\n32",
            keccak256(abi.encode(
                userOpHash,
                validUntil,
                validAfter,
                address(this)
            ))
        ));

        // Check for replay attacks
        if (_usedHashes[hash]) {
            return ("", _packValidationData(true, validUntil, validAfter));
        }

        // Verify signer
        address recovered = hash.recover(signature);
        bool validSignature = recovered == _verifyingSigner;

        if (!validSignature) {
            return ("", _packValidationData(true, validUntil, validAfter));
        }

        // Mark hash as used to prevent replay
        _usedHashes[hash] = true;

        // Check if we have enough deposit to cover the cost
        if (_deposits[userOp.sender] < maxCost) {
            // Try to use general paymaster deposit
            if (getDeposit() < maxCost) {
                return ("", _packValidationData(true, validUntil, validAfter));
            }
        }

        // Prepare context for postOp
        context = abi.encode(
            userOp.sender,
            maxCost,
            userOpHash
        );

        return (context, _packValidationData(false, validUntil, validAfter));
    }

    /**
     * @dev Post-operation processing
     * @param context Context from validatePaymasterUserOp
     * @param actualGasCost Actual gas cost of the operation
     * @param actualUserOpFeePerGas Actual fee per gas unit
     */
    function _postOp(
        PostOpMode mode,
        bytes calldata context,
        uint256 actualGasCost,
        uint256 actualUserOpFeePerGas
    ) internal override {
        if (mode == PostOpMode.opReverted) {
            // Operation reverted, still need to pay for gas
            return;
        }

        // Decode context
        (address sender, uint256 maxCost, bytes32 userOpHash) = abi.decode(
            context,
            (address, uint256, bytes32)
        );

        // Deduct cost from user's deposit or general paymaster deposit
        if (_deposits[sender] >= actualGasCost) {
            _deposits[sender] -= actualGasCost;
        } else if (_deposits[sender] > 0) {
            // Use partial user deposit and cover the rest from paymaster
            uint256 userContribution = _deposits[sender];
            _deposits[sender] = 0;

            uint256 paymasterCost = actualGasCost - userContribution;
            if (getDeposit() >= paymasterCost) {
                withdrawTo(payable(address(this)), paymasterCost);
            }
        } else {
            // Use paymaster deposit entirely
            if (getDeposit() >= actualGasCost) {
                withdrawTo(payable(address(this)), actualGasCost);
            }
        }

        emit UserOperationSponsored(sender, userOpHash, actualGasCost);

        // Prevent unused variable warning
        (actualUserOpFeePerGas);
    }

    /**
     * @dev Emergency withdrawal function
     * @param to Withdrawal destination
     * @param amount Amount to withdraw
     */
    function emergencyWithdraw(address payable to, uint256 amount) external onlyOwner {
        require(to != address(0), "Invalid destination");
        require(address(this).balance >= amount, "Insufficient balance");

        to.transfer(amount);
    }

    /**
     * @dev Get paymaster hash for signing
     * @param userOpHash UserOperation hash
     * @param validUntil Valid until timestamp
     * @param validAfter Valid after timestamp
     * @return Hash to be signed by the verifying signer
     */
    function getHash(
        bytes32 userOpHash,
        uint48 validUntil,
        uint48 validAfter
    ) external view returns (bytes32) {
        return keccak256(abi.encodePacked(
            "\x19Ethereum Signed Message:\n32",
            keccak256(abi.encode(
                userOpHash,
                validUntil,
                validAfter,
                address(this)
            ))
        ));
    }

    /**
     * @dev Parse paymaster and data
     * @param paymasterAndData Packed paymaster data
     * @return validUntil Valid until timestamp
     * @return validAfter Valid after timestamp
     * @return signature Paymaster signature
     */
    function parsePaymasterAndData(bytes calldata paymasterAndData)
        external
        pure
        returns (
            uint48 validUntil,
            uint48 validAfter,
            bytes calldata signature
        )
    {
        if (paymasterAndData.length < SIGNATURE_OFFSET) {
            revert PaymasterDataTooShort();
        }

        validUntil = uint48(bytes6(paymasterAndData[VALID_TIMESTAMP_OFFSET:VALID_TIMESTAMP_OFFSET + 6]));
        validAfter = uint48(bytes6(paymasterAndData[VALID_TIMESTAMP_OFFSET + 6:VALID_TIMESTAMP_OFFSET + 12]));
        signature = paymasterAndData[SIGNATURE_OFFSET:];
    }

    /**
     * @dev Check if a hash has been used (for replay protection)
     * @param hash Hash to check
     * @return True if hash has been used
     */
    function isHashUsed(bytes32 hash) external view returns (bool) {
        return _usedHashes[hash];
    }

    /**
     * @dev Batch deposit for multiple accounts
     * @param accounts Array of account addresses
     * @param amounts Array of deposit amounts
     */
    function batchDeposit(address[] calldata accounts, uint256[] calldata amounts) external payable {
        require(accounts.length == amounts.length, "Array length mismatch");

        uint256 totalAmount = 0;
        for (uint256 i = 0; i < amounts.length; i++) {
            totalAmount += amounts[i];
        }
        require(msg.value == totalAmount, "Incorrect total amount");

        for (uint256 i = 0; i < accounts.length; i++) {
            if (accounts[i] != address(0) && amounts[i] > 0) {
                _deposits[accounts[i]] += amounts[i];
                emit DepositAdded(accounts[i], amounts[i]);
            }
        }
    }

    /**
     * @dev Get multiple account deposits
     * @param accounts Array of account addresses
     * @return deposits Array of deposit amounts
     */
    function getMultipleDeposits(address[] calldata accounts)
        external
        view
        returns (uint256[] memory deposits)
    {
        deposits = new uint256[](accounts.length);
        for (uint256 i = 0; i < accounts.length; i++) {
            deposits[i] = _deposits[accounts[i]];
        }
    }

    /**
     * @dev Receive ETH deposits
     */
    receive() external payable {
        // Add to general paymaster deposit
        deposit();
    }

    function _packValidationData(
    bool sigFailed,
    uint48 validUntil,
    uint48 validAfter
) internal pure returns (uint256) {
    return
        (sigFailed ? 1 : 0) |
        (uint256(validUntil) << 8) |
        (uint256(validAfter) << (8 + 48));
}
}
