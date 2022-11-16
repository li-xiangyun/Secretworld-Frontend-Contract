import Web3 from 'web3'
import Secret from '../../build/contracts/Secret.json'
import Tokenreward from '../../build/contracts/TokenReward.json'
//secretToken合约构建
let getSecretContract=(web3) =>{
  //const web3temp = web3
  return new Promise(function(resolve, reject) {
    web3.eth.net.getId().then((networkId)=>{
      var networkData = Tokenreward.networks[networkId]
      console.log(networkData);
      if(networkData) {
       let _contract = new web3.eth.Contract(Tokenreward.abi, networkData.address);
       resolve(_contract);
      }else{
       reject();
      }
    })
  })
}

let getTokenContract=(web3) =>{
  //const web3temp = web3
  return new Promise(function(resolve, reject) {
    web3.eth.net.getId().then((networkId)=>{
      var networkData = Secret.networks[networkId]
      console.log(networkData);
      if(networkData) {
       let _contract = new web3.eth.Contract(Secret.abi, networkData.address);
       resolve(_contract);
      }else{
       reject();
      }
    })
  })
}

let getWeb3 = ()=>{
return new Promise(function(resolve, reject) {
  let provider = null;
  if (typeof window.ethereum !== 'undefined') {
    try {
      provider = window.ethereum;
      // 请求用户账号授权
      // 如果未授权就会弹出下图授权界面, 如果已授权就跳过了
      provider.enable();
    } catch (error) {
      console.log('User denied account access');
    }
  } else {
    provider = new Web3.providers.HttpProvider("http://127.0.0.1:8545");
    console.log('Please install MetaMask')
  }
  let web3 = new Web3(provider);
  resolve(web3)
})
}
export {getWeb3,getSecretContract,getTokenContract}
