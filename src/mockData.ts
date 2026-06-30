import { ActivityEvent, Instruction, Milestone, Position } from './types';

export const defaultInstruction: Instruction = {
  percentBps: 2000,
  goalLabel: 'Emergency fund',
  goalTargetGD: 2000,
  active: true,
};

export const defaultPosition: Position = {
  principalGD: 1222,
  yieldGD: 18,
  stableSupplied: 9.4,
};

// Simulated APY from Aave (in percent)
export const MOCK_APY = 4.2;

// Generates a deterministic-ish mock activity feed
export const defaultActivity: ActivityEvent[] = [
  { id: 'a1',  kind: 'save',      date: '2025-06-28', amountGD: 24,   label: 'Auto-saved from daily claim' },
  { id: 'a2',  kind: 'yield',     date: '2025-06-28', amountGD: 0.9,  label: 'Yield accrued' },
  { id: 'a3',  kind: 'milestone', date: '2025-06-25', streakDay: 14,  label: '14-day streak 🔥' },
  { id: 'a4',  kind: 'save',      date: '2025-06-27', amountGD: 22,   label: 'Auto-saved from daily claim' },
  { id: 'a5',  kind: 'yield',     date: '2025-06-27', amountGD: 0.8,  label: 'Yield accrued' },
  { id: 'a6',  kind: 'save',      date: '2025-06-26', amountGD: 25,   label: 'Auto-saved from daily claim' },
  { id: 'a7',  kind: 'save',      date: '2025-06-25', amountGD: 21,   label: 'Auto-saved from daily claim' },
  { id: 'a8',  kind: 'milestone', date: '2025-06-18', streakDay: 7,   label: '7-day streak 🌟' },
  { id: 'a9',  kind: 'save',      date: '2025-06-24', amountGD: 23,   label: 'Auto-saved from daily claim' },
  { id: 'a10', kind: 'yield',     date: '2025-06-24', amountGD: 0.7,  label: 'Yield accrued' },
  { id: 'a11', kind: 'save',      date: '2025-06-23', amountGD: 20,   label: 'Auto-saved from daily claim' },
  { id: 'a12', kind: 'level-up',  date: '2025-06-20', label: 'Mascot evolved to Sprout 🌱' },
  { id: 'a13', kind: 'save',      date: '2025-06-22', amountGD: 22,   label: 'Auto-saved from daily claim' },
  { id: 'a14', kind: 'save',      date: '2025-06-21', amountGD: 19,   label: 'Auto-saved from daily claim' },
];

export const defaultMilestones: Milestone[] = [
  { kind: '7d',    label: '7-day streak',    reached: true,  icon: '⚡' },
  { kind: '30d',   label: '30-day streak',   reached: false, icon: '🔥' },
  { kind: '100d',  label: '100-day streak',  reached: false, icon: '💎' },
  { kind: '500g',  label: '500 G$ saved',    reached: true,  icon: '🌿' },
  { kind: '1000g', label: '1,000 G$ saved',  reached: true,  icon: '🌳' },
  { kind: '2000g', label: '2,000 G$ saved',  reached: false, icon: '🏆' },
];
