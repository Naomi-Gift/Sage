import { Home, Info, TrendingUp, WalletCards } from 'lucide-react';
import { motion } from 'framer-motion';

type ShellProps = {
  activeView: string;
  onViewChange: (view: 'setup' | 'dashboard' | 'about') => void;
  connectedAddress?: string;
  onConnect: () => void;
  children: React.ReactNode;
};

const tabs = [
  { view: 'setup' as const, label: 'Home', icon: Home },
  { view: 'dashboard' as const, label: 'Grow', icon: TrendingUp },
  { view: 'about' as const, label: 'About', icon: Info }
];

export function Shell({ activeView, onViewChange, connectedAddress, onConnect, children }: ShellProps) {
  const shortAddress = connectedAddress
    ? `${connectedAddress.slice(0, 6)}...${connectedAddress.slice(-4)}`
    : undefined;

  return (
    <div className="app-shell">
      <header className="app-header">
        <button className="brand-logo-btn" onClick={() => onViewChange('setup')} aria-label="Go to home">
          <img
            src="/assets/sage-logo.svg"
            alt="Sage"
            className="brand-logo"
            width="88"
            height="32"
          />
        </button>
        <div className="header-actions">
          <button className={shortAddress ? 'wallet-pill connected' : 'wallet-pill'} onClick={onConnect}>
            {shortAddress && <span className="status-dot" />}
            {!shortAddress && <WalletCards size={16} />}
            {shortAddress || 'Connect'}
          </button>
        </div>
      </header>
      <main className="main">{children}</main>
      <nav className="tab-bar" aria-label="Primary">
        {tabs.map(({ view, label, icon: Icon }) => {
          const active = activeView === view;
          return (
            <button
              key={view}
              className={`tab-item ${active ? 'active' : 'inactive'}`}
              onClick={() => onViewChange(view)}
              aria-current={active ? 'page' : undefined}
            >
              {active && (
                <motion.div
                  className="active-pill"
                  layoutId="activeTab"
                  transition={{ type: 'spring', stiffness: 400, damping: 30 }}
                />
              )}
              <Icon size={22} />
              <span className="tab-label">{label}</span>
            </button>
          );
        })}
      </nav>
    </div>
  );
}
