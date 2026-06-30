import { animate, motion, useMotionValue, useTransform } from 'framer-motion';
import { useEffect, useState } from 'react';

type SavingsDonutProps = {
  amount: number;
  progress: number;
  loading?: boolean;
};

export function SavingsDonut({ amount, progress, loading = false }: SavingsDonutProps) {
  const count        = useMotionValue(0);
  const rounded      = useTransform(count, (v) => Math.round(v).toLocaleString());
  const [display, setDisplay] = useState('0');

  useEffect(() => {
    if (loading) return;
    const ctrl = animate(count, amount, { duration: 1, ease: 'easeOut' });
    const unsub = rounded.on('change', setDisplay);
    return () => { ctrl.stop(); unsub(); };
  }, [amount, count, loading, rounded]);

  if (loading) {
    return (
      <div className="donut-wrap loading-donut">
        <div className="donut-center">
          <strong className="saved-amount">G$ —</strong>
          <span className="saved-caption">saved so far</span>
        </div>
      </div>
    );
  }

  return (
    <div className="donut-wrap" role="img" aria-label={`G$ ${Math.round(amount).toLocaleString()} saved so far`}>
      <svg viewBox="0 0 220 220" aria-hidden="true">
        <defs>
          <linearGradient id="donutGradient" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%"   stopColor="#7C6AF0" />
            <stop offset="100%" stopColor="#F25EAE" />
          </linearGradient>
        </defs>
        <circle className="donut-track"    cx="110" cy="110" r="84" />
        <motion.circle
          className="donut-progress"
          cx="110" cy="110" r="84"
          initial={{ pathLength: 0 }}
          animate={{ pathLength: Math.max(0.02, Math.min(progress, 1)) }}
          transition={{ duration: 1, ease: 'easeOut' }}
        />
        <motion.circle
          className="donut-sheen"
          cx="110" cy="110" r="84"
          animate={{ strokeDashoffset: [530, 0] }}
          transition={{ duration: 1.4, repeat: Infinity, repeatDelay: 4, ease: 'easeInOut' }}
        />
      </svg>
      <div className="donut-center">
        <strong className="saved-amount">G$ {display}</strong>
        <span className="saved-caption">saved so far</span>
      </div>
    </div>
  );
}
