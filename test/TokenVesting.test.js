const { accounts, contract } = require('@openzeppelin/test-environment');

const { BN, constants, expectEvent, expectRevert, time } = require('@openzeppelin/test-helpers');
const { ZERO_ADDRESS } = constants;

const { expect } = require('chai');

const ERC20Mintable = contract.fromArtifact('Mintable');
const TokenVesting = contract.fromArtifact('TokenVesting');

describe('TokenVesting', function () {
  const [ owner, beneficiary ] = accounts;

  const amount = new BN('1000');

  beforeEach(async function () {
    // +1 minute so it starts after contract instantiation
    this.start = (await time.latest()).add(time.duration.minutes(1));
    this.duration = time.duration.years(2);
  });

  it('reverts with a null beneficiary', async function () {
    await expectRevert(
      TokenVesting.new(ZERO_ADDRESS, this.start, this.duration, { from: owner }),
      'TokenVesting: beneficiary is the zero address'
    );
  });

  it('reverts with a null duration', async function () {
    await expectRevert(
      TokenVesting.new(beneficiary, this.start, 0, { from: owner }), 'TokenVesting: duration is 0'
    );
  });

  it('reverts if the end time is in the past', async function () {
    const now = await time.latest();

    this.start = now.sub(this.duration).sub(time.duration.minutes(1));
    await expectRevert(
      TokenVesting.new(beneficiary, this.start, this.duration, { from: owner }),
      'TokenVesting: final time is before current time'
    );
  });

  context('once deployed', function () {
    beforeEach(async function () {
      this.vesting = await TokenVesting.new(
        beneficiary, this.start, this.duration, { from: owner });

      this.token = await ERC20Mintable.new({ from: owner });
      await this.token.mint(this.vesting.address, amount, { from: owner });
    });

    it('can get state', async function () {
      expect(await this.vesting.beneficiary()).to.equal(beneficiary);
      expect(await this.vesting.start()).to.be.bignumber.equal(this.start);
      expect(await this.vesting.duration()).to.be.bignumber.equal(this.duration);
    });

    it('can be released', async function () {
      await time.increaseTo(this.start.add(time.duration.weeks(1)));
      const { logs } = await this.vesting.release(this.token.address);
      expectEvent.inLogs(logs, 'TokensReleased', {
        token: this.token.address,
        amount: await this.token.balanceOf(beneficiary),
      });
    });

    it('should release proper amount', async function () {
      await time.increaseTo(this.start.add(time.duration.weeks(1)));

      await this.vesting.release(this.token.address);
      const releaseTime = await time.latest();

      const releasedAmount = amount.mul(releaseTime.sub(this.start)).div(this.duration);
      expect(await this.token.balanceOf(beneficiary)).to.be.bignumber.equal(releasedAmount);
      expect(await this.vesting.released(this.token.address)).to.be.bignumber.equal(releasedAmount);
    });

    it('should linearly release tokens during vesting period', async function () {
      const vestingPeriod = this.duration;
      const checkpoints = 4;

      for (let i = 1; i <= checkpoints; i++) {
        const now = this.start.add((vestingPeriod.muln(i).divn(checkpoints)));
        await time.increaseTo(now);

        await this.vesting.release(this.token.address);
        const expectedVesting = amount.mul(now.sub(this.start)).div(this.duration);
        expect(await this.token.balanceOf(beneficiary)).to.be.bignumber.equal(expectedVesting);
        expect(await this.vesting.released(this.token.address)).to.be.bignumber.equal(expectedVesting);
      }
    });

    it('should have released all after end', async function () {
      await time.increaseTo(this.start.add(this.duration));
      await this.vesting.release(this.token.address);
      expect(await this.token.balanceOf(beneficiary)).to.be.bignumber.equal(amount);
      expect(await this.vesting.released(this.token.address)).to.be.bignumber.equal(amount);
    });
  });
});
 