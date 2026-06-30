import { AnimatePresence, motion, useReducedMotion } from 'framer-motion';
import { Mascot, type MascotStage } from './Mascot';

type EvolutionUnlockProps = {
  open: boolean;
  stage: MascotStage;
  onShare: () => void;
  onClose: () => void;
};

export function EvolutionUnlock({ open, stage, onShare, onClose }: EvolutionUnlockProps) {
  const reduceMotion = useReducedMotion();

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          className="evolution-overlay"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
        >
          <motion.div
            className="evolution-panel"
            initial={reduceMotion ? false : { scale: 0.86, y: 20 }}
            animate={reduceMotion ? {} : { scale: 1, y: 0 }}
            exit={reduceMotion ? {} : { scale: 0.94, y: 12 }}
            transition={{ type: 'spring', stiffness: 230, damping: 18 }}
          >
            <p>LEVEL UP</p>
            <Mascot stage={stage} compact />
            <h2>Your Sage hit {stage} mode.</h2>
            <span>All automatic. You just showed up to witness the glow-up.</span>
            <div className="evolution-actions">
              <button onClick={onShare}>Share this moment</button>
              <button onClick={onClose}>Keep growing</button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
