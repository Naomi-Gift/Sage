import { createPublicClient, createWalletClient, custom, http, parseAbi, type WalletClient } from 'viem';
import { celo } from 'viem/chains';
import { appConfig } from './config';

export const sageVaultAbi = parseAbi([
  'function setInstruction(uint256 percentBps, string goalLabel) external',
  'function pauseInstruction() external',
  'function withdraw(uint256 stableAmount, uint256 minGdOut) external returns (uint256)',
  'function instructions(address user) view returns (uint256 percentBps, string goalLabel, bool active)',
  'function positions(address user) view returns (uint256 principalDepositedGD, uint256 stableSupplied)',
  'function quoteBuyGD(uint256 stableAmount) view returns (uint256 expectedGD, uint256 minGdOut)',
  'function quoteSellGD(uint256 gdAmount) view returns (uint256 expectedStable, uint256 minStableOut)',
  'function previewWithdrawableGD(address user) view returns (uint256)'
]);

export const publicClient = createPublicClient({
  chain: celo,
  transport: http(appConfig.rpcUrl)
});

export async function connectInjectedWallet() {
  if (!window.ethereum) {
    throw new Error('No wallet found. Open Sage in MiniPay, GoodWallet, or a browser wallet.');
  }

  const walletClient = createWalletClient({
    chain: celo,
    transport: custom(window.ethereum)
  });
  const [address] = await walletClient.requestAddresses();
  return { walletClient, address };
}

/// Reads the on-chain position for a connected address.
/// Returns null if the vault address is not configured (mock mode).
export async function readPosition(address: `0x${string}`) {
  if (!appConfig.vaultAddress) return null;

  const [rawPos, withdrawableGD] = await Promise.all([
    publicClient.readContract({
      address: appConfig.vaultAddress,
      abi: sageVaultAbi,
      functionName: 'positions',
      args: [address]
    }),
    publicClient.readContract({
      address: appConfig.vaultAddress,
      abi: sageVaultAbi,
      functionName: 'previewWithdrawableGD',
      args: [address]
    })
  ]);

  const [principalDepositedGD, stableSupplied] = rawPos;
  // principalDepositedGD = G$ originally deposited
  // withdrawableGD = current G$ value of the stable position
  // difference is yield earned in G$ terms
  const principalGD = Number(principalDepositedGD) / 1e18;
  const currentGD   = Number(withdrawableGD) / 1e18;
  const yieldGD     = Math.max(0, currentGD - principalGD);

  return {
    principalGD,
    yieldGD,
    stableSupplied: Number(stableSupplied) / 1e18
  };
}

/// Reads the on-chain instruction for a connected address.
/// Returns null if the vault address is not configured (mock mode).
export async function readInstruction(address: `0x${string}`) {
  if (!appConfig.vaultAddress) return null;

  const [percentBps, goalLabel, active] = await publicClient.readContract({
    address: appConfig.vaultAddress,
    abi: sageVaultAbi,
    functionName: 'instructions',
    args: [address]
  });

  return { percentBps: Number(percentBps), goalLabel, active };
}

export async function writeInstruction(
  walletClient: WalletClient,
  address: `0x${string}`,
  percentBps: number,
  goalLabel: string
) {
  if (!appConfig.vaultAddress) {
    throw new Error('VITE_SAGE_VAULT_ADDRESS is not configured.');
  }

  return walletClient.writeContract({
    account: address,
    chain: celo,
    address: appConfig.vaultAddress,
    abi: sageVaultAbi,
    functionName: 'setInstruction',
    args: [BigInt(percentBps), goalLabel]
  });
}

export async function writePause(walletClient: WalletClient, address: `0x${string}`) {
  if (!appConfig.vaultAddress) {
    throw new Error('VITE_SAGE_VAULT_ADDRESS is not configured.');
  }

  return walletClient.writeContract({
    account: address,
    chain: celo,
    address: appConfig.vaultAddress,
    abi: sageVaultAbi,
    functionName: 'pauseInstruction'
  });
}

export async function writeWithdraw(
  walletClient: WalletClient,
  address: `0x${string}`,
  stableAmount: bigint,
  minGdOut: bigint
) {
  if (!appConfig.vaultAddress) {
    throw new Error('VITE_SAGE_VAULT_ADDRESS is not configured.');
  }

  return walletClient.writeContract({
    account: address,
    chain: celo,
    address: appConfig.vaultAddress,
    abi: sageVaultAbi,
    functionName: 'withdraw',
    args: [stableAmount, minGdOut]
  });
}

declare global {
  interface Window {
    ethereum?: {
      request: (args: { method: string; params?: unknown[] }) => Promise<unknown>;
    };
  }
}
