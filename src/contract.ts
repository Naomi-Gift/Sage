import { createPublicClient, http, parseAbi, type WalletClient } from 'viem';
import { appChain, appConfig } from './config';

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

const erc20Abi = parseAbi([
  'function balanceOf(address account) view returns (uint256)',
  'function decimals() view returns (uint8)',
]);

export const publicClient = createPublicClient({
  chain: appChain,
  transport: http(appConfig.rpcUrl, {
    timeout: 15_000,
    retryCount: 3,
    retryDelay: 1_000,
  }),
  pollingInterval: 1_000,
});

/// Read live G$ wallet balance for the connected address.
export async function readGDollarBalance(
  userAddress: `0x${string}`,
  gDollarAddress: `0x${string}`
): Promise<number> {
  try {
    const raw = await publicClient.readContract({
      address: gDollarAddress,
      abi: erc20Abi,
      functionName: 'balanceOf',
      args: [userAddress],
    });
    return Number(raw) / 1e18; // G$ is 18 decimals on Celo
  } catch {
    return 0;
  }
}

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
  const principalGD = Number(principalDepositedGD) / 1e18;
  const currentGD   = Number(withdrawableGD) / 1e18;
  const yieldGD     = Math.max(0, currentGD - principalGD);
  return { principalGD, yieldGD, stableSupplied: Number(stableSupplied) / 1e18 };
}

export async function quoteGdToUsdt(gdAmount: number): Promise<number> {
  if (gdAmount <= 0) return 0;
  try {
    if (appConfig.vaultAddress) {
      const gdUnits = BigInt(Math.floor(gdAmount * 1e18));
      const [expectedStable] = await publicClient.readContract({
        address: appConfig.vaultAddress,
        abi: sageVaultAbi,
        functionName: 'quoteSellGD',
        args: [gdUnits],
      });
      return Number(expectedStable) / 1e18;
    }
  } catch {
    // fallback to current reserve rate
  }
  // Standard GoodDollar reserve reference rate ~ 0.000125 USDT per G$
  return gdAmount * 0.000125;
}

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
    throw new Error(
      'Vault address is not configured. Please deploy the contract and set VITE_SAGE_VAULT_ADDRESS.'
    );
  }
  const hash = await walletClient.writeContract({
    account: address,
    chain: appChain,
    address: appConfig.vaultAddress,
    abi: sageVaultAbi,
    functionName: 'setInstruction',
    args: [BigInt(percentBps), goalLabel]
  });
  // Wait for the transaction to be confirmed
  await publicClient.waitForTransactionReceipt({ hash, timeout: 60_000 });
  return hash;
}

export async function writePause(walletClient: WalletClient, address: `0x${string}`) {
  if (!appConfig.vaultAddress) {
    throw new Error('Vault address is not configured.');
  }
  const hash = await walletClient.writeContract({
    account: address,
    chain: appChain,
    address: appConfig.vaultAddress,
    abi: sageVaultAbi,
    functionName: 'pauseInstruction'
  });
  await publicClient.waitForTransactionReceipt({ hash, timeout: 60_000 });
  return hash;
}

export async function writeWithdraw(
  walletClient: WalletClient,
  address: `0x${string}`,
  stableAmount: bigint,
  minGdOut: bigint
) {
  if (!appConfig.vaultAddress) {
    throw new Error('Vault address is not configured.');
  }
  const hash = await walletClient.writeContract({
    account: address,
    chain: appChain,
    address: appConfig.vaultAddress,
    abi: sageVaultAbi,
    functionName: 'withdraw',
    args: [stableAmount, minGdOut]
  });
  await publicClient.waitForTransactionReceipt({ hash, timeout: 60_000 });
  return hash;
}

