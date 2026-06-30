type GoalProgressLabelProps = {
  goalName: string;
  progress: number;
  target?: number;
  current?: number;
};

export function GoalProgressLabel({ goalName, progress, target, current }: GoalProgressLabelProps) {
  if (!goalName.trim()) return null;

  const pct = Math.round(progress);
  const hasTarget = target && target > 0 && current !== undefined;

  return (
    <div className="goal-progress-wrap">
      <div className="goal-progress-text">
        <span className="goal-progress-name">{goalName.trim()}</span>
        {hasTarget ? (
          <span className="goal-progress-amount">
            G$ {Math.round(current!).toLocaleString()} / {target!.toLocaleString()}
          </span>
        ) : (
          <span className="goal-progress-amount">{pct}%</span>
        )}
      </div>
      <div className="goal-progress-bar" role="progressbar" aria-valuenow={pct} aria-valuemin={0} aria-valuemax={100}>
        <div className="goal-progress-fill" style={{ width: `${pct}%` }} />
      </div>
      {hasTarget && (
        <p className="goal-progress-label">{pct}% of your goal reached</p>
      )}
    </div>
  );
}
