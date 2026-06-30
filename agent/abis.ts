import { parseAbi } from 'viem';

export const goodDollarUbiAbi = parseAbi([
  'event Claimed(address indexed claimer, uint256 amount)'
]);

export const sageVaultAbi = parseAbi([
  'function executeSaving(address user, uint256 claimedAmount) external returns (uint256)',
  'function instructions(address user) view returns (uint256 percentBps, string goalLabel, bool active)'
]);
