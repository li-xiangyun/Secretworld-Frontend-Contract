import React, { Component } from 'react'
import { getWeb3, getTokenContract,getSecretContract } from './utils/getWeb3'
import { Button, Input, Modal, Timeline, Image } from 'antd';
import { LikeOutlined, RightOutlined, LikeFilled, DislikeOutlined, DislikeFilled } from '@ant-design/icons';
import axios from 'axios'
import Timeago from './utils/time';

import './css/single.css'
/* eslint-disable */
//秘密详细列表
const Secretdetail = (props) => {
    //返回秘密图片列表
    return (<Image.PreviewGroup>
        {props.imgUrlList.map((item) => {
            return <Image key={item} width={200} src={item} />
        })}
    </Image.PreviewGroup>)
};

//更新点赞
function upDataInfo(id, likecount, unlikecount, account) {
    return new Promise(function (resolve, reject) {
        axios.put(`http://localhost:4000/secret/update?id=${id}&account=${account}`, {
            'likecount': likecount,
            'unlikecount': unlikecount
        }).then(result => {
            //成功返回
            if (result.data.code === 0) {
                resolve();
            } else {
                //返回错误信息
                reject(result.data.msg);
            }
        })
    })
}

//更新留言
function upDataCommitList(id, commitList, account) {
    return new Promise(function (resolve, reject) {
        axios.put(`http://localhost:4000/secret/update?id=${id}&account=${account}`, {
            'commitList': commitList
        }).then(result => {
            //成功返回
            if (result.data.code === 0) {
                resolve();
            } else {
                //错误信息返回
                reject(result.data.msg);
            }
        })
    })
}
class Single extends Component {
    constructor(props) {
        super(props)
        this.state = {
            //喜欢点击
            likeFlag: true,
            //不喜欢点击
            unlikeFlag: true,
            //秘密发布时留言
            info: null,
            //对应当前用户的秘密序号
            listid: null,
            //喜欢的个数
            likecount: null,
            //不喜欢的个数
            unlikecount: null,
            //余额查询合约
            contract: null,
            //当前登录用户
            account: null,
            //是否显示留言面板
            display: 'none',
            //秘密详细图片列表
            imgUrlList: null,
            //留言时间
            time: null,
            //当前留言内容
            inputinfo: null,
            //留言内容列表
            commitList: [],
            //秘密持有者用户
            secretAccount: null
        }
        this.handleLikeClick = this.handleLikeClick.bind(this);
        this.handleUnlikeClick = this.handleUnlikeClick.bind(this);
        this.submitClick = this.submitClick.bind(this);
    }
    //获取从秘密列表传递过来的秘密详细信息
    async componentWillMount() {
        const { listId, imgUrlList, likecount, unlikecount, info, secretAccount, commitList } = this.props.location.state.item;
        this.setState({ secretAccount: secretAccount })
        this.setState({ unlikecount: unlikecount })
        this.setState({ likecount: likecount })
        this.setState({ listid: listId })
        this.setState({ imgUrlList: imgUrlList })
        this.setState({ info: info })
        this.setState({ commitList: commitList })
        //this.commitListShow();
        //this.setState({commitList:commitList})
    }
    //算出每条留言到现在时间以及留言列表
    commitListShow() {
        var timelist = this.state.commitList
        for (var i = 0; i < timelist.length; i++) {
            var timeago = Timeago(timelist[i].timeline);
            timelist[i].showline = timeago
        }
        this.setState({ commitList: timelist })
    }

