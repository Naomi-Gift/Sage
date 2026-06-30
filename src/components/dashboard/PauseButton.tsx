import { motion, AnimatePresence } from 'framer-motion';
import { Pause, Play } from 'lucide-react';

type PauseButtonProps = {
  active: boolean;
  loading?: boolean;
  onToggle: () => void;
};

export function PauseButton({ active, loading = false, onToggle }: PauseButtonProps) {
  return (
    <button
      className={`pause-toggle ${active ? 'pause-toggle-active' : 'pause-toggle-paused'}`}
      onClick={onToggle}
      disabled={loading}
      aria-label={active ? 'Pause automatic saving' : 'Resume automatic saving'}
      title={active ? 'Pause Sage — stops auto-saving new claims' : 'Resume Sage — restarts auto-saving'}
    >
      <AnimatePresence mode="wait" initial={false}>
        <motion.span
          key={active ? 'active' : 'paused'}
          initial={{ scale: 0.7, opacity: 0 }}
          animate={{ scale: 1,   opacity: 1 }}
          exit={{   scale: 0.7, opacity: 0 }}
          transition={{ duration: 0.18 }}
          className="pause-toggle-icon"
        >
          {active ? <Pause size={14} strokeWidth={2.5} /> : <Play size={14} strokeWidth={2.5} />}
        </motion.span>
      </AnimatePresence>
      <span>{loading ? 'Updating…' : active ? 'Pause saving' : 'Resume saving'}</span>
    </button>
  );
}
