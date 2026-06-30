export type MascotStage = 'seedling' | 'sprout' | 'bloom' | 'glow-up';

export function getMascotStage(totalSaved: number, streak: number): MascotStage {
  if (streak >= 100 || totalSaved >= 2000) return 'glow-up';
  if (streak >= 30 || totalSaved >= 500) return 'bloom';
  if (streak >= 7 || totalSaved >= 50) return 'sprout';
  return 'seedling';
}