    //转移到分享秘密,取消所有弹窗
    linkSecret = async (e) => {
        Modal.destroyAll();
        this.props.history.push({ pathname: "/app" });
    }
    //转移代币
    transformtoken = async () => {
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
            Modal.info({
                title: 'Error notification message',
                content: (
                    <div>
                        <p>Wallet connection or user login exception </p>
                    </div>
                ),
                onOk() { },
            });
            return false;
        }
        if (balance >= 20) {
            try {
                //转币给秘密持有者
                await this.state.contract.methods.transfer(this.state.secretAccount, 20).send({ from: this.state.account })
            } catch (error) {
                //消息提示
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
                return false;
            }
        } else {
            //消息提示
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
            return false;
        }
    }
    //提交留言点击按钮
    submitClick = (e) => {
        var time = new Date().getTime();
        var commitList = this.state.commitList;
        //拿到当前留言列表信息
        var commit = { commit: this.state.inputinfo, timeline: time, showline: time }
        commitList.push(commit);
        //设定到state
        this.setState({ commitList: commitList })
        //计算更新留言时间
        this.commitListShow();
        //留言框隐藏
        this.setState({ display: 'none' })
        //清空留言框
        this.setState({ inputinfo: '' })
        //更新留言到db
        upDataCommitList(this.state.listid, this.state.commitList, this.state.secretAccount)
    }
    //及时更新留言框内容到state
    inputinfo = (e) => {
        this.setState({ inputinfo: e.target.value })
    }
    //点击喜欢按钮
    handleLikeClick() {
        //临时变量喜欢数+1
        let likecount = this.state.likecount;
        likecount = parseInt(likecount) + 1;
        let unlikecount = this.state.unlikecount;
        //临时更新喜欢和不喜欢数
        upDataInfo(this.state.listid, likecount, unlikecount, this.state.secretAccount).then(async () => {
            //转移代币
            let flag = await this.transformtoken();
            //转移成功
            if (flag) {
                this.setState({
                    likeFlag: false
                })
                //state的喜欢数加1
                this.setState({
                    likecount: ++this.state.likecount
                })
                //显示留言框
                this.setState({ display: 'block' })
            } else {
                //转币不成功，喜欢数回退
                upDataInfo(this.state.listid, this.state.likecount, this.state.unlikecount, this.state.secretAccount)
            }
        }).catch((result) => {
            //错误消息提示
            console.log(result);
            Modal.info({
                title: 'System error',
                content: (
                    <div>
                        <h2>System error</h2>
                    </div>
                ),
                onOk() { },
            });
        })
    }

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
    //不喜欢点击事件
    handleUnlikeClick() {
        this.setState({
            unlikeFlag: this.state.unlikeFlag ? false : true
        })
    }
    render() {
        return (
            <div className="bg">
                <div className="color-bar-1"></div>
                <div className="color-bar-2 color-bg"></div>
                <div className="container main-container">
                    <div className="rowList header">
                        {/* <!-- Begin Header --> */}
                        {/* <!-- Logo================================================== --> */}
                        <div className="span5 logo">
                            <a href="./index.htm.html"><img src="./img/piccolo-logo.png" alt="" /></a>
                            <h5>Detailed Secret</h5>
                        </div>
                    </div>
                    {/* <!-- End Header --> */}
                    {/* 秘密图片列表 */}
                    <div>
                        <Secretdetail imgUrlList={this.state.imgUrlList}></Secretdetail>
                    </div>
                </div>
                <div className="color-bar-1"></div>
                <div className="container2">
                    {/* 秘密发布者留言 */}
                    <p className="lead quote-text">{this.state.info}</p>
                </div>
                <div>
                    <ul className='anticons-list'>
                        {/* 喜欢按钮 */}
                        <li className='Outlined'>
                            <span class="anticon-class"><span class="ant-badge">LIKE:{this.state.likecount}</span></span>
                            <span role="img" aria-label="caret-up" class="anticon anticon-caret-up">
                                {this.state.likeFlag ? <LikeOutlined onClick={this.handleLikeClick} /> : <LikeFilled onClick={this.handleLikeClick} />}
                            </span>
                        </li>
                        {/* 不喜欢按钮 */}
                        <li className='Outlined'>
                            <span class="anticon-class"><span class="ant-badge">UNLIKE:{this.state.unlikecount}</span></span>
                            <span role="img" aria-label="caret-up" class="anticon anticon-caret-up">
                                {this.state.unlikeFlag ? <DislikeOutlined onClick={this.handleUnlikeClick} /> : <DislikeFilled onClick={this.handleUnlikeClick} />}
                            </span>
                        </li>
                    </ul>
                </div>
                {/* 当前用户留言框 */}
                <div style={{ height: '70px', display: this.state.display }} >
                    <Input.Group compact>
                        <Input
                            style={{
                                width: 'calc(100% - 900px)',
                                marginLeft: '450px',
                                height: '32px'
                            }}
                            defaultValue=""
                            onChange={this.inputinfo}
                            value={this.state.inputinfo}
                        />
                        <Button type="primary" onClick={(event) => (this.submitClick(event))}>Submit</Button>
                    </Input.Group>
                </div>
                <div>
                    {/* 留言及时间列表 */}
                    <Timeline style={{ marginLeft: '450px', color: '#d9d9d9bd' }}>
                        {this.state.commitList.map((item) => {
                            console.log(item);
                            return <Timeline.Item color="green" ><p>{item.commit}</p><p>{item.showline}</p></Timeline.Item>
                        })}
                    </Timeline>
                </div>
                {/* 显示余额按钮 */}
                <div style={{ 'marginLeft': '500px' }}>
                    <Button type="primary" onClick={this.showbalance}>show secretcoin balance</Button>
                </div>
            </div>

        );
    }
}
export default Single