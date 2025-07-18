// contracts/contracts/core/SmartAccountV2.sol
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {ISmartAccount} from "../interfaces/ISmartAccount.sol";
import {ModuleRegistry} from "../modules/ModuleRegistry.sol";
import {SmartAccount} from "./SmartAccount.sol";
import {IEntryPoint} from "@account-abstraction/contracts/interfaces/IEntryPoint.sol";

/**
 * @title SmartAccountV2
 * @dev Enhanced SmartAccount with module registry integration and advanced features
 * @author Smart Wallet Team
 */
contract SmartAccountV2 is SmartAccount {
    // Module registry for validation
    ModuleRegistry public immutable moduleRegistry;

    // Enhanced module tracking
    mapping(address => uint256) private _moduleInstallTime;
    mapping(address => bool) private _moduleActive;

    // Execution tracking
    mapping(bytes32 => bool) private _executedOperations;
    uint256 private _operationNonce;

    // Events
    event ModuleInstalledFromRegistry(address indexed module, string name, string version);
    event ModuleValidated(address indexed module, bool isValid);
    event OperationExecuted(bytes32 indexed operationHash, bool success);

    constructor(
        IEntryPoint anEntryPoint,
        ModuleRegistry _moduleRegistry
    ) SmartAccount(anEntryPoint) {
        moduleRegistry = _moduleRegistry;
    }

    /**
     * @dev Add module with registry validation
     * @param module Module address to add
     */
    function addModule(address module) public override onlyOwner {
        // Validate module through registry
        require(moduleRegistry.isModuleValid(module), "SmartAccountV2: invalid module");

        // Call parent implementation
        super.addModule(module);

        // Record installation
        _moduleInstallTime[module] = block.timestamp;
        _moduleActive[module] = true;

        // Record in registry
        moduleRegistry.recordInstallation(module, address(this));

        // Emit enhanced event with module info
        try moduleRegistry.getModuleInfo(module) returns (
            string memory name,
            string memory version,
            string memory,
            address,
            bool,
            uint256,
            string[] memory
        ) {
            emit ModuleInstalledFromRegistry(module, name, version);
        } catch {
            // Fallback for modules not in registry
        }

        emit ModuleValidated(module, true);
    }

    /**
     * @dev Remove module with registry notification
     * @param module Module address to remove
     */
    function removeModule(address module) public override onlyOwner {
        // Call parent implementation
        super.removeModule(module);

        // Update tracking
        _moduleActive[module] = false;

        // Record in registry
        try moduleRegistry.recordUninstallation(module, address(this)) {} catch {}
    }

    /**
     * @dev Get module installation time
     * @param module Module address
     * @return Installation timestamp
     */
    function getModuleInstallTime(address module) external view returns (uint256) {
        return _moduleInstallTime[module];
    }

    /**
     * @dev Check if module is active (installed and not removed)
     * @param module Module address
     * @return True if module is active
     */
    function isModuleActive(address module) external view returns (bool) {
        return _moduleActive[module] && isModuleEnabled(module);
    }

    /**
     * @dev Execute operation with replay protection
     * @param target Target address
     * @param value ETH value
     * @param data Call data
     * @param operationId Unique operation identifier
     */
    function executeWithId(
        address target,
        uint256 value,
        bytes calldata data,
        bytes32 operationId
    ) external onlyEntryPointOrOwner {
        require(!_executedOperations[operationId], "SmartAccountV2: operation already executed");

        _executedOperations[operationId] = true;

        _execute(target, value, data);

        emit OperationExecuted(operationId, true);
        emit Executed(target, value, data);
    }

    /**
     * @dev Check if operation was executed
     * @param operationId Operation identifier
     * @return True if operation was executed
     */
    function isOperationExecuted(bytes32 operationId) external view returns (bool) {
        return _executedOperations[operationId];
    }

    /**
     * @dev Get next operation nonce
     * @return Next available nonce
     */
    function getNextOperationNonce() external view returns (uint256) {
        return _operationNonce + 1;
    }

    /**
     * @dev Generate operation ID
     * @param target Target address
     * @param value ETH value
     * @param data Call data
     * @param nonce Operation nonce
     * @return Operation ID hash
     */
    function generateOperationId(
        address target,
        uint256 value,
        bytes calldata data,
        uint256 nonce
    ) external pure returns (bytes32) {
        return keccak256(abi.encodePacked(target, value, data, nonce));
    }

    /**
     * @dev Batch add modules from registry
     * @param modules Array of module addresses
     */
    function batchAddModules(address[] calldata modules) external onlyOwner {
        for (uint256 i = 0; i < modules.length; i++) {
            addModule(modules[i]);
        }
    }

    /**
     * @dev Get installed modules with metadata
     * @return modules Array of module addresses
     * @return installTimes Array of installation timestamps
     * @return activeStatus Array of active status
     */
    function getModulesWithMetadata() external view returns (
        address[] memory modules,
        uint256[] memory installTimes,
        bool[] memory activeStatus
    ) {
        address[] memory allModules = getModules();
        installTimes = new uint256[](allModules.length);
        activeStatus = new bool[](allModules.length);

        for (uint256 i = 0; i < allModules.length; i++) {
            installTimes[i] = _moduleInstallTime[allModules[i]];
            activeStatus[i] = _moduleActive[allModules[i]];
        }

        return (allModules, installTimes, activeStatus);
    }
}
