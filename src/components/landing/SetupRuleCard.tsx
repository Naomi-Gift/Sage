import { useEffect, useRef } from 'react';
import { Instruction } from '../../types';
import { GoalNameInput } from '../setup/GoalNameInput';
import { GoalTargetInput } from '../setup/GoalTargetInput';
import { SavingsSlider } from '../setup/SavingsSlider';
import { LandingIn } from './LandingIn';
import { HoverCta } from './HoverCta';

type SetupRuleCardProps = {
  instruction: Instruction;
  onInstructionChange: (instruction: Instruction) => void;
  onSave: () => void;
  saving: boolean;
};

export function SetupRuleCard({
  instruction, onInstructionChange, onSave, saving,
}: SetupRuleCardProps) {
  const percent = instruction.percentBps / 100;
  const cardRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const t = window.setTimeout(() => {
      cardRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }, 240);
    return () => window.clearTimeout(t);
  }, []);

  return (
    <section className="ln-container" id="setup-rule">
      <LandingIn delay={0.05}>
        <div className="ln-setup" ref={cardRef}>
          <div>
            <h2>Choose your savings rule</h2>
            <p>Sage saves from your future daily claims. Adjust or pause anytime from Grow.</p>
          </div>
          <div className="ln-setup-controls">
            <SavingsSlider
              value={percent}
              onChange={(value) =>
                onInstructionChange({ ...instruction, percentBps: value * 100, active: value > 0 })
              }
            />
            <GoalNameInput
              value={instruction.goalLabel}
              onChange={(goalLabel) => onInstructionChange({ ...instruction, goalLabel })}
            />
            <GoalTargetInput
              value={instruction.goalTargetGD}
              onChange={(goalTargetGD) => onInstructionChange({ ...instruction, goalTargetGD })}
            />
            <HoverCta disabled={saving} onClick={onSave}>
              {saving ? 'Saving…' : 'Activate Sage'}
            </HoverCta>
          </div>
        </div>
      </LandingIn>
    </section>
  );
}
