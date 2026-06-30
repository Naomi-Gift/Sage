// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "forge-std/Test.sol";
import {SageVault} from "../contracts/SageVault.sol";
import {MockAavePool} from "../contracts/mocks/MockAavePool.sol";
import {MockERC20} from "../contracts/mocks/MockERC20.sol";
import {MockGoodDollarExchangeHelper} from "../contracts/mocks/MockGoodDollarExchangeHelper.sol";
import {MockGoodMarketMaker} from "../contracts/mocks/MockGoodMarketMaker.sol";

contract SageVaultGateTest is Test {
    address internal owner = address(0xA11CE);
    address internal agent = address(0xA6E17);
    address internal user = address(0xB0B);
    address internal stranger = address(0xBAD);

    MockERC20 internal gd;
    MockERC20 internal stable;
    MockERC20 internal aToken;
    MockAavePool internal aave;
    MockGoodMarketMaker internal marketMaker;
    MockGoodDollarExchangeHelper internal exchange;
    SageVault internal vault;

    function setUp() public {
        gd = new MockERC20("GoodDollar", "G$", 18);
        stable = new MockERC20("Reserve Stable", "cUSD", 18);
        aToken = new MockERC20("Aave Stable", "aStable", 18);
        aave = new MockAavePool();
        marketMaker = new MockGoodMarketMaker();
        exchange = new MockGoodDollarExchangeHelper(address(gd));

        gd.mint(user, 1_000e18);
        gd.mint(stranger, 1_000e18);
        gd.mint(address(exchange), 10_000e18);
        stable.mint(address(exchange), 10_000e18);
        stable.mint(address(aave), 10_000e18);

        vm.prank(owner);
        vault = new SageVault(
            address(gd),
            address(stable),
            address(aToken),
            address(aave),
            address(exchange),
            address(marketMaker),
            agent,
            500e18,
            1e18
        );

        vm.prank(user);
        gd.approve(address(vault), type(uint256).max);
        vm.prank(stranger);
        gd.approve(address(vault), type(uint256).max);
    }

    function test_setInstruction() public {
        vm.prank(user);
        vm.expectEmit(true, true, true, true);
        emit SageVault.InstructionSet(user, 2000, "Emergency fund");
        vault.setInstruction(2000, "Emergency fund");

        (uint256 percentBps, string memory goalLabel, bool active) = vault.instructions(user);
        assertEq(percentBps, 2000);
        assertEq(goalLabel, "Emergency fund");
        assertTrue(active);
    }

    function test_pauseInstruction() public {
        vm.prank(user);
        vault.setInstruction(2000, "Emergency fund");

        vm.prank(user);
        vm.expectEmit(true, true, true, true);
        emit SageVault.InstructionPaused(user);
        vault.pauseInstruction();

        vm.prank(agent);
        uint256 stableReceived = vault.executeSaving(user, 100e18);
        assertEq(stableReceived, 0);

        (,, bool active) = vault.instructions(user);
        assertTrue(!active);

        (, uint256 supplied) = vault.positions(user);
        assertEq(supplied, 0);
    }

    function test_executeSaving_happyPath() public {
        vm.prank(user);
        vault.setInstruction(2500, "Rainy day");

        vm.expectEmit(true, true, true, true);
        emit SageVault.SavingsExecuted(user, 25e18, 25e18, block.timestamp);

        vm.prank(agent);
        uint256 stableReceived = vault.executeSaving(user, 100e18);
        assertEq(stableReceived, 25e18);

        (uint256 principal, uint256 supplied) = vault.positions(user);
        assertEq(principal, 25e18);
        assertEq(supplied, 25e18);
        assertEq(stable.balanceOf(address(aave)), 10_025e18);
    }

    function test_executeSaving_revertsOnExceedingDepositCap() public {
        vm.prank(user);
        vault.setInstruction(5000, "Cap test");

        vm.prank(agent);
        vm.expectRevert("SageVault: deposit cap");
        vault.executeSaving(user, 1_200e18);
    }

    function test_executeSaving_revertsOnSlippageExceeded() public {
        exchange.setRates(5_000, 10_000);

        vm.prank(user);
        vault.setInstruction(2500, "Slippage");

        vm.prank(agent);
        vm.expectRevert("MockExchange: min sell");
        vault.executeSaving(user, 100e18);
    }

    function test_executeSaving_onlyAgentCanCall() public {
        vm.prank(user);
        vault.setInstruction(2000, "Access");

        vm.prank(stranger);
        vm.expectRevert("SageVault: not agent");
        vault.executeSaving(user, 100e18);
    }

    function test_withdraw_happyPath() public {
        vm.prank(user);
        vault.setInstruction(2500, "Withdraw");

        vm.prank(agent);
        vault.executeSaving(user, 100e18);

        uint256 beforeBalance = gd.balanceOf(user);

        vm.expectEmit(true, true, true, true);
        emit SageVault.Withdrawn(user, 10e18, 10e18, block.timestamp);

        vm.prank(user);
        uint256 gdReceived = vault.withdraw(10e18, 9e18);
        assertEq(gdReceived, 10e18);
        assertEq(gd.balanceOf(user) - beforeBalance, 10e18);

        (, uint256 supplied) = vault.positions(user);
        assertEq(supplied, 15e18);
    }

    function test_withdraw_revertsOnInsufficientBalance() public {
        vm.prank(user);
        vault.setInstruction(2500, "Withdraw");

        vm.prank(agent);
        vault.executeSaving(user, 100e18);

        vm.prank(user);
        vm.expectRevert("SageVault: insufficient position");
        vault.withdraw(30e18, 1e18);
    }

    function test_withdraw_userCanOnlyWithdrawOwnPosition() public {
        vm.prank(user);
        vault.setInstruction(2500, "User reserve");
        vm.prank(agent);
        vault.executeSaving(user, 100e18);

        vm.prank(stranger);
        vm.expectRevert("SageVault: insufficient position");
        vault.withdraw(1e18, 1e18);

        (uint256 principal, uint256 supplied) = vault.positions(user);
        assertEq(principal, 25e18);
        assertEq(supplied, 25e18);
    }

    function test_reentrancy_executeSaving() public {
        ReentrantExchangeHelper helper = new ReentrantExchangeHelper(address(gd));

        vm.prank(owner);
        vault = new SageVault(
            address(gd),
            address(stable),
            address(aToken),
            address(aave),
            address(helper),
            address(marketMaker),
            address(helper),
            500e18,
            1e18
        );
        helper.setVault(address(vault));

        gd.mint(user, 1_000e18);
        gd.mint(address(helper), 1_000e18);
        stable.mint(address(helper), 1_000e18);
        vm.prank(user);
        gd.approve(address(vault), type(uint256).max);
        vm.prank(address(helper));
        gd.approve(address(vault), type(uint256).max);
        vm.prank(address(helper));
        stable.approve(address(vault), type(uint256).max);

        vm.prank(user);
        vault.setInstruction(2500, "Reentry");

        helper.armSellAttack(user, 100e18);

        vm.expectRevert("SageVault: reentrant");
        helper.triggerExecuteSaving(user, 100e18);
    }

    function test_reentrancy_withdraw() public {
        ReentrantExchangeHelper helper = new ReentrantExchangeHelper(address(gd));

        vm.prank(owner);
        vault = new SageVault(
            address(gd),
            address(stable),
            address(aToken),
            address(aave),
            address(helper),
            address(marketMaker),
            agent,
            500e18,
            1e18
        );
        helper.setVault(address(vault));

        gd.mint(address(helper), 1_000e18);
        stable.mint(address(helper), 1_000e18);
        vm.prank(address(helper));
        gd.approve(address(vault), type(uint256).max);
        vm.prank(address(helper));
        stable.approve(address(vault), type(uint256).max);

        vm.prank(address(helper));
        vault.setInstruction(2500, "Helper position");

        vm.prank(agent);
        vault.executeSaving(address(helper), 100e18);

        helper.armBuyAttack(10e18, 9e18);

        vm.expectRevert("SageVault: reentrant");
        helper.triggerWithdraw(10e18, 9e18);
    }

    /// @dev Fork test against live Celo mainnet GoodDollar + Aave contracts.
    /// Requires: CELO_RPC_URL, GDOLLAR_TOKEN, RESERVE_ASSET_TOKEN, ATOKEN_RESERVE_ASSET,
    ///           AAVE_POOL_CELO, GOODDOLLAR_EXCHANGE_HELPER, GOODDOLLAR_MARKET_MAKER
    /// Run: forge test --fork-url "$CELO_RPC_URL" --match-test test_fork -vvv
    function test_fork_realCeloIntegration() public {
        string memory rpcUrl = vm.envOr("CELO_RPC_URL", string(""));
        if (bytes(rpcUrl).length == 0) {
            emit log("Skipping fork test: CELO_RPC_URL not set");
            return;
        }

        // Check all required addresses are provided
        address gdollar        = vm.envOr("GDOLLAR_TOKEN",             address(0));
        address reserveStable  = vm.envOr("RESERVE_ASSET_TOKEN",       address(0));
        address aTokenAddr     = vm.envOr("ATOKEN_RESERVE_ASSET",      address(0));
        address aavePoolAddr   = vm.envOr("AAVE_POOL_CELO",            address(0));
        address exchangeHelperAddr = vm.envOr("GOODDOLLAR_EXCHANGE_HELPER", address(0));
        address marketMakerAddr    = vm.envOr("GOODDOLLAR_MARKET_MAKER",    address(0));

        if (
            gdollar == address(0) || reserveStable == address(0) || aTokenAddr == address(0) ||
            aavePoolAddr == address(0) || exchangeHelperAddr == address(0) || marketMakerAddr == address(0)
        ) {
            emit log("Skipping fork test: one or more contract addresses not set in env");
            return;
        }

        vm.createSelectFork(rpcUrl);

        // Deploy vault on the fork with a test executor
        address forkExecutor = makeAddr("forkExecutor");
        SageVault forkVault = new SageVault(
            gdollar,
            reserveStable,
            aTokenAddr,
            aavePoolAddr,
            exchangeHelperAddr,
            marketMakerAddr,
            forkExecutor,
            500e18,  // max single deposit
            0        // disable price-impact guard on fork (set live value before mainnet)
        );

        // Smoke-check: vault was deployed, immutables wired correctly
        assertEq(address(forkVault.gDollar()), gdollar);
        assertEq(address(forkVault.targetStable()), reserveStable);
        assertEq(address(forkVault.aavePool()), aavePoolAddr);
        assertEq(forkVault.agentExecutor(), forkExecutor);

        // Smoke-check: market maker quotes are non-zero for a reasonable G$ amount
        (uint256 expectedStable,) = forkVault.quoteSellGD(100e18);
        assertGt(expectedStable, 0, "sellReturn should return non-zero stable");

        (uint256 expectedGD,) = forkVault.quoteBuyGD(expectedStable);
        assertGt(expectedGD, 0, "buyReturn should return non-zero G$");

        emit log_named_uint("quoteSellGD(100 G$) -> stable", expectedStable);
        emit log_named_uint("quoteBuyGD(stable)  -> G$",     expectedGD);
        emit log("Fork smoke-checks passed. Full round-trip test requires a G$ holder on fork.");
    }
}

