// contracts/contracts/interfaces/IPaymaster.sol
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {IPaymaster} from "@account-abstraction/contracts/interfaces/IPaymaster.sol";

/**
 * @title IVerifyingPaymaster
 * @dev Interface for verifying paymaster with signature validation
 */
interface IVerifyingPaymaster is IPaymaster {
    // Events
    event DepositAdded(address indexed account, uint256 amount);
    event DepositWithdrawn(address indexed account, uint256 amount);
    event PaymasterConfigured(address indexed verifyingSigner);

    // Errors
    error InvalidSignature();
    error InsufficientDeposit();
    error InvalidSigner();
    error PaymasterDataTooShort();

    /**
     * @dev Set the verifying signer address
     * @param newSigner New signer address
     */
    function setVerifyingSigner(address newSigner) external;

    /**
     * @dev Add deposit for gas sponsorship
     * @param account Account to add deposit for
     */
    function addDepositFor(address account) external payable;

    /**
     * @dev Withdraw deposit
     * @param account Account to withdraw from
     * @param amount Amount to withdraw
     */
    function withdrawDepositTo(address account, uint256 amount) external;

    /**
     * @dev Get deposit amount for account
     * @param account Account address
     * @return Deposit amount
     */
    function getDeposit(address account) external view returns (uint256);

    /**
     * @dev Get the verifying signer address
     * @return Signer address
     */
    function verifyingSigner() external view returns (address);
}
