// var Secretcoin = artifacts.require("./Secretcoin.sol");
// var acc = artifacts.require("./Account.sol");
// module.exports = async function(deployer) {
//  deployer.deploy(Secretcoin).then(() => Secretcoin.deployed())        // 传递 Storage 合约地址，部署 InfoManager 合约
//  .then(() => deployer.deploy(acc, Secretcoin.address));
  
// };


var Secret = artifacts.require("Secret");
var TokenReward = artifacts.require("TokenReward");

module.exports = async function(deployer) {
  let token = await Secret.deployed();
  return deployer.deploy(TokenReward, token.address);
}
