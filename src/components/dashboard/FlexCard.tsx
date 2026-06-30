import { forwardRef } from 'react';
import { Mascot, type MascotStage } from '../mascot/Mascot';

type FlexCardProps = {
  stage: MascotStage;
  streak: number;
  savedAmount: number;
};

export const FlexCard = forwardRef<HTMLDivElement, FlexCardProps>(function FlexCard({ stage, streak, savedAmount }, ref) {
  return (
    <div className="flex-card" ref={ref}>
      <div className="flex-card-inner">
        <Mascot stage={stage} compact />
        <h2>{streak} day streak 🔥</h2>
        <p>G$ {Math.round(savedAmount).toLocaleString()} saved & growing</p>
        <span>sageapp.xyz — your G$ grows itself</span>
      </div>
    </div>
  );
});
