// SPDX-License-Identifier: SimPL-2.0
pragma solidity ^0.8.0;

import "./interface/IERC2612.sol";
import "./ERC2612.sol";
contract Secret is ERC2612 {
  //构建代币
  constructor () ERC2612("SecretCoin", "SecretCoin") {
    _mint(msg.sender, 100000e18);
  }
  //销毁代币
  function burn(uint256 amount) public {
    _burn(msg.sender, amount);
  }
}