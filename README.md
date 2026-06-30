# Sage

**Sage** is an automated savings protocol for [GoodDollar](https://gooddollar.org) UBI claimers on Celo.

Every time a user claims their daily G$, Sage's on-chain agent intercepts a portion of that claim, converts it to a stable asset via the Mento reserve, and supplies it to Aave — earning real DeFi yield. Users can withdraw back to G$ at any time.

---

## How it works

```
User claims G$ → Agent calls executeSaving() → G$ → cUSD (Mento) → Aave (yield)
                                                ↑
                                   User's savings instruction (% + goal label)
```

1. User sets a savings rule: e.g. "save 20% of every claim towards Emergency Fund"
2. The Sage agent watches for `Claimed` events on the GoodDollar UBI contract
3. On each claim, the agent calls `SageVault.executeSaving()` with the claimed amount
4. The vault pulls the saved portion, sells G$ for cUSD via Mento, and supplies to Aave
5. Users can `withdraw()` at any time — their cUSD is redeemed from Aave and converted back to G$

---

## Architecture

```
contracts/
├── SageVault.sol              # Core vault — savings logic, deposit/withdraw, risk guards
├── SageAgent.sol              # On-chain agent registry (executor identity + metadata)
├── MentoExchangeAdapter.sol   # Adapts Mento Broker → ExchangeHelper + MarketMaker interfaces
└── interfaces/
    ├── IAavePool.sol
    ├── IERC20.sol
    ├── IERC677Receiver.sol    # ERC-677 transferAndCall support
    ├── IGoodDollarExchangeHelper.sol
    ├── IGoodMarketMaker.sol
    └── IMentoBroker.sol       # Mento Broker (swap engine for G$ ↔ cUSD on Celo)

agent/
├── index.ts                   # Event watcher — listens for Claimed events, calls executeSaving
├── config.ts                  # Chain + contract config (Celo mainnet / Celo Sepolia)
└── abis.ts                    # Minimal ABIs for the agent

src/                           # React frontend (Vite + TypeScript)
├── App.tsx
├── contract.ts                # Vault read/write helpers, live chain state
├── views/
│   ├── SetupView.tsx          # Onboarding — set savings % and goal
│   ├── DashboardView.tsx      # Position, streak, mascot, share card
│   └── AboutView.tsx
└── components/

test/
├── SageVault.t.sol            # Core unit tests
└── SageVaultGate.t.sol        # Access control, reentrancy, fork smoke test

script/
└── Deploy.s.sol               # One-command deploy (testnet mock stack or mainnet)
```

---

## Deployments

### Celo Sepolia (testnet)

| Contract | Address |
|---|---|
| `SageVault` | [`0x765951171682073c94814B00482a1a0FBa2d7011`](https://sepolia.celoscan.io/address/0x765951171682073c94814B00482a1a0FBa2d7011) |
| `SageAgent` | [`0x0EE7A6d4d9a0212C76A703D1d6647E148D1604B7`](https://sepolia.celoscan.io/address/0x0EE7A6d4d9a0212C76A703D1d6647E148D1604B7) |
| `MentoExchangeAdapter` | [`0xB96EFE9F69d24c407901AB54fb7f3bcADBf279e6`](https://sepolia.celoscan.io/address/0xB96EFE9F69d24c407901AB54fb7f3bcADBf279e6) |
| Mock G$ | `0x084DA2de8Cfa7CF714b66c006eAC80791B396A88` |
| Mock cUSD | `0x2cFC85251a6B414cc6B398C0b9B64278902076f7` |

> Testnet uses a fully self-contained mock stack (no real GoodDollar or Aave on Celo Sepolia). Mainnet deploy uses real Mento + Aave V3 Celo addresses — see `docs/deployment-checklist.md`.

---

## Getting started

### Prerequisites

- [Foundry](https://book.getfoundry.sh/getting-started/installation) — `curl -L https://foundry.paradigm.xyz | bash`
- [Node.js](https://nodejs.org) ≥ 18
- A Celo wallet funded with CELO for gas

### Install

```bash
git clone https://github.com/Naomi-Gift/Sage.git
cd Sage
npm install
forge install
```

### Configure

```bash
cp .env.example .env
# Fill in your values — see comments in .env.example
```

### Run tests

```bash
forge test -vv
```

All 18 tests should pass. For the fork integration test:

```bash
forge test --fork-url "$CELO_RPC_URL" --match-test test_fork -vvv
```

### Deploy

**Testnet (Celo Sepolia) — deploys a full mock stack:**

```bash
# Set USE_MOCK_AAVE=true in .env (default for testnet)
forge script script/Deploy.s.sol \
  --rpc-url https://forno.celo-sepolia.celo-testnet.org \
  --broadcast \
  --private-key $AGENT_PRIVATE_KEY \
  --chain-id 11142220 \
  -vvv
```

**Mainnet (Celo):**

```bash
# Set USE_MOCK_AAVE=false and fill real addresses in .env
# See docs/deployment-checklist.md first
forge script script/Deploy.s.sol \
  --rpc-url https://forno.celo.org \
  --broadcast \
  --private-key $AGENT_PRIVATE_KEY \
  -vvv
```

### Run the agent

```bash
# Fill SAGE_VAULT_ADDRESS, GOODDOLLAR_UBI_CONTRACT, AGENT_PRIVATE_KEY in .env
npm run agent
```

### Run the frontend

```bash
npm run dev
```

---

## Key contracts

### `SageVault`

The core protocol contract. Users set a savings instruction (BPS percentage + goal label). The agent calls `executeSaving()` on each UBI claim; users call `withdraw()` to redeem.

Key parameters:
- `maxSingleDepositGD` — per-call deposit cap (protects against manipulation)
- `maxSlippageBps` — slippage tolerance on Mento swaps (default 1%)
- `maxPriceImpactBps` — rejects swaps that deviate too far from reference price (default 3%)
- `referenceGdPerStable1e18` — reference price for price impact guard (set from live Mento quote)

### `MentoExchangeAdapter`

Bridges the Mento Broker (Celo's on-chain AMM for G$ ↔ cUSD) into the `IGoodDollarExchangeHelper` and `IGoodMarketMaker` interface shapes that `SageVault` expects. Both the `exchangeHelper` and `marketMaker` slots on the vault point to this adapter.

### `SageAgent`

On-chain registry for the Sage agent identity. Stores the executor hot-wallet address, endpoint, and metadata URI. Used for discoverability — the vault takes a raw executor address, not the agent contract address.

---

## Security notes

- Reentrancy protection on all state-changing vault functions (`nonReentrant`)
- Price impact guard prevents execution when G$/cUSD deviates significantly from the reference price
- Slippage guard on all Mento swaps
- Per-call deposit cap limits blast radius of any single misbehaving call
- Only the registered `agentExecutor` can call `executeSaving` — not a general user
- All protocol risk parameters are owner-adjustable post-deploy

---

## Roadmap to mainnet

See [`docs/deployment-checklist.md`](./docs/deployment-checklist.md) for the full pre-mainnet checklist, including verified Mento/Aave addresses and required risk parameter configuration.

---

## License

MIT
