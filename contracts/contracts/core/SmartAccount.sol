// contracts/contracts/core/SmartAccount.sol
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "@account-abstraction/contracts/core/BaseAccount.sol";
import "@account-abstraction/contracts/interfaces/PackedUserOperation.sol";
import "@openzeppelin/contracts/utils/cryptography/ECDSA.sol";
import "@openzeppelin/contracts/utils/cryptography/MessageHashUtils.sol";
import "@openzeppelin/contracts/proxy/utils/Initializable.sol";
import "@openzeppelin/contracts/proxy/utils/UUPSUpgradeable.sol";
import "@openzeppelin/contracts/utils/introspection/IERC165.sol";
import "@openzeppelin/contracts/interfaces/IERC1271.sol";
import "../interfaces/ISmartAccount.sol";
import "../interfaces/IModule.sol";

/**
 * @title SmartAccount
 * @dev ERC-4337 compatible smart contract wallet with modular architecture
 * @author Smart Wallet Team
 */
contract SmartAccount is
    BaseAccount,
    UUPSUpgradeable,
    Initializable,
    IERC1271,
    ISmartAccount
{
    using ECDSA for bytes32;
    using MessageHashUtils for bytes32;

    // Storage
    address private _owner;
    uint256 private _nonce;
    mapping(address => bool) private _modules;
    address[] private _modulesList;

    // Constants
    bytes4 private constant MAGICVALUE = 0x1626ba7e;
    bytes4 private constant INVALID_SIGNATURE = 0xffffffff;

    // Modifiers
    modifier onlyOwner() {
        require(msg.sender == _owner, "SmartAccount: caller is not the owner");
        _;
    }

    modifier onlyOwnerOrModule() {
        require(
            msg.sender == _owner || _modules[msg.sender],
            "SmartAccount: caller is not owner or module"
        );
        _;
    }

    modifier onlyEntryPointOrOwner() {
        require(
            msg.sender == address(entryPoint()) || msg.sender == _owner,
            "SmartAccount: caller is not EntryPoint or owner"
        );
        _;
    }

    /**
     * @dev Constructor - disable initializers for implementation
     */
    constructor(IEntryPoint anEntryPoint) BaseAccount(anEntryPoint) {
        _disableInitializers();
    }

    /**
     * @dev Initialize the smart account
     * @param owner_ Initial owner of the account
     */
    function initialize(address owner_) external override initializer {
        if (owner_ == address(0)) revert InvalidOwner();
        _owner = owner_;
        emit OwnershipTransferred(address(0), owner_);
    }

    /**
     * @dev Execute a transaction
     * @param target Target contract address
     * @param value ETH value to send
     * @param data Call data
     */
    function execute(
        address target,
        uint256 value,
        bytes calldata data
    ) external override onlyEntryPointOrOwner {
        _execute(target, value, data);
        emit Executed(target, value, data);
    }

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
    ) external override onlyEntryPointOrOwner {
        require(
            targets.length == values.length && targets.length == datas.length,
            "SmartAccount: array length mismatch"
        );

        for (uint256 i = 0; i < targets.length; i++) {
            _execute(targets[i], values[i], datas[i]);
            emit Executed(targets[i], values[i], datas[i]);
        }
    }

    /**
     * @dev Add a module to the account
     * @param module Module address to add
     */
    function addModule(address module) external override onlyOwner {
        if (module == address(0)) revert InvalidModule();
        if (_modules[module]) return; // Already added

        _modules[module] = true;
        _modulesList.push(module);

        // Initialize module if it supports the interface
        if (IERC165(module).supportsInterface(type(IModule).interfaceId)) {
            IModule(module).init(address(this), "");
        }

        emit ModuleAdded(module);
    }

    /**
     * @dev Remove a module from the account
     * @param module Module address to remove
     */
    function removeModule(address module) external override onlyOwner {
        if (!_modules[module]) revert InvalidModule();

        _modules[module] = false;

        // Remove from modules list
        for (uint256 i = 0; i < _modulesList.length; i++) {
            if (_modulesList[i] == module) {
                _modulesList[i] = _modulesList[_modulesList.length - 1];
                _modulesList.pop();
                break;
            }
        }

        // Deinitialize module if it supports the interface
        if (IERC165(module).supportsInterface(type(IModule).interfaceId)) {
            IModule(module).deinit(address(this));
        }

        emit ModuleRemoved(module);
    }

    /**
     * @dev Check if address is an enabled module
     * @param module Module address to check
     * @return True if module is enabled
     */
    function isModuleEnabled(address module) external view override returns (bool) {
        return _modules[module];
    }

    /**
     * @dev Get the current owner
     * @return Owner address
     */
    function owner() external view override returns (address) {
        return _owner;
    }

    /**
     * @dev Get the current nonce
     * @return Current nonce value
     */
    function getNonce() external view override returns (uint256) {
        return _nonce;
    }

    /**
     * @dev Get list of enabled modules
     * @return Array of module addresses
     */
    function getModules() external view returns (address[] memory) {
        return _modulesList;
    }

    /**
     * @dev Transfer ownership to a new owner
     * @param newOwner New owner address
     */
    function transferOwnership(address newOwner) external onlyOwner {
        if (newOwner == address(0)) revert InvalidOwner();
        address oldOwner = _owner;
        _owner = newOwner;
        emit OwnershipTransferred(oldOwner, newOwner);
    }

    /**
     * @dev Validate user operation signature
     * @param userOp User operation to validate
     * @param userOpHash Hash of the user operation
     * @return validationData Packed validation data
     */
    function _validateSignature(
        PackedUserOperation calldata userOp,
        bytes32 userOpHash
    ) internal view override returns (uint256 validationData) {
        bytes32 hash = userOpHash.toEthSignedMessageHash();
        address recovered = hash.recover(userOp.signature);

        if (recovered == _owner) {
            return 0; // Valid signature
        }

        // Check if signature is from an enabled module
        if (_modules[recovered]) {
            return 0; // Valid module signature
        }

        return 1; // Invalid signature
    }

    /**
     * @dev Get the current nonce for EntryPoint
     */
    function nonce() public view override returns (uint256) {
        return _nonce;
    }

    /**
     * @dev Increment nonce
     */
    function _incrementNonce() internal {
        _nonce++;
    }

    /**
     * @dev Internal execute function
     * @param target Target address
     * @param value ETH value
     * @param data Call data
     */
    function _execute(address target, uint256 value, bytes memory data) internal {
        if (target == address(0)) revert ExecutionFailed();

        (bool success, bytes memory result) = target.call{value: value}(data);
        if (!success) {
            // If there's a return value, bubble up the revert reason
            if (result.length > 0) {
                assembly {
                    let returndata_size := mload(result)
                    revert(add(32, result), returndata_size)
                }
            } else {
                revert ExecutionFailed();
            }
        }
    }

    /**
     * @dev EIP-1271 signature validation
     * @param hash Hash of the data
     * @param signature Signature to validate
     * @return magicValue EIP-1271 magic value if valid
     */
    function isValidSignature(
        bytes32 hash,
        bytes memory signature
    ) external view override returns (bytes4 magicValue) {
        bytes32 messageHash = hash.toEthSignedMessageHash();
        address recovered = messageHash.recover(signature);

        if (recovered == _owner || _modules[recovered]) {
            return MAGICVALUE;
        }

        return INVALID_SIGNATURE;
    }

    /**
     * @dev UUPS upgrade authorization
     * @param newImplementation New implementation address
     */
    function _authorizeUpgrade(address newImplementation) internal view override {
        (newImplementation); // Silence unused parameter warning
        require(msg.sender == _owner, "SmartAccount: unauthorized upgrade");
    }

    /**
     * @dev Receive ETH
     */
    receive() external payable {}

    /**
     * @dev Fallback function to handle module calls
     */
    fallback() external payable {
        address module = _findModuleForSelector(msg.sig);
        if (module != address(0) && _modules[module]) {
            // Delegate call to module
            (bool success, bytes memory result) = module.delegatecall(msg.data);
            if (!success) {
                if (result.length > 0) {
                    assembly {
                        let returndata_size := mload(result)
                        revert(add(32, result), returndata_size)
                    }
                } else {
                    revert("SmartAccount: module call failed");
                }
            } else {
                assembly {
                    let returndata_size := mload(result)
                    return(add(32, result), returndata_size)
                }
            }
        }
        revert("SmartAccount: function not found");
    }

    /**
     * @dev Find module that handles a specific function selector
     * @param selector Function selector
     * @return module Module address or zero if not found
     */
    function _findModuleForSelector(bytes4 selector) internal view returns (address module) {
        // This is a simplified implementation
        // In production, you'd have a more sophisticated module routing system
        for (uint256 i = 0; i < _modulesList.length; i++) {
            if (_modules[_modulesList[i]]) {
                // Check if module supports this selector
                // This would require modules to implement a function selector registry
                return _modulesList[i];
            }
        }
        return address(0);
    }

    /**
     * @dev Override _validateNonce to increment our internal nonce
     */
    function _validateNonce(uint256 nonce_) internal override {
        require(nonce_ == _nonce, "SmartAccount: invalid nonce");
        _incrementNonce();
    }
}