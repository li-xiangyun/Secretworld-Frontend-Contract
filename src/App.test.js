import React from 'react'
import ReactDOM from 'react-dom'
import DApp from './DApp'

it('renders without crashing', () => {
  const div = document.createElement('div')
  ReactDOM.render(<DApp />, div)
})
