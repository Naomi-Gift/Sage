import { Target } from 'lucide-react';

type GoalTargetInputProps = {
  value: number;
  onChange: (value: number) => void;
};

const PRESETS = [500, 1000, 2000, 5000];

export function GoalTargetInput({ value, onChange }: GoalTargetInputProps) {
  return (
    <div className="goal-target-input">
      <label className="goal-target-label" htmlFor="goal-target">
        <Target size={14} strokeWidth={2} />
        <span>Target amount <em>(optional)</em></span>
      </label>
      <div className="goal-target-presets">
        {PRESETS.map((p) => (
          <button
            key={p}
            type="button"
            className={`preset-chip ${value === p ? 'preset-chip-active' : ''}`}
            onClick={() => onChange(value === p ? 0 : p)}
          >
            G$ {p.toLocaleString()}
          </button>
        ))}
      </div>
      <input
        id="goal-target"
        type="number"
        inputMode="numeric"
        min="0"
        step="100"
        placeholder="Or enter a custom amount…"
        value={value > 0 ? value : ''}
        className="goal-target-field"
        onChange={(e) => {
          const n = Number(e.target.value);
          onChange(Number.isFinite(n) && n >= 0 ? n : 0);
        }}
      />
    </div>
  );
}
