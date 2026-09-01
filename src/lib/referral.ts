/**
 * Referral and Downline Bonus Engine for Sage.
 */

export type ReferralStats = {
  referralCode: string;
  totalReferrals: number;
  tier1Count: number;
  tier2Count: number;
  earnedBonusGD: number;
  claimMultiplierPercent: number; // e.g. +5% bonus
};

const REF_STORAGE_KEY = 'sage.inboundReferral';
const REF_STATS_KEY = 'sage.referralStats';
const LEADERBOARD_OPTIN_KEY = 'sage.leaderboardOptIn';
const USER_ALIAS_KEY = 'sage.userAlias';

/**
 * Capture and store referral code from current URL query string.
 */
export function captureInboundReferral(): string | null {
  if (typeof window === 'undefined') return null;
  const params = new URLSearchParams(window.location.search);
  const ref = params.get('ref');
  if (ref && ref.startsWith('0x') && ref.length >= 10) {
    localStorage.setItem(REF_STORAGE_KEY, ref);
    return ref;
  }
  return localStorage.getItem(REF_STORAGE_KEY);
}

/**
 * Generate shareable referral URL for an address.
 */
export function getReferralUrl(address?: string): string {
  if (!address) return window.location.origin;
  return `${window.location.origin}/?ref=${address}`;
}

/**
 * Get or initialize referral statistics for the connected user.
 */
export function getReferralStats(address?: string): ReferralStats {
  if (!address) {
    return {
      referralCode: '',
      totalReferrals: 0,
      tier1Count: 0,
      tier2Count: 0,
      earnedBonusGD: 0,
      claimMultiplierPercent: 0,
    };
  }

  const raw = localStorage.getItem(`${REF_STATS_KEY}.${address.toLowerCase()}`);
  if (raw) {
    try {
      return JSON.parse(raw);
    } catch {
      // fallback
    }
  }

  // Default initial stats
  const initial: ReferralStats = {
    referralCode: address,
    totalReferrals: 0,
    tier1Count: 0,
    tier2Count: 0,
    earnedBonusGD: 0,
    claimMultiplierPercent: 0,
  };
  return initial;
}

/**
 * Opt-in Leaderboard Preferences
 */
export function getLeaderboardOptIn(): boolean {
  if (typeof window === 'undefined') return true;
  return localStorage.getItem(LEADERBOARD_OPTIN_KEY) !== 'false';
}

export function setLeaderboardOptIn(optIn: boolean): void {
  localStorage.setItem(LEADERBOARD_OPTIN_KEY, String(optIn));
}

export function getUserAlias(address?: string): string {
  if (!address) return 'Anonymous Saver';
  const saved = localStorage.getItem(`${USER_ALIAS_KEY}.${address.toLowerCase()}`);
  if (saved) return saved;
  return `${address.slice(0, 6)}…${address.slice(-4)}`;
}

export function setUserAlias(address: string, alias: string): void {
  localStorage.setItem(`${USER_ALIAS_KEY}.${address.toLowerCase()}`, alias);
}
