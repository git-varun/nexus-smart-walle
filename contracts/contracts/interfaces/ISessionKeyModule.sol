// contracts/contracts/interfaces/ISessionKeyModule.sol
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "./IModule.sol";

/**
 * @title ISessionKeyModule
 * @dev Interface for session key management module
 */
interface ISessionKeyModule is IModule {
    struct SessionKey {
        address key;
        uint256 spendingLimit;
        uint256 dailyLimit;
        uint256 usedToday;
        uint256 lastUsedDay;
        uint256 expiryTime;
        address[] allowedTargets;
        bool isActive;
    }

    // Events
    event SessionKeyAdded(
        address indexed account,
        address indexed sessionKey,
        uint256 spendingLimit,
        uint256 dailyLimit,
        uint256 expiryTime
    );
    event SessionKeyRevoked(address indexed account, address indexed sessionKey);
    event SessionKeyUsed(address indexed account, address indexed sessionKey, uint256 amount);

    // Errors
    error SessionKeyNotFound();
    error SessionKeyExpired();
    error SpendingLimitExceeded();
    error DailyLimitExceeded();
    error TargetNotAllowed();
    error SessionKeyInactive();

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
    ) external;

    /**
     * @dev Revoke a session key
     * @param account Smart account address
     * @param sessionKey Session key address to revoke
     */
    function revokeSessionKey(address account, address sessionKey) external;

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
    ) external returns (bool);

    /**
     * @dev Get session key details
     * @param account Smart account address
     * @param sessionKey Session key address
     * @return SessionKey struct
     */
    function getSessionKey(address account, address sessionKey)
        external
        view
        returns (SessionKey memory);

    /**
     * @dev Get all session keys for an account
     * @param account Smart account address
     * @return Array of session key addresses
     */
    function getSessionKeys(address account) external view returns (address[] memory);
}
