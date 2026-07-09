import { createPublicClient, createWalletClient, custom, http, parseAbi, type WalletClient } from 'viem';
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
  transport: http(appConfig.rpcUrl)
});

export async function connectInjectedWallet() {
  if (!window.ethereum) {
    throw new Error('No wallet found. Open Sage in MiniPay, GoodWallet, or a browser wallet.');
  }
  const walletClient = createWalletClient({
    chain: appChain,
    transport: custom(window.ethereum)
  });
  const [address] = await walletClient.requestAddresses();

  // Auto-switch to the correct chain if wallet is on the wrong one
  const currentChainId = await publicClient.getChainId();
  if (currentChainId !== appChain.id) {
    try {
      await window.ethereum.request({
        method: 'wallet_switchEthereumChain',
        params: [{ chainId: `0x${appChain.id.toString(16)}` }],
      });
    } catch (switchError: unknown) {
      // Chain not added to wallet yet — add it then switch
      const err = switchError as { code?: number };
      if (err?.code === 4902) {
        await window.ethereum.request({
          method: 'wallet_addEthereumChain',
          params: [{
            chainId: `0x${appChain.id.toString(16)}`,
            chainName: appChain.name,
            nativeCurrency: appChain.nativeCurrency,
            rpcUrls: [appChain.rpcUrls.default.http[0]],
            blockExplorerUrls: appChain.blockExplorers
              ? [appChain.blockExplorers.default.url]
              : [],
          }],
        });
      } else {
        throw new Error(`Please switch your wallet to ${appChain.name} and try again.`);
      }
    }
  }

  return { walletClient, address };
}

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
  await publicClient.waitForTransactionReceipt({ hash });
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
  await publicClient.waitForTransactionReceipt({ hash });
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
  await publicClient.waitForTransactionReceipt({ hash });
  return hash;
}

declare global {
  interface Window {
    ethereum?: {
      request: (args: { method: string; params?: unknown[] }) => Promise<unknown>;
    };
  }
}
