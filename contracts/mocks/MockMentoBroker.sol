// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {IERC20} from "../interfaces/IERC20.sol";

/// @notice Test double for the Mento Broker.
/// Swaps at a configurable rate (BPS). Default 1:1.
contract MockMentoBroker {
    uint256 public rateBps = 10_000; // applied to all swaps, 10_000 = 1:1

    function setRate(uint256 rateBps_) external {
        rateBps = rateBps_;
    }

    function getAmountOut(
        address, /* exchangeProvider */
        bytes32, /* exchangeId */
        address, /* tokenIn */
        address, /* tokenOut */
        uint256 amountIn
    ) external view returns (uint256) {
        return (amountIn * rateBps) / 10_000;
    }

    function swapIn(
        address, /* exchangeProvider */
        bytes32, /* exchangeId */
        address tokenIn,
        address tokenOut,
        uint256 amountIn,
        uint256 amountOutMin
    ) external returns (uint256 amountOut) {
        amountOut = (amountIn * rateBps) / 10_000;
        require(amountOut >= amountOutMin, "MockBroker: slippage");
        require(IERC20(tokenIn).transferFrom(msg.sender, address(this), amountIn), "MockBroker: pull failed");
        require(IERC20(tokenOut).transfer(msg.sender, amountOut), "MockBroker: pay failed");
    }
}
