import {
  ArrowDownLeft,
  ArrowUpRight,
  Calendar,
  Download,
  Home,
  LogOut,
  Plus,
  Repeat2,
  ShieldCheck,
  Sprout,
  Target,
  Wallet,
} from 'lucide-react';
import { LandingIn } from './LandingIn';
import { SolarIcon } from './SolarIcon';

export function ProductPreview() {
  return (
    <section className="ln-preview-section ln-container" id="preview">
      <LandingIn delay={0.1} className="ln-preview-intro">
        <div className="ln-preview-sparks" aria-hidden="true">
          <span /><span /><span />
        </div>
        <h2>Meet your financial platform</h2>
        <p>Set a rule once. Sage saves from every GoodDollar claim and puts it to work automatically.</p>
      </LandingIn>

      <LandingIn delay={0.3} className="ln-dash">
        {/* Left Sidebar Rail */}
        <aside className="ln-dash-rail">
          <div className="ln-dash-rail-top">
            <a className="ln-dash-logo" href="#top" aria-label="Sage">
              <img
                src="/assets/sage_S_logo_Dark.png"
                alt="Sage"
                className="ln-dash-logo-img"
              />
            </a>
            <div className="ln-dash-icons">
              <button type="button" aria-label="Overview" className="ln-dash-icon-btn">
                <SolarIcon icon="solar:widget-linear" width={24} height={24} />
              </button>
              <button type="button" aria-label="Streak" className="ln-dash-icon-btn">
                <SolarIcon icon="solar:star-linear" width={24} height={24} />
              </button>
              <button type="button" aria-label="Calendar" className="ln-dash-icon-btn">
                <SolarIcon icon="solar:calendar-linear" width={24} height={24} />
              </button>
              <button type="button" className="ln-dash-icon-btn ln-dash-icon-dot" aria-label="Activity">
                <SolarIcon icon="solar:document-text-linear" width={24} height={24} />
                <i />
              </button>
              <button type="button" aria-label="Vault" className="ln-dash-icon-btn">
                <SolarIcon icon="solar:buildings-linear" width={24} height={24} />
              </button>
              <button type="button" aria-label="Account" className="ln-dash-icon-btn">
                <SolarIcon icon="solar:user-linear" width={24} height={24} />
              </button>
            </div>
          </div>

          <button type="button" className="ln-dash-rail-add" aria-label="Add Action">
            <Plus size={18} />
          </button>
        </aside>

        {/* Main Dashboard Core */}
        <div className="ln-dash-main">
          <div className="ln-dash-core">
            {/* Top Header */}
            <div className="ln-dash-head">
              <div className="fs-header-title-group">
                <h3>Welcome back</h3>
              </div>
              <div className="ln-dash-head-actions">
                <button type="button" className="ln-updates-btn">
                  <SolarIcon icon="solar:restart-linear" width={14} height={14} />
                  20% AUTO-SAVING
                </button>
                <div className="fs-wallet-chip" style={{ height: '34px', fontSize: '12px', padding: '0 12px' }}>
                  <span className="fs-wallet-address">0x71C8…49E2</span>
                  <LogOut size={13} className="fs-logout-icon" />
                </div>
              </div>
            </div>

            {/* Quick Action Cards (4 across) */}
            <div className="ln-quick-grid">
              {[
                { icon: <Home size={20} />, label: 'Daily claim' },
                { icon: <Sprout size={20} />, label: 'Auto-save' },
                { icon: <Wallet size={20} />, label: 'Withdraw' },
                { icon: <Repeat2 size={20} />, label: 'Yield' },
              ].map((item) => (
                <button key={item.label} type="button" className="ln-quick">
                  <span className="ln-quick-icon-wrap">{item.icon}</span>
                  <em>{item.label}</em>
                </button>
              ))}
            </div>

            {/* Statistics 2x2 Grid */}
            <div className="ln-stat-grid">
              <div className="ln-stat">
                <div className="ln-stat-icon">
                  <ArrowDownLeft size={24} />
                </div>
                <div className="ln-stat-info">
                  <span>Yield earned</span>
                  <strong>G$ 18.40</strong>
                </div>
              </div>

              <div className="ln-stat">
                <div className="ln-stat-icon">
                  <ArrowUpRight size={24} />
                </div>
                <div className="ln-stat-info">
                  <span>Total saved</span>
                  <strong>G$ 1,240.00</strong>
                </div>
              </div>

              <div className="ln-stat">
                <div className="ln-stat-icon">
                  <Target size={24} />
                </div>
                <div className="ln-stat-info">
                  <span>Emergency fund</span>
                  <strong>G$ 2,000 goal</strong>
                </div>
              </div>

              <div className="ln-stat">
                <div className="ln-stat-icon">
                  <ShieldCheck size={24} />
                </div>
                <div className="ln-stat-info">
                  <span>Saving rule</span>
                  <strong>20% of each claim</strong>
                </div>
              </div>
            </div>

            {/* Split: Recent Activity + Activity Graph */}
            <div className="ln-dash-split">
              {/* Recent Activity */}
              <div className="ln-activity">
                <h4>Recent activity</h4>
                <div className="ln-activity-tabs">
                  <div className="ln-tabs">
                    <button type="button" className="is-on">History</button>
                    <button type="button">Upcoming</button>
                  </div>
                  <div className="ln-tab-tools">
                    <button type="button" className="ln-date-chip">
                      <Calendar size={14} />
                      Last 14 days
                    </button>
                    <button type="button" className="ln-tiny-btn" aria-label="Download">
                      <Download size={15} />
                    </button>
                    <button type="button" className="ln-tiny-add-btn" aria-label="Add transaction">
                      <Plus size={16} />
                    </button>
                  </div>
                </div>

                {/* Date Group 1: Today */}
                <div className="ln-tx-group">
                  <span className="ln-tx-date-label">Today</span>
                  <div className="ln-tx">
                    <div className="ln-tx-who">
                      <div className="ln-tx-icon">
                        <SolarIcon icon="solar:transfer-horizontal-linear" width={18} height={18} />
                      </div>
                      <div>
                        <strong>Auto-saved from daily claim</strong>
                        <small>Just now</small>
                      </div>
                    </div>
                    <div className="ln-tx-cat">
                      <span><Sprout size={13} /></span>
                      Save
                    </div>
                    <div className="ln-tx-amt">
                      <span className="ln-doc">
                        <SolarIcon icon="solar:document-text-linear" width={14} height={14} />
                      </span>
                      <em className="pos">+G$ 20.00</em>
                    </div>
                  </div>
                </div>

                {/* Date Group 2: Yesterday */}
                <div className="ln-tx-group">
                  <span className="ln-tx-date-label">Yesterday</span>
                  <div className="ln-tx">
                    <div className="ln-tx-who">
                      <div className="ln-tx-icon">
                        <SolarIcon icon="solar:download-square-linear" width={18} height={18} />
                      </div>
                      <div>
                        <strong>Yield accrued</strong>
                        <small>Aave V3 · Celo</small>
                      </div>
                    </div>
                    <div className="ln-tx-cat">
                      <span><Repeat2 size={13} /></span>
                      Yield
                    </div>
                    <div className="ln-tx-amt">
                      <span className="ln-doc is-on">
                        <SolarIcon icon="solar:check-read-linear" width={14} height={14} />
                      </span>
                      <em className="pos">+G$ 0.90</em>
                    </div>
                  </div>

                  <div className="ln-tx">
                    <div className="ln-tx-who dim">
                      <div className="ln-tx-icon">
                        <SolarIcon icon="solar:arrow-right-up-linear" width={18} height={18} />
                      </div>
                      <div>
                        <strong>Daily claim intercepted</strong>
                        <small>20% of G$ 100</small>
                      </div>
                    </div>
                    <div className="ln-tx-cat">
                      <span><Wallet size={13} /></span>
                      Claim
                    </div>
                    <div className="ln-tx-amt">
                      <span className="ln-doc">
                        <SolarIcon icon="solar:document-text-linear" width={14} height={14} />
                      </span>
                      <em className="dim">+G$ 20.00</em>
                    </div>
                  </div>
                </div>
              </div>

              {/* Activity Graph */}
              <div className="ln-graph">
                <div className="ln-graph-header">
                  <div>
                    <h5>Activity graph</h5>
                    <strong>G$ 1.2k</strong>
                  </div>
                  <div className="ln-graph-range">LAST 18 DAYS</div>
                </div>

                <div className="ln-graph-plot">
                  <div className="ln-bars">
                    <div className="ln-bar-scale">
                      <span>25</span>
                      <span>15</span>
                      <span>5</span>
                      <span>0</span>
                    </div>
                    <div className="ln-bar-cols">
                      {[
                        { h: 20, peak: false, dim: false },
                        { h: 35, peak: false, dim: false },
                        { h: 25, peak: false, dim: false },
                        { h: 45, peak: false, dim: true },
                        { h: 60, peak: false, dim: false },
                        { h: 80, peak: false, dim: false },
                        { h: 90, peak: false, dim: false },
                        { h: 100, peak: true, dim: false },
                        { h: 60, peak: false, dim: false },
                        { h: 40, peak: false, dim: false },
                        { h: 30, peak: false, dim: false },
                      ].map((bar, i) => (
                        <div
                          key={i}
                          style={{ height: `${bar.h}%` }}
                          className={`ln-bar-col ${bar.peak ? 'is-peak' : ''} ${bar.dim ? 'is-dim' : ''}`}
                        />
                      ))}
                    </div>
                  </div>
                  <div className="ln-bar-x">
                    {['9', '11', '13', '15', '17', '19', '21', '23', '25', '27'].map((d) => (
                      <span key={d}>{d}</span>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </LandingIn>
    </section>
  );
}
