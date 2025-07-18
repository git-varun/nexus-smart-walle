// contracts/contracts/interfaces/ISmartAccount.sol
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "@account-abstraction/contracts/interfaces/IAccount.sol";

/**
 * @title ISmartAccount
 * @dev Interface for ERC-4337 compatible smart account
 */
interface ISmartAccount is IAccount {
    // Events
    event OwnershipTransferred(address indexed previousOwner, address indexed newOwner);
    event ModuleAdded(address indexed module);
    event ModuleRemoved(address indexed module);
    event Executed(address indexed target, uint256 value, bytes data);

    // Errors
    error InvalidOwner();
    error InvalidModule();
    error ExecutionFailed();
    error UnauthorizedModule();

    /**
     * @dev Initialize the smart account
     * @param owner Initial owner of the account
     */
    function initialize(address owner) external;

    /**
     * @dev Execute a transaction
     * @param target Target contract address
     * @param value ETH value to send
     * @param data Call data
     */
    function execute(address target, uint256 value, bytes calldata data) external;

    /**
     * @dev Execute batch transactions
     * @param targets Array of target addresses
     * @param values Array of ETH values
     * @param datas Array of call data
     */
    function executeBatch(
        address[] calldata targets,
        uint256[] calldata values,
        bytes[] calldata datas
    ) external;

    /**
     * @dev Add a module to the account
     * @param module Module address to add
     */
    function addModule(address module) external;

    /**
     * @dev Remove a module from the account
     * @param module Module address to remove
     */
    function removeModule(address module) external;

    /**
     * @dev Check if address is an enabled module
     * @param module Module address to check
     * @return True if module is enabled
     */
    function isModuleEnabled(address module) external view returns (bool);

    /**
     * @dev Get the current owner
     * @return Owner address
     */
    function owner() external view returns (address);

    /**
     * @dev Get the current nonce
     * @return Current nonce value
     */
    function getNonce() external view returns (uint256);
}
