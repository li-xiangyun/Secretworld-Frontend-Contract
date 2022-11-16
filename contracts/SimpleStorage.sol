// SPDX-License-Identifier: SimPL-2.0
pragma solidity ^0.8.0;

contract SimpleStorage {
  string ipfsHash;

  function set(string memory x) public {
    ipfsHash = x;
  }

  function get() public view returns (string memory) {
    return ipfsHash;
  }
}
