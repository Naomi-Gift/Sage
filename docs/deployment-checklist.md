# Sage Deployment Checklist

Work through this top-to-bottom before broadcasting to mainnet.  
Each item has a ✅ checkbox — mark it when confirmed.

---

## 1 — Resolve live contract addresses

Look these up from the [GoodDollar GoodProtocol deployment manifest](https://github.com/GoodDollar/GoodProtocol) or GoodDocs:

- [ ] `GDOLLAR_TOKEN` — G$ token address on Celo Mainnet (18 decimals, confirm with `decimals()`)
- [ ] `GOODDOLLAR_EXCHANGE_HELPER` — current `ExchangeHelper` address post V4/GIP-24
- [ ] `GOODDOLLAR_MARKET_MAKER` — current `GoodMarketMaker` address
- [ ] `GOODDOLLAR_UBI_CONTRACT` — UBI scheme contract that emits `Claimed(address,uint256)`
- [ ] Confirm `ExchangeHelper.sell()` still pays out `cUSD` (or identify the new reserve asset)
- [ ] Confirm the 3% exit contribution is still the current rate (`EXIT_CONTRIBUTION_BPS = 300`)
- [ ] Confirm none of Reserve / ExchangeHelper / MarketMaker are paused or being migrated

Look these up from the [Aave Celo deployment](https://app.aave.com) or Aave docs:

- [ ] `AAVE_POOL_CELO` — Aave V3 Pool proxy on Celo Mainnet
- [ ] `RESERVE_ASSET_TOKEN` — the stable (e.g. cUSD) you'll supply to Aave
- [ ] `ATOKEN_RESERVE_ASSET` — the matching aToken (e.g. aCELO-cUSD)

---

## 2 — Set deployment parameters

- [ ] `AGENT_EXECUTOR` — the hot-wallet address that will call `executeSaving`. Fund it with enough CELO for gas (or set `GDOLLAR_FEE_CURRENCY` for G$-denominated fees).
- [ ] `MAX_SINGLE_DEPOSIT_GD` — e.g. `500000000000000000000` (500 G$). Tune based on expected daily claim size.
- [ ] `REFERENCE_GD_PER_STABLE_1E18` — get the current value:
  ```bash
  cast call $GOODDOLLAR_MARKET_MAKER "currentPrice(address)(uint256)" $RESERVE_ASSET_TOKEN \
    --rpc-url $CELO_RPC_URL
  ```
  Set this in `.env`. Leaving it `0` disables the price-impact guard — **do not do this on mainnet**.

---

## 3 — Run the fork test

```bash
forge test --fork-url "$CELO_RPC_URL" --match-test test_fork -vvv
```

Expected output includes non-zero `quoteSellGD` and `quoteBuyGD` values.  
- [ ] Fork test passes with no reverts

---

## 4 — Deploy to Alfajores first

Fill `.env` with Alfajores addresses (`CHAIN=alfajores`), then:

```bash
forge script script/Deploy.s.sol \
  --rpc-url "$CELO_RPC_URL" \
  --broadcast \
  --verify
```

- [ ] `SageAgent` deployed and verified on Alfajores Celoscan
- [ ] `SageVault` deployed and verified on Alfajores Celoscan
- [ ] `vault.agentExecutor()` matches `AGENT_EXECUTOR`
- [ ] `agent.executorAddress()` matches `AGENT_EXECUTOR`
- [ ] `vault.gDollar()` matches `GDOLLAR_TOKEN`
- [ ] `vault.referenceGdPerStable1e18()` is non-zero

Manual smoke test on Alfajores:
- [ ] Call `vault.setInstruction(2000, "test")` from a test wallet — succeeds
- [ ] Agent wallet calls `vault.executeSaving(testWallet, 10e18)` — succeeds (fund test wallet with G$ first)
- [ ] Call `vault.withdraw(stableAmount, minGdOut)` — returns G$ to test wallet

---

## 5 — Deploy to Celo Mainnet

Switch `.env` to mainnet addresses (`CHAIN=celo`), then:

```bash
forge script script/Deploy.s.sol \
  --rpc-url "$CELO_RPC_URL" \
  --broadcast \
  --verify
```

- [ ] Copy deployed `SageVault` address → `SAGE_VAULT_ADDRESS` and `VITE_SAGE_VAULT_ADDRESS` in `.env`
- [ ] Copy deployed `SageAgent` address → `SAGE_AGENT_ADDRESS` in `.env`
- [ ] Set `VITE_ENABLE_MOCK_DATA=false` in `.env`

---

## 6 — Post-deploy agent setup

- [ ] Fund agent hot wallet with CELO (or G$ if using fee currency)
- [ ] Start the agent: `npm run agent`
- [ ] Confirm agent logs `Sage agent online on Celo` and begins watching `Claimed` events
- [ ] Monitor first live `executeSaving` call in agent logs

---

## 7 — Frontend

- [ ] `npm run build` succeeds with no TS errors
- [ ] Test in MiniPay / GoodWallet: connect wallet, set instruction, confirm on-chain read shows correct values
- [ ] `VITE_ENABLE_MOCK_DATA=false` — confirm dashboard shows live position, not mock data

---

## Quick reference commands

```bash
# Full test suite (mock, no fork)
forge test -vv

# Fork tests only
forge test --fork-url "$CELO_RPC_URL" --match-test test_fork -vvv

# Deploy (set CHAIN=alfajores or celo in .env)
forge script script/Deploy.s.sol --rpc-url "$CELO_RPC_URL" --broadcast --verify

# Check vault state post-deploy
cast call $SAGE_VAULT_ADDRESS "agentExecutor()(address)" --rpc-url $CELO_RPC_URL
cast call $SAGE_VAULT_ADDRESS "referenceGdPerStable1e18()(uint256)" --rpc-url $CELO_RPC_URL

# Start the agent
npm run agent
```
