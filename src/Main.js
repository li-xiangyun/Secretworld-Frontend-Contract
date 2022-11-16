import React, { Component } from 'react'
import { Link } from 'react-router-dom'

import './css/home.css'
import './css/optimize.css'
import './effect/run.js'
// 主页
class Main extends Component {
    render() {
        return (
            // 主页
            <div className="wrap index-wrap" data-handler="index" >
                <div className="main index-main" style={{ "background": "#0b1323" }}>
                    <div className="banner">
                        <canvas id="demo-canvas" width="1903" height="810"></canvas>
                        <div className="slogan">
                            <p style={{ "color": "#00ffdd" }}>Secret World</p>
                        </div>
                        <div className="tools js_tools">
                        {/* 按钮Get Secret */}
                            <div style={{ "float": "left" }}>
                                <div className="buttons">
                                    <Link to='/getsecret'>Get Secret</Link>
                                </div>
                            </div>
                        {/* 按钮Share Your Secret */}
                            <div style={{ "float": "left" }}>
                                <div className="buttons">
                                    <Link to='/sharesecret'>Share Your Secret</Link>
                                </div>
                            </div>
                        </div>
                        <div>
                        </div>
                    </div>
                </div>
            </div>
        )
    }
}

export default Main