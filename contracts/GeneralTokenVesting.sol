// SPDX-License-Identifier: MIT

pragma solidity ^0.6.12;

import "@openzeppelin/contracts/token/ERC20/SafeERC20.sol";
import "@openzeppelin/contracts/math/SafeMath.sol";

/**
 * @title GeneralTokenVesting
 * @dev A token holder contract that can release its token balance gradually like a
 * typical vesting scheme, with a vesting period.
 */

contract GeneralTokenVesting {
    // The vesting schedule is time-based (i.e. using block timestamps as opposed to e.g. block numbers), and is
    // therefore sensitive to timestamp manipulation (which is something miners can do, to a certain degree). Therefore,
    // it is recommended to avoid using short time durations (less than a minute). Typical vesting schemes, with a
    // duration of four years, are safe to use.

    using SafeMath for uint256;
    using SafeERC20 for IERC20;

    event TokensReleased(
        IERC20 token,
        address beneficiary,
        address recipient,
        uint256 amount
    );
    event VestStarted(IERC20 token, address beneficiary, uint256 amount);

    struct Vest {
        uint256 _totalTokens;
        uint256 _releasedTokens;
        uint256 _start;
        uint256 _duration;
    }

    //data mapping for token contract
    mapping(IERC20 => mapping(address => Vest)) public tokenVest;

    /**
     * @dev Creates a vesting contract that vests its balance of any ERC20 token to the
     * beneficiary, gradually in a linear fashion until start + duration. By then all
     * of the balance will have vested.
     * @dev transfers erc20 token to vesting contract to allow the vesting contract to release
     * tokens at the end of the vesting schedule.
     * @param beneficiary addresses of the beneficiaries to whom vested tokens are transferred
     * @param tokensToVest amounts of tokens for the beneficiaries
     * @param vestDuration duration in seconds of the period in which the tokens will vest
     * @param tokenAddress address of the token to be vested
     */

    function startVest(
        address beneficiary,
        uint256 tokensToVest,
        uint256 vestDuration,
        IERC20 tokenAddress
    ) public {
        require(vestDuration > 0, "GeneralTokenVesting: duration is 0");
        require(
            beneficiary != address(0),
            "GeneralTokenVesting: beneficiary is the zero address"
        );
        require(
            address(tokenAddress) != address(0),
            "GeneralTokenVesting: token is the zero address"
        );
        require(tokensToVest != 0, "GeneralTokenVesting: amount is zero");
        require(
            getTotalTokens(tokenAddress, beneficiary) == 0,
            "GeneralTokenVesting: Vest already created for this token => beneficiary"
        );

        uint256 beforeBalance = tokenAddress.balanceOf(address(this));
        tokenAddress.safeTransferFrom(msg.sender, address(this), tokensToVest);
        uint256 afterBalance = tokenAddress.balanceOf(address(this));
        uint256 resultBalance = afterBalance.sub(beforeBalance);
        require(resultBalance != 0, "GeneralTokenVesting: amount is zero");

        Vest memory newVest =
            Vest(resultBalance, 0, block.timestamp, vestDuration);
        tokenVest[tokenAddress][beneficiary] = newVest;

        emit VestStarted(tokenAddress, beneficiary, resultBalance);
    }

    /**
     * @return the start time of the token vesting.
     */
    function getStart(IERC20 token, address beneficiary)
        public
        view
        returns (uint256)
    {
        return tokenVest[token][beneficiary]._start;
    }

    /**
     * @return the total tokens of the token vesting.
     */
    function getTotalTokens(IERC20 token, address beneficiary)
        public
        view
        returns (uint256)
    {
        return tokenVest[token][beneficiary]._totalTokens;
    }

    /**
     * @return the duration of the token vesting.
     */
    function getDuration(IERC20 token, address beneficiary)
        public
        view
        returns (uint256)
    {
        return tokenVest[token][beneficiary]._duration;
    }

    /**
     * @return the amount of the tokens released.
     */
    function getReleasedTokens(IERC20 token, address beneficiary)
        public
        view
        returns (uint256)
    {
        return tokenVest[token][beneficiary]._releasedTokens;
    }

    /**
     * @return the amount of tokens which can be claimed by a beneficiary.
     */
    function getReleasableAmount(IERC20 token, address beneficiary)
        public
        view
        returns (uint256)
    {
        return
            totalVestedAmount(token, beneficiary).sub(
                getReleasedTokens(token, beneficiary)
            );
    }
    /**
     * @notice Transfers vested tokens to beneficiary.
     * @param beneficiary beneficiary to receive the funds
     * @param token address of the token released
     * Private used by release/releaseTo functions
     */
    function _release(
        IERC20 token,
        address beneficiary,
        address recipient
    ) private {
        uint256 unreleased = getReleasableAmount(token, beneficiary);
        require(unreleased > 0, "GeneralTokenVesting: no tokens are due");
        tokenVest[token][beneficiary]._releasedTokens = tokenVest[token][
            beneficiary
        ]
            ._releasedTokens
            .add(unreleased);
        token.safeTransfer(recipient, unreleased);
        emit TokensReleased(token, beneficiary, recipient, unreleased);
    }

    /**
     * @notice Transfers vested tokens to beneficiary.
     * @param beneficiary beneficiary to receive the funds
     * @param token address of the token released
     */
    function release(IERC20 token, address beneficiary) public {
        _release(token, beneficiary, beneficiary);
    }

    /**
     * @notice Transfers beneficiary's tokens to a new recipient.
     * Beneficiary must be msg.sender
     * @param recipient recipient to receive the beneficiary's funds
     * @param token address of the token released
     */
    function releaseTo(IERC20 token, address recipient) public {
        _release(token, msg.sender, recipient);
    }

    /**
     * @dev Calculates the amount that has already vested.
     * @param beneficiary beneficiary address to check
     * @param token address of the token vested
     */
    function totalVestedAmount(IERC20 token, address beneficiary)
        public
        view
        returns (uint256)
    {
        uint256 _startTime = getStart(token, beneficiary);
        uint256 _durationTime = getDuration(token, beneficiary);
        if (block.timestamp < _startTime) {
            return 0;
        } else if (block.timestamp >= _startTime.add(_durationTime)) {
            return getTotalTokens(token, beneficiary);
        } else {
            return
                getTotalTokens(token, beneficiary)
                    .mul(block.timestamp.sub(_startTime))
                    .div(_durationTime);
        }
    }
}
