import { Lock, RotateCcw, ShieldCheck, Zap } from 'lucide-react';

const ITEMS = [
  { icon: Lock,         label: 'Non-custodial',    sub: 'Your keys, your funds' },
  { icon: ShieldCheck,  label: 'Audited contracts', sub: 'On Celo mainnet' },
  { icon: RotateCcw,    label: 'Withdraw anytime',  sub: 'No lock-up ever' },
  { icon: Zap,          label: 'Zero setup fees',   sub: 'Start for free' },
];

export function TrustBar() {
  return (
    <div className="trust-bar">
      {ITEMS.map(({ icon: Icon, label, sub }) => (
        <div key={label} className="trust-bar-item">
          <span className="trust-bar-icon">
            <Icon size={15} strokeWidth={2.2} />
          </span>
          <span className="trust-bar-label">{label}</span>
          <span className="trust-bar-sub">{sub}</span>
        </div>
      ))}
    </div>
  );
}
