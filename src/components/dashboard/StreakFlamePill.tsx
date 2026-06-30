import { motion } from 'framer-motion';

type StreakFlamePillProps = {
  streak: number;
};

export function StreakFlamePill({ streak }: StreakFlamePillProps) {
  return (
    <motion.span
      className="streak-pill"
      key={streak}
      initial={{ scale: 0.9 }}
      animate={{ scale: [1, 1.12, 1] }}
      transition={{ duration: 0.26 }}
    >
      <motion.span
        className="flame-icon"
        aria-hidden="true"
        animate={streak >= 7 ? {
          scale: [1, 1.1, 0.95, 1.05, 1],
          rotate: [0, 3, -3, 1, 0],
        } : {}}
        transition={{ duration: 1.8, repeat: Infinity, ease: 'easeInOut' }}
      />
      <strong>{streak}</strong>
    </motion.span>
  );
}
