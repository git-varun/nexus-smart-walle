// contracts/contracts/modules/ModuleRegistry.sol
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {IModule} from "../interfaces/IModule.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/introspection/ERC165Checker.sol";

/**
 * @title ModuleRegistry
 * @dev Registry for managing and validating smart wallet modules
 * @author Smart Wallet Team
 */
contract ModuleRegistry is Ownable {
    using ERC165Checker for address;

    // Module information
    struct ModuleInfo {
        string name;
        string version;
        string description;
        address developer;
        bool isActive;
        uint256 registeredAt;
        bytes32 codeHash;
        string[] tags;
        mapping(string => bool) hasTag;
    }

    // Module statistics
    struct ModuleStats {
        uint256 installCount;
        uint256 activeInstalls;
        uint256 lastUsed;
        mapping(address => bool) installedBy;
    }

    // Storage
    mapping(address => ModuleInfo) private _modules;
    mapping(address => ModuleStats) private _moduleStats;
    mapping(string => address[]) private _modulesByTag;
    mapping(bytes32 => address) private _modulesByNameVersion;

    address[] private _allModules;
    mapping(address => bool) private _isRegistered;

    // Registry settings
    mapping(address => bool) public authorizedDevelopers;
    bool public requireAuthorization = false;
    uint256 public registrationFee = 0;

    // Events
    event ModuleRegistered(
        address indexed module,
        string name,
        string version,
        address indexed developer
    );
    event ModuleDeactivated(address indexed module, string reason);
    event ModuleReactivated(address indexed module);
    event ModuleInstalled(address indexed module, address indexed account);
    event ModuleUninstalled(address indexed module, address indexed account);
    event DeveloperAuthorized(address indexed developer);
    event DeveloperDeauthorized(address indexed developer);

    // Errors
    error ModuleAlreadyRegistered();
    error ModuleNotRegistered();
    error InvalidModule();
    error UnauthorizedDeveloper();
    error InsufficientFee();
    error ModuleNotActive();
    error DuplicateNameVersion();

    constructor() Ownable(msg.sender) {}

    /**
     * @dev Register a new module
     * @param module Module contract address
     * @param name Module name
     * @param version Module version
     * @param description Module description
     * @param tags Array of tags for categorization
     */
    function registerModule(
        address module,
        string calldata name,
        string calldata version,
        string calldata description,
        string[] calldata tags
    ) external payable {
        if (_isRegistered[module]) revert ModuleAlreadyRegistered();
        if (requireAuthorization && !authorizedDevelopers[msg.sender]) revert UnauthorizedDeveloper();
        if (msg.value < registrationFee) revert InsufficientFee();

        // Validate module interface
        if (!module.supportsInterface(type(IModule).interfaceId)) revert InvalidModule();

        // Check for duplicate name/version combination
        bytes32 nameVersionHash = keccak256(abi.encodePacked(name, version));
        if (_modulesByNameVersion[nameVersionHash] != address(0)) revert DuplicateNameVersion();

        // Validate module by calling its interface functions
        try IModule(module).name() returns (string memory moduleName) {
            require(
                keccak256(bytes(moduleName)) == keccak256(bytes(name)),
                "Module name mismatch"
            );
        } catch {
            revert InvalidModule();
        }

        try IModule(module).version() returns (string memory moduleVersion) {
            require(
                keccak256(bytes(moduleVersion)) == keccak256(bytes(version)),
                "Module version mismatch"
            );
        } catch {
            revert InvalidModule();
        }

        // Store module info
        ModuleInfo storage info = _modules[module];
        info.name = name;
        info.version = version;
        info.description = description;
        info.developer = msg.sender;
        info.isActive = true;
        info.registeredAt = block.timestamp;
        info.codeHash = keccak256(module.code);
        info.tags = tags;

        // Index by tags
        for (uint256 i = 0; i < tags.length; i++) {
            if (!info.hasTag[tags[i]]) {
                info.hasTag[tags[i]] = true;
                _modulesByTag[tags[i]].push(module);
            }
        }

        // Index by name/version
        _modulesByNameVersion[nameVersionHash] = module;

        // Add to registry
        _allModules.push(module);
        _isRegistered[module] = true;

        emit ModuleRegistered(module, name, version, msg.sender);
    }

    /**
     * @dev Deactivate a module
     * @param module Module address
     * @param reason Reason for deactivation
     */
    function deactivateModule(
        address module,
        string calldata reason
    ) external onlyOwner {
        if (!_isRegistered[module]) revert ModuleNotRegistered();

        _modules[module].isActive = false;
        emit ModuleDeactivated(module, reason);
    }

    /**
     * @dev Reactivate a module
     * @param module Module address
     */
    function reactivateModule(address module) external onlyOwner {
        if (!_isRegistered[module]) revert ModuleNotRegistered();

        _modules[module].isActive = true;
        emit ModuleReactivated(module);
    }

    /**
     * @dev Record module installation
     * @param module Module address
     * @param account Account that installed the module
     */
    function recordInstallation(address module, address account) external {
        if (!_isRegistered[module]) revert ModuleNotRegistered();
        if (!_modules[module].isActive) revert ModuleNotActive();

        ModuleStats storage stats = _moduleStats[module];

        if (!stats.installedBy[account]) {
            stats.installedBy[account] = true;
            stats.installCount++;
            stats.activeInstalls++;
        }

        stats.lastUsed = block.timestamp;
        emit ModuleInstalled(module, account);
    }

    /**
     * @dev Record module uninstallation
     * @param module Module address
     * @param account Account that uninstalled the module
     */
    function recordUninstallation(address module, address account) external {
        if (!_isRegistered[module]) revert ModuleNotRegistered();

        ModuleStats storage stats = _moduleStats[module];

        if (stats.installedBy[account]) {
            stats.installedBy[account] = false;
            stats.activeInstalls--;
        }

        emit ModuleUninstalled(module, account);
    }

    /**
     * @dev Get module information
     * @param module Module address
     * @return name Module name
     * @return version Module version
     * @return description Module description
     * @return developer Developer address
     * @return isActive Whether module is active
     * @return registeredAt Registration timestamp
     * @return tags Module tags
     */
    function getModuleInfo(address module) external view returns (
        string memory name,
        string memory version,
        string memory description,
        address developer,
        bool isActive,
        uint256 registeredAt,
        string[] memory tags
    ) {
        if (!_isRegistered[module]) revert ModuleNotRegistered();

        ModuleInfo storage info = _modules[module];
        return (
            info.name,
            info.version,
            info.description,
            info.developer,
            info.isActive,
            info.registeredAt,
            info.tags
        );
    }

    /**
     * @dev Get module statistics
     * @param module Module address
     * @return installCount Total installations
     * @return activeInstalls Current active installations
     * @return lastUsed Last usage timestamp
     */
    function getModuleStats(address module) external view returns (
        uint256 installCount,
        uint256 activeInstalls,
        uint256 lastUsed
    ) {
        if (!_isRegistered[module]) revert ModuleNotRegistered();

        ModuleStats storage stats = _moduleStats[module];
        return (stats.installCount, stats.activeInstalls, stats.lastUsed);
    }

    /**
     * @dev Get modules by tag
     * @param tag Tag to search for
     * @return Array of module addresses with the tag
     */
    function getModulesByTag(string calldata tag) external view returns (address[] memory) {
        return _modulesByTag[tag];
    }

    /**
     * @dev Find module by name and version
     * @param name Module name
     * @param version Module version
     * @return Module address
     */
    function findModule(
        string calldata name,
        string calldata version
    ) external view returns (address) {
        bytes32 nameVersionHash = keccak256(abi.encodePacked(name, version));
        return _modulesByNameVersion[nameVersionHash];
    }

    /**
     * @dev Get all registered modules
     * @return Array of all module addresses
     */
    function getAllModules() external view returns (address[] memory) {
        return _allModules;
    }

    /**
     * @dev Get active modules
     * @return Array of active module addresses
     */
    function getActiveModules() external view returns (address[] memory) {
        uint256 activeCount = 0;

        // Count active modules
        for (uint256 i = 0; i < _allModules.length; i++) {
            if (_modules[_allModules[i]].isActive) {
                activeCount++;
            }
        }

        // Build active modules array
        address[] memory activeModules = new address[](activeCount);
        uint256 index = 0;

        for (uint256 i = 0; i < _allModules.length; i++) {
            if (_modules[_allModules[i]].isActive) {
                activeModules[index] = _allModules[i];
                index++;
            }
        }

        return activeModules;
    }

    /**
     * @dev Check if module is registered and active
     * @param module Module address
     * @return True if module is registered and active
     */
    function isModuleValid(address module) external view returns (bool) {
        return _isRegistered[module] && _modules[module].isActive;
    }

    /**
     * @dev Get modules by developer
     * @param developer Developer address
     * @return Array of module addresses developed by the developer
     */
    function getModulesByDeveloper(address developer) external view returns (address[] memory) {
        uint256 count = 0;

        // Count modules by developer
        for (uint256 i = 0; i < _allModules.length; i++) {
            if (_modules[_allModules[i]].developer == developer) {
                count++;
            }
        }

        // Build developer modules array
        address[] memory developerModules = new address[](count);
        uint256 index = 0;

        for (uint256 i = 0; i < _allModules.length; i++) {
            if (_modules[_allModules[i]].developer == developer) {
                developerModules[index] = _allModules[i];
                index++;
            }
        }

        return developerModules;
    }

    /**
     * @dev Get popular modules (by install count)
     * @param limit Maximum number of modules to return
     * @return Array of popular module addresses
     */
    function getPopularModules(uint256 limit) external view returns (address[] memory) {
        if (limit == 0 || limit > _allModules.length) {
            limit = _allModules.length;
        }

        // Create array with modules and their install counts
        address[] memory sortedModules = new address[](limit);
        uint256[] memory installCounts = new uint256[](limit);

        // Simple insertion sort for top modules
        for (uint256 i = 0; i < _allModules.length; i++) {
            address module = _allModules[i];
            if (!_modules[module].isActive) continue;

            uint256 installs = _moduleStats[module].installCount;

            // Find insertion position
            for (uint256 j = 0; j < limit; j++) {
                if (sortedModules[j] == address(0) || installs > installCounts[j]) {
                    // Shift elements
                    for (uint256 k = limit - 1; k > j; k--) {
                        sortedModules[k] = sortedModules[k - 1];
                        installCounts[k] = installCounts[k - 1];
                    }

                    sortedModules[j] = module;
                    installCounts[j] = installs;
                    break;
                }
            }
        }

        // Remove empty slots
        uint256 actualCount = 0;
        for (uint256 i = 0; i < limit; i++) {
            if (sortedModules[i] != address(0)) {
                actualCount++;
            } else {
                break;
            }
        }

        address[] memory result = new address[](actualCount);
        for (uint256 i = 0; i < actualCount; i++) {
            result[i] = sortedModules[i];
        }

        return result;
    }

    /**
     * @dev Search modules by name or description
     * @param query Search query
     * @return Array of matching module addresses
     */
    function searchModules(string calldata query) external view returns (address[] memory) {
        address[] memory matches = new address[](_allModules.length);
        uint256 matchCount = 0;

        for (uint256 i = 0; i < _allModules.length; i++) {
            address module = _allModules[i];
            ModuleInfo storage info = _modules[module];

            if (!info.isActive) continue;

            // Check if query matches name or description
            if (
                _contains(info.name, query) ||
                _contains(info.description, query) ||
                _containsTag(info.tags, query)
            ) {
                matches[matchCount] = module;
                matchCount++;
            }
        }

        // Trim results
        address[] memory results = new address[](matchCount);
        for (uint256 i = 0; i < matchCount; i++) {
            results[i] = matches[i];
        }

        return results;
    }

    /**
     * @dev Authorize developer for module registration
     * @param developer Developer address
     */
    function authorizeDeveloper(address developer) external onlyOwner {
        authorizedDevelopers[developer] = true;
        emit DeveloperAuthorized(developer);
    }

    /**
     * @dev Deauthorize developer
     * @param developer Developer address
     */
    function deauthorizeDeveloper(address developer) external onlyOwner {
        authorizedDevelopers[developer] = false;
        emit DeveloperDeauthorized(developer);
    }

    /**
     * @dev Set authorization requirement
     * @param required Whether authorization is required
     */
    function setAuthorizationRequired(bool required) external onlyOwner {
        requireAuthorization = required;
    }

    /**
     * @dev Set registration fee
     * @param fee New registration fee
     */
    function setRegistrationFee(uint256 fee) external onlyOwner {
        registrationFee = fee;
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
     * @dev Check if account has installed module
     * @param module Module address
     * @param account Account address
     * @return True if module is installed by account
     */
    function hasModuleInstalled(
        address module,
        address account
    ) external view returns (bool) {
        return _moduleStats[module].installedBy[account];
    }

    /**
     * @dev Get registry statistics
     * @return totalModules Total registered modules
     * @return activeModules Total active modules
     * @return totalInstalls Total installations across all modules
     */
    function getRegistryStats() external view returns (
        uint256 totalModules,
        uint256 activeModules,
        uint256 totalInstalls
    ) {
        totalModules = _allModules.length;

        for (uint256 i = 0; i < _allModules.length; i++) {
            address module = _allModules[i];
            if (_modules[module].isActive) {
                activeModules++;
            }
            totalInstalls += _moduleStats[module].installCount;
        }
    }

    /**
     * @dev Batch register multiple modules
     * @param modules Array of module addresses
     * @param names Array of module names
     * @param versions Array of module versions
     * @param descriptions Array of module descriptions
     * @param tags Array of tag arrays for each module
     */
    function batchRegisterModules(
        address[] calldata modules,
        string[] calldata names,
        string[] calldata versions,
        string[] calldata descriptions,
        string[][] calldata tags
    ) external payable {
        require(
            modules.length == names.length &&
            names.length == versions.length &&
            versions.length == descriptions.length &&
            descriptions.length == tags.length,
            "Array length mismatch"
        );

        uint256 totalFee = registrationFee * modules.length;
        if (msg.value < totalFee) revert InsufficientFee();

        for (uint256 i = 0; i < modules.length; i++) {
            // Note: This simplified approach doesn't handle individual failures
            // In production, you'd want more sophisticated error handling
            this.registerModule{value: registrationFee}(
                modules[i],
                names[i],
                versions[i],
                descriptions[i],
                tags[i]
            );
        }
    }

    // Helper functions
    function _contains(string memory str, string memory query) private pure returns (bool) {
        bytes memory strBytes = bytes(str);
        bytes memory queryBytes = bytes(query);

        if (queryBytes.length > strBytes.length) return false;
        if (queryBytes.length == 0) return true;

        for (uint256 i = 0; i <= strBytes.length - queryBytes.length; i++) {
            bool found = true;
            for (uint256 j = 0; j < queryBytes.length; j++) {
                if (strBytes[i + j] != queryBytes[j]) {
                    found = false;
                    break;
                }
            }
            if (found) return true;
        }

        return false;
    }

    function _containsTag(string[] memory tags, string memory query) private pure returns (bool) {
        for (uint256 i = 0; i < tags.length; i++) {
            if (keccak256(bytes(tags[i])) == keccak256(bytes(query))) {
                return true;
            }
        }
        return false;
    }
}
