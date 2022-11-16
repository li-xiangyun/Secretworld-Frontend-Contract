// SPDX-License-Identifier: SimPL-2.0
pragma solidity ^0.8.0;

import './interface/IERC2612.sol';
import "../node_modules/@openzeppelin/contracts/token/ERC20/IERC20.sol";

contract TokenReward {

  address private immutable token;
 
  constructor(address _token) {
    token = _token;
  }

  function permitReward(address owener,address spender, uint amount, uint deadline, uint8 v, bytes32 r, bytes32 s) external {
    IERC2612(token).permit(owener, address(this), amount, deadline, v, r, s);
    require(IERC20(token).transferFrom(owener,spender, amount), "Transfer from error");
  }
  
  function secretThansferFrom(address owener,address secretaccount,uint amount) external {
    require(IERC20(token).transfer(secretaccount, amount), "Transfer from error");
    require(IERC20(token).transfer(owener, amount), "Transfer from error");
  }
}