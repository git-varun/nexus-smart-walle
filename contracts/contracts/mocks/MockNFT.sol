// contracts/contracts/mocks/MockNFT.sol
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "@openzeppelin/contracts/token/ERC721/ERC721.sol";

/**
 * @title MockNFT
 * @dev Mock NFT contract for testing
 */
contract MockNFT is ERC721 {
    uint256 private _currentTokenId = 0;

    constructor(
        string memory name,
        string memory symbol
    ) ERC721(name, symbol) {}

    function mint(address to) internal returns (uint256) {
        uint256 tokenId = _currentTokenId++;
        _mint(to, tokenId);
        return tokenId;
    }

    function mintBatch(address to, uint256 amount) external {
        for (uint256 i = 0; i < amount; i++) {
            mint(to);
        }
    }
}