interface IERC20Like {
    function approve(address spender, uint256 amount) external returns (bool);
}

contract ReentrantExchangeHelper {
    SageVault public vault;
    IERC20Like public immutable gDollar;

    bool public attackSell;
    bool public attackBuy;
    bool private sellEntered;
    bool private buyEntered;
    address public sellUser;
    uint256 public sellClaimedAmount;
    uint256 public buyStableAmount;
    uint256 public buyMinGdOut;

    constructor(address gDollar_) {
        gDollar = IERC20Like(gDollar_);
    }

    function setVault(address vault_) external {
        vault = SageVault(vault_);
    }

    function armSellAttack(address user, uint256 claimedAmount) external {
        attackSell = true;
        sellEntered = false;
        sellUser = user;
        sellClaimedAmount = claimedAmount;
    }

    function armBuyAttack(uint256 stableAmount, uint256 minGdOut) external {
        attackBuy = true;
        buyEntered = false;
        buyStableAmount = stableAmount;
        buyMinGdOut = minGdOut;
    }

    function triggerExecuteSaving(address user, uint256 claimedAmount) external {
        vault.executeSaving(user, claimedAmount);
    }

    function triggerWithdraw(uint256 stableAmount, uint256 minGdOut) external {
        vault.withdraw(stableAmount, minGdOut);
    }

    function buy(address[] calldata buyPath, uint256 tokenAmount, uint256 minReturn, uint256)
        external
        returns (uint256 gdAmount)
    {
        if (attackBuy && !buyEntered) {
            buyEntered = true;
            vault.withdraw(buyStableAmount, buyMinGdOut);
        }

        MockERC20 stable = MockERC20(buyPath[0]);
        require(stable.transferFrom(msg.sender, address(this), tokenAmount), "Helper: stable pull");
        gdAmount = tokenAmount;
        require(gdAmount >= minReturn, "Helper: min buy");
        require(MockERC20(address(gDollar)).transfer(msg.sender, gdAmount), "Helper: G$ pay");
    }

    function sell(address[] calldata sellPath, uint256 gdAmount, uint256 minReturn, address seller)
        external
        returns (uint256 stableAmount)
    {
        if (attackSell && !sellEntered) {
            sellEntered = true;
            vault.executeSaving(sellUser, sellClaimedAmount);
        }

        MockERC20 stable = MockERC20(sellPath[0]);
        require(MockERC20(address(gDollar)).transferFrom(seller, address(this), gdAmount), "Helper: G$ pull");
        stableAmount = gdAmount;
        require(stableAmount >= minReturn, "Helper: min sell");
        require(stable.transfer(msg.sender, stableAmount), "Helper: stable pay");
    }
}
