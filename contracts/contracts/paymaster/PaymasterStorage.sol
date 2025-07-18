// contracts/contracts/paymaster/PaymasterStorage.sol
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {Ownable} from "@openzeppelin/contracts/access/Ownable.sol";


/**
 * @title PaymasterStorage
 * @dev Storage contract for paymaster configurations and policies
 */
contract PaymasterStorage is Ownable {
    // Storage structures
    struct SponsorshipPolicy {
        bool isActive;
        uint256 maxGasPerUserOp;
        uint256 maxUserOpsPerDay;
        uint256 dailySpendingLimit;
        address[] allowedTargets;
        mapping(address => bool) isTargetAllowed;
    }

    struct UserStats {
        uint256 userOpsToday;
        uint256 gasUsedToday;
        uint256 lastUsedDay;
        uint256 totalUserOps;
        uint256 totalGasUsed;
    }

    // Storage
    mapping(address => SponsorshipPolicy) public policies;
    mapping(address => UserStats) public userStats;
    mapping(address => bool) public authorizedPaymasters;

    uint256 public globalDailyLimit;
    uint256 public globalUsedToday;
    uint256 public lastGlobalUsageDay;

    // Events
    event PolicyUpdated(address indexed account, bool isActive);
    event GlobalLimitUpdated(uint256 newLimit);
    event PaymasterAuthorized(address indexed paymaster, bool authorized);

    constructor(address _owner) Ownable(_owner) {}

    /**
     * @dev Set sponsorship policy for an account
     */
    function setSponsorshipPolicy(
        address account,
        bool isActive,
        uint256 maxGasPerUserOp,
        uint256 maxUserOpsPerDay,
        uint256 dailySpendingLimit,
        address[] calldata allowedTargets
    ) external onlyOwner {
        SponsorshipPolicy storage policy = policies[account];
        policy.isActive = isActive;
        policy.maxGasPerUserOp = maxGasPerUserOp;
        policy.maxUserOpsPerDay = maxUserOpsPerDay;
        policy.dailySpendingLimit = dailySpendingLimit;

        // Clear existing targets
        for (uint256 i = 0; i < policy.allowedTargets.length; i++) {
            policy.isTargetAllowed[policy.allowedTargets[i]] = false;
        }

        // Set new targets
        delete policy.allowedTargets;
        for (uint256 i = 0; i < allowedTargets.length; i++) {
            policy.allowedTargets.push(allowedTargets[i]);
            policy.isTargetAllowed[allowedTargets[i]] = true;
        }

        emit PolicyUpdated(account, isActive);
    }

    /**
     * @dev Check if sponsorship is allowed
     */
    function isSponsorshipAllowed(
        address account,
        address target,
        uint256 gasLimit
    ) external view returns (bool) {
        SponsorshipPolicy storage policy = policies[account];

        if (!policy.isActive) return false;
        if (gasLimit > policy.maxGasPerUserOp) return false;
        if (policy.allowedTargets.length > 0 && !policy.isTargetAllowed[target]) return false;

        // Check daily limits
        UserStats storage stats = userStats[account];
        uint256 today = block.timestamp / 1 days;

        if (stats.lastUsedDay == today) {
            if (stats.userOpsToday >= policy.maxUserOpsPerDay) return false;
            if (stats.gasUsedToday + gasLimit > policy.dailySpendingLimit) return false;
        }

        // Check global limits
        if (lastGlobalUsageDay == today && globalUsedToday + gasLimit > globalDailyLimit) {
            return false;
        }

        return true;
    }

    /**
     * @dev Update usage statistics
     */
    function updateUsageStats(
        address account,
        uint256 gasUsed
    ) external {
        require(authorizedPaymasters[msg.sender], "Unauthorized paymaster");

        uint256 today = block.timestamp / 1 days;
        UserStats storage stats = userStats[account];

        // Reset daily stats if new day
        if (stats.lastUsedDay != today) {
            stats.userOpsToday = 0;
            stats.gasUsedToday = 0;
            stats.lastUsedDay = today;
        }

        // Update user stats
        stats.userOpsToday += 1;
        stats.gasUsedToday += gasUsed;
        stats.totalUserOps += 1;
        stats.totalGasUsed += gasUsed;

        // Update global stats
        if (lastGlobalUsageDay != today) {
            globalUsedToday = 0;
            lastGlobalUsageDay = today;
        }
        globalUsedToday += gasUsed;
    }

    /**
     * @dev Set global daily limit
     */
    function setGlobalDailyLimit(uint256 newLimit) external onlyOwner {
        globalDailyLimit = newLimit;
        emit GlobalLimitUpdated(newLimit);
    }

    /**
     * @dev Authorize/deauthorize paymaster
     */
    function setPaymasterAuthorization(address paymaster, bool authorized) external onlyOwner {
        authorizedPaymasters[paymaster] = authorized;
        emit PaymasterAuthorized(paymaster, authorized);
    }
}
