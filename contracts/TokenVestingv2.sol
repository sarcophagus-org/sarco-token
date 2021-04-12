// SPDX-License-Identifier: MIT

pragma solidity ^0.6.12;

import "@openzeppelin/contracts/token/ERC20/SafeERC20.sol";
import "@openzeppelin/contracts/math/SafeMath.sol";

/**
 * @title TokenVestingv2
 * @dev A token holder contract that can release its token balance gradually like a
 * typical vesting scheme, with a vesting period.
 */

contract TokenVestingv2 {
    // The vesting schedule is time-based (i.e. using block timestamps as opposed to e.g. block numbers), and is
    // therefore sensitive to timestamp manipulation (which is something miners can do, to a certain degree). Therefore,
    // it is recommended to avoid using short time durations (less than a minute). Typical vesting schemes, with a
    // duration of four years, are safe to use.

    using SafeMath for uint256;
    using SafeERC20 for IERC20;

    event TokensReleased(IERC20 token, address beneficiary, uint256 amount);
    event VestStarted(IERC20 token, address beneficiary, uint256 amount);

    struct investment {
        uint256 _totalTokens;
        uint256 _releasedTokens;
        uint256 _start;
        uint256 _duration;
        bool _investorAddressCreated;
    }

    //data mapping for token contract
    mapping (IERC20 => mapping (address =>  investment)) public _tokenVest;

    /**
     * @dev Creates a vesting contract that vests its balance of any ERC20 token to the
     * beneficiary, gradually in a linear fashion until start + duration. By then all
     * of the balance will have vested.
     * @dev transfers erc20 token to vesting contract to allow the vesting contract to release 
     * tokens at the end of the vesting schedule.
     * @param _beneficiary addresses of the beneficiaries to whom vested tokens are transferred
     * @param _tokensToVest amounts of tokens for the beneficiaries
     * @param _vestDuration duration in seconds of the period in which the tokens will vest
     * @param _tokenAddress address of the token to be vested
     */

    function startVest(address _beneficiary, uint256 _tokensToVest, uint256 _vestDuration, IERC20 _tokenAddress) public {
        require(_vestDuration > 0, 'TokenVestingv2: duration is 0');
        require(getInvestorCreated(_tokenAddress, _beneficiary) != true, "_beneficiary already created for this token");
        require(_beneficiary != address(0), "TokenVestingv2: beneficiary is the zero address");
        require(_tokensToVest != 0, 'TokenVestingv2: amount is zero');
        
        uint256 beforeBalance = _tokenAddress.balanceOf(address(this));
        _tokenAddress.safeTransferFrom(msg.sender, address(this), _tokensToVest);
        uint256 afterBalance = _tokenAddress.balanceOf(address(this));
        uint256 resultBalalnce = afterBalance.sub(beforeBalance);

        investment memory newInvestment = investment(resultBalalnce, 0, block.timestamp, _vestDuration, true);
        _tokenVest[_tokenAddress][_beneficiary] = newInvestment;        

        emit VestStarted(_tokenAddress, _beneficiary, resultBalalnce);
    }

     /**
     * @return the start time of the token vesting.
     */
    function getStart(IERC20 token, address beneficiary) public view returns (uint256) {
        return _tokenVest[token][beneficiary]._start;
    }
    
    /**
     * @return the total tokens of the token vesting.
     */
    function getTotalTokens(IERC20 token, address beneficiary) public view returns (uint256) {
        return _tokenVest[token][beneficiary]._totalTokens;
    }

    /**
     * @return the duration of the token vesting.
     */
    function getDuration(IERC20 token, address beneficiary) public view returns (uint256) {
        return _tokenVest[token][beneficiary]._duration;
    }

    /**
     * @return the duration of the token vesting.
     */
    function getInvestorCreated(IERC20 token, address beneficiary) public view returns (bool) {
        return _tokenVest[token][beneficiary]._investorAddressCreated;
    }


    /**
     * @return the amount of the token released.
     */
    function getReleasedTokens(IERC20 token, address beneficiary) public view returns (uint256) {
        return _tokenVest[token][beneficiary]._releasedTokens;
    }

    /**
     * @return the amount of tokens which can be claimed by a beneficiary.
     */
    function getReleasableAmount(IERC20 token, address beneficiary) public view returns (uint256) {
        return _vestedAmount(token, beneficiary).sub(getReleasedTokens(token, beneficiary));
    }

    /**
     * @notice Transfers vested tokens to beneficiary.
     * @param beneficiary beneficiary to receive the funds
     * @param token address of the token released
     */
    function release(IERC20 token, address beneficiary) public {
        uint256 unreleased = getReleasableAmount(token, beneficiary);
        require(unreleased > 0, "TokenVesting: no tokens are due");
        _tokenVest[token][beneficiary]._releasedTokens = _tokenVest[token][beneficiary]._releasedTokens.add(unreleased);
        token.safeTransfer(beneficiary, unreleased);
        emit TokensReleased(token, beneficiary, unreleased);
    }

    /**
     * @dev Calculates the amount that has already vested.
     * @param beneficiary beneficiary address to check
     * @param token address of the token vested
     */
    function _vestedAmount(IERC20 token, address beneficiary) private view returns (uint256) {
        uint256 _startTime = getStart(token, beneficiary);
        uint256 _durationTime = getDuration(token, beneficiary);
        if (block.timestamp < _startTime) {
            return 0;
        } else if (block.timestamp >= _startTime.add(_durationTime)) {
            return getTotalTokens(token, beneficiary);
        } else {
            return getTotalTokens(token, beneficiary).mul(block.timestamp.sub(_startTime)).div(_durationTime);
        }
    }
}
