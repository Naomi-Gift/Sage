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

export const PROTOCOL_APY = 4.2;
