// SPDX-License-Identifier: SimPL-2.0
pragma solidity ^0.8.0;

import "../node_modules/@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "./interface/IERC2612.sol";
abstract contract ERC2612 is ERC20, IERC2612 {
    mapping (address => uint256) public override nonces;
    string temp;
    string name1;
    bytes32 public immutable DOMAIN_SEPARATOR;
    bytes32 public immutable PERMIT_TYPEHASH = keccak256("Permit(address owner,address spender,uint256 value,uint256 nonce,uint256 deadline)");
    
    //构建签名信息，EIP712格式
    constructor(string memory name_, string memory symbol_) ERC20(name_, symbol_) {
        DOMAIN_SEPARATOR = keccak256(
            //abi编码
            abi.encode(
                keccak256("EIP712Domain(string name,string version,uint256 chainId,address verifyingContract)"),
                //token 名字
                keccak256(bytes(name_)),
                //token 版本
                keccak256(bytes("1")),
                //链id
                1337,
                //合约地址
                address(this)
            )
        );
    }
    /**
     * @dev See {IERC2612-permit}.
     */
    function permit(address owner, address spender, uint256 amount, uint256 deadline, uint8 v, bytes32 r, bytes32 s) public virtual override {
        require(deadline >= block.timestamp, "ERC20Permit: expired deadline");
        //授权内容，转账者，被转帐者，允许金额，nonce，时间线 hash算出
        bytes32 hashStruct = keccak256(
            abi.encode(
                PERMIT_TYPEHASH,
                owner,
                spender,
                amount,
                0,
                deadline
            )
        );
        
        //最后签名信息算出
        bytes32 hash = keccak256(
            abi.encodePacked(
                '\x19\x01',
                DOMAIN_SEPARATOR,
                hashStruct
            )
        );

        //验证签名
        //r:32 字节，s:32 字节，v:1字节
        address signer = ecrecover(hash, v, r, s);
        require(
            signer != address(0) && signer == owner,
            "ERC20Permit: invalid signature"
        );
        _approve(owner, spender, amount);
    }
}
