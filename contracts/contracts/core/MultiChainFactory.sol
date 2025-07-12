// contracts/contracts/core/MultiChainFactory.sol
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/Create2.sol";
import "@openzeppelin/contracts/proxy/ERC1967/ERC1967Proxy.sol";
import "./SmartAccount.sol";

/**
 * @title MultiChainFactory
 * @dev Factory for deploying smart accounts with deterministic addresses across multiple chains
 * @author Smart Wallet Team
 */
contract MultiChainFactory is Ownable {
    // Chain configuration
    struct ChainConfig {
        uint256 chainId;
        address entryPoint;
        address factory;
        bool isActive;
        uint256 deploymentFee;
        string rpcEndpoint;
    }

    // Cross-chain account info
    struct CrossChainAccount {
        address owner;
        uint256 salt;
        address[] deployedChains;
        mapping(uint256 => address) chainToAddress;
        mapping(uint256 => bool) isDeployed;
        uint256 createdAt;
        bytes32 configHash;
    }

    // Storage
    mapping(uint256 => ChainConfig) public chainConfigs;
    mapping(bytes32 => CrossChainAccount) private _crossChainAccounts;
    mapping(address => bytes32[]) private _ownerAccounts;

    uint256[] public supportedChains;
    address public immutable accountImplementation;
    IEntryPoint public immutable defaultEntryPoint;

    // Cross-chain messaging
    mapping(uint256 => address) public chainMessengers;
    mapping(bytes32 => bool) public processedMessages;

    // Events
    event ChainConfigured(uint256 indexed chainId, address entryPoint, address factory);
    event CrossChainAccountCreated(
        bytes32 indexed accountId,
        address indexed owner,
        uint256 salt,
        uint256[] chains
    );
    event AccountDeployedOnChain(
        bytes32 indexed accountId,
        uint256 indexed chainId,
        address accountAddress
    );
    event CrossChainMessage(
        bytes32 indexed messageId,
        uint256 indexed fromChain,
        uint256 indexed toChain,
        bytes data
    );

    // Errors
    error ChainNotSupported();
    error AccountAlreadyExists();
    error InsufficientFee();
    error DeploymentFailed();
    error InvalidChainConfig();
    error MessageAlreadyProcessed();

    constructor(IEntryPoint _defaultEntryPoint) Ownable(msg.sender) {
        defaultEntryPoint = _defaultEntryPoint;
        accountImplementation = address(new SmartAccount(_defaultEntryPoint));
    }

    /**
     * @dev Configure a new chain for multi-chain deployment
     * @param chainId Chain ID
     * @param entryPoint EntryPoint address on that chain
     * @param factory Factory address on that chain
     * @param deploymentFee Fee required for deployment on that chain
     * @param rpcEndpoint RPC endpoint for the chain
     */
    function configureChain(
        uint256 chainId,
        address entryPoint,
        address factory,
        uint256 deploymentFee,
        string calldata rpcEndpoint
    ) external onlyOwner {
        if (entryPoint == address(0) || factory == address(0)) revert InvalidChainConfig();

        ChainConfig storage config = chainConfigs[chainId];
        bool isNew = !config.isActive;

        config.chainId = chainId;
        config.entryPoint = entryPoint;
        config.factory = factory;
        config.isActive = true;
        config.deploymentFee = deploymentFee;
        config.rpcEndpoint = rpcEndpoint;

        if (isNew) {
            supportedChains.push(chainId);
        }

        emit ChainConfigured(chainId, entryPoint, factory);
    }

    /**
     * @dev Create a cross-chain smart account
     * @param owner Account owner address
     * @param salt Salt for deterministic address
     * @param targetChains Array of chain IDs to deploy on
     * @param moduleConfigs Configuration for modules on each chain
     */
    function createCrossChainAccount(
        address owner,
        uint256 salt,
        uint256[] calldata targetChains,
        bytes[] calldata moduleConfigs
    ) external payable returns (bytes32 accountId) {
        if (owner == address(0)) revert InvalidChainConfig();
        if (targetChains.length == 0) revert InvalidChainConfig();

        // Generate account ID
        accountId = keccak256(abi.encodePacked(owner, salt, block.chainid));

        // Check if account already exists
        if (_crossChainAccounts[accountId].owner != address(0)) revert AccountAlreadyExists();

        // Validate all chains are supported and calculate total fee
        uint256 totalFee = 0;
        for (uint256 i = 0; i < targetChains.length; i++) {
            if (!chainConfigs[targetChains[i]].isActive) revert ChainNotSupported();
            totalFee += chainConfigs[targetChains[i]].deploymentFee;
        }

        if (msg.value < totalFee) revert InsufficientFee();

        // Create cross-chain account record
        CrossChainAccount storage account = _crossChainAccounts[accountId];
        account.owner = owner;
        account.salt = salt;
        account.createdAt = block.timestamp;
        account.configHash = keccak256(abi.encodePacked(targetChains, moduleConfigs));

        // Deploy on current chain if included
        bool deployedOnCurrent = false;
        for (uint256 i = 0; i < targetChains.length; i++) {
            if (targetChains[i] == block.chainid) {
                address accountAddress = _deployAccount(owner, salt, accountId);
                account.chainToAddress[block.chainid] = accountAddress;
                account.isDeployed[block.chainid] = true;
                account.deployedChains.push(block.chainid);
                deployedOnCurrent = true;

                emit AccountDeployedOnChain(accountId, block.chainid, accountAddress);
                break;
            }
        }

        // Queue deployments for other chains
        for (uint256 i = 0; i < targetChains.length; i++) {
            if (targetChains[i] != block.chainid) {
                _queueCrossChainDeployment(
                    accountId,
                    targetChains[i],
                    owner,
                    salt,
                    moduleConfigs.length > i ? moduleConfigs[i] : bytes("")
                );
            }
        }

        // Track account for owner
        _ownerAccounts[owner].push(accountId);

        emit CrossChainAccountCreated(accountId, owner, salt, targetChains);

        return accountId;
    }

    /**
     * @dev Deploy account on current chain (internal)
     */
    function _deployAccount(
        address owner,
        uint256 salt,
        bytes32 accountId
    ) internal returns (address) {
        bytes memory initData = abi.encodeWithSelector(
            SmartAccount.initialize.selector,
            owner
        );

        bytes32 deploymentSalt = keccak256(abi.encodePacked(accountId, salt));

        try new ERC1967Proxy{salt: deploymentSalt}(accountImplementation, initData) returns (ERC1967Proxy proxy) {
            return address(proxy);
        } catch {
            revert DeploymentFailed();
        }
    }

    /**
     * @dev Queue cross-chain deployment
     */
    function _queueCrossChainDeployment(
        bytes32 accountId,
        uint256 targetChain,
        address owner,
        uint256 salt,
        bytes memory moduleConfig
    ) internal {
        bytes32 messageId = keccak256(abi.encodePacked(
            accountId,
            targetChain,
            owner,
            salt,
            block.timestamp
        ));

        bytes memory message = abi.encode(
            accountId,
            owner,
            salt,
            moduleConfig,
            block.chainid
        );

        emit CrossChainMessage(messageId, block.chainid, targetChain, message);
    }

    /**
     * @dev Process cross-chain deployment message
     * @param messageId Unique message identifier
     * @param accountId Account identifier
     * @param owner Account owner
     * @param salt Deployment salt
     * @param moduleConfig Module configuration
     * @param sourceChain Source chain ID
     */
    function processCrossChainDeployment(
        bytes32 messageId,
        bytes32 accountId,
        address owner,
        uint256 salt,
        bytes calldata moduleConfig,
        uint256 sourceChain
    ) external {
        // Verify message hasn't been processed
        if (processedMessages[messageId]) revert MessageAlreadyProcessed();

        // TODO: Add proper cross-chain message verification
        // In production, this would verify the message came from a trusted source

        processedMessages[messageId] = true;

        // Deploy the account
        address accountAddress = _deployAccount(owner, salt, accountId);

        // Update cross-chain account record
        CrossChainAccount storage account = _crossChainAccounts[accountId];
        account.chainToAddress[block.chainid] = accountAddress;
        account.isDeployed[block.chainid] = true;
        account.deployedChains.push(block.chainid);

        emit AccountDeployedOnChain(accountId, block.chainid, accountAddress);
    }

    /**
     * @dev Get deterministic address for account on any chain
     * @param owner Account owner
     * @param salt Deployment salt
     * @param accountId Account identifier
     * @return Predicted address
     */
    function getAccountAddress(
        address owner,
        uint256 salt,
        bytes32 accountId
    ) external view returns (address) {
        bytes memory initData = abi.encodeWithSelector(
            SmartAccount.initialize.selector,
            owner
        );

        bytes32 deploymentSalt = keccak256(abi.encodePacked(accountId, salt));

        bytes memory bytecode = abi.encodePacked(
            type(ERC1967Proxy).creationCode,
            abi.encode(accountImplementation, initData)
        );

        return Create2.computeAddress(deploymentSalt, keccak256(bytecode));
    }

    /**
     * @dev Get cross-chain account information
     * @param accountId Account identifier
     * @return owner Account owner
     * @return salt Deployment salt
     * @return deployedChains Array of chains where account is deployed
     * @return createdAt Creation timestamp
     */
    function getCrossChainAccount(bytes32 accountId) external view returns (
        address owner,
        uint256 salt,
        uint256[] memory deployedChains,
        uint256 createdAt
    ) {
        CrossChainAccount storage account = _crossChainAccounts[accountId];
        return (
            account.owner,
            account.salt,
            account.deployedChains,
            account.createdAt
        );
    }

    /**
     * @dev Get account address on specific chain
     * @param accountId Account identifier
     * @param chainId Chain ID
     * @return Account address on that chain
     */
    function getAccountOnChain(bytes32 accountId, uint256 chainId) external view returns (address) {
        return _crossChainAccounts[accountId].chainToAddress[chainId];
    }

    /**
     * @dev Check if account is deployed on specific chain
     * @param accountId Account identifier
     * @param chainId Chain ID
     * @return True if deployed
     */
    function isDeployedOnChain(bytes32 accountId, uint256 chainId) external view returns (bool) {
        return _crossChainAccounts[accountId].isDeployed[chainId];
    }

    /**
     * @dev Get all accounts for an owner
     * @param owner Owner address
     * @return Array of account IDs
     */
    function getOwnerAccounts(address owner) external view returns (bytes32[] memory) {
        return _ownerAccounts[owner];
    }

    /**
     * @dev Get supported chains
     * @return Array of supported chain IDs
     */
    function getSupportedChains() external view returns (uint256[] memory) {
        return supportedChains;
    }

    /**
     * @dev Get chain configuration
     * @param chainId Chain ID
     * @return Chain configuration
     */
    function getChainConfig(uint256 chainId) external view returns (ChainConfig memory) {
        return chainConfigs[chainId];
    }

    /**
     * @dev Estimate deployment costs across chains
     * @param targetChains Array of target chain IDs
     * @return Total deployment cost
     */
    function estimateDeploymentCost(uint256[] calldata targetChains) external view returns (uint256) {
        uint256 totalCost = 0;
        for (uint256 i = 0; i < targetChains.length; i++) {
            if (chainConfigs[targetChains[i]].isActive) {
                totalCost += chainConfigs[targetChains[i]].deploymentFee;
            }
        }
        return totalCost;
    }

    /**
     * @dev Enable/disable a chain
     * @param chainId Chain ID
     * @param active Whether chain should be active
     */
    function setChainActive(uint256 chainId, bool active) external onlyOwner {
        chainConfigs[chainId].isActive = active;
    }

    /**
     * @dev Update deployment fee for a chain
     * @param chainId Chain ID
     * @param newFee New deployment fee
     */
    function updateDeploymentFee(uint256 chainId, uint256 newFee) external onlyOwner {
        chainConfigs[chainId].deploymentFee = newFee;
    }

    /**
     * @dev Set cross-chain messenger for a chain
     * @param chainId Chain ID
     * @param messenger Messenger contract address
     */
    function setChainMessenger(uint256 chainId, address messenger) external onlyOwner {
        chainMessengers[chainId] = messenger;
    }

    /**
     * @dev Withdraw collected fees
     * @param to Withdrawal destination
     */
    function withdrawFees(address payable to) external onlyOwner {
        require(to != address(0), "Invalid destination");
        to.transfer(address(this).balance);
    }

    /**
     * @dev Emergency pause for specific chain
     * @param chainId Chain ID to pause
     */
    function emergencyPauseChain(uint256 chainId) external onlyOwner {
        chainConfigs[chainId].isActive = false;
    }

    /**
     * @dev Batch configure multiple chains
     * @param chainIds Array of chain IDs
     * @param entryPoints Array of EntryPoint addresses
     * @param factories Array of factory addresses
     * @param fees Array of deployment fees
     * @param rpcEndpoints Array of RPC endpoints
     */
    function batchConfigureChains(
        uint256[] calldata chainIds,
        address[] calldata entryPoints,
        address[] calldata factories,
        uint256[] calldata fees,
        string[] calldata rpcEndpoints
    ) external onlyOwner {
        require(
            chainIds.length == entryPoints.length &&
            entryPoints.length == factories.length &&
            factories.length == fees.length &&
            fees.length == rpcEndpoints.length,
            "Array length mismatch"
        );

        for (uint256 i = 0; i < chainIds.length; i++) {
            configureChain(chainIds[i], entryPoints[i], factories[i], fees[i], rpcEndpoints[i]);
        }
    }

    /**
     * @dev Get deployment statistics
     * @return totalAccounts Total cross-chain accounts created
     * @return totalDeployments Total deployments across all chains
     * @return activeChains Number of active chains
     */
    function getDeploymentStats() external view returns (
        uint256 totalAccounts,
        uint256 totalDeployments,
        uint256 activeChains
    ) {
        // This would require additional tracking in a production implementation
        // For now, return basic chain count
        activeChains = supportedChains.length;

        for (uint256 i = 0; i < supportedChains.length; i++) {
            if (chainConfigs[supportedChains[i]].isActive) {
                totalAccounts++; // Simplified - would need proper tracking
            }
        }

        return (totalAccounts, totalDeployments, activeChains);
    }
}