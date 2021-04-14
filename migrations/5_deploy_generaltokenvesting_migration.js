const GeneralTokenVesting = artifacts.require("GeneralTokenVesting");

module.exports = function (deployer) {
  deployer.deploy(GeneralTokenVesting);
};
