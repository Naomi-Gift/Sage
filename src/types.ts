export type Instruction = {
  percentBps: number;
  goalLabel: string;
  goalTargetGD: number; // 0 = no target set
  active: boolean;
};

export type Position = {
  principalGD: number;
  yieldGD: number;
  stableSupplied: number;
};

export type ActivityEventKind =
  | 'save' // auto-save from daily claim
  | 'yield' // yield accrued
  | 'withdraw' // user withdrew
  | 'rule' // rule updated / configured
  | 'pause' // savings paused
  | 'resume' // savings resumed
  | 'milestone' // streak / amount milestone
  | 'level-up'; // mascot evolved

export type ActivityEvent = {
  id: string;
  kind: ActivityEventKind;
  date: string; // ISO date string
  amountGD?: number;
  streakDay?: number;
  label?: string;
  txHash?: string;
};

export type MilestoneKind = '7d' | '30d' | '100d' | '500g' | '1000g' | '2000g';

export type Milestone = {
  kind: MilestoneKind;
  label: string;
  reached: boolean;
  icon: string;
};

// Production clean initial states
export const initialInstruction: Instruction = {
  percentBps: 2000,
  goalLabel: 'Savings goal',
  goalTargetGD: 1000,
  active: false,
};

export const initialPosition: Position = {
  principalGD: 0,
  yieldGD: 0,
  stableSupplied: 0,
};

export const PROTOCOL_BASE_APY = 4.2;
export const PROTOCOL_APY = PROTOCOL_BASE_APY;

export type StreakTier = {
  name: string;
  tier: 'bronze' | 'silver' | 'gold' | 'diamond';
  boostApy: number; // e.g. 0.2 means +0.2%
  effectiveApy: number; // e.g. 4.4%
  icon: string;
  minStreak: number;
};

/**
 * Returns streak tier information and boosted APY.
 * 7d+ : +0.2% APY (4.4%)
 * 30d+: +0.5% APY (4.7%)
 * 100d+: +1.0% APY (5.2%)
 */
export function getStreakTierInfo(streak: number): StreakTier {
  if (streak >= 100) {
    return {
      name: 'Diamond Saver',
      tier: 'diamond',
      boostApy: 1.0,
      effectiveApy: PROTOCOL_BASE_APY + 1.0,
      icon: '💎',
      minStreak: 100,
    };
  }
  if (streak >= 30) {
    return {
      name: 'Flame Master',
      tier: 'gold',
      boostApy: 0.5,
      effectiveApy: PROTOCOL_BASE_APY + 0.5,
      icon: '🔥',
      minStreak: 30,
    };
  }
  if (streak >= 7) {
    return {
      name: 'Silver Stacker',
      tier: 'silver',
      boostApy: 0.2,
      effectiveApy: PROTOCOL_BASE_APY + 0.2,
      icon: '⚡',
      minStreak: 7,
    };
  }
  return {
    name: 'Seedling Saver',
    tier: 'bronze',
    boostApy: 0.0,
    effectiveApy: PROTOCOL_BASE_APY,
    icon: '🌱',
    minStreak: 0,
  };
}

/**
 * 36-Hour Grace Window calculation.
 * Returns true if the user's last check-in was within the 36-hour grace period.
 */
export const GRACE_WINDOW_HOURS = 36;
export const GRACE_WINDOW_MS = GRACE_WINDOW_HOURS * 60 * 60 * 1000;

export function checkGraceStatus(lastCheckInMs: number): {
  isAlive: boolean;
  hoursRemaining: number;
} {
  if (!lastCheckInMs) return { isAlive: true, hoursRemaining: GRACE_WINDOW_HOURS };
  const elapsed = Date.now() - lastCheckInMs;
  const remainingMs = Math.max(0, GRACE_WINDOW_MS - elapsed);
  const hoursRemaining = Math.floor(remainingMs / (1000 * 60 * 60));
  return {
    isAlive: elapsed <= GRACE_WINDOW_MS,
    hoursRemaining,
  };
}
