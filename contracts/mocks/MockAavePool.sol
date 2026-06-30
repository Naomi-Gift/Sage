// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {IERC20} from "../interfaces/IERC20.sol";
import {IAavePool} from "../interfaces/IAavePool.sol";

contract MockAavePool is IAavePool {
    mapping(address => uint256) public supplied;

    function supply(address asset, uint256 amount, address, uint16) external {
        require(IERC20(asset).transferFrom(msg.sender, address(this), amount), "MockAavePool: pull failed");
        supplied[asset] += amount;
    }

    function withdraw(address asset, uint256 amount, address to) external returns (uint256) {
        require(supplied[asset] >= amount, "MockAavePool: insufficient");
        supplied[asset] -= amount;
        require(IERC20(asset).transfer(to, amount), "MockAavePool: transfer failed");
        return amount;
    }
}
