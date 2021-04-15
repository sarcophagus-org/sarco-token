const { BN, constants, expectEvent, expectRevert, time } = require('@openzeppelin/test-helpers');
const { ZERO_ADDRESS } = constants;

const { expect } = require('chai');

const ERC20Mintable = artifacts.require('Mintable');
const GeneralTokenVesting = artifacts.require('GeneralTokenVesting');

contract('GeneralTokenVesting', accounts => {
  const [owner, beneficiary, beneficiary2, beneficiary3, recipient] = accounts;

  const amount = new BN('1000');
  const mintamount = new BN('20000');

  beforeEach(async function () {
    this.vesting = await GeneralTokenVesting.new({ from: owner })
    this.token = await ERC20Mintable.new({ from: owner });
    this.token2 = await ERC20Mintable.new({ from: owner });
    await this.token.mint(owner, mintamount, { from: owner });
    await this.token2.mint(owner, mintamount, { from: owner });
    await this.token.approve(this.vesting.address, amount, { from: owner });
    this.duration = time.duration.years(2);
  });

  it('reverts with a null beneficiary', async function () {
    await expectRevert(
      this.vesting.startVest(ZERO_ADDRESS, amount, this.duration, this.token.address, { from: owner }),
      "GeneralTokenVesting: beneficiary is the zero address"
    );
  });
  it('reverts with a null token', async function () {
    await expectRevert(
      this.vesting.startVest(beneficiary, amount, this.duration, ZERO_ADDRESS, { from: owner }),
      "GeneralTokenVesting: token is the zero address"
    );
  });

  it('reverts with a null amount', async function () {
    await expectRevert(
      this.vesting.startVest(beneficiary, 0, this.duration, this.token.address, { from: owner }),
      'GeneralTokenVesting: amount is zero'
    );
  });

  it('reverts with a null duration', async function () {
    await expectRevert(
      this.vesting.startVest(beneficiary, amount, 0, this.token.address, { from: owner }),
      'GeneralTokenVesting: duration is 0'
    );
  });

  it('reverts with a duplicate vest', async function () {
    await this.vesting.startVest(beneficiary, amount, this.duration, this.token.address, { from: owner });
    await expectRevert(
      this.vesting.startVest(beneficiary, amount, this.duration, this.token.address, { from: owner }),
      "GeneralTokenVesting: Vest already created for this token => beneficiary"
    );
  });

  it('reverts with contract not approved to transfer tokens', async function () {
    await expectRevert(
      this.vesting.startVest(beneficiary, amount, this.duration, this.token2.address, { from: owner }),
      "ERC20: transfer amount exceeds allowance"
    );
  });

  it('reverts with contract transfing more than approved', async function () {
    await expectRevert(
      this.vesting.startVest(beneficiary2, 30000, this.duration, this.token.address, { from: owner }),
      "ERC20: transfer amount exceeds balance"
    );
  });

  it('transfers tokens to contract address', async function () {
    await this.vesting.startVest(beneficiary, amount, this.duration, this.token.address, { from: owner });
    expect(await this.token.balanceOf(this.vesting.address)).to.be.bignumber.that.equals(amount);
  });


  context('once vest has started', function () {
    beforeEach(async function () {
      this.token = await ERC20Mintable.new({ from: owner });
      this.token2 = await ERC20Mintable.new({ from: owner });
      this.vesting = await GeneralTokenVesting.new({ from: owner });
      this.duration = time.duration.years(2);

      await this.token.mint(owner, mintamount, { from: owner });
      await this.token.approve(this.vesting.address, mintamount, { from: owner });

      await this.vesting.startVest(beneficiary, amount, this.duration, this.token.address, { from: owner });
      this.start = await this.vesting.getStart(this.token.address, beneficiary);
      this.durationVest = await this.vesting.getDuration(this.token.address, beneficiary);
    });

    it('can get state', async function () {
      expect(await this.vesting.getTotalTokens(this.token.address, beneficiary)).to.be.bignumber.that.equals(amount);
      expect(await this.vesting.getDuration(this.token.address, beneficiary)).to.be.bignumber.that.equals(this.durationVest);
    });

    it('can be released', async function () {
      await time.increaseTo(this.start.add(this.durationVest));
      const { logs } = await this.vesting.release(this.token.address, beneficiary);
      expectEvent.inLogs(logs, 'TokensReleased', {
        token: this.token.address,
        beneficiary: beneficiary,
        recipient: beneficiary,
        amount: await this.token.balanceOf(beneficiary),
      });
    });

    it('can be releasedTo', async function () {
      await time.increaseTo(this.start.add(this.durationVest));
      const { logs } = await this.vesting.releaseTo(this.token.address, recipient, { from: beneficiary });
      expectEvent.inLogs(logs, 'TokensReleased', {
        token: this.token.address,
        beneficiary: beneficiary,
        recipient: recipient,
        amount: await this.token.balanceOf(recipient),
      });
    });


    it('(Release)reverts with beneficiary vested time is < 0 ', async function () {
      await expectRevert(
        this.vesting.release(this.token.address, beneficiary, { from: owner }),
        "GeneralTokenVesting: no tokens are due"
      );
    });

    it('(ReleaseTo)reverts with beneficiary vested time is < 0 ', async function () {
      await expectRevert(
        this.vesting.releaseTo(this.token.address, recipient, { from: beneficiary }),
        "GeneralTokenVesting: no tokens are due"
      );
    });

    it('(release)reverts with beneficiary does not exist', async function () {
      await expectRevert(
        this.vesting.release(this.token.address, beneficiary2, { from: owner }),
        "GeneralTokenVesting: no tokens are due"
      );
    });

    it('(releaseTo)reverts with beneficiary does not exist', async function () {
      await expectRevert(
        this.vesting.releaseTo(this.token.address, recipient, { from: beneficiary2 }),
        "GeneralTokenVesting: no tokens are due"
      );
    });

    it('(release)reverts with token does not exist', async function () {
      await expectRevert(
        this.vesting.release(this.token2.address, beneficiary2, { from: owner }),
        "GeneralTokenVesting: no tokens are due"
      );
    });

    it('(releaseTo)reverts with token does not exist', async function () {
      await expectRevert(
        this.vesting.release(this.token2.address, recipient, { from: beneficiary2 }),
        "GeneralTokenVesting: no tokens are due"
      );
    });

    it('should release proper amount', async function () {
      await time.increaseTo(this.start.add(this.duration));

      await this.vesting.release(this.token.address, beneficiary);
      const releaseTime = await time.latest();

      const releasedAmount = amount.mul(releaseTime.sub(this.start)).div(this.durationVest);
      expect(await this.token.balanceOf(beneficiary)).to.be.bignumber.equal(releasedAmount);
      expect(await this.vesting.getReleasedTokens(this.token.address, beneficiary)).to.be.bignumber.equal(releasedAmount);
    });

    it('(release)should linearly release tokens during vesting period', async function () {
      const vestingPeriod = this.durationVest;
      const checkpoints = 4;

      for (let i = 1; i <= checkpoints; i++) {
        const now = this.start.add((vestingPeriod.muln(i).divn(checkpoints)));
        await time.increaseTo(now);

        await this.vesting.release(this.token.address, beneficiary);
        const expectedVesting = amount.mul(now.sub(this.start)).div(this.durationVest);
        expect(await this.token.balanceOf(beneficiary)).to.be.bignumber.equal(expectedVesting);
        expect(await this.vesting.getReleasedTokens(this.token.address, beneficiary)).to.be.bignumber.equal(expectedVesting);
      }
    });

    it('(releaseTo)should linearly release tokens during vesting period', async function () {
      const vestingPeriod = this.durationVest;
      const checkpoints = 4;

      for (let i = 1; i <= checkpoints; i++) {
        const now = this.start.add((vestingPeriod.muln(i).divn(checkpoints)));
        await time.increaseTo(now);

        await this.vesting.releaseTo(this.token.address, recipient, { from: beneficiary });
        const expectedVesting = amount.mul(now.sub(this.start)).div(this.durationVest);
        expect(await this.token.balanceOf(recipient)).to.be.bignumber.equal(expectedVesting);
        expect(await this.vesting.getReleasedTokens(this.token.address, beneficiary)).to.be.bignumber.equal(expectedVesting);
      }
    });

    it('should have released all after end', async function () {
      await time.increaseTo(this.start.add(this.durationVest));
      await this.vesting.release(this.token.address, beneficiary);
      expect(await this.token.balanceOf(beneficiary)).to.be.bignumber.equal(amount);
      expect(await this.vesting.getReleasedTokens(this.token.address, beneficiary)).to.be.bignumber.equal(amount);
    });
  });

  context('multiple beneficiary/durations/tokens', function () {
    beforeEach(async function () {
      this.token1 = await ERC20Mintable.new({ from: owner });
      this.token2 = await ERC20Mintable.new({ from: owner });
      this.token3 = await ERC20Mintable.new({ from: owner });

      this.vesting = await GeneralTokenVesting.new({ from: owner });

      this.duration1 = time.duration.years(1);
      this.duration2 = time.duration.years(2);
      this.duration3 = time.duration.years(3);

      await this.token1.mint(owner, mintamount, { from: owner });
      await this.token2.mint(owner, mintamount, { from: owner });
      await this.token3.mint(owner, mintamount, { from: owner });

      await this.token1.approve(this.vesting.address, mintamount, { from: owner });
      await this.token2.approve(this.vesting.address, mintamount, { from: owner });
      await this.token3.approve(this.vesting.address, mintamount, { from: owner });

      //await this.vesting.startVest(beneficiary, amount, this.duration, this.token.address, { from: owner });
      //this.start = await this.vesting.getStart(this.token.address, beneficiary);
      //this.durationVest = await this.vesting.getDuration(this.token.address, beneficiary);
    });

    it('can get state(multiple beneficiaries)', async function () {
      await this.vesting.startVest(beneficiary, amount, this.duration1, this.token1.address, { from: owner });
      await this.vesting.startVest(beneficiary2, amount, this.duration1, this.token1.address, { from: owner });
      await this.vesting.startVest(beneficiary3, amount, this.duration1, this.token1.address, { from: owner });

      //beneficiary1
      expect(await this.vesting.getTotalTokens(this.token1.address, beneficiary)).to.be.bignumber.that.equals(amount);
      expect(await this.vesting.getDuration(this.token1.address, beneficiary)).to.be.bignumber.that.equals(this.duration1);
      //beneficiary2
      expect(await this.vesting.getTotalTokens(this.token1.address, beneficiary2)).to.be.bignumber.that.equals(amount);
      expect(await this.vesting.getDuration(this.token1.address, beneficiary2)).to.be.bignumber.that.equals(this.duration1);
      //beneficiary3
      expect(await this.vesting.getTotalTokens(this.token1.address, beneficiary3)).to.be.bignumber.that.equals(amount);
      expect(await this.vesting.getDuration(this.token1.address, beneficiary3)).to.be.bignumber.that.equals(this.duration1);
    });

    it('can get state(multiple durations)', async function () {
      await this.vesting.startVest(beneficiary, amount, this.duration1, this.token1.address, { from: owner });
      await this.vesting.startVest(beneficiary2, amount, this.duration2, this.token1.address, { from: owner });
      await this.vesting.startVest(beneficiary3, amount, this.duration3, this.token1.address, { from: owner });

      //duration1
      expect(await this.vesting.getTotalTokens(this.token1.address, beneficiary)).to.be.bignumber.that.equals(amount);
      expect(await this.vesting.getDuration(this.token1.address, beneficiary)).to.be.bignumber.that.equals(this.duration1);
      //duration2
      expect(await this.vesting.getTotalTokens(this.token1.address, beneficiary2)).to.be.bignumber.that.equals(amount);
      expect(await this.vesting.getDuration(this.token1.address, beneficiary2)).to.be.bignumber.that.equals(this.duration2);
      //duration3
      expect(await this.vesting.getTotalTokens(this.token1.address, beneficiary3)).to.be.bignumber.that.equals(amount);
      expect(await this.vesting.getDuration(this.token1.address, beneficiary3)).to.be.bignumber.that.equals(this.duration3);
    });

    it('can get state(multiple tokens)', async function () {
      await this.vesting.startVest(beneficiary, amount, this.duration1, this.token1.address, { from: owner });
      await this.vesting.startVest(beneficiary, amount, this.duration1, this.token2.address, { from: owner });
      await this.vesting.startVest(beneficiary, amount, this.duration1, this.token3.address, { from: owner });

      //token1
      expect(await this.vesting.getTotalTokens(this.token1.address, beneficiary)).to.be.bignumber.that.equals(amount);
      expect(await this.vesting.getDuration(this.token1.address, beneficiary)).to.be.bignumber.that.equals(this.duration1);
      //token2
      expect(await this.vesting.getTotalTokens(this.token2.address, beneficiary)).to.be.bignumber.that.equals(amount);
      expect(await this.vesting.getDuration(this.token2.address, beneficiary)).to.be.bignumber.that.equals(this.duration1);
      //token3
      expect(await this.vesting.getTotalTokens(this.token3.address, beneficiary)).to.be.bignumber.that.equals(amount);
      expect(await this.vesting.getDuration(this.token3.address, beneficiary)).to.be.bignumber.that.equals(this.duration1);
    });

    it('can get state(start vests at a different time)', async function () {
      await this.vesting.startVest(beneficiary, amount, this.duration1, this.token1.address, { from: owner });
      this.start = await this.vesting.getStart(this.token1.address, beneficiary);
      await time.increaseTo(this.start.add(this.duration1));
      await this.vesting.startVest(beneficiary2, amount, this.duration1, this.token1.address, { from: owner });

      //vest1
      expect(await this.vesting.getTotalTokens(this.token1.address, beneficiary)).to.be.bignumber.that.equals(amount);
      expect(await this.vesting.getDuration(this.token1.address, beneficiary)).to.be.bignumber.that.equals(this.duration1);
      //vest2
      expect(await this.vesting.getTotalTokens(this.token1.address, beneficiary2)).to.be.bignumber.that.equals(amount);
      expect(await this.vesting.getDuration(this.token1.address, beneficiary2)).to.be.bignumber.that.equals(this.duration1);
    });

    it('can get state(for an address that has released tokens and started a new vest)', async function () {
      await this.vesting.startVest(beneficiary, amount, this.duration1, this.token1.address, { from: owner });
      this.start = await this.vesting.getStart(this.token1.address, beneficiary);
      this.durationVest = await this.vesting.getDuration(this.token1.address, beneficiary);
      await time.increaseTo(this.start.add(this.durationVest));
      await this.vesting.release(this.token1.address, beneficiary);

      //vest with same beneficiary
      await this.vesting.startVest(beneficiary, amount, this.duration1, this.token2.address, { from: owner });

      //vest1
      expect(await this.token1.balanceOf(beneficiary)).to.be.bignumber.equal(amount);
      expect(await this.vesting.getReleasedTokens(this.token1.address, beneficiary)).to.be.bignumber.equal(amount);
      //vest2
      expect(await this.vesting.getTotalTokens(this.token2.address, beneficiary)).to.be.bignumber.that.equals(amount);
      expect(await this.vesting.getDuration(this.token2.address, beneficiary)).to.be.bignumber.that.equals(this.duration1);
    });

    it('can get state(for an address that has releasedTo tokens and started a new vest)', async function () {
      await this.vesting.startVest(beneficiary, amount, this.duration1, this.token1.address, { from: owner });
      this.start = await this.vesting.getStart(this.token1.address, beneficiary);
      this.durationVest = await this.vesting.getDuration(this.token1.address, beneficiary);
      await time.increaseTo(this.start.add(this.durationVest));
      await this.vesting.releaseTo(this.token1.address, recipient, { from: beneficiary });

      //vest with same beneficiary
      await this.vesting.startVest(beneficiary, amount, this.duration1, this.token2.address, { from: owner });

      //vest1
      expect(await this.token1.balanceOf(recipient)).to.be.bignumber.equal(amount);
      expect(await this.vesting.getReleasedTokens(this.token1.address, beneficiary)).to.be.bignumber.equal(amount);
      //vest2
      expect(await this.vesting.getTotalTokens(this.token2.address, beneficiary)).to.be.bignumber.that.equals(amount);
      expect(await this.vesting.getDuration(this.token2.address, beneficiary)).to.be.bignumber.that.equals(this.duration1);
    });
  });
});
