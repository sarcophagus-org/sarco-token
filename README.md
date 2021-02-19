# Sarcophagus Token (SARCO)
[![Discord](https://img.shields.io/discord/753398645507883099?color=768AD4&label=discord)](https://discord.com/channels/753398645507883099/)
[![Twitter](https://img.shields.io/twitter/follow/sarcophagusio?style=social)](https://twitter.com/sarcophagusio)

Sarcophagus is a decentralized dead man's switch built on Ethereum and Arweave.

## Overview
This repository contains the smart contracts necessary for the creation, distribution, and vesting of SARCO, the token that powers Sarcophagus.

The SARCO ERC20 token is live on mainnet at [`0x7697B462A7c4Ff5F8b55BDBC2F4076c2aF9cF51A`](https://etherscan.io/token/0x7697B462A7c4Ff5F8b55BDBC2F4076c2aF9cF51A)

It is also deployed to Goerli at [`0x4633b43990b41B57b3678c6F3Ac35bA75C3D8436`](https://goerli.etherscan.io/address/0x4633b43990b41B57b3678c6F3Ac35bA75C3D8436),
and Rinkeby at [`0x77ec161f6c2f2ce4554695a07e071d3f0ef3aef5`](https://rinkeby.etherscan.io/token/0x77ec161f6c2f2ce4554695a07e071d3f0ef3aef5)

## Distribution
SARCO tokens will be distributed amongst the Sarcophagus DAO, the Builders of Sarcophagus, and to support the bond incentive, grant, and liquidity mining programs.

![token distribution](static/token_distribution.png "Token Distribution")

Distribution Breakdown:
| Entity               | Holdings     | Vesting in months |
| :------------------- | :----------: | ----------------: |
|  DAO                 | 60M          | 0                 |
|  Builders            | 20M          | 24                |
|  Bond Incentive      | 15M          | 12                |
|  Embalmer Grants     | 2M           | 0                 |
|  Archaelogist Grants | 2M           | 0                 |
|  Liquidity Mining    | 1M           | 12                |

## Vesting Schedule
The vesting schedule for the builders tokens is linear, per second, for two years, and applies equally to all builders. No VC or other exceptions. This contract can be found [here](https://github.com/sarcophagus-org/sarco-token/blob/master/contracts/TokenVesting.sol).

![vesting schedule](static/vesting_schedule.png "Vesting Schedule")

Both the bond incentive and liquidity mining allocations are vested over the course of one year as a virtue of the structure of their respective contracts, separate from the builder vesting contract. The liquidity mining contract can be found [here](https://github.com/sarcophagus-org/liquidity-mining/blob/master/contracts/LiquidityMining.sol).

## Community
[![Discord](https://img.shields.io/discord/753398645507883099?color=768AD4&label=discord)](https://discord.com/channels/753398645507883099/)
[![Twitter](https://img.shields.io/twitter/follow/sarcophagusio?style=social)](https://twitter.com/sarcophagusio)

We can also be found on [Telegram](https://t.me/sarcophagusio).

Made with :skull: and proudly decentralized.