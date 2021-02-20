// SPDX-License-Identifier: MIT

pragma solidity ^0.6.12;

import "@openzeppelin/contracts-upgradeable/token/ERC20/ERC20Upgradeable.sol";
import "./SarcoStaking.sol";
import "./Sarco.sol";

contract SarcoVotingRights is Initializable, ERC20Upgradeable {
    SarcoStaking public sarcoStaking;
    Sarco public sarco;

    function initialize(
        string memory name,
        string memory symbol,
        SarcoStaking _sarcoStaking,
        Sarco _sarco
    ) external initializer {
        __ERC20_init(name, symbol);
        sarcoStaking = _sarcoStaking;
        sarco = _sarco;
    }

    function balanceOf(address _owner) public view override returns (uint256) {
        return sarcoStaking.stakeValue(_owner);
    }

    function totalSupply() public view override returns (uint256) {
        return sarcoStaking.totalStaked();
    }

    function balanceOfAt(address _owner, uint256 _blockNumber)
        public
        view
        returns (uint256)
    {
        return sarcoStaking.stakeValueAt(_owner, _blockNumber);
    }

    function totalSupplyAt(uint256 _blockNumber) public view returns (uint256) {
        return sarcoStaking.totalStakedAt(_blockNumber);
    }

    function allowance(address, address)
        public
        view
        override
        returns (uint256)
    {
        revert("allowance Not Supported");
    }

    function approve(address, uint256) public override returns (bool) {
        revert("approve Not Supported");
    }

    function transfer(address, uint256) public override returns (bool) {
        revert("transfer Not Supported");
    }

    function transferFrom(
        address,
        address,
        uint256
    ) public override returns (bool) {
        revert("transferFrom Not Supported");
    }
}
