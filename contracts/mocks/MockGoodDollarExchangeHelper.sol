// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {IERC20} from "../interfaces/IERC20.sol";

contract MockGoodDollarExchangeHelper {
    IERC20 public immutable gDollar;
    uint256 public sellRateBps = 10_000;
    uint256 public buyRateBps = 10_000;

    constructor(address gDollar_) {
        gDollar = IERC20(gDollar_);
    }

    function setRates(uint256 sellRateBps_, uint256 buyRateBps_) external {
        sellRateBps = sellRateBps_;
        buyRateBps = buyRateBps_;
    }

    function buy(address[] calldata buyPath, uint256 tokenAmount, uint256 minReturn, uint256)
        external
        returns (uint256 gdAmount)
    {
        IERC20 stable = IERC20(buyPath[0]);
        require(stable.transferFrom(msg.sender, address(this), tokenAmount), "MockExchange: stable pull");
        gdAmount = (tokenAmount * buyRateBps) / 10_000;
        require(gdAmount >= minReturn, "MockExchange: min buy");
        require(gDollar.transfer(msg.sender, gdAmount), "MockExchange: G$ pay");
    }

    function sell(address[] calldata sellPath, uint256 gdAmount, uint256 minReturn, address seller)
        external
        returns (uint256 stableAmount)
    {
        IERC20 stable = IERC20(sellPath[0]);
        require(gDollar.transferFrom(seller, address(this), gdAmount), "MockExchange: G$ pull");
        stableAmount = (gdAmount * sellRateBps) / 10_000;
        require(stableAmount >= minReturn, "MockExchange: min sell");
        require(stable.transfer(msg.sender, stableAmount), "MockExchange: stable pay");
    }
}
