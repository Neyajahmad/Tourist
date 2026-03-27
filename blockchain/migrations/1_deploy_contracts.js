const TouristSafety = artifacts.require("TouristSafety");

module.exports = function (deployer) {
  deployer.deploy(TouristSafety);
};
