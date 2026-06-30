import { celo, celoAlfajores, type Chain } from 'viem/chains';

// Celo Sepolia — the current Celo testnet (replaces Alfajores)
const celoSepolia: Chain = {
  ...celoAlfajores,
  id: 11142220,
  name: 'Celo Sepolia',
  nativeCurrency: { name: 'CELO', symbol: 'CELO', decimals: 18 },
  rpcUrls: {
    default: { http: ['https://forno.celo-sepolia.celo-testnet.org'] },
    public:  { http: ['https://forno.celo-sepolia.celo-testnet.org'] }
  },
  blockExplorers: {
    default: { name: 'Celoscan', url: 'https://sepolia.celoscan.io' }
  },
  testnet: true
};

function resolveChain(): Chain {
  const chainEnv = import.meta.env.VITE_CHAIN || 'celo';
  if (chainEnv === 'celo-sepolia' || chainEnv === 'alfajores') return celoSepolia;
  return celo;
}

export const appChain = resolveChain();

export const appConfig = {
  vaultAddress: import.meta.env.VITE_SAGE_VAULT_ADDRESS as `0x${string}` | undefined,
  rpcUrl: import.meta.env.VITE_CELO_RPC_URL || (appChain.id === 11142220
    ? 'https://forno.celo-sepolia.celo-testnet.org'
    : 'https://forno.celo.org'),
  mockMode: import.meta.env.VITE_ENABLE_MOCK_DATA !== 'false'
};
