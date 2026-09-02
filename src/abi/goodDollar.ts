import { type Address } from 'viem';

/**
 * Official GoodDollar Protocol Deployed Contract Addresses on Celo.
 */
export const GOODDOLLAR_CONTRACTS = {
  // Celo Mainnet (Chain ID: 42220)
  celo: {
    goodDollarToken: '0x62B8B11039FcfE5aB0C56E502b1C372A3d2a9c7A' as Address,
    identity: '0xC361A6E67822a0EDc17D899227dd9FC50BD62F42' as Address,
    ubiScheme: '0x43d72Ff17701B2DA814620735C39C620Ce0ea4A1' as Address, // GoodProtocol UBIScheme on Celo
  },
  // Celo Sepolia Testnet (Chain ID: 11142220)
  celoSepolia: {
    goodDollarToken: '0x62B8B11039FcfE5aB0C56E502b1C372A3d2a9c7A' as Address,
    identity: '0x0108BBc09772973aC27983Fc17c7D82D8e87ef4D' as Address,
    ubiScheme: '0x43d72Ff17701B2DA814620735C39C620Ce0ea4A1' as Address,
  },
};

/**
 * ABI for GoodDollar Identity.sol contract (Proof of Humanity / Whitelist).
 */
export const IDENTITY_ABI = [
  {
    type: 'function',
    name: 'isWhitelisted',
    stateMutability: 'view',
    inputs: [{ name: 'account', type: 'address' }],
    outputs: [{ name: '', type: 'bool' }],
  },
  {
    type: 'function',
    name: 'getWhitelistedRoot',
    stateMutability: 'view',
    inputs: [{ name: 'account', type: 'address' }],
    outputs: [
      { name: 'isWhitelisted', type: 'bool' },
      { name: 'root', type: 'address' },
    ],
  },
  {
    type: 'function',
    name: 'lastAuthenticated',
    stateMutability: 'view',
    inputs: [{ name: 'account', type: 'address' }],
    outputs: [{ name: '', type: 'uint256' }],
  },
  {
    type: 'function',
    name: 'authenticationPeriod',
    stateMutability: 'view',
    inputs: [],
    outputs: [{ name: '', type: 'uint256' }],
  },
] as const;

/**
 * ABI for GoodDollar UBIScheme.sol contract (Daily Distribution).
 */
export const UBI_SCHEME_ABI = [
  {
    type: 'function',
    name: 'checkEntitlement',
    stateMutability: 'view',
    inputs: [{ name: 'member', type: 'address' }],
    outputs: [{ name: '', type: 'uint256' }],
  },
  {
    type: 'function',
    name: 'checkEntitlement',
    stateMutability: 'view',
    inputs: [],
    outputs: [{ name: '', type: 'uint256' }],
  },
  {
    type: 'function',
    name: 'claim',
    stateMutability: 'nonpayable',
    inputs: [],
    outputs: [{ name: '', type: 'bool' }],
  },
  {
    type: 'function',
    name: 'currentDay',
    stateMutability: 'view',
    inputs: [],
    outputs: [{ name: '', type: 'uint256' }],
  },
] as const;

/**
 * Standard ERC-20 ABI for G$ Token.
 */
export const GOODDOLLAR_TOKEN_ABI = [
  {
    type: 'function',
    name: 'balanceOf',
    stateMutability: 'view',
    inputs: [{ name: 'account', type: 'address' }],
    outputs: [{ name: '', type: 'uint256' }],
  },
  {
    type: 'function',
    name: 'decimals',
    stateMutability: 'view',
    inputs: [],
    outputs: [{ name: '', type: 'uint8' }],
  },
  {
    type: 'function',
    name: 'transfer',
    stateMutability: 'nonpayable',
    inputs: [
      { name: 'recipient', type: 'address' },
      { name: 'amount', type: 'uint256' },
    ],
    outputs: [{ name: '', type: 'bool' }],
  },
  {
    type: 'function',
    name: 'approve',
    stateMutability: 'nonpayable',
    inputs: [
      { name: 'spender', type: 'address' },
      { name: 'amount', type: 'uint256' },
    ],
    outputs: [{ name: '', type: 'bool' }],
  },
] as const;
