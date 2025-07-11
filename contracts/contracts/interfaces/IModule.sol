// contracts/contracts/interfaces/IModule.sol
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

/**
 * @title IModule
 * @dev Base interface for all smart account modules
 */
interface IModule {
    /**
     * @dev Initialize the module for a specific account
     * @param account Smart account address
     * @param data Initialization data
     */
    function init(address account, bytes calldata data) external;

    /**
     * @dev Deinitialize the module for a specific account
     * @param account Smart account address
     */
    function deinit(address account) external;

    /**
     * @dev Check if module is initialized for account
     * @param account Smart account address
     * @return True if initialized
     */
    function isInitialized(address account) external view returns (bool);

    /**
     * @dev Get module name
     * @return Module name string
     */
    function name() external pure returns (string memory);

    /**
     * @dev Get module version
     * @return Module version string
     */
    function version() external pure returns (string memory);
}