import { motion, AnimatePresence } from 'framer-motion';
import { useMemo, useState } from 'react';

const DAILY_CLAIM_OPTIONS = [50, 100, 200, 500];
const APY = 4.2;

function project(dailyClaim: number, pct: number, days: number) {
  // Simple compound projection: each day's save earns APY/365 daily
  const dailySave   = dailyClaim * (pct / 100);
  const dailyRate   = APY / 100 / 365;
  let total = 0;
  for (let d = 0; d < days; d++) {
    total = (total + dailySave) * (1 + dailyRate);
  }
  return Math.round(total);
}

type SavingsEstimatorProps = {
  pct: number;
};

export function SavingsEstimator({ pct }: SavingsEstimatorProps) {
  const [claim, setClaim] = useState(100);

  const results = useMemo(() => ({
    d30:  project(claim, pct, 30),
    d90:  project(claim, pct, 90),
    d365: project(claim, pct, 365),
  }), [claim, pct]);

  const safePct = pct > 0 ? pct : 20;
  const safeResults = useMemo(() => ({
    d30:  project(claim, safePct, 30),
    d90:  project(claim, safePct, 90),
    d365: project(claim, safePct, 365),
  }), [claim, safePct]);

  const display = pct > 0 ? results : safeResults;
  const label   = pct > 0 ? `${pct}%` : '20%';

  return (
    <div className="estimator">
      <div className="estimator-header">
        <span className="estimator-title">See your savings grow</span>
        <span className="estimator-sub">Based on your daily G$ claim amount</span>
      </div>

      {/* Claim selector */}
      <div className="estimator-claim-row">
        <span className="estimator-claim-label">Daily claim</span>
        <div className="estimator-chips">
          {DAILY_CLAIM_OPTIONS.map((opt) => (
            <button
              key={opt}
              type="button"
              className={`estimator-chip ${claim === opt ? 'estimator-chip-active' : ''}`}
              onClick={() => setClaim(opt)}
            >
              G$ {opt}
            </button>
          ))}
        </div>
      </div>

      {/* Projection bars */}
      <div className="estimator-bars">
        {([
          { key: 'd30',  label: '30 days',  value: display.d30,  max: display.d365 },
          { key: 'd90',  label: '90 days',  value: display.d90,  max: display.d365 },
          { key: 'd365', label: '1 year',   value: display.d365, max: display.d365 },
        ] as const).map((row) => (
          <div key={row.key} className="estimator-bar-row">
            <span className="estimator-bar-label">{row.label}</span>
            <div className="estimator-bar-track">
              <AnimatePresence initial={false}>
                <motion.div
                  key={`${row.key}-${row.value}`}
                  className="estimator-bar-fill"
                  initial={{ width: 0 }}
                  animate={{ width: `${Math.max(4, (row.value / row.max) * 100)}%` }}
                  transition={{ duration: 0.55, ease: [0.22, 1, 0.36, 1] }}
                />
              </AnimatePresence>
            </div>
            <AnimatePresence mode="wait" initial={false}>
              <motion.span
                key={row.value}
                className="estimator-bar-value"
                initial={{ opacity: 0, y: 4 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{   opacity: 0, y: -4 }}
                transition={{ duration: 0.2 }}
              >
                G$ {row.value.toLocaleString()}
              </motion.span>
            </AnimatePresence>
          </div>
        ))}
      </div>

      <p className="estimator-footnote">
        Saving {label} per claim · {APY}% APY via Aave · numbers are estimates
      </p>
    </div>
  );
}
