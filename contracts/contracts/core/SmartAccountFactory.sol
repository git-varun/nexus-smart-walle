// contracts/contracts/core/SmartAccountFactory.sol
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "@openzeppelin/contracts/utils/Create2.sol";
import "@openzeppelin/contracts/proxy/ERC1967/ERC1967Proxy.sol";
import "./SmartAccount.sol";

/**
 * @title SmartAccountFactory
 * @dev Factory contract for deploying SmartAccount instances using CREATE2
 * @author Smart Wallet Team
 */
contract SmartAccountFactory {
    // Events
    event SmartAccountCreated(
        address indexed account,
        address indexed owner,
        uint256 salt
    );

    // Storage
    address public immutable accountImplementation;
    IEntryPoint public immutable entryPoint;

    // Errors
    error AccountAlreadyExists();
    error InvalidOwner();

    /**
     * @dev Constructor
     * @param _entryPoint EntryPoint contract address
     */
    constructor(IEntryPoint _entryPoint) {
        entryPoint = _entryPoint;
        accountImplementation = address(new SmartAccount(_entryPoint));
    }

    /**
     * @dev Create a smart account for owner
     * @param owner Account owner address
     * @param salt Salt for CREATE2
     * @return account Created account address
     */
    function createAccount(
        address owner,
        uint256 salt
    ) external returns (SmartAccount account) {
        if (owner == address(0)) revert InvalidOwner();

        address addr = getAddress(owner, salt);
        uint256 codeSize = addr.code.length;

        if (codeSize > 0) {
            return SmartAccount(payable(addr));
        }

        bytes memory initData = abi.encodeWithSelector(
            SmartAccount.initialize.selector,
            owner
        );

        account = SmartAccount(payable(
            new ERC1967Proxy{salt: bytes32(salt)}(
                accountImplementation,
                initData
            )
        ));

        emit SmartAccountCreated(address(account), owner, salt);
    }

    /**
     * @dev Calculate the counterfactual address of a smart account
     * @param owner Account owner address
     * @param salt Salt for CREATE2
     * @return Address that the account will have
     */
    function getAddress(
        address owner,
        uint256 salt
    ) public view returns (address) {
        bytes memory initData = abi.encodeWithSelector(
            SmartAccount.initialize.selector,
            owner
        );

        bytes memory bytecode = abi.encodePacked(
            type(ERC1967Proxy).creationCode,
            abi.encode(accountImplementation, initData)
        );

        return Create2.computeAddress(
            bytes32(salt),
            keccak256(bytecode)
        );
    }

    /**
     * @dev Check if account is deployed
     * @param owner Account owner address
     * @param salt Salt used for deployment
     * @return True if account is deployed
     */
    function isAccountDeployed(
        address owner,
        uint256 salt
    ) external view returns (bool) {
        address addr = getAddress(owner, salt);
        return addr.code.length > 0;
    }

    /**
     * @dev Get initCode for account creation
     * @param owner Account owner address
     * @param salt Salt for CREATE2
     * @return initCode Initialization code for the account
     */
    function getInitCode(
        address owner,
        uint256 salt
    ) external view returns (bytes memory initCode) {
        bytes memory createCall = abi.encodeWithSelector(
            this.createAccount.selector,
            owner,
            salt
        );
        return abi.encodePacked(address(this), createCall);
    }
}