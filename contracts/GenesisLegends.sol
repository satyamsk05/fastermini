// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/Strings.sol";

contract GenesisLegends is ERC721, Ownable {
    using Strings for uint256;

    uint256 public constant MAX_SUPPLY = 5555;
    uint256 public mintPrice;
    uint256 public totalMinted;
    bool public isMintEnabled;
    string public baseTokenURI;

    mapping(address => bool) public hasUserMinted;

    event MintPriceChanged(uint256 newPrice);
    event BaseURIChanged(string newBaseURI);
    event MintStatusChanged(bool isEnabled);

    constructor(string memory initialBaseURI, uint256 initialPrice) ERC721("Genesis Legends", "GL") Ownable(msg.sender) {
        baseTokenURI = initialBaseURI;
        mintPrice = initialPrice;
        isMintEnabled = true;
    }

    function mint() external payable {
        require(isMintEnabled, "Mint is not enabled");
        require(totalMinted < MAX_SUPPLY, "Max supply reached");
        require(!hasUserMinted[msg.sender], "Wallet has already minted");
        require(msg.value >= mintPrice, "Insufficient ETH sent");

        hasUserMinted[msg.sender] = true;
        uint256 tokenId = totalMinted + 1;
        totalMinted++;

        _safeMint(msg.sender, tokenId);
    }

    function setMintPrice(uint256 _newPrice) external onlyOwner {
        mintPrice = _newPrice;
        emit MintPriceChanged(_newPrice);
    }

    function setBaseURI(string calldata _newBaseURI) external onlyOwner {
        baseTokenURI = _newBaseURI;
        emit BaseURIChanged(_newBaseURI);
    }

    function setMintEnabled(bool _isEnabled) external onlyOwner {
        isMintEnabled = _isEnabled;
        emit MintStatusChanged(_isEnabled);
    }

    function withdraw() external onlyOwner {
        (bool success, ) = owner().call{value: address(this).balance}("");
        require(success, "Withdraw failed");
    }

    function getTotalMinted() external view returns (uint256) {
        return totalMinted;
    }

    function tokenURI(uint256 tokenId) public view virtual override returns (string memory) {
        require(ownerOf(tokenId) != address(0), "ERC721Metadata: URI query for nonexistent token");
        return bytes(baseTokenURI).length > 0 ? string(abi.encodePacked(baseTokenURI, tokenId.toString())) : "";
    }
}
