import React, { Component } from 'react'
import Sharesecret from './Sharesecret.js'
import Getsecret from './Getsecret.js'
import Secretdetailed from './Secretdetailed.js'
import Main from './Main.js'
import { BrowserRouter as Router,Route,Switch } from 'react-router-dom'

//Sharesecret:分享秘密
//Getsecret:获取秘密列表
//secretdetailed:秘密详情
class Homepage extends Component {
    render() {
        return (
            <Router>
                <Switch>
                 <Route exact path='/' component={Main}></Route>
                 <Route path='/sharesecret' component={Sharesecret}></Route>
                 <Route path='/getsecret' component={Getsecret}></Route>
                 <Route path='/secretdetailed' component={Secretdetailed}></Route>
                </Switch>
        </Router>
        )
    }
}
export default Homepage