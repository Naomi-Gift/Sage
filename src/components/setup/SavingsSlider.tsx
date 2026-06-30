type SavingsSliderProps = {
  value: number;
  onChange: (value: number) => void;
};

export function SavingsSlider({ value, onChange }: SavingsSliderProps) {
  return (
    <label className="savings-slider" htmlFor="save-percent">
      <span className="slider-question">How much of your daily claim should Sage save for you?</span>
      <span className="slider-value" style={{ left: `${value * 2}%` }}>{value}%</span>
      <input
        id="save-percent"
        type="range"
        min="0"
        max="50"
        step="1"
        value={value}
        style={{ ['--slider-percent' as string]: `${value * 2}%` }}
        onChange={(event) => onChange(Number(event.target.value))}
      />
    </label>
  );
}
