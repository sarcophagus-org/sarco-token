// SPDX-License-Identifier: Unlicense

pragma solidity ^0.6.12;

import "./TokenVesting.sol";

contract Distributor {
    address[] private _recipients;
    uint256[] private _amounts;

    address[] private _vestRecipients;
    uint256[] private _vestAmounts;

    TokenVesting public vesting;
    
    constructor(
        address[] memory recipients_, uint256[] memory amounts_,
        address[] memory vestRecipients_, uint256[] memory vestAmounts_
    ) public {
        require(recipients_.length == amounts_.length, "Distributor::constructor: recipients_ length must equal amounts_ length");
        require(vestRecipients_.length == vestAmounts_.length, "Distributor::constructor: vestRecipients_ length must equal vestAmounts_ length");

        _recipients = recipients_;
        _amounts = amounts_;

        _vestRecipients = vestRecipients_;
        _vestAmounts = vestAmounts_;
    }

    function distribute(IERC20 token, uint256 duration) public {
        for (uint i = 0; i < _recipients.length; i++) {
            token.transfer(_recipients[i], _amounts[i]);
        }

        uint256 vestTotal;
        for (uint i = 0; i < _vestAmounts.length; i++) {
            vestTotal += _vestAmounts[i];
        }
        require(token.balanceOf(address(this)) == vestTotal, "Distributor::distribute: calculated vest total not equal to distributor balance");

        vesting = new TokenVesting(_vestRecipients, _vestAmounts, block.timestamp, duration);
        vesting.setToken(token);
        token.transfer(address(vesting), vestTotal);
    }
}
