// SPDX-License-Identifier: MIT

pragma solidity ^0.6.12;

import "@openzeppelin/contracts/math/SafeMath.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts-upgradeable/proxy/Initializable.sol";

contract SarcoStaking is Initializable {
    using SafeMath for uint256;

    IERC20 internal sarcoToken;

    struct Checkpoint {
        uint128 fromBlock;
        uint128 value;
    }

    mapping(address => uint256) public stakeValue;
    mapping(address => Checkpoint[]) stakeValueHistory;

    uint256 public totalStaked;
    uint256 public totalStakers;
    Checkpoint[] totalStakedHistory;

    event OnStake(address sender, uint256 amount);
    event OnUnstake(address sender, uint256 amount);

    function initialize(IERC20 _sarcoToken) external initializer {
        sarcoToken = _sarcoToken;
    }

    function stake(uint256 _amount) public {
        require(_amount >= 1e18, "Must stake at least one SARCO.");
        require(
            sarcoToken.balanceOf(msg.sender) >= _amount,
            "Cannot stake more SARCO than you hold unstaked."
        );
        
        if (stakeValue[msg.sender] == 0) {
            totalStakers = totalStakers.add(1);
        }

        // Update staker's history
        _updateCheckpointValueAtNow(
            stakeValueHistory[msg.sender],
            stakeValue[msg.sender],
            stakeValue[msg.sender].add(_amount)
        );

        // Update total staked history
        _updateCheckpointValueAtNow(
            totalStakedHistory,
            totalStaked,
            totalStaked.add(_amount)
        );

        totalStaked = totalStaked.add(_amount);
        stakeValue[msg.sender] = stakeValue[msg.sender].add(_amount);

        require(
            sarcoToken.transferFrom(msg.sender, address(this), _amount),
            "Stake failed due to failed transfer."
        );

        emit OnStake(msg.sender, _amount);
    }

    function unstake(uint256 _amount) external {
        require(_amount >= 1e18, "Must unstake at least one SARCO.");
        require(
            stakeValue[msg.sender] >= _amount,
            "Cannot unstake more SARCO than you have staked."
        );

        // Update staker's history
        _updateCheckpointValueAtNow(
            stakeValueHistory[msg.sender],
            stakeValue[msg.sender],
            stakeValue[msg.sender].sub(_amount)
        );

        // Update total staked history
        _updateCheckpointValueAtNow(
            totalStakedHistory,
            totalStaked,
            totalStaked.sub(_amount)
        );

        if (stakeValue[msg.sender] == _amount) {
            totalStakers = totalStakers.sub(1);
        }

        totalStaked = totalStaked.sub(_amount);
        stakeValue[msg.sender] = stakeValue[msg.sender].sub(_amount);

        require(
            sarcoToken.transfer(msg.sender, _amount),
            "Unstake failed due to failed transfer."
        );

        emit OnUnstake(msg.sender, _amount);
    }

    function totalStakedAt(uint256 _blockNumber) public view returns (uint256) {
        // If we haven't initialized history yet
        if (totalStakedHistory.length == 0) {
            // Use the existing value
            return totalStaked;
        } else {
            // Binary search history for the proper staked amount
            return _getCheckpointValueAt(totalStakedHistory, _blockNumber);
        }
    }

    function stakeValueAt(address _owner, uint256 _blockNumber)
        public
        view
        returns (uint256)
    {
        // If we haven't initialized history yet
        if (stakeValueHistory[_owner].length == 0) {
            // Use the existing latest value
            return stakeValue[_owner];
        } else {
            // Binary search history for the proper staked amount
            return
                _getCheckpointValueAt(stakeValueHistory[_owner], _blockNumber);
        }
    }

    function _getCheckpointValueAt(
        Checkpoint[] storage checkpoints,
        uint256 _block
    ) internal view returns (uint256) {
        // This case should be handled by caller
        if (checkpoints.length == 0) return 0;

        // Use the latest checkpoint
        if (_block >= checkpoints[checkpoints.length - 1].fromBlock)
            return checkpoints[checkpoints.length - 1].value;

        // Use the oldest checkpoint
        if (_block < checkpoints[0].fromBlock) return checkpoints[0].value;

        // Binary search of the value in the array
        uint256 min = 0;
        uint256 max = checkpoints.length - 1;
        while (max > min) {
            uint256 mid = (max + min + 1) / 2;
            if (checkpoints[mid].fromBlock <= _block) {
                min = mid;
            } else {
                max = mid - 1;
            }
        }
        return checkpoints[min].value;
    }

    function _updateCheckpointValueAtNow(
        Checkpoint[] storage checkpoints,
        uint256 _oldValue,
        uint256 _value
    ) internal {
        require(_value <= uint128(-1));
        require(_oldValue <= uint128(-1));

        if (checkpoints.length == 0) {
            Checkpoint memory genesis;
            genesis.fromBlock = uint128(block.number - 1);
            genesis.value = uint128(_oldValue);
            checkpoints.push(genesis);
        }

        if (checkpoints[checkpoints.length - 1].fromBlock < block.number) {
            Checkpoint memory newCheckPoint;
            newCheckPoint.fromBlock = uint128(block.number);
            newCheckPoint.value = uint128(_value);
            checkpoints.push(newCheckPoint);
        } else {
            Checkpoint storage oldCheckPoint =
                checkpoints[checkpoints.length - 1];
            oldCheckPoint.value = uint128(_value);
        }
    }
}
