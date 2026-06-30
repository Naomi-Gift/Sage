import { motion } from 'framer-motion';
import { TrendingUp } from 'lucide-react';

type YieldBadgeProps = {
  apy: number;
};

export function YieldBadge({ apy }: YieldBadgeProps) {
  return (
    <motion.div
      className="yield-badge"
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ delay: 0.3, duration: 0.35 }}
      title="Current estimated APY via Aave"
    >
      <span className="yield-badge-icon">
        <TrendingUp size={13} strokeWidth={2.5} />
      </span>
      <span className="yield-badge-value">{apy.toFixed(1)}% APY</span>
      <span className="yield-badge-via">via Aave</span>
    </motion.div>
  );
}
