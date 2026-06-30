// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "forge-std/Script.sol";
import {SageAgent} from "../contracts/SageAgent.sol";
import {SageVault} from "../contracts/SageVault.sol";
import {MentoExchangeAdapter} from "../contracts/MentoExchangeAdapter.sol";
import {MockAavePool} from "../contracts/mocks/MockAavePool.sol";
import {MockERC20} from "../contracts/mocks/MockERC20.sol";
import {MockMentoBroker} from "../contracts/mocks/MockMentoBroker.sol";

/// @notice Full self-contained testnet deploy.
/// On testnet (USE_MOCK_AAVE=true): deploys mock G$, mock cUSD, mock Aave, mock Mento broker.
/// On mainnet (USE_MOCK_AAVE=false): reads all real addresses from env.
contract DeployScript is Script {
    function run() external returns (
        MentoExchangeAdapter adapter,
        SageAgent agent,
        SageVault vault
    ) {
        address agentExecutor    = vm.envAddress("AGENT_EXECUTOR");
        uint256 maxSingleDeposit = vm.envUint("MAX_SINGLE_DEPOSIT_GD");
        uint256 referenceGdPerStable1e18 = vm.envOr("REFERENCE_GD_PER_STABLE_1E18", uint256(0));
        string memory agentEndpoint    = vm.envOr("AGENT_ENDPOINT",     string("https://sage.app"));
        string memory agentMetadataURI = vm.envOr("AGENT_METADATA_URI", string(""));
        bool useMocks = vm.envOr("USE_MOCK_AAVE", false);

        address gDollar;
        address targetStable;
        address aToken;
        address aavePool;
        address mentoBroker;
        address mentoProvider;
        bytes32 mentoExchangeId;

        vm.startBroadcast();

        if (useMocks) {
            // ── Deploy full mock stack ─────────────────────────────────────────
            MockERC20 mockGD     = new MockERC20("GoodDollar", "G$", 18);
            MockERC20 mockStable = new MockERC20("Celo Dollar", "cUSD", 18);
            MockERC20 mockAToken = new MockERC20("Aave cUSD", "acUSD", 18);
            MockAavePool mockAave = new MockAavePool();
            MockMentoBroker mockBroker = new MockMentoBroker();

            // Seed the mock broker so it can pay out on swaps
            mockGD.mint(address(mockBroker),     1_000_000e18);
            mockStable.mint(address(mockBroker), 1_000_000e18);
            // Seed mock Aave so withdrawals work
            mockStable.mint(address(mockAave),   1_000_000e18);

            gDollar         = address(mockGD);
            targetStable    = address(mockStable);
            aToken          = address(mockAToken);
            aavePool        = address(mockAave);
            mentoBroker     = address(mockBroker);
            mentoProvider   = address(mockBroker); // adapter ignores provider in mock path
            mentoExchangeId = bytes32(0);           // adapter ignores exchangeId in mock path

            console.log("--- Mock stack ---");
            console.log("Mock G$     :", gDollar);
            console.log("Mock cUSD   :", targetStable);
            console.log("Mock aToken :", aToken);
            console.log("Mock Aave   :", aavePool);
            console.log("Mock Broker :", mentoBroker);
        } else {
            // ── Use real addresses from env ────────────────────────────────────
            gDollar         = vm.envAddress("GDOLLAR_TOKEN");
            targetStable    = vm.envAddress("RESERVE_ASSET_TOKEN");
            aToken          = vm.envAddress("ATOKEN_RESERVE_ASSET");
            aavePool        = vm.envAddress("AAVE_POOL_CELO");
            mentoBroker     = vm.envAddress("MENTO_BROKER");
            mentoProvider   = vm.envAddress("MENTO_EXCHANGE_PROVIDER");
            mentoExchangeId = vm.envBytes32("MENTO_EXCHANGE_ID");
        }

        // 1. Mento adapter
        adapter = new MentoExchangeAdapter(
            mentoBroker,
            mentoProvider,
            mentoExchangeId,
            gDollar,
            targetStable
        );

        // 2. Agent registry
        agent = new SageAgent(agentEndpoint, agentMetadataURI, agentExecutor);

        // 3. Vault — adapter fills both exchangeHelper and marketMaker slots
        vault = new SageVault(
            gDollar,
            targetStable,
            aToken,
            aavePool,
            address(adapter),
            address(adapter),
            agentExecutor,
            maxSingleDeposit,
            referenceGdPerStable1e18
        );

        vm.stopBroadcast();

        console.log("");
        console.log("=== Sage Deployment Complete ===");
        console.log("MentoExchangeAdapter :", address(adapter));
        console.log("SageAgent            :", address(agent));
        console.log("SageVault            :", address(vault));
        console.log("agentExecutor        :", agentExecutor);
        console.log("gDollar              :", gDollar);
        console.log("targetStable         :", targetStable);
        console.log("");
        console.log("Add to .env:");
        console.log("SAGE_VAULT_ADDRESS=", address(vault));
        console.log("SAGE_AGENT_ADDRESS=", address(agent));
        console.log("VITE_SAGE_VAULT_ADDRESS=", address(vault));
        if (useMocks) {
            console.log("GDOLLAR_TOKEN=", gDollar);
            console.log("RESERVE_ASSET_TOKEN=", targetStable);
        }
    }
}
