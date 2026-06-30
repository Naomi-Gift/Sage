import { Address, http } from 'viem';
import { celo, celoAlfajores } from 'viem/chains';

// Celo Sepolia — replaces Alfajores as the Celo testnet (chainId 11142220)
const celoSepolia = {
  ...celoAlfajores,
  id: 11142220,
  name: 'Celo Sepolia',
  rpcUrls: {
    default: { http: ['https://forno.celo-sepolia.celo-testnet.org'] },
    public:  { http: ['https://forno.celo-sepolia.celo-testnet.org'] }
  },
  blockExplorers: {
    default: { name: 'Celoscan', url: 'https://sepolia.celoscan.io' }
  }
} as const;

function requiredAddress(name: string): Address {
  const value = process.env[name];
  if (!value || !value.startsWith('0x')) {
    throw new Error(`${name} must be set to a 0x address`);
  }
  return value as Address;
}

function selectChain() {
  switch (process.env.CHAIN) {
    case 'alfajores':   return celoSepolia;   // alfajores → Celo Sepolia (alfajores sunset)
    case 'celo-sepolia': return celoSepolia;
    case 'celo':
    default:            return celo;
  }
}

export const chain = selectChain();
export const transport = http(process.env.CELO_RPC_URL);

export const config = {
  goodDollarUbiContract: requiredAddress('GOODDOLLAR_UBI_CONTRACT'),
  sageVaultAddress: requiredAddress('SAGE_VAULT_ADDRESS'),
  gDollarToken: requiredAddress('GDOLLAR_TOKEN'),
  reserveAssetToken: requiredAddress('RESERVE_ASSET_TOKEN'),
  agentPrivateKey: process.env.AGENT_PRIVATE_KEY as `0x${string}`,
  feeCurrency: process.env.GDOLLAR_FEE_CURRENCY as Address | undefined,
  maxSlippageBps: BigInt(process.env.MAX_SLIPPAGE_BPS || '100')
};

if (!config.agentPrivateKey?.startsWith('0x')) {
  throw new Error('AGENT_PRIVATE_KEY must be set');
}
