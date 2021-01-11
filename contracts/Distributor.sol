// SPDX-License-Identifier: MIT

pragma solidity ^0.6.12;

import "./TokenVesting.sol";

/**
 * @title Distributor
 * @dev A distribution contract, which is given tokens, and two lists of addresses and amounts
 * which the given tokens are distributed to.
 */
contract Distributor {
    // Token recipients and amounts state
    address[] private _immediateRecipients;
    uint256[] private _immediateAmounts;
    address[] private _vestRecipients;
    uint256[] private _vestAmounts;

    // The TokenVesting instance which this contract will deploy
    TokenVesting private _vesting;

    // Authorization
    address private _deployer;
    bool private _distributed;
    
    /**
     * @dev Creates a distribution contract that temporarily holds a set of tokens, to be distributed.
     * These tokens are sent to two lists of addresses, one list being addresses which should immediately
     * receive thier tokens, the other list being addresses that need to have their tokens vested over
     * some period of time.
     * @param immediateRecipients_ addresses which should immediately receive their tokens
     * @param immediateAmounts_ token amounts that correpsond to the immediateRecipients_ addresses
     * @param vestRecipients_ addresses which should have their tokens vest over some period of time
     * @param vestAmounts_ token amounts that correpsond to the vestRecipients_ addresses
     */
    constructor(
        address[] memory immediateRecipients_, uint256[] memory immediateAmounts_,
        address[] memory vestRecipients_, uint256[] memory vestAmounts_
    ) public {
        require(
            immediateRecipients_.length == immediateAmounts_.length,
            "Distributor::constructor: immediateRecipients_ length must equal immediateAmounts_ length"
        );
        require(
            vestRecipients_.length == vestAmounts_.length,
            "Distributor::constructor: vestRecipients_ length must equal vestAmounts_ length"
        );

        _immediateRecipients = immediateRecipients_;
        _immediateAmounts = immediateAmounts_;

        _vestRecipients = vestRecipients_;
        _vestAmounts = vestAmounts_;

        // Save the deployer address, so that we can be sure that only that address calls `distribute`
        _deployer = msg.sender;
    }

    /**
     * @return the vesting contract address which this contract created
     */
    function vesting() public view returns (address) {
        return address(_vesting);
    }

    /**
     * @notice Distributes tokens to immediate recipients,
     * creates a new TokenVesting contract, and sends the tokens to-be-vested to that contract
     * @param token the ERC20 token which to operate on
     * @param start the time at which tokens start to vest
     * @param duration the TokenVesting duration
     */
    function distribute(IERC20 token, uint256 start, uint256 duration) public {
        // Only callable one tine
        require(_distributed == false, "Distributor::distribute: _distributed is true");
        _distributed = true;

        // Only the address which deployed this contract can call `distribute`
        require(msg.sender == _deployer, "Distributor::distribute: distributor is not deployer");

        // Send tokens directly to recipient addresses with no vesting
        for (uint i = 0; i < _immediateRecipients.length; i++) {
            token.transfer(_immediateRecipients[i], _immediateAmounts[i]);
        }

        // Calculate the amount of tokens to be vested
        uint256 vestTotal;
        for (uint i = 0; i < _vestAmounts.length; i++) {
            vestTotal += _vestAmounts[i];
        }

        // Create new TokenVesting contract which will be shared between all vesting addresses, send tokens to it
        _vesting = new TokenVesting(_vestRecipients, _vestAmounts, start, duration, token);
        token.transfer(address(_vesting), vestTotal);

        // Sanity check
        require(token.balanceOf(address(this)) == 0, "Distributor::distribute: distributor balance not 0");
    }
}
