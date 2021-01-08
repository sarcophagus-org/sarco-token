// SPDX-License-Identifier: Unlicense

pragma solidity ^0.6.12;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";

contract Mintable is ERC20 {
    constructor() ERC20("Mintable", "MINT") public {}

    function mint(address to_, uint256 amount_) public {
        _mint(to_, amount_);
    }
}
