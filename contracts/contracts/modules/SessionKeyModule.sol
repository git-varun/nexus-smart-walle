// contracts/contracts/modules/SessionKeyModule.sol
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {IModule} from "../interfaces/IModule.sol";
import {ISessionKeyModule} from "../interfaces/ISessionKeyModule.sol";
import {ERC165} from "@openzeppelin/contracts/utils/introspection/ERC165.sol";
import {Ownable} from "@openzeppelin/contracts/access/Ownable.sol";

/**
 * @title SessionKeyModule
 * @dev Module for managing temporary session keys with spending limits and permissions
 * @author Smart Wallet Team
 */
contract SessionKeyModule is ERC165, Ownable, ISessionKeyModule {
    // Storage
    mapping(address => mapping(address => SessionKey)) private _sessionKeys;
    mapping(address => address[]) private _accountSessionKeys;
    mapping(address => bool) private _initializedAccounts;

    // Constants
    uint256 public constant MAX_SESSION_KEYS_PER_ACCOUNT = 10;
    uint256 public constant MAX_TARGETS_PER_SESSION = 5;
    uint256 public constant MAX_SESSION_DURATION = 30 days;

    // Modifiers
    modifier onlyAccountOwner(address account) {
        // In production, this should check the actual account owner
        // For now, we'll assume the caller is authorized
        _;
    }

    modifier onlyInitialized(address account) {
        require(_initializedAccounts[account], "SessionKeyModule: account not initialized");
        _;
    }

    constructor() Ownable(msg.sender) {}

    /**
     * @dev Initialize the module for a specific account
     * @param account Smart account address
     * @param data Initialization data (unused for session keys)
     */
    function init(address account, bytes calldata data) external override {
        require(account != address(0), "SessionKeyModule: invalid account");

        _initializedAccounts[account] = true;

        // data parameter is unused but kept for interface compatibility
        (data);

        emit ModuleInitialized(account);
    }

    /**
     * @dev Deinitialize the module for a specific account
     * @param account Smart account address
     */
    function deinit(address account) external override {
        require(_initializedAccounts[account], "SessionKeyModule: not initialized");

        // Remove all session keys for this account
        address[] memory sessionKeys = _accountSessionKeys[account];
        for (uint256 i = 0; i < sessionKeys.length; i++) {
            delete _sessionKeys[account][sessionKeys[i]];
        }
        delete _accountSessionKeys[account];

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
        return "SessionKeyModule";
    }

    /**
     * @dev Get module version
     * @return Module version string
     */
    function version() external pure override returns (string memory) {
        return "1.0.0";
    }

    /**
     * @dev Add a session key to an account
     * @param account Smart account address
     * @param sessionKey Session key address
     * @param spendingLimit Per-transaction spending limit
     * @param dailyLimit Daily spending limit
     * @param expiryTime Expiry timestamp
     * @param allowedTargets Array of allowed target contracts
     */
    function addSessionKey(
        address account,
        address sessionKey,
        uint256 spendingLimit,
        uint256 dailyLimit,
        uint256 expiryTime,
        address[] calldata allowedTargets
    ) external override onlyInitialized(account) onlyAccountOwner(account) {
        require(sessionKey != address(0), "SessionKeyModule: invalid session key");
        require(sessionKey != account, "SessionKeyModule: session key cannot be account");
        require(spendingLimit > 0, "SessionKeyModule: invalid spending limit");
        require(dailyLimit >= spendingLimit, "SessionKeyModule: daily limit too low");
        require(expiryTime > block.timestamp, "SessionKeyModule: invalid expiry time");
        require(
            expiryTime <= block.timestamp + MAX_SESSION_DURATION,
            "SessionKeyModule: expiry time too far"
        );
        require(
            allowedTargets.length <= MAX_TARGETS_PER_SESSION,
            "SessionKeyModule: too many targets"
        );

        // Check if session key already exists
        require(
            !_sessionKeys[account][sessionKey].isActive,
            "SessionKeyModule: session key already exists"
        );

        // Check session key limit
        require(
            _accountSessionKeys[account].length < MAX_SESSION_KEYS_PER_ACCOUNT,
            "SessionKeyModule: too many session keys"
        );

        // Create session key
        SessionKey storage newSession = _sessionKeys[account][sessionKey];
        newSession.key = sessionKey;
        newSession.spendingLimit = spendingLimit;
        newSession.dailyLimit = dailyLimit;
        newSession.usedToday = 0;
        newSession.lastUsedDay = _getCurrentDay();
        newSession.expiryTime = expiryTime;
        newSession.allowedTargets = allowedTargets;
        newSession.isActive = true;

        // Add to account's session keys list
        _accountSessionKeys[account].push(sessionKey);

        emit SessionKeyAdded(
            account,
            sessionKey,
            spendingLimit,
            dailyLimit,
            expiryTime
        );
    }

    /**
     * @dev Revoke a session key
     * @param account Smart account address
     * @param sessionKey Session key address to revoke
     */
    function revokeSessionKey(
        address account,
        address sessionKey
    ) external override onlyInitialized(account) onlyAccountOwner(account) {
        SessionKey storage session = _sessionKeys[account][sessionKey];
        require(session.isActive, "SessionKeyModule: session key not found");

        session.isActive = false;

        // Remove from account's session keys list
        address[] storage accountKeys = _accountSessionKeys[account];
        for (uint256 i = 0; i < accountKeys.length; i++) {
            if (accountKeys[i] == sessionKey) {
                accountKeys[i] = accountKeys[accountKeys.length - 1];
                accountKeys.pop();
                break;
            }
        }

        emit SessionKeyRevoked(account, sessionKey);
    }

    /**
     * @dev Validate a session key operation
     * @param account Smart account address
     * @param sessionKey Session key address
     * @param target Target contract
     * @param value ETH value
     * @return True if valid
     */
    function validateSessionKey(
        address account,
        address sessionKey,
        address target,
        uint256 value
    ) external override onlyInitialized(account) returns (bool) {
        SessionKey storage session = _sessionKeys[account][sessionKey];

        // Check if session key exists and is active
        if (!session.isActive) {
            revert SessionKeyNotFound();
        }

        // Check expiry
        if (block.timestamp > session.expiryTime) {
            revert SessionKeyExpired();
        }

        // Check spending limit
        if (value > session.spendingLimit) {
            revert SpendingLimitExceeded();
        }

        // Check daily limit
        uint256 currentDay = _getCurrentDay();
        if (session.lastUsedDay != currentDay) {
            session.usedToday = 0;
            session.lastUsedDay = currentDay;
        }

        if (session.usedToday + value > session.dailyLimit) {
            revert DailyLimitExceeded();
        }

        // Check allowed targets
        if (session.allowedTargets.length > 0) {
            bool targetAllowed = false;
            for (uint256 i = 0; i < session.allowedTargets.length; i++) {
                if (session.allowedTargets[i] == target) {
                    targetAllowed = true;
                    break;
                }
            }
            if (!targetAllowed) {
                revert TargetNotAllowed();
            }
        }

        // Update usage
        session.usedToday += value;

        emit SessionKeyUsed(account, sessionKey, value);

        return true;
    }

    /**
     * @dev Get session key details
     * @param account Smart account address
     * @param sessionKey Session key address
     * @return SessionKey struct
     */
    function getSessionKey(
        address account,
        address sessionKey
    ) external view override returns (SessionKey memory) {
        return _sessionKeys[account][sessionKey];
    }

    /**
     * @dev Get all session keys for an account
     * @param account Smart account address
     * @return Array of session key addresses
     */
    function getSessionKeys(address account) external view override returns (address[] memory) {
        return _accountSessionKeys[account];
    }

    /**
     * @dev Get active session keys for an account
     * @param account Smart account address
     * @return Array of active session key addresses
     */
    function getActiveSessionKeys(address account) external view returns (address[] memory) {
        address[] memory allKeys = _accountSessionKeys[account];
        uint256 activeCount = 0;

        // Count active keys
        for (uint256 i = 0; i < allKeys.length; i++) {
            SessionKey memory session = _sessionKeys[account][allKeys[i]];
            if (session.isActive && block.timestamp <= session.expiryTime) {
                activeCount++;
            }
        }

        // Build active keys array
        address[] memory activeKeys = new address[](activeCount);
        uint256 index = 0;

        for (uint256 i = 0; i < allKeys.length; i++) {
            SessionKey memory session = _sessionKeys[account][allKeys[i]];
            if (session.isActive && block.timestamp <= session.expiryTime) {
                activeKeys[index] = allKeys[i];
                index++;
            }
        }

        return activeKeys;
    }

    /**
     * @dev Check if a session key is valid for a specific operation
     * @param account Smart account address
     * @param sessionKey Session key address
     * @param target Target contract
     * @param value ETH value
     * @return isValid True if the operation would be valid
     * @return reason Reason if invalid
     */
    function checkSessionKeyValidity(
        address account,
        address sessionKey,
        address target,
        uint256 value
    ) external view returns (bool isValid, string memory reason) {
        SessionKey memory session = _sessionKeys[account][sessionKey];

        if (!session.isActive) {
            return (false, "Session key not active");
        }

        if (block.timestamp > session.expiryTime) {
            return (false, "Session key expired");
        }

        if (value > session.spendingLimit) {
            return (false, "Exceeds spending limit");
        }

        uint256 currentDay = _getCurrentDay();
        uint256 usedToday = session.lastUsedDay == currentDay ? session.usedToday : 0;

        if (usedToday + value > session.dailyLimit) {
            return (false, "Exceeds daily limit");
        }

        if (session.allowedTargets.length > 0) {
            bool targetAllowed = false;
            for (uint256 i = 0; i < session.allowedTargets.length; i++) {
                if (session.allowedTargets[i] == target) {
                    targetAllowed = true;
                    break;
                }
            }
            if (!targetAllowed) {
                return (false, "Target not allowed");
            }
        }

        return (true, "");
    }

    /**
     * @dev Update session key limits (owner only)
     * @param account Smart account address
     * @param sessionKey Session key address
     * @param newSpendingLimit New spending limit
     * @param newDailyLimit New daily limit
     */
    function updateSessionKeyLimits(
        address account,
        address sessionKey,
        uint256 newSpendingLimit,
        uint256 newDailyLimit
    ) external onlyInitialized(account) onlyAccountOwner(account) {
        SessionKey storage session = _sessionKeys[account][sessionKey];
        require(session.isActive, "SessionKeyModule: session key not found");
        require(newSpendingLimit > 0, "SessionKeyModule: invalid spending limit");
        require(newDailyLimit >= newSpendingLimit, "SessionKeyModule: daily limit too low");

        uint256 oldSpendingLimit = session.spendingLimit;
        uint256 oldDailyLimit = session.dailyLimit;

        session.spendingLimit = newSpendingLimit;
        session.dailyLimit = newDailyLimit;

        emit SessionKeyLimitsUpdated(
            account,
            sessionKey,
            oldSpendingLimit,
            newSpendingLimit,
            oldDailyLimit,
            newDailyLimit
        );
    }

    /**
     * @dev Extend session key expiry time
     * @param account Smart account address
     * @param sessionKey Session key address
     * @param newExpiryTime New expiry timestamp
     */
    function extendSessionKey(
        address account,
        address sessionKey,
        uint256 newExpiryTime
    ) external onlyInitialized(account) onlyAccountOwner(account) {
        SessionKey storage session = _sessionKeys[account][sessionKey];
        require(session.isActive, "SessionKeyModule: session key not found");
        require(newExpiryTime > session.expiryTime, "SessionKeyModule: cannot reduce expiry");
        require(
            newExpiryTime <= block.timestamp + MAX_SESSION_DURATION,
            "SessionKeyModule: expiry time too far"
        );

        uint256 oldExpiryTime = session.expiryTime;
        session.expiryTime = newExpiryTime;

        emit SessionKeyExtended(account, sessionKey, oldExpiryTime, newExpiryTime);
    }

    /**
     * @dev Get session key usage statistics
     * @param account Smart account address
     * @param sessionKey Session key address
     * @return usedToday Amount used today
     * @return remainingDaily Remaining daily limit
     * @return remainingPerTx Remaining per-transaction limit
     * @return timeUntilExpiry Time until expiry in seconds
     */
    function getSessionKeyUsage(
        address account,
        address sessionKey
    ) external view returns (
        uint256 usedToday,
        uint256 remainingDaily,
        uint256 remainingPerTx,
        uint256 timeUntilExpiry
    ) {
        SessionKey memory session = _sessionKeys[account][sessionKey];

        uint256 currentDay = _getCurrentDay();
        usedToday = session.lastUsedDay == currentDay ? session.usedToday : 0;
        remainingDaily = session.dailyLimit > usedToday ? session.dailyLimit - usedToday : 0;
        remainingPerTx = session.spendingLimit;
        timeUntilExpiry = session.expiryTime > block.timestamp ?
            session.expiryTime - block.timestamp : 0;
    }

    /**
     * @dev Emergency revoke all session keys for an account
     * @param account Smart account address
     */
    function emergencyRevokeAll(
        address account
    ) external onlyInitialized(account) onlyAccountOwner(account) {
        address[] memory sessionKeys = _accountSessionKeys[account];

        for (uint256 i = 0; i < sessionKeys.length; i++) {
            _sessionKeys[account][sessionKeys[i]].isActive = false;
            emit SessionKeyRevoked(account, sessionKeys[i]);
        }

        delete _accountSessionKeys[account];

        emit EmergencyRevokeAll(account, sessionKeys.length);
    }

    /**
     * @dev Get current day (for daily limit tracking)
     * @return Current day as Unix timestamp / 86400
     */
    function _getCurrentDay() private view returns (uint256) {
        return block.timestamp / 1 days;
    }

    /**
     * @dev Check interface support
     * @param interfaceId Interface identifier
     * @return True if supported
     */
    function supportsInterface(bytes4 interfaceId) public view virtual override returns (bool) {
        return
            interfaceId == type(IModule).interfaceId ||
            interfaceId == type(ISessionKeyModule).interfaceId ||
            super.supportsInterface(interfaceId);
    }

    // Events
    event ModuleInitialized(address indexed account);
    event ModuleDeinitialized(address indexed account);
    event SessionKeyLimitsUpdated(
        address indexed account,
        address indexed sessionKey,
        uint256 oldSpendingLimit,
        uint256 newSpendingLimit,
        uint256 oldDailyLimit,
        uint256 newDailyLimit
    );
    event SessionKeyExtended(
        address indexed account,
        address indexed sessionKey,
        uint256 oldExpiryTime,
        uint256 newExpiryTime
    );
    event EmergencyRevokeAll(address indexed account, uint256 revokedCount);
}
