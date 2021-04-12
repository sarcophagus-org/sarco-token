const { BN, constants, expectEvent, expectRevert, time } = require('@openzeppelin/test-helpers');
const { ZERO_ADDRESS } = constants;

const { expect } = require('chai');

const ERC20Mintable = artifacts.require('Mintable');
const TokenVestingv2 = artifacts.require('TokenVestingv2');

contract('TokenVestingv2', accounts => {
  const [ owner, beneficiary ] = accounts;

  const amount = new BN('1000');
  const mintamount = new BN('20000');

  beforeEach(async function () {
    this.vestingv2 = await TokenVestingv2.new({ from: owner })
    this.token = await ERC20Mintable.new({ from: owner });
    await this.token.mint(owner, mintamount, { from: owner });
    await this.token.approve(this.vestingv2.address,amount, { from: owner });
    this.duration = time.duration.years(2);
  });

  it('reverts with a null beneficiary', async function () {
    await expectRevert(
      this.vestingv2.startVest(ZERO_ADDRESS, amount, this.duration, ZERO_ADDRESS, { from: owner }),
      "TokenVestingv2: beneficiary is the zero address"
    );
  });

  it('reverts with a null amount', async function () {
    await expectRevert(
      this.vestingv2.startVest(beneficiary, 0, this.duration, ZERO_ADDRESS, { from: owner }),
      'TokenVestingv2: amount is zero'
    );
  });

  it('reverts with a null duration', async function () {
    await expectRevert(
      this.vestingv2.startVest(beneficiary, amount, 0, ZERO_ADDRESS, { from: owner }),
      'TokenVestingv2: duration is 0'
    );
  });

  it('reverts with a duplicate investor', async function () {
    await this.vestingv2.startVest(beneficiary, amount, this.duration, this.token.address, { from: owner });
    await expectRevert(
      this.vestingv2.startVest(beneficiary, amount, this.duration, this.token.address, { from: owner }),
      "_beneficiary already created for this token"
    );
  });

  it('transfers tokens to contract address', async function () {
    await this.vestingv2.startVest(beneficiary, amount, this.duration, this.token.address, { from: owner });
    expect(await this.token.balanceOf(this.vestingv2.address)).to.be.bignumber.that.equals(amount);
  });

  context('once vest has started', function () {
    beforeEach(async function () {
      this.token = await ERC20Mintable.new({ from: owner });
      this.vestingv2 = await TokenVestingv2.new({ from: owner });
      this.duration = time.duration.years(2);

      await this.token.mint(owner, mintamount, { from: owner });
      await this.token.approve(this.vestingv2.address,mintamount, { from: owner });

      await this.token.mint(this.vestingv2.address, amount, { from: owner });

      await this.vestingv2.startVest(beneficiary, amount, this.duration, this.token.address, { from: owner });
      this.start = await this.vestingv2.getStart(this.token.address,beneficiary);
      this.durationVest = await this.vestingv2.getDuration(this.token.address,beneficiary);
    });

    it('can get state', async function () {
      expect(await this.vestingv2.getTotalTokens(this.token.address,beneficiary)).to.be.bignumber.that.equals(amount);
      expect(await this.vestingv2.getDuration(this.token.address,beneficiary)).to.be.bignumber.that.equals(this.durationVest);
      expect(await this.vestingv2.getInvestorCreated(this.token.address,beneficiary)).to.equal(true);
    });

    it('can be released', async function () {
      await time.increaseTo(this.start.add(this.durationVest));
      const { logs } = await this.vestingv2.release(this.token.address,beneficiary);
      expectEvent.inLogs(logs, 'TokensReleased', {
        token: this.token.address,
        amount: await this.token.balanceOf(beneficiary),
      });
    });

    it('should release proper amount', async function () {
      await time.increaseTo(this.start.add(this.duration));

      await this.vestingv2.release(this.token.address,beneficiary);
      const releaseTime = await time.latest();

      const releasedAmount = amount.mul(releaseTime.sub(this.start)).div(this.durationVest);
      expect(await this.token.balanceOf(beneficiary)).to.be.bignumber.equal(releasedAmount);
      expect(await this.vestingv2.getReleasedTokens(this.token.address,beneficiary)).to.be.bignumber.equal(releasedAmount);
    });

    it('should linearly release tokens during vesting period', async function () {
      const vestingPeriod = this.durationVest;
      const checkpoints = 4;

      for (let i = 1; i <= checkpoints; i++) {
        const now = this.start.add((vestingPeriod.muln(i).divn(checkpoints)));
        await time.increaseTo(now);

        await this.vestingv2.release(this.token.address,beneficiary);
        const expectedVesting = amount.mul(now.sub(this.start)).div(this.durationVest);
        expect(await this.token.balanceOf(beneficiary)).to.be.bignumber.equal(expectedVesting);
        expect(await this.vestingv2.getReleasedTokens(this.token.address,beneficiary)).to.be.bignumber.equal(expectedVesting);
      }
    });

    it('should have released all after end', async function () {
      await time.increaseTo(this.start.add(this.durationVest));
      await this.vestingv2.release(this.token.address,beneficiary);
      expect(await this.token.balanceOf(beneficiary)).to.be.bignumber.equal(amount);
      expect(await this.vestingv2.getReleasedTokens(this.token.address,beneficiary)).to.be.bignumber.equal(amount);
    });
  });
});
 