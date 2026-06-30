import { AnimatePresence, motion } from 'framer-motion';
import { X } from 'lucide-react';
import { useEffect, useState } from 'react';

type CoachStep = {
  key: string;
  message: string;
  emoji: string;
};

const STEPS: CoachStep[] = [
  { key: 'tap-mascot',  emoji: '👆', message: 'Tap the mascot every day to check in and grow your streak.' },
  { key: 'auto-saves',  emoji: '⚡', message: 'Sage saves automatically — no action needed on your end.' },
  { key: 'withdraw',    emoji: '💸', message: 'Withdraw anytime. Your money stays yours, always in G$.' },
];

const STORAGE_KEY = 'sage.coachDismissed';

export function CoachMarks() {
  const [step, setStep] = useState<number | null>(null);

  useEffect(() => {
    const dismissed = localStorage.getItem(STORAGE_KEY);
    if (!dismissed) {
      // Small delay so it doesn't fight the page mount animation
      const t = window.setTimeout(() => setStep(0), 900);
      return () => clearTimeout(t);
    }
  }, []);

  function advance() {
    if (step === null) return;
    const next = step + 1;
    if (next >= STEPS.length) {
      setStep(null);
      localStorage.setItem(STORAGE_KEY, 'true');
    } else {
      setStep(next);
    }
  }

  function dismiss() {
    setStep(null);
    localStorage.setItem(STORAGE_KEY, 'true');
  }

  const current = step !== null ? STEPS[step] : null;

  return (
    <AnimatePresence>
      {current && (
        <motion.div
          className="coach-mark"
          key={current.key}
          initial={{ opacity: 0, y: 14, scale: 0.96 }}
          animate={{ opacity: 1, y: 0,  scale: 1 }}
          exit={{   opacity: 0, y: -8, scale: 0.97 }}
          transition={{ type: 'spring', stiffness: 260, damping: 20 }}
          role="status"
          aria-live="polite"
        >
          <span className="coach-emoji" aria-hidden="true">{current.emoji}</span>
          <p className="coach-text">{current.message}</p>
          <div className="coach-actions">
            <div className="coach-dots">
              {STEPS.map((_, i) => (
                <span key={i} className={`coach-dot ${i === step ? 'coach-dot-active' : ''}`} />
              ))}
            </div>
            <div className="coach-btns">
              <button className="coach-skip" onClick={dismiss} aria-label="Dismiss tips">
                <X size={13} />
              </button>
              <button className="coach-next" onClick={advance}>
                {step! < STEPS.length - 1 ? 'Next' : 'Got it'}
              </button>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
