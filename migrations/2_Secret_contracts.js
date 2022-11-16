var Secret = artifacts.require("./Secret.sol");

module.exports = function(deployer) {
  deployer.deploy(Secret);
};
