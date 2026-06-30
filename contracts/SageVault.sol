// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {IAavePool} from "./interfaces/IAavePool.sol";
import {IERC20} from "./interfaces/IERC20.sol";
import {IERC677Receiver} from "./interfaces/IERC677Receiver.sol";
import {IGoodDollarExchangeHelper} from "./interfaces/IGoodDollarExchangeHelper.sol";
import {IGoodMarketMaker} from "./interfaces/IGoodMarketMaker.sol";

contract SageVault is IERC677Receiver {
    struct SavingsInstruction {
        uint256 percentBps;
        string goalLabel;
        bool active;
    }

    struct UserPosition {
        uint256 principalDepositedGD;
        uint256 stableSupplied;
    }

    mapping(address => SavingsInstruction) public instructions;
    mapping(address => UserPosition) public positions;

    IAavePool public immutable aavePool;
    IGoodDollarExchangeHelper public immutable exchangeHelper;
    IGoodMarketMaker public immutable marketMaker;
    IERC20 public immutable gDollar;
    IERC20 public immutable targetStable;
    IERC20 public immutable aToken;

    address public owner;
    address public agentExecutor;
    uint256 public maxSingleDepositGD;
    uint256 public maxSlippageBps = 100;
    uint256 public maxPriceImpactBps = 300;
    uint256 public referenceGdPerStable1e18;

    uint256 public constant BPS = 10_000;
    // GoodDollar charges a 3% reserve contribution on every G$ sell-back.
    // This is deducted by the ExchangeHelper internally, so our received stable
    // is already net of it. The constant is kept here for documentation and for
    // computing worst-case minGdOut quotes in the withdraw path.
    uint256 public constant EXIT_CONTRIBUTION_BPS = 300;

    bool private locked;

    event InstructionSet(address indexed user, uint256 percentBps, string goalLabel);
    event InstructionPaused(address indexed user);
    event SavingsExecuted(address indexed user, uint256 gdReceived, uint256 stableSupplied, uint256 timestamp);
    event Withdrawn(address indexed user, uint256 stableWithdrawn, uint256 gdReceived, uint256 timestamp);
    event AgentExecutorUpdated(address indexed oldExecutor, address indexed newExecutor);
    event MaxSingleDepositUpdated(uint256 oldCap, uint256 newCap);
    event RiskParametersUpdated(uint256 maxSlippageBps, uint256 maxPriceImpactBps, uint256 referenceGdPerStable1e18);

    modifier onlyOwner() {
        require(msg.sender == owner, "SageVault: not owner");
        _;
    }

    modifier onlyAgent() {
        require(msg.sender == agentExecutor, "SageVault: not agent");
        _;
    }

    modifier nonReentrant() {
        require(!locked, "SageVault: reentrant");
        locked = true;
        _;
        locked = false;
    }

    constructor(
        address gDollar_,
        address targetStable_,
        address aToken_,
        address aavePool_,
        address exchangeHelper_,
        address marketMaker_,
        address agentExecutor_,
        uint256 maxSingleDepositGD_,
        uint256 referenceGdPerStable1e18_
    ) {
        require(gDollar_ != address(0), "SageVault: zero G$");
        require(targetStable_ != address(0), "SageVault: zero stable");
        require(aToken_ != address(0), "SageVault: zero aToken");
        require(aavePool_ != address(0), "SageVault: zero Aave pool");
        require(exchangeHelper_ != address(0), "SageVault: zero exchange");
        require(marketMaker_ != address(0), "SageVault: zero market maker");
        require(agentExecutor_ != address(0), "SageVault: zero agent");
        require(maxSingleDepositGD_ > 0, "SageVault: zero cap");

        owner = msg.sender;
        // Sage is Celo-only: G$ uses 18 decimals on Celo. A future Fuse port must revisit all amount math.
        require(IERC20(gDollar_).decimals() == 18, "SageVault: Celo G$ only");
        gDollar = IERC20(gDollar_);
        targetStable = IERC20(targetStable_);
        aToken = IERC20(aToken_);
        aavePool = IAavePool(aavePool_);
        exchangeHelper = IGoodDollarExchangeHelper(exchangeHelper_);
        marketMaker = IGoodMarketMaker(marketMaker_);
        agentExecutor = agentExecutor_;
        maxSingleDepositGD = maxSingleDepositGD_;
        referenceGdPerStable1e18 = referenceGdPerStable1e18_;
    }

    function setInstruction(uint256 percentBps, string calldata goalLabel) external {
        require(percentBps <= 5000, "SageVault: max 50%");
        instructions[msg.sender] = SavingsInstruction({
            percentBps: percentBps,
            goalLabel: goalLabel,
            active: percentBps > 0
        });

        emit InstructionSet(msg.sender, percentBps, goalLabel);
    }

    function pauseInstruction() external {
        instructions[msg.sender].active = false;
        emit InstructionPaused(msg.sender);
    }

    function executeSaving(address user, uint256 claimedAmountGD) external onlyAgent nonReentrant returns (uint256 stableReceived) {
        SavingsInstruction memory instr = instructions[user];
        if (!instr.active || instr.percentBps == 0 || claimedAmountGD == 0) {
            return 0;
        }

        uint256 amountToSaveGD = (claimedAmountGD * instr.percentBps) / 10000;
        require(amountToSaveGD <= maxSingleDepositGD, "SageVault: deposit cap");
        uint256 gdReceived = _pullGDollar(user, amountToSaveGD);
        stableReceived = _convertGDollarToStable(gdReceived);
        _depositStableIntoAave(stableReceived);
        _recordSavings(user, gdReceived, stableReceived);
    }

    function onTokenTransfer(address sender, uint256 amount, bytes calldata data) external nonReentrant returns (bool) {
        require(msg.sender == address(gDollar), "SageVault: only G$ callback");
        SavingsInstruction memory instr = instructions[sender];
        require(instr.active, "SageVault: inactive instruction");

        uint256 gdReceived = _actualReceivedFromCallback(amount);
        if (data.length > 0) {
            address creditedUser = abi.decode(data, (address));
            require(creditedUser == sender, "SageVault: sender mismatch");
        }

        uint256 stableReceived = _convertGDollarToStable(gdReceived);
        _depositStableIntoAave(stableReceived);
        _recordSavings(sender, gdReceived, stableReceived);
        return true;
    }

    function withdraw(uint256 stableAmount, uint256 minGdOut) external nonReentrant returns (uint256 gdReceived) {
        UserPosition storage pos = positions[msg.sender];
        require(stableAmount > 0, "SageVault: zero withdraw");
        require(stableAmount <= pos.stableSupplied, "SageVault: insufficient position");

        uint256 stableReceived = _withdrawStableFromAave(stableAmount);
        uint256 expectedGD = _estimateGDForStable(stableReceived);
        // Apply exit contribution + slippage so the floor is realistic.
        uint256 protocolAwareMin = _quoteMinOutWithContribution(expectedGD);
        require(minGdOut <= protocolAwareMin, "SageVault: min too optimistic");

        gdReceived = _convertStableToGDollar(stableReceived, minGdOut);
        _recordWithdrawal(msg.sender, stableAmount, gdReceived);
        require(gDollar.transfer(msg.sender, gdReceived), "SageVault: G$ transfer failed");
        emit Withdrawn(msg.sender, stableReceived, gdReceived, block.timestamp);
    }

    function quoteSellGD(uint256 gdAmount) external view returns (uint256 expectedStable, uint256 minStableOut) {
        expectedStable = marketMaker.sellReturn(gdAmount);
        minStableOut = _quoteMinOut(expectedStable);
    }

    function quoteBuyGD(uint256 stableAmount) external view returns (uint256 expectedGD, uint256 minGdOut) {
        expectedGD = _estimateGDForStable(stableAmount);
        minGdOut = _quoteMinOutWithContribution(expectedGD);
    }

    function updateAgentExecutor(address newExecutor) external onlyOwner {
        require(newExecutor != address(0), "SageVault: zero agent");
        address oldExecutor = agentExecutor;
        agentExecutor = newExecutor;
        emit AgentExecutorUpdated(oldExecutor, newExecutor);
    }

    function updateMaxSingleDeposit(uint256 newCap) external onlyOwner {
        require(newCap > 0, "SageVault: zero cap");
        uint256 oldCap = maxSingleDepositGD;
        maxSingleDepositGD = newCap;
        emit MaxSingleDepositUpdated(oldCap, newCap);
    }

    function updateRiskParameters(uint256 maxSlippageBps_, uint256 maxPriceImpactBps_, uint256 referenceGdPerStable1e18_)
        external
        onlyOwner
    {
        require(maxSlippageBps_ <= 1000, "SageVault: slippage too high");
        require(maxPriceImpactBps_ <= 1000, "SageVault: impact too high");
        maxSlippageBps = maxSlippageBps_;
        maxPriceImpactBps = maxPriceImpactBps_;
        referenceGdPerStable1e18 = referenceGdPerStable1e18_;
        emit RiskParametersUpdated(maxSlippageBps_, maxPriceImpactBps_, referenceGdPerStable1e18_);
    }

    function previewWithdrawableGD(address user) external view returns (uint256) {
        uint256 supplied = positions[user].stableSupplied;
        if (supplied == 0) return 0;
        return marketMaker.buyReturn(address(targetStable), supplied);
    }

    function _pullGDollar(address user, uint256 requestedAmount) private returns (uint256 receivedAmount) {
        uint256 beforeBalance = gDollar.balanceOf(address(this));
        require(gDollar.transferFrom(user, address(this), requestedAmount), "SageVault: G$ transfer failed");
        receivedAmount = gDollar.balanceOf(address(this)) - beforeBalance;
        require(receivedAmount > 0, "SageVault: no G$ received");
    }

    function _actualReceivedFromCallback(uint256 nominalAmount) private view returns (uint256) {
        uint256 currentBalance = gDollar.balanceOf(address(this));
        uint256 receivedAmount = currentBalance < nominalAmount ? currentBalance : nominalAmount;
        require(receivedAmount > 0, "SageVault: callback balance");
        return receivedAmount;
    }

    function _convertGDollarToStable(uint256 gdAmount) private returns (uint256 stableReceived) {
        uint256 expectedStable = marketMaker.sellReturn(gdAmount);
        require(expectedStable > 0, "SageVault: zero sell quote");
        _enforcePriceImpact(gdAmount, expectedStable);

        address[] memory sellPath = new address[](1);
        sellPath[0] = address(targetStable);

        _approveIfNeeded(gDollar, address(exchangeHelper), gdAmount);
        stableReceived = exchangeHelper.sell(sellPath, gdAmount, _quoteMinOut(expectedStable), address(this));
    }

    function _depositStableIntoAave(uint256 stableAmount) private {
        _approveIfNeeded(targetStable, address(aavePool), stableAmount);
        aavePool.supply(address(targetStable), stableAmount, address(this), 0);
    }

    function _recordSavings(address user, uint256 gdAmount, uint256 stableAmount) private {
        positions[user].principalDepositedGD += gdAmount;
        positions[user].stableSupplied += stableAmount;
        emit SavingsExecuted(user, gdAmount, stableAmount, block.timestamp);
    }

    function _withdrawStableFromAave(uint256 stableAmount) private returns (uint256 stableReceived) {
        stableReceived = aavePool.withdraw(address(targetStable), stableAmount, address(this));
    }

    function _convertStableToGDollar(uint256 stableAmount, uint256 minGdOut) private returns (uint256 gdReceived) {
        address[] memory buyPath = new address[](1);
        buyPath[0] = address(targetStable);

        _approveIfNeeded(targetStable, address(exchangeHelper), stableAmount);
        gdReceived = exchangeHelper.buy(buyPath, stableAmount, minGdOut, 1);
    }

    function _recordWithdrawal(address user, uint256 stableAmount, uint256 gdReceived) private {
        UserPosition storage pos = positions[user];
        pos.stableSupplied -= stableAmount;
        pos.principalDepositedGD = gdReceived >= pos.principalDepositedGD ? 0 : pos.principalDepositedGD - gdReceived;
    }

    function _enforcePriceImpact(uint256 gdAmount, uint256 stableReceived) private view {
        if (referenceGdPerStable1e18 == 0) return;
        uint256 impliedGdPerStable1e18 = (gdAmount * 1e18) / stableReceived;
        uint256 maxAllowed = (referenceGdPerStable1e18 * (BPS + maxPriceImpactBps)) / BPS;
        require(impliedGdPerStable1e18 <= maxAllowed, "SageVault: price impact");
    }

    function _minAfterSlippage(uint256 expectedAmount) private view returns (uint256) {
        return (expectedAmount * (BPS - maxSlippageBps)) / BPS;
    }

    function _quoteMinOut(uint256 expectedAmount) private view returns (uint256) {
        return _minAfterSlippage(expectedAmount);
    }

    /// @dev For the withdraw path: the GoodDollar reserve charges EXIT_CONTRIBUTION_BPS
    /// on every buy-back. The ExchangeHelper deducts it internally, so we compound
    /// contribution + slippage when computing the floor for minGdOut.
    function _quoteMinOutWithContribution(uint256 expectedAmount) private view returns (uint256) {
        uint256 afterContribution = (expectedAmount * (BPS - EXIT_CONTRIBUTION_BPS)) / BPS;
        return _minAfterSlippage(afterContribution);
    }

    function _estimateGDForStable(uint256 stableAmount) private view returns (uint256) {
        return marketMaker.buyReturn(address(targetStable), stableAmount);
    }

    function _approveIfNeeded(IERC20 token, address spender, uint256 amount) private {
        if (token.allowance(address(this), spender) < amount) {
            require(token.approve(spender, type(uint256).max), "SageVault: approve failed");
        }
    }
}
