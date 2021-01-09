// SPDX-License-Identifier: Unlicense

pragma solidity ^0.6.12;

import "./TokenVesting.sol";

contract Distributor {
    address[] private _recipients;
    uint256[] private _amounts;
    bool[] private _vests;

    mapping(address => bool) private _distributed;
    mapping(address => TokenVesting) public vestings;

    constructor(address[] memory recipients_, uint256[] memory amounts_, bool[] memory vests_) public {
        require(recipients_.length == amounts_.length, "Distributor::constructor: recipients_ length must equal amounts_ length");
        require(amounts_.length == vests_.length, "Distributor::constructor: amounts_ length must equal vests_ length");

        _recipients = recipients_;
        _amounts = amounts_;
        _vests = vests_;
    }

    function distribute(IERC20 token, uint8 startIndex, uint8 length) public {
        for (uint i = startIndex; i < startIndex + length; i++) {
            address recipient = _recipients[i];
            uint256 amount = _amounts[i] * 10**18;
            bool vest = _vests[i];

            require(!_distributed[recipient], "Distributor::distribute: already distributed recipient");
            _distributed[recipient] = true;

            if (vest) {
                TokenVesting vesting = new TokenVesting(recipient, block.timestamp, 365 days * 2);
                vestings[recipient] = vesting;
                token.transfer(address(vesting), amount);
            } else {
                token.transfer(recipient, amount);
            }
        }
    }
}
