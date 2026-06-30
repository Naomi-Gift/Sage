import { motion } from 'framer-motion';
import { Mascot } from '../mascot/Mascot';

type EmptyStateProps = {
  savePercent: number;
};

export function EmptyState({ savePercent }: EmptyStateProps) {
  return (
    <motion.div
      className="empty-state"
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
    >
      <Mascot stage="seedling" compact />
      <div className="empty-state-copy">
        <h2>Your first save is coming 🌱</h2>
        <p>
          Sage is watching your next daily G$ claim.
          When it arrives, we'll automatically set aside{' '}
          <strong>{savePercent}%</strong> for you.
        </p>
        <p className="empty-state-sub">
          Nothing to do. Come back tomorrow to see it grow.
        </p>
      </div>
    </motion.div>
  );
}
