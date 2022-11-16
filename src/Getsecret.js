import React, { Component } from 'react'
import { Button, Modal } from 'antd';
import { RightOutlined } from '@ant-design/icons'
import { getWeb3, getSecretContract, getTokenContract } from './utils/getWeb3'
import ipfs from './utils/ipfs'
import Tokenowner from './Tokenowner'

import './css/bootstrap-responsive.css'
import './css/prettyPhoto.css'
import './css/custom-styles.css'

//从ipfs获取文件返回内部地址
function ipfscat(hash) {
    return new Promise(function (resolve, reject) {
        //ipfs查看文件
        ipfs.files.cat(hash, (err, buffer) => {
            if (err) {
                //错误返回
                reject(err);
            }
            //创建文件并返回内部临时地址
            var file = new File([buffer], "", { type: "image/png", lastModified: Date.now() });
            var url = window.URL.createObjectURL(file);
            resolve(url);
        })
    })
}

//取得秘密列表信息
function getSecretinfo(obj) {
    console.log("Get Info Start");
    //访问DB获取ipfshash等信息
    obj.$http('/secret/select').then(async result => {
        var tmpobj = obj.state.imgList
        var tmpdata = result.data.data;
        Promise.all(tmpdata.map(async (item, index) => {
            return new Promise(async function (resolve, reject) {
                //ipfs哈希列表
                var tmphashList = [];
                //本地临时地址
                var tmpimgList = [];
                for (let j = 0; j < item.content.length; j++) {
                    tmphashList.push(item.content[j]);
                    await ipfscat(item.content[j]).then((value) => tmpimgList.push(value)).catch(error => { reject(error) })
                }
                //从ipfs以及db拿到的信息给state
                tmpobj[index] = {
                    listFlag: true,
                    listId: item.listid,
                    secretAccount: item.account,
                    hashList: tmphashList,
                    imgUrlList: tmpimgList,
                    likecount: item.likecount,
                    info: item.info,
                    unlikecount: item.unlikecount,
                    commitList: item.commitList
                }
                resolve()
            })
        })).then(() => {
            //获取到所有秘密信息后，从新设回state
            obj.setState({ imgList: tmpobj });
        }
        )
    })
}
class List extends Component {

    constructor(props) {
        super(props)
        this.state = {
            //第一张图按钮以及进入详细页面按钮
            show: true,
            //当前登录用户地址
            account: null,
            //token合约
            contract: null,
            //秘密所属用户地址
            secretAccount: null,
            //web3实例
            web3: null,
            //token余额
            banlance: null,
            //秘密的图片列表
            imgList: [],
            //转移token合约
            token: null
        }
        this.handleFocus = this.handleFocus.bind(this);
        this.linkSecret = this.linkSecret.bind(this);
    }
    //进入页面
    async componentWillMount() {
        await getSecretinfo(this);
    }
    //离开页面
    componentWillUnmont() {
        //取消所有悬浮框
        Modal.destroyAll();
    }
    //鼠标移动到秘密上 显示可以进入详细秘密的按钮
    handleFocus = (Id) => {
        var tmpimgList = this.state.imgList
        //显示flag切换
        tmpimgList[Id].listFlag = tmpimgList[Id].listFlag ? false : true;
        this.setState({ imgList: tmpimgList })
    }

