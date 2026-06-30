import { forwardRef } from 'react';
import { Mascot, type MascotStage } from '../mascot/Mascot';

type FlexCardProps = {
  stage:       MascotStage;
  streak:      number;
  savedAmount: number;
  apy?:        number;
  goalLabel?:  string;
};

export const FlexCard = forwardRef<HTMLDivElement, FlexCardProps>(
  function FlexCard({ stage, streak, savedAmount, apy = 4.2, goalLabel }, ref) {
    const amount = Math.round(savedAmount).toLocaleString();
    const label  = goalLabel?.trim() || '';

    return (
      <div className="flex-card" ref={ref}>
        {/* Background blobs for richness */}
        <div className="flex-card-blob flex-card-blob-1" />
        <div className="flex-card-blob flex-card-blob-2" />
        <div className="flex-card-blob flex-card-blob-3" />

        <div className="flex-card-inner">
          {/* Top row: branding */}
          <div className="flex-card-brand">
            <span className="flex-card-logo">Sage</span>
            <span className="flex-card-apy">🌱 {apy}% APY</span>
          </div>

          {/* Mascot */}
          <div className="flex-card-mascot-wrap">
            <Mascot stage={stage} compact />
          </div>

          {/* Main stats */}
          <div className="flex-card-stats">
            <div className="flex-card-amount">
              <span className="flex-card-amount-label">saved & growing</span>
              <span className="flex-card-amount-value">G$ {amount}</span>
            </div>
            <div className="flex-card-streak">
              <span className="flex-card-streak-num">{streak}</span>
              <span className="flex-card-streak-label">day streak 🔥</span>
            </div>
          </div>

          {/* Goal label (optional) */}
          {label && (
            <div className="flex-card-goal">
              Goal: {label}
            </div>
          )}

          {/* Footer */}
          <div className="flex-card-footer">
            <span>sageapp.xyz</span>
            <span>·</span>
            <span>your G$ grows itself</span>
          </div>
        </div>
      </div>
    );
  }
);
