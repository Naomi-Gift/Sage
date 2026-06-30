// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

interface IGoodDollarExchangeHelper {
    function buy(address[] calldata buyPath, uint256 tokenAmount, uint256 minReturn, uint256 minTokenReturn)
        external
        returns (uint256);

    function sell(address[] calldata sellPath, uint256 gdAmount, uint256 minReturn, address seller)
        external
        returns (uint256);
}
