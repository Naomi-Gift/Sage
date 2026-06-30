// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

/// @title IMentoBroker
/// @notice Minimal interface for the Mento Broker — the on-chain swap engine
/// that backs G$ on Celo via the Mento reserve.
/// Full interface: https://github.com/mento-protocol/mento-core/blob/main/contracts/interfaces/IBroker.sol
interface IMentoBroker {
    /// @notice Quote how much tokenOut you receive for a fixed amountIn of tokenIn.
    function getAmountOut(
        address exchangeProvider,
        bytes32 exchangeId,
        address tokenIn,
        address tokenOut,
        uint256 amountIn
    ) external view returns (uint256 amountOut);

    /// @notice Execute a swap with a fixed amountIn.
    /// @param amountOutMin Minimum acceptable output — reverts if not met (slippage guard).
    function swapIn(
        address exchangeProvider,
        bytes32 exchangeId,
        address tokenIn,
        address tokenOut,
        uint256 amountIn,
        uint256 amountOutMin
    ) external returns (uint256 amountOut);
}
