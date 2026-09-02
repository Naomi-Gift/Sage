import { motion } from 'framer-motion';
import { Lock, Zap, Flame, Gem, Sprout, Trees, Trophy, Award } from 'lucide-react';
import type { Milestone } from '../../types';

type MilestoneBadgesProps = {
  milestones: Milestone[];
};

function renderMilestoneIcon(kind: string, iconId: string, reached: boolean) {
  if (!reached) {
    return <Lock size={14} className="opacity-40" />;
  }

  switch (iconId || kind) {
    case 'zap':
    case '7d':
      return <Zap size={14} className="text-amber-400" />;
    case 'flame':
    case '30d':
      return <Flame size={14} className="text-orange-400" />;
    case 'diamond':
    case '100d':
      return <Gem size={14} className="text-cyan-400" />;
    case 'sprout':
    case '500g':
      return <Sprout size={14} className="text-emerald-400" />;
    case 'tree':
    case '1000g':
      return <Trees size={14} className="text-emerald-500" />;
    case 'trophy':
    case '2000g':
      return <Trophy size={14} className="text-amber-300" />;
    default:
      return <Award size={14} className="text-purple-400" />;
  }
}

export function MilestoneBadges({ milestones }: MilestoneBadgesProps) {
  return (
    <div className="milestone-section">
      <p className="milestone-heading">Milestones</p>
      <div className="milestone-grid">
        {milestones.map((m, i) => (
          <motion.div
            key={m.kind}
            className={`milestone-badge ${m.reached ? 'milestone-reached' : 'milestone-locked'}`}
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.06, duration: 0.28 }}
            title={m.reached ? `${m.label} · achieved` : `${m.label} · keep going`}
          >
            <span className="milestone-icon">
              {renderMilestoneIcon(m.kind, m.icon, m.reached)}
            </span>
            <span className="milestone-label">{m.label}</span>
          </motion.div>
        ))}
      </div>
    </div>
  );
}
