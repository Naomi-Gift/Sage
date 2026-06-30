// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

/// @title IGoodMarketMaker
/// @notice Minimal interface for the GoodDollar GoodMarketMaker (reserve pricing oracle).
/// Only view/pure functions are included — Sage never writes to the market maker directly;
/// all buys and sells go through IGoodDollarExchangeHelper.
interface IGoodMarketMaker {
    /// @notice Returns how much stable the reserve would pay for `gdAmount` G$ sold.
    /// @param gdAmount Amount of G$ (18 decimals on Celo) to sell.
    /// @return Amount of reserve stable received.
    function sellReturn(uint256 gdAmount) external view returns (uint256);

    /// @notice Returns how much G$ the reserve would mint for `tokenAmount` of reserve token.
    /// @param token Address of the reserve token (e.g. cUSD).
    /// @param tokenAmount Amount of reserve token to supply.
    /// @return Amount of G$ minted.
    function buyReturn(address token, uint256 tokenAmount) external view returns (uint256);

    /// @notice Current G$ price expressed in the reserve token, scaled by 1e18.
    /// Useful for sanity-checking referenceGdPerStable1e18 on deployment.
    /// @param token Address of the reserve token.
    /// @return price Price of 1 G$ in reserve token units * 1e18.
    function currentPrice(address token) external view returns (uint256 price);

    /// @notice The reserve ratio for a given token (PPM, parts-per-million).
    /// @param token Address of the reserve token.
    /// @return ratio Reserve ratio in PPM.
    function reserveRatio(address token) external view returns (uint32 ratio);
}
