type GoalNameInputProps = {
  value: string;
  onChange: (value: string) => void;
};

export function GoalNameInput({ value, onChange }: GoalNameInputProps) {
  return (
    <label className="goal-input" htmlFor="goal-name">
      <span>Give it a name (optional)</span>
      <input
        id="goal-name"
        value={value}
        placeholder="Emergency fund"
        onChange={(event) => onChange(event.target.value)}
      />
    </label>
  );
}
