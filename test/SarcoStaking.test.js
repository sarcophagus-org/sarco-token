const { deployProxy } = require("@openzeppelin/truffle-upgrades")
const { time, expectRevert } = require('@openzeppelin/test-helpers');
const SarcoToken = artifacts.require("Sarco")
const SarcoStaking = artifacts.require("SarcoStaking")
const SarcoVotingRights = artifacts.require("SarcoVotingRights")

const toBN = web3.utils.toBN
const toWei = web3.utils.toWei

contract("SarcoStaking", (accounts) => {
  const tokenOwner = accounts[0]
  const stakers = [accounts[1], accounts[2], accounts[3], accounts[4]]

  let sarcoToken, sarcoStaking

  beforeEach(async () => {
    sarcoToken = await SarcoToken.new(tokenOwner)
    sarcoStaking = await deployProxy(SarcoStaking, [sarcoToken.address])

    await Promise.all([
      await sarcoToken.transfer(stakers[0], toWei('100000'), { from: tokenOwner }),
      await sarcoToken.transfer(stakers[1], toWei('100000'), { from: tokenOwner }),
      await sarcoToken.transfer(stakers[2], toWei('100000'), { from: tokenOwner }),
      await sarcoToken.transfer(stakers[3], toWei('100000'), { from: tokenOwner })
    ])
  })

  describe("stake", () => {
    let staker, value

    beforeEach(async () => {
      staker = stakers[0]
      value = toBN(toWei("21000"))
      await sarcoToken.approve(sarcoStaking.address, value, { from: staker })
    })

    it("Should revert if staking more tokens than held", async () => {
      const balance = await sarcoToken.balanceOf(staker)
      expect(balance.toString()).to.not.equal(toBN(0), { from: staker })
      await expectRevert(
        sarcoStaking.stake(balance.add(toBN(1)), { from: staker }),
        "Cannot stake more SARCO than you hold unstaked."
      )
      await expectRevert(
        sarcoStaking.stake(balance.add(toBN(toWei("10000000000000"))), { from: staker }),
        "Cannot stake more SARCO than you hold unstaked."
      )
    })

    it("Should decrease stakers balance by value", async () => {
      const initialStakersTokens = await sarcoToken.balanceOf(staker)
      await sarcoStaking.stake(value, { from: staker })
      const finalStakersTokens = await sarcoToken.balanceOf(staker)
      expect(finalStakersTokens.toString()).to.equal(initialStakersTokens.sub(value).toString())
    })

    it("Should not change totalStakers", async () => {
      await sarcoStaking.stake(value, { from: staker })
      const initialTotalStakers = await sarcoStaking.totalStakers()
      await sarcoToken.approve(sarcoStaking.address, value, { from: staker })
      await sarcoStaking.stake(value, { from: staker })
      const finalTotalStakers = await sarcoStaking.totalStakers()
      expect(finalTotalStakers.toString()).to.equal(initialTotalStakers.toString())
    })

    it("Should increase totalStaked by value", async () => {
      const initialTotalStaked = await sarcoStaking.totalStaked()
      await sarcoToken.approve(sarcoStaking.address, value, { from: staker })
      await sarcoStaking.stake(value, { from: staker })
      const finalTotalStaked = await sarcoStaking.totalStaked()
      expect(finalTotalStaked.toString()).to.equal(initialTotalStaked.add(value).toString())
    })

    it("Should increase sender's staked amount by value", async () => {
      const initialStakerBalance = await sarcoStaking.stakeValue(staker)
      await sarcoToken.approve(sarcoStaking.address, value, { from: staker })
      await sarcoStaking.stake(value, { from: staker })
      const finalStakerBalance = await sarcoStaking.stakeValue(staker)
      expect(finalStakerBalance.toString()).to.equal(initialStakerBalance.add(value).toString())
    })
  })

  describe("unstake", () => {
    let staker, value

    beforeEach(async () => {
      staker = stakers[0]
      value = toBN(toWei("21000"))
      await sarcoToken.approve(sarcoStaking.address, value, { from: staker })
      await sarcoStaking.stake(value, { from: staker })
    })

    it("Should revert if less than 1 token", async () => {
      await expectRevert(
        sarcoStaking.unstake(toBN(toWei("1")).sub(toBN(1)), { from: staker }),
        "Must unstake at least one SARCO."
      )
      await expectRevert(
        sarcoStaking.unstake(0, { from: staker }),
        "Must unstake at least one SARCO."
      )
      await expectRevert(
        sarcoStaking.unstake(toBN(1), { from: staker }),
        "Must unstake at least one SARCO."
      )
    })

    it("Should revert if unstaking more tokens than staked", async () => {
      const balance = await sarcoStaking.stakeValue(staker)
      expect(balance.toString()).to.equal(value.toString(), { from: staker })
      await expectRevert(
        sarcoStaking.unstake(balance.add(toBN(1)), { from: staker }),
        "Cannot unstake more SARCO than you have staked."
      )
      await expectRevert(
        sarcoStaking.unstake(balance.add(toBN(toWei("10000000000000"))), { from: staker }),
        "Cannot unstake more SARCO than you have staked."
      )
    })

    it("Should decrease totalStaked balance by value", async () => {
      const initialTotalStaked = await sarcoStaking.totalStaked()
      await sarcoStaking.unstake(value, { from: staker })
      const finalTotalStaked = await sarcoStaking.totalStaked()
      expect(finalTotalStaked.toString()).to.equal(initialTotalStaked.sub(value).toString())
    })

    it("Should decrease sender's staked amount by value", async () => {
      const initialStakerBalance = await sarcoStaking.stakeValue(staker)
      await sarcoStaking.unstake(value, { from: staker })
      const finalStakerBalance = await sarcoStaking.stakeValue(staker)
      expect(finalStakerBalance.toString()).to.equal(initialStakerBalance.sub(value).toString())
    })

    it("Should decrease totalStakers by 1", async () => {
      const stakerValue = await sarcoStaking.stakeValue(staker)
      const initialTotalStakers = await sarcoStaking.totalStakers()
      await sarcoStaking.unstake(stakerValue, { from: staker })
      const finalTotalStakers = await sarcoStaking.totalStakers()
      expect(finalTotalStakers.toString()).to.equal(initialTotalStakers.sub(toBN(1)).toString())
    })
  })

  describe("history", () => {
    let staked
    let history
    let totalStaked
    let totalStakedHistory

    beforeEach(async () => {
      staked = {}
      history = {}
      totalStaked = "0"
      totalStakedHistory = []

      for (const staker of stakers) {
        const value = toBN(toWei("21000"))
        await sarcoToken.approve(sarcoStaking.address, value, { from: staker })
        await sarcoStaking.stake(value, { from: staker })
  
        if (!staked[staker]) {
          staked[staker] = "0"
        }

        staked[staker] = toBN(staked[staker]).add(value).toString()
        totalStaked = toBN(totalStaked).add(value).toString()
      }
    })

    it("Stake History Fresh Upgrade", async () => {
      const result = await sarcoStaking.totalStakedAt(await web3.eth.getBlockNumber())
      expect(result.toString()).to.equal(totalStaked)

      for (const staker of stakers) {
        const value = staked[staker]
        const result = await sarcoStaking.stakeValueAt(staker, await web3.eth.getBlockNumber());
        expect(result.toString()).to.equal(value)
      }
    })

    it("Stake History Is Correct After Stake & Unstake", async () => {
      const sarcoVotingRights = await deployProxy(SarcoVotingRights, ["SARCO Voting Rights", "SARCO-VR", sarcoStaking.address, sarcoToken.address])

      const exec = async (method, addOrSub, staker, eth) => {
        const stakeInput = eth
        staked[staker] = toBN(staked[staker])[addOrSub](stakeInput).toString()
        totalStaked = toBN(totalStaked)[addOrSub](stakeInput).toString()

        const tx = await sarcoStaking[method](stakeInput, { from: staker })

        if (!history[staker]) {
          history[staker] = []
        }

        history[staker].push({
          value: staked[staker],
          block: tx.receipt.blockNumber
        })

        totalStakedHistory.push({
          value: totalStaked,
          block: tx.receipt.blockNumber
        })

        expect(await sarcoVotingRights.totalSupply()).to.deep.equal(await sarcoStaking.totalStaked())
        expect(await sarcoVotingRights.balanceOf(staker)).to.deep.equal(await sarcoStaking.stakeValue(staker))
      }

      const stake = async (staker, eth) => {
        await sarcoToken.approve(sarcoStaking.address, eth, { from: staker })
        await exec("stake", "add", staker, eth)
      }

      const unstake = async (staker, eth) => {
        await exec("unstake", "sub", staker, eth)
      }

      expect(await sarcoVotingRights.decimals()).to.deep.equal(await sarcoToken.decimals())

      for (const staker of stakers) {
        const rand = () => toBN(toWei(Math.floor(1000 + Math.random() * 100).toString()))

        const stake1 = rand()
        const stake2 = rand()
        const stake3 = rand()

        await stake(staker, stake1)
        await stake(staker, stake2)
        await unstake(staker, stake1)
        await stake(staker, stake3)
        await unstake(staker, stake2.add(stake3))
      }

      for (const staker of stakers) {
        // Verify latest block
        await time.advanceBlock()
        const latestResult = await sarcoStaking.stakeValueAt(staker, await web3.eth.getBlockNumber())
        const votingBalanceOfAt = await sarcoVotingRights.balanceOfAt(staker, await web3.eth.getBlockNumber())

        expect(latestResult.toString()).to.equal(staked[staker])
        expect(votingBalanceOfAt.toString()).to.equal(latestResult.toString())

        // Verify all stake history
        const stakeHistory = history[staker]
        for (const checkpoint of stakeHistory) {
          const { value, block } = checkpoint
          const result = await sarcoStaking.stakeValueAt(staker, block)

          expect(result.toString()).to.equal(value)
          expect(await sarcoVotingRights.balanceOfAt(staker, block)).to.deep.equal(result)
        }
      }

      // Verify all "total staked" history
      for (const checkpoint of totalStakedHistory) {
        const { value, block } = checkpoint
        const result = await sarcoStaking.totalStakedAt(block)

        expect(result.toString()).to.equal(value)
        expect(await sarcoVotingRights.totalSupplyAt(block)).to.deep.equal(result)
      }
    })
  })
})
