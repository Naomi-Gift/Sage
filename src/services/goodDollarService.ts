import { type Address } from 'viem';
import { publicClient } from '../contract';
import { GOODDOLLAR_CONTRACTS, IDENTITY_ABI, UBI_SCHEME_ABI } from '../abi/goodDollar';
import { appChain } from '../config';

const isSepolia = appChain.id === 11142220;
const contracts = isSepolia ? GOODDOLLAR_CONTRACTS.celoSepolia : GOODDOLLAR_CONTRACTS.celo;

export type UbiStatus = {
  isWhitelisted: boolean;
  entitlementGD: number;
  nextClaimDate: Date;
  secondsUntilNextClaim: number;
};

/**
 * Check on-chain whitelist status in GoodDollar Identity.sol contract.
 * Strictly queries the blockchain. Returns false if not whitelisted or if call fails.
 */
export async function checkIdentityWhitelisted(account?: Address | string): Promise<boolean> {
  if (!account || !account.startsWith('0x') || account.length !== 42) {
    return false;
  }

  try {
    const isWhitelisted = await publicClient.readContract({
      address: contracts.identity,
      abi: IDENTITY_ABI,
      functionName: 'isWhitelisted',
      args: [account as Address],
    });
    return Boolean(isWhitelisted);
  } catch (error) {
    console.warn('Identity on-chain whitelist query returned unverified:', error);
    return false;
  }
}

/**
 * Generate official GoodID / GoodDollar Face Verification URL for FaceTec biometric check.
 * Directs user to the GoodID portal where wallet signature authenticates the FaceTec session.
 */
export function getFaceVerificationUrl(account?: string): string {
  const addr = account || '';
  if (addr) {
    return `https://goodid.gooddollar.org/?account=${addr}`;
  }
  return 'https://goodid.gooddollar.org';
}

export function getGoodDollarWalletUrl(): string {
  return 'https://wallet.gooddollar.org';
}

/**
 * Calculate the next daily UBI distribution reset time (12:00 PM UTC daily).
 */
export function getNextUbiResetTime(): Date {
  const now = new Date();
  const reset = new Date();
  reset.setUTCHours(12, 0, 0, 0);

  // If already past 12:00 PM UTC today, next reset is tomorrow at 12:00 PM UTC
  if (now.getTime() >= reset.getTime()) {
    reset.setUTCDate(reset.getUTCDate() + 1);
  }

  return reset;
}

/**
 * Query live UBI entitlement from UBIScheme contract.
 */
export async function getUbiEntitlement(account?: Address | string): Promise<number> {
  if (!account || !account.startsWith('0x') || account.length !== 42) {
    return 0;
  }

  try {
    const rawEntitlement = await publicClient.readContract({
      address: contracts.ubiScheme,
      abi: UBI_SCHEME_ABI,
      functionName: 'checkEntitlement',
      args: [account as Address],
    });
    const gdAmount = Number(rawEntitlement) / 100; // G$ has 2 decimals on Celo
    return gdAmount > 0 ? gdAmount : 0;
  } catch {
    return 0;
  }
}
