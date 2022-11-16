import React, { Component } from 'react'
import Secret from '../build/contracts/Secret.json'
import TokenStake from '../build/contracts/TokenReward.json'
import ipfs from './utils/ipfs'
import { Button, Modal } from 'antd';
import Web3 from 'web3';
import axios from 'axios'
import { UploadImage } from './Upload'
import Tokenowner from './Tokenowner'

import './css/oswald.css'
import './css/open-sans.css'
import './css/pure-min.css'
import './css/app.css'
import './css/zui.min.css'
import './css/marquee.css'

//后端IP及端口号
axios.defaults.baseURL = 'http://127.0.0.1:4000'
React.Component.prototype.$http = axios
/* eslint-disable */
//上传文件至ipfs得到hash
async function getfile(element) {
  return new Promise(function (resolve, reject) {
    const reader = new window.FileReader()
    reader.readAsArrayBuffer(element.originFileObj)
    reader.onloadend = async () => {
      try {
        let hash = await ipfsAdd(reader.result);
        resolve(hash);
      }catch(error){
        reject(error);
      }
    }
  })
}

//点edit按钮后更新db信息
function upDataInfo(content, id, info, account) {
  axios.put(`http://localhost:4000/secret/update?id=${id}&account=${account}`, {
    'content': content,
    'info': info
  }).then(result => {
    console.log(result);
    if (result.data.code === 0) {
      //提示成功
      alert("OK");
    } else {
      //提示错误信息
      alert(result.data.msg);
    }
  })
}
//点击Upload之后按钮执行
function uploadInfo(obj, content) {
  return new Promise(function (resolve, reject) {
    obj.$http({
      header: {
        'Content-Type': 'application/json'
      },
      method: 'post',
      url: `http://localhost:4000/secret/create`,
      data: {
        //图片对应的ipfs哈希码列表
        'content': content,
        //不喜欢数，新建默认0
        'unlikecount': '0',
        //喜欢数，新建默认0
        'likecount': '0',
        //对应当前用户的秘密id
        'listid': (++(obj.state.listObj.length)),
        //当前用户
        'account': obj.state.account,
        //秘密备注
        'info': obj.state.info
      }
    }).then(result => {
      if (result.data.code === 0) {
        //返回成功
        alert("OK");
      } else {
        //不成功返回提示失败信息
        alert(result.data.msg);
      }
      //清空当前页面的图片
      obj.setState({ isOK: obj.state.isOK?false:true});
      this.setState({ info: "" })
      resolve();
    }).catch(error=>{
      reject(error);
    })
  })
}

//获取当前用户的秘密显示到页面
function getInfo(obj) {
  return new Promise(function (resolve, reject) {
    obj.$http(`/secret/select/${obj.state.account}`).then(result => {
      //取得秘密列表信息
      var tmpobj = obj.state.listObj
      var tmpdata = result.data.data;
      for (let i = 0; i < tmpdata.length; i++) {
        var tmplist = [];
        for (let j = 0; j < tmpdata[i].content.length; j++) {
          tmplist.push(
            tmpdata[i].content[j]
          );
        }
        tmpobj[i] = {
          //图片对应的hash列表
          ipfsHash: tmplist,
          //喜欢数
          likecount: tmpdata[i].likecount,
          //不喜欢数
          unlikecount: tmpdata[i].unlikecount,
          //秘密序号
          listid: tmpdata[i].listid,
          //秘密备注信息
          info: tmpdata[i].info
        }
      }
      //设置秘密列表信息
      obj.setState({ listObj: tmpobj });
      resolve()
    })
  })
}

//图片文件提交到ipfs
function ipfsAdd(result) {
  return new Promise(function (resolve, reject) {
    ipfs.files.add(Buffer(result), (error, result) => {
      if (error) {
        //返回失败信息
        reject(error);
        return
      }
      //返回hash
      resolve(result[0].hash);
    })
  })
}



class App extends Component {
  constructor(props) {
    super(props)

    this.state = {
      //发币者账户地址
      owner: null,
      //web3实例
      web3: null,
      //token合约实例
      contract: null,
      //验证转账合约实例
      stake: null,
      //登录用户地址
      account: null,
      //上传图片flag
      isOK: false,
      //编辑图片后flag
      isEditOK: false,
      //秘密信息序号
      listid: null,
      //upload edit 状态控制
      btnStatus: false,
      //时间线
      deadline: null,
      //交易nonce
      nonce: null,
      //秘密备注信息
      info: null,
      //合约实例
      ERC2612: null,
      //签名信息
      signature: null,
      //链id
      chaid: null,
      //被授权者
      spender: null,
      //余额信息
      balance: null,
      //秘密图片列表
      fileLists: [],
      //秘密
      listObj: []
    }
    this.listClick = this.listClick.bind(this);
  }
  //获取秘密列表
  getChildFileList = (val) => {
    this.setState({ fileLists: val });
  };

