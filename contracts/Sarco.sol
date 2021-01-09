// SPDX-License-Identifier: MIT

pragma solidity ^0.6.12;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";

contract Sarco is ERC20 {
    constructor(address distributor) ERC20("Sarcophagus", "SARCO") public {
        _mint(distributor, 100 * 10**6 * 10**18);
    }
}
