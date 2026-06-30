import { motion } from 'framer-motion';
import type { Milestone } from '../../types';

type MilestoneBadgesProps = {
  milestones: Milestone[];
};

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
            title={m.reached ? `${m.label} — achieved!` : `${m.label} — keep going`}
          >
            <span className="milestone-icon">{m.reached ? m.icon : '🔒'}</span>
            <span className="milestone-label">{m.label}</span>
          </motion.div>
        ))}
      </div>
    </div>
  );
}
