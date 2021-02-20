const { deployProxy } = require("@openzeppelin/truffle-upgrades")
const Sarco = artifacts.require("Sarco")
const SarcoStaking = artifacts.require("SarcoStaking")

module.exports = async function (deployer) {
  const sarcoToken = await Sarco.deployed()
  await deployProxy(SarcoStaking, [sarcoToken.address], { deployer })
}
