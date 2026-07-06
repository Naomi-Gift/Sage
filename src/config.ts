import { celo, celoAlfajores, type Chain } from 'viem/chains';

// Celo Sepolia — current Celo testnet (replaces Alfajores)
const celoSepolia: Chain = {
  ...celoAlfajores,
  id: 11142220,
  name: 'Celo Sepolia',
  nativeCurrency: { name: 'CELO', symbol: 'CELO', decimals: 18 },
  rpcUrls: {
    default: { http: ['https://forno.celo-sepolia.celo-testnet.org'] },
    public:  { http: ['https://forno.celo-sepolia.celo-testnet.org'] },
  },
  blockExplorers: {
    default: { name: 'Celoscan', url: 'https://sepolia.celoscan.io' },
  },
  testnet: true,
};

// ── Hardcoded fallback addresses (used when env vars are not set) ─────────────
// These are the deployed Celo Sepolia testnet contracts.
// On mainnet deployment, set VITE_* env vars in your hosting platform to override.
const TESTNET_VAULT    = '0x765951171682073c94814B00482a1a0FBa2d7011' as const;
const TESTNET_G_DOLLAR = '0x084DA2de8Cfa7CF714b66c006eAC80791B396A88' as const;
const TESTNET_RPC      = 'https://forno.celo-sepolia.celo-testnet.org';

function resolveChain(): Chain {
  const chainEnv = import.meta.env.VITE_CHAIN || 'celo-sepolia';
  if (chainEnv === 'celo') return celo;
  return celoSepolia; // default to testnet
}

export const appChain = resolveChain();

const rpcUrl =
  import.meta.env.VITE_CELO_RPC_URL ||
  (appChain.id === 11142220 ? TESTNET_RPC : 'https://forno.celo.org');

// vaultAddress: env var takes priority, then hardcoded testnet fallback
// This ensures the app ALWAYS connects to the contract — never shows the
// "not configured" error unless you're explicitly on a chain with no contract.
const vaultAddress = (
  import.meta.env.VITE_SAGE_VAULT_ADDRESS || TESTNET_VAULT
) as `0x${string}`;

export const appConfig = {
  vaultAddress,
  rpcUrl,
  // mockMode is only true if explicitly set to "true" — default is live mode
  mockMode: import.meta.env.VITE_ENABLE_MOCK_DATA === 'true',
  // G$ token address for balance reading
  gDollarAddress: (
    import.meta.env.VITE_GDOLLAR_TOKEN || TESTNET_G_DOLLAR
  ) as `0x${string}`,
};