  //拿到签名后 验证 转账
  transferFromToken = async (amount) => {
    let r = '0x' + this.state.signature.substring(2).substring(0, 64);
    let s = '0x' + this.state.signature.substring(2).substring(64, 128);
    let v = '0x' + this.state.signature.substring(2).substring(128, 130);
    //验证签名 并且转账
    this.state.stake.methods.permitReward(this.state.owner, this.state.spender, amount, this.state.deadline, v, r, s).send({ from: this.state.account, nonce: 0 }).then(async () => {
      console.log("transferFrom success!!!!!!!");
    }).catch(error =>{
      console.log(error);
    })
  }
  //后端进行线下签名
  getSignature = async (value) => {
    await this.$http({
      header: {
        'Content-Type': 'application/json'
      },
      method: 'post',
      url: `http://localhost:4000/secret/Sign`,
      data: {
        //合约地址
        contactAddr: this.state.contract._address,
        //链id
        chainid: this.state.chaid,
        //发币者账户
        owner: this.state.owner,
        //被授权合约账户
        spender: this.state.stake._address,
        //转币数量
        value: value,
        //交易nonce
        nonce: 0,
        //时间线
        deadline: this.state.deadline
      }
    }).then(result => {
      this.setState({
        signature: result.data.data
      })
      console.log(result);
    })
  }
  
  async componentWillMount() {
    //获取web3实例
    if (window.ethereum) {
      this.provider = window.ethereum;
      try {
        await window.ethereum.enable();
      } catch (error) {
        console.error("User denied account access");
      }
    } else {
      this.provider = new Web3.providers.HttpProvider("http://127.0.0.1:8545");
    }
    let web3 = new Web3(this.provider);
    this.setState({
      web3: web3
    })
    //初始化合约实例,签名信息
    await this.instantiateContract()
    //获取当前用户页面秘密信息
    await getInfo(this);
  }

  // async getNonce() {
  //   await this.state.web3.eth.getTransactionCount(this.state.account, 'pending', (err, nonce) => {
  //     this.setState({
  //       nonce: nonce
  //     })
  //     console.log('nonce: ' + nonce);
  //   })
  // }
  //构建签名信息
  async readyStake() {
    //被转账账户
    let spender = this.state.account
    //转账账户
    let owner = Tokenowner
    //时间线
    let deadline = Math.ceil(Date.now() / 1000) + parseInt(20 * 60);
    //链id
    let chainId = this.state.web3.currentProvider.networkVersion;
    this.setState({chaid: chainId})
    this.setState({owner: owner})
    this.setState({spender: spender})
    this.setState({deadline: deadline})
  }

  //构建合约实例
  async instantiateContract() {
    //取得networkid
    const networkId = await this.state.web3.eth.net.getId()
    //取得合约数据
    var networkData = Secret.networks[networkId]
    var TokenStakeData = TokenStake.networks[networkId]
    //取得当前用户
    const accounts = await this.state.web3.eth.getAccounts()
    this.setState({ account: accounts[0] })
    if (networkData) {
      //秘密币合约
      let _contract = new this.state.web3.eth.Contract(Secret.abi, networkData.address);
      this.setState({contract: _contract});
      //转账合约
      let _stake = new this.state.web3.eth.Contract(TokenStake.abi, TokenStakeData.address);
      this.setState({stake: _stake});
      //线下签名构建
      this.readyStake();
    }
  }
  //点击列表获取对应秘密详细信息
  listClick = (e) => {
    let id = e.currentTarget.getAttribute("value")
    axios.get(`/secret/listSelect?id=${id}&account=${this.state.account}`).then(async (result) => {
      this.setState({ info: result.data.data.info });
      this.setState({ btnStatus: true });
      this.setState({ listid: id })
      this.setState({ isEditOK: this.state.isEditOK ? false : true });
    });
  }

  //编辑后 点击edit
  editClick = (event) => {
    //按钮状态disable
    this.setState({ btnStatus: false });
    let imglist = new Array();
    Promise.all(this.state.fileLists.map(item => {
      return new Promise(async function (resolve, reject) {
        //更新后 获得新的ipfs hash
        let filehash = await getfile(item);
        imglist.push(filehash);
        resolve();
      })
    })).then(() => {
      //更新秘密信息
      upDataInfo(imglist, this.state.listid, this.state.info, this.state.account);
      //清空当前页面
      this.setState({ info: '' });
      this.setState({ isOK: this.state.isOK ? false : true });
    });
  }
  //获取秘密备注信息
  handleInfo = (e) => {
    this.setState({info: e.target.value})
  }

