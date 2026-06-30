import type { LucideIcon } from 'lucide-react';

type HowSageWorksStepProps = {
  icon: LucideIcon;
  title?: string;
  children: React.ReactNode;
};

export function HowSageWorksStep({ icon: Icon, title, children }: HowSageWorksStepProps) {
  return (
    <div className="trust-step">
      <span className="trust-icon">
        <Icon size={18} strokeWidth={2} />
      </span>
      <div>
        {title && (
          <strong style={{ display: 'block', fontSize: '15px', fontWeight: 700, color: 'var(--text)', marginBottom: '4px' }}>
            {title}
          </strong>
        )}
        <p>{children}</p>
      </div>
    </div>
  );
}
