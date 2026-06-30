import { Home, Info, TrendingUp, Wallet } from 'lucide-react';
import { motion } from 'framer-motion';

type ShellProps = {
  activeView: string;
  onViewChange: (view: 'setup' | 'dashboard' | 'about') => void;
  connectedAddress?: string;
  onConnect: () => void;
  children: React.ReactNode;
};

const tabs = [
  { view: 'setup'     as const, label: 'Home',  icon: Home },
  { view: 'dashboard' as const, label: 'Grow',  icon: TrendingUp },
  { view: 'about'     as const, label: 'About', icon: Info },
];

export function Shell({ activeView, onViewChange, connectedAddress, onConnect, children }: ShellProps) {
  const shortAddress = connectedAddress
    ? `${connectedAddress.slice(0, 6)}…${connectedAddress.slice(-4)}`
    : undefined;

  return (
    <div className="app-shell">
      <header className="app-header">
        <button
          className="brand"
          onClick={() => onViewChange('setup')}
          aria-label="Go to home"
        >
          Sage
        </button>

        <div className="header-actions">
          <button
            className={`wallet-pill ${shortAddress ? 'connected' : ''}`}
            onClick={onConnect}
            aria-label={shortAddress ? `Wallet: ${shortAddress}` : 'Connect wallet'}
          >
            {shortAddress ? <span className="status-dot" /> : <Wallet size={14} />}
            <span>{shortAddress ?? 'Connect'}</span>
          </button>
        </div>
      </header>

      <main className="main">{children}</main>

      <nav className="tab-bar" aria-label="Primary navigation">
        {tabs.map(({ view, label, icon: Icon }) => {
          const active = activeView === view;
          return (
            <button
              key={view}
              className={`tab-item ${active ? 'active' : 'inactive'}`}
              onClick={() => onViewChange(view)}
              aria-current={active ? 'page' : undefined}
              aria-label={label}
            >
              {active && (
                <motion.div
                  className="active-pill"
                  layoutId="activeTab"
                  transition={{ type: 'spring', stiffness: 380, damping: 28 }}
                />
              )}
              <Icon size={20} strokeWidth={active ? 2.2 : 1.8} />
              <span className="tab-label">{label}</span>
            </button>
          );
        })}
      </nav>
    </div>
  );
}
