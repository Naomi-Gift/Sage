// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {IERC20} from "./interfaces/IERC20.sol";
import {IMentoBroker} from "./interfaces/IMentoBroker.sol";

/// @title MentoExchangeAdapter
/// @notice Adapts the Mento Broker into the IGoodDollarExchangeHelper +
///         IGoodMarketMaker interface shapes that SageVault expects.
///
/// @dev Architecture:
///   SageVault calls:
///     exchangeHelper.sell(path, gdAmount, minStable, address(this))
///       → this contract pulls G$ from the vault, calls broker.swapIn(G$→cUSD),
///         transfers cUSD back to the vault.
///     exchangeHelper.buy(path, stableAmount, minGd, 1)
///       → pulls cUSD from the vault, calls broker.swapIn(cUSD→G$),
///         transfers G$ back to the vault.
///     marketMaker.sellReturn(gdAmount)      → broker.getAmountOut(G$→cUSD)
///     marketMaker.buyReturn(token, amount)  → broker.getAmountOut(cUSD→G$)
///
///   The vault approves this adapter before each call (handled by _approveIfNeeded).
///   This adapter then re-approves the Mento Broker before each swap.
///
/// @dev Mento Broker requires the caller (this contract) to hold the tokenIn
///      and to have approved the broker. SageVault transfers G$/cUSD to this
///      adapter via transferFrom, which is why the vault must approve this adapter.

contract MentoExchangeAdapter {
    IMentoBroker public immutable broker;
    address public immutable exchangeProvider;
    bytes32 public immutable exchangeId;
    IERC20 public immutable gDollar;
    IERC20 public immutable stable;

    constructor(
        address broker_,
        address exchangeProvider_,
        bytes32 exchangeId_,
        address gDollar_,
        address stable_
    ) {
        require(broker_ != address(0), "Adapter: zero broker");
        require(exchangeProvider_ != address(0), "Adapter: zero provider");
        require(gDollar_ != address(0), "Adapter: zero G$");
        require(stable_ != address(0), "Adapter: zero stable");
        broker = IMentoBroker(broker_);
        exchangeProvider = exchangeProvider_;
        exchangeId = exchangeId_;
        gDollar = IERC20(gDollar_);
        stable = IERC20(stable_);
    }

    // ─── IGoodDollarExchangeHelper ────────────────────────────────────────────

    /// @notice Sell G$ for stable. Called by SageVault during deposit.
    /// @param gdAmount   Amount of G$ to sell (vault has already approved this adapter).
    /// @param minReturn  Minimum cUSD to receive (slippage guard).
    /// @return stableReceived Amount of cUSD returned to msg.sender (the vault).
    function sell(
        address[] calldata, /* sellPath — ignored, route is fixed by exchangeId */
        uint256 gdAmount,
        uint256 minReturn,
        address /* seller */
    ) external returns (uint256 stableReceived) {
        // Pull G$ from the vault (vault approved this adapter)
        require(gDollar.transferFrom(msg.sender, address(this), gdAmount), "Adapter: G$ pull failed");

        // Approve broker
        _approveIfNeeded(gDollar, address(broker), gdAmount);

        stableReceived = broker.swapIn(
            exchangeProvider,
            exchangeId,
            address(gDollar),
            address(stable),
            gdAmount,
            minReturn
        );

        require(stable.transfer(msg.sender, stableReceived), "Adapter: stable pay failed");
    }

    /// @notice Buy G$ with stable. Called by SageVault during withdrawal.
    /// @param stableAmount   Amount of cUSD to spend (vault has approved this adapter).
    /// @param minReturn      Minimum G$ to receive (slippage guard).
    /// @return gdReceived    Amount of G$ returned to msg.sender (the vault).
    function buy(
        address[] calldata, /* buyPath — ignored */
        uint256 stableAmount,
        uint256 minReturn,
        uint256               /* minTokenReturn — unused */
    ) external returns (uint256 gdReceived) {
        // Pull cUSD from the vault
        require(stable.transferFrom(msg.sender, address(this), stableAmount), "Adapter: stable pull failed");

        // Approve broker
        _approveIfNeeded(stable, address(broker), stableAmount);

        gdReceived = broker.swapIn(
            exchangeProvider,
            exchangeId,
            address(stable),
            address(gDollar),
            stableAmount,
            minReturn
        );

        require(gDollar.transfer(msg.sender, gdReceived), "Adapter: G$ pay failed");
    }

    // ─── IGoodMarketMaker (price oracle shape) ────────────────────────────────

    /// @notice Quote how much cUSD you get for selling `gdAmount` G$.
    function sellReturn(uint256 gdAmount) external view returns (uint256) {
        return broker.getAmountOut(exchangeProvider, exchangeId, address(gDollar), address(stable), gdAmount);
    }

    /// @notice Quote how much G$ you get for supplying `tokenAmount` of the stable.
    /// @param token Must match this adapter's stable address — enforced for safety.
    function buyReturn(address token, uint256 tokenAmount) external view returns (uint256) {
        require(token == address(stable), "Adapter: wrong token");
        return broker.getAmountOut(exchangeProvider, exchangeId, address(stable), address(gDollar), tokenAmount);
    }

    /// @notice Spot price of 1 G$ in stable units, scaled by 1e18.
    /// Useful for setting referenceGdPerStable1e18 on the vault.
    function currentPrice(address token) external view returns (uint256) {
        require(token == address(stable), "Adapter: wrong token");
        // Price of 1 G$ in stable = stable received for 1e18 G$
        uint256 stableFor1GD = broker.getAmountOut(
            exchangeProvider, exchangeId, address(gDollar), address(stable), 1e18
        );
        // Convert: "stable per G$" → "G$ per stable" * 1e18
        // gdPerStable1e18 = 1e36 / stableFor1GD  (both 18-decimal tokens)
        if (stableFor1GD == 0) return 0;
        return (1e36) / stableFor1GD;
    }

    /// @notice Reserve ratio — not tracked by Mento, returns 0.
    function reserveRatio(address) external pure returns (uint32) {
        return 0;
    }

    // ─── Internal ─────────────────────────────────────────────────────────────

    function _approveIfNeeded(IERC20 token, address spender, uint256 amount) private {
        if (token.allowance(address(this), spender) < amount) {
            require(token.approve(spender, type(uint256).max), "Adapter: approve failed");
        }
    }
}
