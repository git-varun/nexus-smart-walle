// contracts/contracts/modules/RecoveryModule.sol
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {IModule} from "../interfaces/IModule.sol";

import {ERC165} from "@openzeppelin/contracts/utils/introspection/ERC165.sol";
import {Ownable} from "@openzeppelin/contracts/access/Ownable.sol";
import {ECDSA} from "@openzeppelin/contracts/utils/cryptography/ECDSA.sol";
import {MessageHashUtils} from "@openzeppelin/contracts/utils/cryptography/MessageHashUtils.sol";

/**
 * @title RecoveryModule
 * @dev Module for guardian-based account recovery with time delays and social recovery
 * @author Smart Wallet Team
 */
contract RecoveryModule is ERC165, Ownable, IModule {
    using ECDSA for bytes32;
    using MessageHashUtils for bytes32;

    // Recovery configuration per account
    struct RecoveryConfig {
        address[] guardians;
        uint256 threshold;
        uint256 delay;
        bool isActive;
        mapping(address => bool) isGuardian;
    }

    // Pending recovery request
    struct RecoveryRequest {
        address newOwner;
        uint256 executeAfter;
        address[] approvedBy;
        bool isExecuted;
        bool isCancelled;
        mapping(address => bool) hasApproved;
    }

    // Storage
    mapping(address => RecoveryConfig) private _recoveryConfigs;
    mapping(address => RecoveryRequest) private _pendingRecoveries;
    mapping(address => bool) private _initializedAccounts;

    // Constants
    uint256 public constant MIN_RECOVERY_DELAY = 24 hours;
    uint256 public constant MAX_RECOVERY_DELAY = 30 days;
    uint256 public constant MAX_GUARDIANS = 10;
    uint256 public constant MIN_THRESHOLD = 1;

    // Events
    event RecoveryConfigured(
        address indexed account,
        address[] guardians,
        uint256 threshold,
        uint256 delay
    );
    event RecoveryInitiated(
        address indexed account,
        address indexed newOwner,
        uint256 executeAfter,
        address indexed initiator
    );
    event RecoveryApproved(
        address indexed account,
        address indexed guardian,
        address indexed newOwner
    );
    event RecoveryExecuted(
        address indexed account,
        address indexed oldOwner,
        address indexed newOwner
    );
    event RecoveryCancelled(
        address indexed account,
        address indexed cancelledBy
    );
    event GuardianAdded(address indexed account, address indexed guardian);
    event GuardianRemoved(address indexed account, address indexed guardian);

    // Events for module lifecycle
    event ModuleInitialized(address indexed account);
    event ModuleDeinitialized(address indexed account);

    // Errors
    error InvalidGuardian();
    error InvalidThreshold();
    error InvalidDelay();
    error TooManyGuardians();
    error RecoveryNotActive();
    error RecoveryAlreadyPending();
    error RecoveryNotPending();
    error InsufficientApprovals();
    error RecoveryDelayNotMet();
    error RecoveryAlreadyExecuted();
    error RecoveryAlreadyCancelled();
    error NotAuthorized();
    error GuardianAlreadyExists();
    error GuardianNotFound();

    // Modifier to check if caller is the account owner
    modifier onlyAccountOwner(address account) {
        require(msg.sender == account, "RecoveryModule: not account owner");
        _;
    }

    constructor() Ownable(msg.sender) {}

    /**
     * @dev Initialize the module for a specific account
     * @param account Smart account address
     * @param data Initialization data containing guardians, threshold, and delay
     */
    function init(address account, bytes calldata data) external override {
        require(account != address(0), "RecoveryModule: invalid account");
        require(!_initializedAccounts[account], "RecoveryModule: already initialized");

        if (data.length > 0) {
            (address[] memory guardians, uint256 threshold, uint256 delay) =
                                abi.decode(data, (address[], uint256, uint256));

            _setupRecovery(account, guardians, threshold, delay);
        }

        _initializedAccounts[account] = true;
        emit ModuleInitialized(account);
    }

    /**
     * @dev Deinitialize the module for a specific account
     * @param account Smart account address
     */
    function deinit(address account) external override {
        require(_initializedAccounts[account], "RecoveryModule: not initialized");

        // Cancel any pending recovery
        if (_pendingRecoveries[account].executeAfter > 0 && !_pendingRecoveries[account].isExecuted) {
            _pendingRecoveries[account].isCancelled = true;
            emit RecoveryCancelled(account, msg.sender);
        }

        // Clear recovery config
        RecoveryConfig storage config = _recoveryConfigs[account];
        for (uint256 i = 0; i < config.guardians.length; i++) {
            config.isGuardian[config.guardians[i]] = false;
        }
        delete config.guardians;
        config.threshold = 0;
        config.delay = 0;
        config.isActive = false;

        _initializedAccounts[account] = false;
        emit ModuleDeinitialized(account);
    }

    /**
     * @dev Check if module is initialized for account
     * @param account Smart account address
     * @return True if initialized
     */
    function isInitialized(address account) external view override returns (bool) {
        return _initializedAccounts[account];
    }

    /**
     * @dev Get module name
     * @return Module name string
     */
    function name() external pure override returns (string memory) {
        return "RecoveryModule";
    }

    /**
     * @dev Get module version
     * @return Module version string
     */
    function version() external pure override returns (string memory) {
        return "1.0.0";
    }

    /**
     * @dev Setup recovery configuration for an account
     * @param account Smart account address
     * @param guardians Array of guardian addresses
     * @param threshold Number of guardians required for recovery
     * @param delay Time delay before recovery can be executed
     */
    function setupRecovery(
        address account,
        address[] calldata guardians,
        uint256 threshold,
        uint256 delay
    ) external onlyAccountOwner(account) {
        _setupRecovery(account, guardians, threshold, delay);
    }

    /**
     * @dev Internal function to setup recovery configuration
     */
    function _setupRecovery(
        address account,
        address[] memory guardians,
        uint256 threshold,
        uint256 delay
    ) internal {
        if (guardians.length == 0 || guardians.length > MAX_GUARDIANS) revert TooManyGuardians();
        if (threshold < MIN_THRESHOLD || threshold > guardians.length) revert InvalidThreshold();
        if (delay < MIN_RECOVERY_DELAY || delay > MAX_RECOVERY_DELAY) revert InvalidDelay();

        RecoveryConfig storage config = _recoveryConfigs[account];

        // Clear existing guardians
        for (uint256 i = 0; i < config.guardians.length; i++) {
            config.isGuardian[config.guardians[i]] = false;
        }

        // Set new guardians
        delete config.guardians;
        for (uint256 i = 0; i < guardians.length; i++) {
            address guardian = guardians[i];
            if (guardian == address(0) || guardian == account) revert InvalidGuardian();
            if (config.isGuardian[guardian]) revert GuardianAlreadyExists();

            config.guardians.push(guardian);
            config.isGuardian[guardian] = true;
        }

        config.threshold = threshold;
        config.delay = delay;
        config.isActive = true;

        emit RecoveryConfigured(account, guardians, threshold, delay);
    }

    /**
     * @dev Initiate recovery process
     * @param account Smart account address to recover
     * @param newOwner New owner address
     */
    function initiateRecovery(
        address account,
        address newOwner
    ) external {
        RecoveryConfig storage config = _recoveryConfigs[account];
        if (!config.isActive) revert RecoveryNotActive();
        if (!config.isGuardian[msg.sender]) revert NotAuthorized();
        if (newOwner == address(0)) revert InvalidGuardian();

        RecoveryRequest storage request = _pendingRecoveries[account];
        if (request.executeAfter > 0 && !request.isExecuted && !request.isCancelled) {
            revert RecoveryAlreadyPending();
        }

        // Initialize new recovery request
        request.newOwner = newOwner;
        request.executeAfter = block.timestamp + config.delay;
        request.isExecuted = false;
        request.isCancelled = false;

        // Clear previous approvals
        for (uint256 i = 0; i < request.approvedBy.length; i++) {
            request.hasApproved[request.approvedBy[i]] = false;
        }
        delete request.approvedBy;

        // Auto-approve by initiator
        request.approvedBy.push(msg.sender);
        request.hasApproved[msg.sender] = true;

        emit RecoveryInitiated(account, newOwner, request.executeAfter, msg.sender);
        emit RecoveryApproved(account, msg.sender, newOwner);
    }

    /**
     * @dev Approve pending recovery
     * @param account Smart account address
     */
    function approveRecovery(address account) external {
        RecoveryConfig storage config = _recoveryConfigs[account];
        if (!config.isGuardian[msg.sender]) revert NotAuthorized();

        RecoveryRequest storage request = _pendingRecoveries[account];
        if (request.executeAfter == 0) revert RecoveryNotPending();
        if (request.isExecuted) revert RecoveryAlreadyExecuted();
        if (request.isCancelled) revert RecoveryAlreadyCancelled();
        if (request.hasApproved[msg.sender]) return; // Already approved

        request.approvedBy.push(msg.sender);
        request.hasApproved[msg.sender] = true;

        emit RecoveryApproved(account, msg.sender, request.newOwner);
    }

    /**
     * @dev Execute recovery after delay and sufficient approvals
     * @param account Smart account address
     */
    function executeRecovery(address account) external {
        RecoveryConfig storage config = _recoveryConfigs[account];
        RecoveryRequest storage request = _pendingRecoveries[account];

        if (request.executeAfter == 0) revert RecoveryNotPending();
        if (request.isExecuted) revert RecoveryAlreadyExecuted();
        if (request.isCancelled) revert RecoveryAlreadyCancelled();
        if (block.timestamp < request.executeAfter) revert RecoveryDelayNotMet();
        if (request.approvedBy.length < config.threshold) revert InsufficientApprovals();

        // Mark as executed
        request.isExecuted = true;

        // Get current owner before change
        address oldOwner = _getAccountOwner(account);

        // Execute owner change on the smart account
        _changeAccountOwner(account, request.newOwner);

        emit RecoveryExecuted(account, oldOwner, request.newOwner);
    }

    /**
     * @dev Cancel pending recovery
     * @param account Smart account address
     */
    function cancelRecovery(address account) external {
        RecoveryRequest storage request = _pendingRecoveries[account];

        if (request.executeAfter == 0) revert RecoveryNotPending();
        if (request.isExecuted) revert RecoveryAlreadyExecuted();
        if (request.isCancelled) revert RecoveryAlreadyCancelled();

        // Only account owner or guardian can cancel
        RecoveryConfig storage config = _recoveryConfigs[account];
        if (msg.sender != account && !config.isGuardian[msg.sender]) revert NotAuthorized();

        request.isCancelled = true;
        emit RecoveryCancelled(account, msg.sender);
    }

    /**
     * @dev Add a guardian to an account
     * @param account Smart account address
     * @param guardian Guardian address to add
     */
    function addGuardian(address account, address guardian) external onlyAccountOwner(account) {
        if (guardian == address(0) || guardian == account) revert InvalidGuardian();

        RecoveryConfig storage config = _recoveryConfigs[account];
        if (config.isGuardian[guardian]) revert GuardianAlreadyExists();
        if (config.guardians.length >= MAX_GUARDIANS) revert TooManyGuardians();

        config.guardians.push(guardian);
        config.isGuardian[guardian] = true;

        emit GuardianAdded(account, guardian);
    }

    /**
     * @dev Remove a guardian from an account
     * @param account Smart account address
     * @param guardian Guardian address to remove
     */
    function removeGuardian(address account, address guardian) external onlyAccountOwner(account) {
        RecoveryConfig storage config = _recoveryConfigs[account];
        if (!config.isGuardian[guardian]) revert GuardianNotFound();

        // Remove from guardians array
        for (uint256 i = 0; i < config.guardians.length; i++) {
            if (config.guardians[i] == guardian) {
                config.guardians[i] = config.guardians[config.guardians.length - 1];
                config.guardians.pop();
                break;
            }
        }

        config.isGuardian[guardian] = false;

        // Adjust threshold if needed
        if (config.threshold > config.guardians.length) {
            config.threshold = config.guardians.length;
        }

        emit GuardianRemoved(account, guardian);
    }

    /**
     * @dev Update recovery threshold
     * @param account Smart account address
     * @param threshold New threshold value
     */
    function updateThreshold(address account, uint256 threshold) external onlyAccountOwner(account) {
        RecoveryConfig storage config = _recoveryConfigs[account];
        if (threshold < MIN_THRESHOLD || threshold > config.guardians.length) revert InvalidThreshold();

        config.threshold = threshold;
        emit RecoveryConfigured(account, config.guardians, threshold, config.delay);
    }

    /**
     * @dev Update recovery delay
     * @param account Smart account address
     * @param delay New delay value
     */
    function updateDelay(address account, uint256 delay) external onlyAccountOwner(account) {
        if (delay < MIN_RECOVERY_DELAY || delay > MAX_RECOVERY_DELAY) revert InvalidDelay();

        RecoveryConfig storage config = _recoveryConfigs[account];
        config.delay = delay;
        emit RecoveryConfigured(account, config.guardians, config.threshold, delay);
    }

    // View functions

    /**
     * @dev Get recovery configuration for an account
     * @param account Smart account address
     * @return guardians Array of guardian addresses
     * @return threshold Required number of approvals
     * @return delay Recovery delay in seconds
     * @return isActive Whether recovery is active
     */
    function getRecoveryConfig(address account) external view returns (
        address[] memory guardians,
        uint256 threshold,
        uint256 delay,
        bool isActive
    ) {
        RecoveryConfig storage config = _recoveryConfigs[account];
        return (config.guardians, config.threshold, config.delay, config.isActive);
    }

    /**
     * @dev Get pending recovery request for an account
     * @param account Smart account address
     * @return newOwner Proposed new owner
     * @return executeAfter Timestamp when recovery can be executed
     * @return approvedBy Array of guardians who approved
     * @return isExecuted Whether recovery was executed
     * @return isCancelled Whether recovery was cancelled
     */
    function getPendingRecovery(address account) external view returns (
        address newOwner,
        uint256 executeAfter,
        address[] memory approvedBy,
        bool isExecuted,
        bool isCancelled
    ) {
        RecoveryRequest storage request = _pendingRecoveries[account];
        return (
            request.newOwner,
            request.executeAfter,
            request.approvedBy,
            request.isExecuted,
            request.isCancelled
        );
    }

    /**
     * @dev Check if an address is a guardian for an account
     * @param account Smart account address
     * @param guardian Address to check
     * @return True if guardian
     */
    function isGuardian(address account, address guardian) external view returns (bool) {
        return _recoveryConfigs[account].isGuardian[guardian];
    }

    /**
     * @dev Check if recovery can be executed
     * @param account Smart account address
     * @return True if recovery can be executed
     */
    function canExecuteRecovery(address account) external view returns (bool) {
        RecoveryConfig storage config = _recoveryConfigs[account];
        RecoveryRequest storage request = _pendingRecoveries[account];

        return request.executeAfter > 0 &&
            !request.isExecuted &&
            !request.isCancelled &&
            block.timestamp >= request.executeAfter &&
            request.approvedBy.length >= config.threshold;
    }

    // Internal functions

    /**
     * @dev Get the current owner of a smart account
     * @param account Smart account address
     * @return Current owner address
     */
    function _getAccountOwner(address account) internal view returns (address) {
        // This should call the actual smart account to get the owner
        // Implementation depends on your smart account interface
        (bool success, bytes memory data) = account.staticcall(
            abi.encodeWithSignature("owner()")
        );
        if (success && data.length == 32) {
            return abi.decode(data, (address));
        }
        return address(0);
    }

    /**
     * @dev Change the owner of a smart account
     * @param account Smart account address
     * @param newOwner New owner address
     */
    function _changeAccountOwner(address account, address newOwner) internal {
        // This should call the actual smart account to change the owner
        // Implementation depends on your smart account interface
        (bool success,) = account.call(
            abi.encodeWithSignature("transferOwnership(address)", newOwner)
        );
        require(success, "RecoveryModule: owner change failed");
    }

    /**
     * @dev See {IERC165-supportsInterface}.
     */
    function supportsInterface(bytes4 interfaceId) public view virtual override returns (bool) {
        return interfaceId == type(IModule).interfaceId || super.supportsInterface(interfaceId);
    }
}
