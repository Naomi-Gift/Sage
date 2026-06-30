// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "forge-std/Test.sol";
import {SageVault} from "../contracts/SageVault.sol";
import {MockAavePool} from "../contracts/mocks/MockAavePool.sol";
import {MockERC20} from "../contracts/mocks/MockERC20.sol";
import {MockGoodDollarExchangeHelper} from "../contracts/mocks/MockGoodDollarExchangeHelper.sol";
import {MockGoodMarketMaker} from "../contracts/mocks/MockGoodMarketMaker.sol";

contract SageVaultTest is Test {
    address internal owner = address(0xA11CE);
    address internal agent = address(0xA6E17);
    address internal user = address(0xB0B);
    address internal stranger = address(0xBAD);

    MockERC20 internal gd;
    MockERC20 internal stable;
    MockERC20 internal aToken;
    MockAavePool internal aave;
    MockGoodDollarExchangeHelper internal exchange;
    MockGoodMarketMaker internal marketMaker;
    SageVault internal vault;

    function setUp() public {
        gd = new MockERC20("GoodDollar", "G$", 18);
        stable = new MockERC20("Reserve Stable", "cUSD", 18);
        aToken = new MockERC20("Aave Stable", "aStable", 18);
        aave = new MockAavePool();
        marketMaker = new MockGoodMarketMaker();
        exchange = new MockGoodDollarExchangeHelper(address(gd));

        gd.mint(user, 1_000e18);
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
    }

    function testSetInstructionCapsAtHalfClaim() public {
        vm.prank(user);
        vm.expectRevert("SageVault: max 50%");
        vault.setInstruction(5001, "School fees");

        vm.prank(user);
        vault.setInstruction(2000, "School fees");

        (uint256 percentBps, string memory goalLabel, bool active) = vault.instructions(user);
        assertEq(percentBps, 2000);
        assertEq(goalLabel, "School fees");
        assertTrue(active);
    }

    function testOnlyAgentCanExecuteSaving() public {
        vm.prank(user);
        vault.setInstruction(2000, "Emergency");

        vm.prank(stranger);
        vm.expectRevert("SageVault: not agent");
        vault.executeSaving(user, 100e18);
    }

    function testExecuteSavingUsesReserveSellAndSuppliesAave() public {
        vm.prank(user);
        vault.setInstruction(2500, "Rainy day");

        vm.prank(agent);
        vault.executeSaving(user, 100e18);

        (uint256 principal, uint256 supplied) = vault.positions(user);
        assertEq(principal, 25e18);
        assertEq(supplied, 25e18);
        assertEq(stable.balanceOf(address(aave)), 10_025e18);
    }

    function testTransferAndCallEntryPoint() public {
        vm.prank(user);
        vault.setInstruction(2000, "Gas efficient");

        vm.prank(user);
        gd.transferAndCall(address(vault), 10e18, abi.encode(user));

        (uint256 principal, uint256 supplied) = vault.positions(user);
        assertEq(principal, 10e18);
        assertEq(supplied, 10e18);
    }

    function testWithdrawBuysBackGDollar() public {
        vm.prank(user);
        vault.setInstruction(2500, "Withdraw");

        vm.prank(agent);
        vault.executeSaving(user, 100e18);

        uint256 beforeBalance = gd.balanceOf(user);

        // minGdOut must account for the 3% exit contribution + slippage floor.
        // At 1:1 mock rates: 10 stable -> ~9.7 G$ after 3% contribution, then
        // 1% slippage -> floor ~9.6. Use 9e18 which is safely below the floor.
        vm.prank(user);
        vault.withdraw(10e18, 9e18);

        assertEq(gd.balanceOf(user) - beforeBalance, 10e18);
        (, uint256 supplied) = vault.positions(user);
        assertEq(supplied, 15e18);
    }

    function testPriceImpactGuardRejectsBadSellQuote() public {
        marketMaker.setRates(0.5e18, 1e18);

        vm.prank(user);
        vault.setInstruction(2500, "Protected");

        vm.prank(agent);
        vm.expectRevert("SageVault: price impact");
        vault.executeSaving(user, 100e18);
    }
}
