// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

contract MockGoodMarketMaker {
    uint256 public sellRate = 1e18;
    uint256 public buyRate = 1e18;
    uint256 public mockPrice = 1e18;
    uint32 public mockReserveRatio = 1_000_000; // 100% in PPM

    function setRates(uint256 sellRate_, uint256 buyRate_) external {
        sellRate = sellRate_;
        buyRate = buyRate_;
    }

    function setPrice(uint256 price_) external {
        mockPrice = price_;
    }

    function setReserveRatio(uint32 ratio_) external {
        mockReserveRatio = ratio_;
    }

    function buyReturn(address, uint256 tokenAmount) external view returns (uint256) {
        return (tokenAmount * buyRate) / 1e18;
    }

    function sellReturn(uint256 gdAmount) external view returns (uint256) {
        return (gdAmount * sellRate) / 1e18;
    }

    function currentPrice(address) external view returns (uint256) {
        return mockPrice;
    }

    function reserveRatio(address) external view returns (uint32) {
        return mockReserveRatio;
    }
}