  //显示余额 测试用
  showbalance = async () => {
    //显示余额 测试用
    let balance = await this.state.contract.methods.balanceOf(this.state.account).call();
    this.setState({ balance: balance.toString() })
    //弹出提示
    Modal.info({
      title: 'Secretcoin Banlance',
      content: (
        <div>
          <p>{this.state.balance}</p>
        </div>
      ),
      onOk() { },
    });
  }

  //upload按钮提交
  handleClick = (event) => {
    let imglist = new Array();
    //无秘密图片 不提交
    if (this.state.fileLists.length === 0) {
      return
    }
    //获取ipfs hash码
    Promise.all(this.state.fileLists.map(item => {
      return new Promise(async function (resolve, reject) {
        let filehash = await getfile(item);
        imglist.push(filehash);
        resolve();
      })
    })).then(async () => {
      //新建秘密
      await uploadInfo(this, imglist);
      //转币前签名
      await this.getSignature(100);
      //转币奖励
      await this.transferFromToken(100);
      //更新秘密列表
      getInfo(this);
     
    });
  }

  render() {
    return (
      <div className="bg">
        <div className="container-fluid">
          <div className="row">
            <div className="col-md-5 col-xs-10 jumbotron">
              <ul style={{ "listStyle": "none", "textAlign": "left", "padding": "0px", "margin": "0px" }}>
                {/* 秘密列表一览 */}
                {this.state.listObj.map(item =>
                  <li key={item.listid}>
                    <a href="#" value={item.listid} info={item.info} onClick={this.listClick} >{(item.ipfsHash)[0]}</a>
                    <span className='rt'>
                      <span className="icon icon-thumbs-up icon-1x" >{item.likecount} </span>
                      <span className=" icon icon-thumbs-down icon-1x">{item.unlikecount}</span>
                    </span>
                  </li>)}
              </ul>
            </div>
            <div className="col-md-6 col-xs-10 jumbotron">
              <div className="marquee">
                <div className="wrap">
                  <div id="marquee2">
                    {/* 广告链接 */}
                    <a href="#" target="_black"><i className="icon icon-github"> Please upload the picture. (๑•̀ㅂ•́)و✧</i></a>
                    <a href="#" target="_black"><i className="icon icon-heart"></i></a>
                    <a><li className="icon icon-bullhorn text-muted"></li></a>      </div>
                </div>
              </div>
              {/* 上传秘密 */}
              <div id='upShowID' className="uploader col-md-12 clo-xs-12" data-ride="uploader" data-url="/application/upload.php">
                <div className="uploader-files file-list file-list-lg file-rename-by-click" data-drag-placeholder="选择文件/Ctrl+V粘贴/拖拽至此处" style={{ "minHeight": "300px", "width": "580px", "marginLeft": "-10px", "borderStyle": "solid" }}>
                  <UploadImage getFileList={this.getChildFileList} clearFlag={this.state.isOK} editFlag={this.state.isEditOK} listid={this.state.listid} acccount={this.state.account}></UploadImage>
                </div>
              </div>
              {/* 秘密备注信息 */}
              <textarea id="url-res-txt" className="form-control" value={this.state.info} onChange={this.handleInfo} rows="5" placeholder="A note about the secret."></textarea>
              <div className="uploader-actions">
                <div className="uploader-status pull-right text-muted"></div>
                {/* 上传 编辑按钮 */}
                {this.state.btnStatus === false ?
                  <button type="button" disabled className="btn btn-link btn-rename-file"><i className="icon icon-pencil"></i> EDIT</button>

                  : <button type="button" className="btn btn-link btn-rename-file" onClick={this.editClick}><i className="icon icon-pencil"></i> EDIT</button>}

                {this.state.btnStatus === false && this.state.fileLists.length > 0 ?
                  <button type="button" className="btn btn-link uploader-btn-start" onClick={this.handleClick}><i className="icon icon-cloud-upload" style={{ "fontSize": "10px" }}></i> UPLOAD</button>
                  : <button type="button" disabled className="btn btn-link uploader-btn-start" onClick={this.handleClick}><i className="icon icon-cloud-upload"></i> UPLOAD</button>}
              </div>
            </div>
          </div>
          {/* 显示余额 测试用 */}
          <div style={{ 'marginLeft': '500px' }}>
            <Button type="primary" onClick={this.showbalance}>show secretcoin balance</Button>
          </div>
        </div>
      </div>
    );
  }
}

export default App