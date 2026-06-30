import type { ReactNode } from 'react';
import { motion } from 'framer-motion';

type StatChipProps = {
  children: ReactNode;
  delay?: number;
};

export function StatChip({ children, delay = 0 }: StatChipProps) {
  return (
    <motion.span
      className="stat-chip"
      animate={{ y: [0, -3, 0] }}
      transition={{ duration: 2.4, repeat: Infinity, ease: 'easeInOut', delay }}
    >
      {children}
    </motion.span>
  );
}
