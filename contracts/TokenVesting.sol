// SPDX-License-Identifier: Unlicense

pragma solidity ^0.6.12;

import "@openzeppelin/contracts/token/ERC20/SafeERC20.sol";
import "@openzeppelin/contracts/math/SafeMath.sol";

/**
 * @title TokenVesting
 * @dev A token holder contract that can release its token balance gradually like a
 * typical vesting scheme, with and vesting period.
 */
contract TokenVesting {
    // The vesting schedule is time-based (i.e. using block timestamps as opposed to e.g. block numbers), and is
    // therefore sensitive to timestamp manipulation (which is something miners can do, to a certain degree). Therefore,
    // it is recommended to avoid using short time durations (less than a minute). Typical vesting schemes, with a
    // duration of four years, are safe to use.

    using SafeMath for uint256;
    using SafeERC20 for IERC20;

    event TokensReleased(address token, address beneficiary, uint256 amount);

    // Durations and timestamps are expressed in UNIX time, the same units as block.timestamp.
    uint256 private _start;
    uint256 private _duration;

    IERC20 private _token;

    // beneficiary token amounts and released amounts
    mapping (address => uint256) private _totalTokens;
    mapping (address => uint256) private _releasedTokens;

    /**
     * @dev Creates a vesting contract that vests its balance of any ERC20 token to the
     * beneficiary, gradually in a linear fashion until start + duration. By then all
     * of the balance will have vested.
     * @param beneficiaries addresses of the beneficiaries to whom vested tokens are transferred
     * @param amounts amounts of tokens for the beneficiaries
     * @param start the time (as Unix time) at which point vesting starts
     * @param duration duration in seconds of the period in which the tokens will vest
     */
    constructor (address[] memory beneficiaries, uint256[] memory amounts, uint256 start, uint256 duration) public {
        require(duration > 0, "TokenVesting: duration is 0");
        require(start.add(duration) > block.timestamp, "TokenVesting: final time is before current time");

        require(beneficiaries.length == amounts.length, "TokenVesting: beneficiaries length is not equal to amounts length");

        for (uint i = 0; i < beneficiaries.length; i++) {
            require(beneficiaries[i] != address(0), "TokenVesting: beneficiary is the zero address");
            require(amounts[i] != 0, "TokenVesting: amount is zero");
            _totalTokens[beneficiaries[i]] = amounts[i];
        }

        _duration = duration;
        _start = start;
    }

    function setToken(IERC20 token) public {
        require(address(_token) == address(0), "TokenVesting: _token is not the zero address");
        _token = token;
    }

    /**
     * @return the token that this contract is holding as vest
     */
    function token() public view returns (address) {
        return address(_token);
    }

    /**
     * @return the amount of tokens for the given beneficiary of the tokens.
     */
    function totalTokens(address beneficiary) public view returns (uint256) {
        return _totalTokens[beneficiary];
    }

    /**
     * @return the start time of the token vesting.
     */
    function start() public view returns (uint256) {
        return _start;
    }

    /**
     * @return the duration of the token vesting.
     */
    function duration() public view returns (uint256) {
        return _duration;
    }

    /**
     * @return the amount of the token released.
     */
    function releasedTokens(address beneficiary) public view returns (uint256) {
        return _releasedTokens[beneficiary];
    }

    /**
     * @notice Transfers vested tokens to beneficiary.
     * @param beneficiary beneficiary to receive the funds
     */
    function release(address beneficiary) public {
        uint256 unreleased = _releasableAmount(beneficiary);

        require(unreleased > 0, "TokenVesting: no tokens are due");

        _releasedTokens[beneficiary] = _releasedTokens[beneficiary].add(unreleased);

        _token.safeTransfer(beneficiary, unreleased);

        emit TokensReleased(address(_token), beneficiary, unreleased);
    }

    /**
     * @dev Calculates the amount that has already vested but hasn't been released yet.
     * @param beneficiary beneficiary address to check
     */
    function _releasableAmount(address beneficiary) private view returns (uint256) {
        return _vestedAmount(beneficiary).sub(_releasedTokens[beneficiary]);
    }

    /**
     * @dev Calculates the amount that has already vested.
     * @param beneficiary beneficiary address to check
     */
    function _vestedAmount(address beneficiary) private view returns (uint256) {
        if (block.timestamp >= _start.add(_duration)) {
            return _totalTokens[beneficiary];
        } else {
            return _totalTokens[beneficiary].mul(block.timestamp.sub(_start)).div(_duration);
        }
    }
}
 