    //跳转到分享秘密页面
    linkSecret = async (e) => {
        //取消所有悬浮窗
        Modal.destroyAll();
        //跳转
        this.props.history.push({ pathname: "/sharesecret" });
    }
    //跳转到秘密详细页面link
    linkClick = async (item) => {
        //this.props.history.push({ pathname: "/secretdetailed", state: { item } });
        let balance
        try {
            //获取web3实例
            let web3 = await getWeb3()
            this.setState({ web3: web3 })
            //获取当前用户
            const accounts = await web3.eth.getAccounts()
            this.setState({ account: accounts[0] })
            //token合约实例
            let token = await getSecretContract(this.state.web3);
            this.setState({ token: token })
            //转币合约实例
            let contract = await getTokenContract(this.state.web3);
            this.setState({ contract: contract })
            //查看当前用户余额
            balance = await contract.methods.balanceOf(this.state.account).call()
        } catch (error) {
            //弹窗提示
            Modal.error({
                title: 'Error notification message',
                content: (
                    <div>
                        <p>Wallet connection or user login exception </p>
                    </div>
                ),
                onOk() { },
            });
            return
        }
        //用户余额是否大于20.不大于20的话 不能进入
        if (balance >= 20) {
            try {
                //当前用户发币给秘密持有者用户
                await this.state.contract.methods.secretThansferFrom(Tokenowner, item.secretAccount, 10).send({ from: this.state.account })
                //跳转到详细页面
                this.props.history.push({ pathname: "/secretdetailed", state: { item } });
            } catch (error) {
                //弹出提示错误，输出错误日志
                console.log(error);
                Modal.error({
                    title: 'Error message',
                    content: (
                        <div>
                            <p>Transfer failed</p>
                        </div>
                    ),
                    onOk() { },
                });
                return
            }
        } else {
            //弹窗提示币少于20，并且提示获取方法
            Modal.info({
                title: 'Secretcoin less than 20',
                content: (
                    <div>
                        <p>You can choose the following methods to earn </p>
                        <ul>
                            {/* //直接消耗以太币 */}
                            <li><a>Use eth(Not yet completed)<span>  <RightOutlined /></span></a></li>
                            {/* //去分享秘密，获取代币 */}
                            <li><a onClick={(e) => { this.linkSecret(e) }}>Publish secret<span>  <RightOutlined /></span></a></li>
                            {/* //去Unswap 换取 */}
                            <li><a href="https://app.uniswap.org">Unswap change<span>  <RightOutlined /></span></a></li>
                        </ul>
                    </div>
                ),
                onOk() { },
            });
            return
        }

    }
    //显示余额按键，测试用
    showbalance = async () => {
        try {
            //获取web3实例
            let web3 = await getWeb3()
            this.setState({ web3: web3 })
            //获取当前用户
            const accounts = await web3.eth.getAccounts()
            this.setState({ account: accounts[0] })
            //转币合约实例
            let contract = await getTokenContract(this.state.web3);
            this.setState({ contract: contract })
            //查看当前用户余额
            let balance = await contract.methods.balanceOf(this.state.account).call()
            this.setState({ balance: balance.toString() })
            Modal.info({
                title: 'Secretcoin Banlance',
                content: (
                    <div>
                        <p>{this.state.balance}</p>
                    </div>
                ),
                onOk() { },
            });
        } catch (error) {
            //弹窗提示
            Modal.error({
                title: 'Error notification message',
                content: (
                    <div>
                        <p>Wallet connection or user login exception </p>
                    </div>
                ),
                onOk() { },
            });
            return
        }
    }

    render() {
        return (
            <div className="bg">
                <div className="container main-container">
                    <div className="rowList header">
                        {/* <!-- Begin Header --> */}
                        {/* <!-- Logo================================================== --> */}
                        <div className="span5 logo">
                            <a href="./index.htm.html"><img src="./img/piccolo-logo.png" alt="" /></a>
                            <h5>Sectet World</h5>
                        </div>
                    </div>
                    {/* <!-- End Header --> */}
                    <div className="rowList">
                        {/* <!-- Secret Items================================================== -->  */}
                        <div className="span12 gallery">
                            <ul id="filterOptions" className="gallery-cats clearfix">
                                {/* 功能列表 各种排序 */}
                                <li className="active"><a href="#" className="all">All</a></li>
                            </ul>
                        </div>
                        <div className="rowList clearfix">
                            <ul className="gallery-post-grid holder ">
                                {/* 秘密列表 圆形 */}
                                {this.state.imgList.map((item, index) => {
                                    return <li key={item.listId} className="span3 gallery-item" onMouseEnter={() => { this.handleFocus(item.listFlag, index) }} onMouseLeave={() => { this.handleFocus(item.listFlag, index) }}>
                                        <span tabIndex="0" hidefocus="true" className={item.listFlag ? 'gallery-hover-4col-cir' : 'gallery-hover-4col-cir-hide'} >
                                            <span className="gallery-icons" >
                                                <a href={item.imgUrlList[0]} className="item-zoom-link lightbox" title="Custom Illustration" data-rel="prettyPhoto"></a>
                                                <a href="#" className="item-details-link" onClick={(e) => { this.linkClick(e, item) }}></a>
                                            </span>
                                        </span>
                                        <a href="./gallery-single.htm.html"><img style={{ "width": "220px", "height": "220px", "object-fit": "none" }} src={item.imgUrlList[0]} alt="Gallery" className="img-circle" /></a>
                                    </li>
                                })}
                            </ul>
                        </div>
                    </div>
                    {/* 显示余额按钮 */}
                    <div style={{ 'marginLeft': '500px' }}>
                        <Button type="primary" onClick={this.showbalance}>show secretcoin balance</Button>
                    </div>
                </div>
            </div>
        );
    }

}
export default List