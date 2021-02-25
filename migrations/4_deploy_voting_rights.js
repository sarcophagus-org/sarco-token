const { deployProxy } = require("@openzeppelin/truffle-upgrades")
const Sarco = artifacts.require("Sarco")
const SarcoStaking = artifacts.require("SarcoStaking")
const SarcoVotingRights = artifacts.require("SarcoVotingRights")

module.exports = async function (deployer) {
  const sarcoToken = await Sarco.deployed()
  const sarcoStaking = await SarcoStaking.deployed()
  await deployProxy(SarcoVotingRights, [
    "SARCO Voting Rights", "SARCO-VR",
    sarcoStaking.address, sarcoToken.address
  ], { deployer })
}
