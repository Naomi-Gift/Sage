import {
  Check, CheckCircle2, Pause, Play, ShieldCheck, Sprout, Wallet,
} from 'lucide-react';
import { LandingIn } from './LandingIn';

export function FeatureGrid() {
  return (
    <section className="ln-section ln-container" id="how-it-works">
      <div className="ln-feature-grid">
        <LandingIn delay={0.1}>
          <article className="ln-feature-card">
            <div className="ln-feature-stage">
              <div className="ln-mini ln-float">
                <div className="ln-mini-head">
                  <div className="ln-mini-head-left">
                    <Sprout size={16} />
                    <span>Daily claim</span>
                  </div>
                  <span className="ln-pill-ok ln-pulse">Saved</span>
                </div>
                <div className="ln-mini-rows">
                  <div><span>Claimed</span><strong>G$ 100.00</strong></div>
                  <div><span>Sage slice 20%</span><strong>G$ 20.00</strong></div>
                  <div><span>You keep</span><strong>G$ 80.00</strong></div>
                  <div><span>On its way to Aave</span><CheckCircle2 size={14} className="ln-ok ln-pulse" /></div>
                </div>
              </div>
            </div>
            <div className="ln-feature-copy">
              <h3>Auto-save from every claim</h3>
              <p>Sage watches your daily GoodDollar claim and intercepts the slice you set  automatically, no extra tap.</p>
            </div>
          </article>
        </LandingIn>

        <LandingIn delay={0.2}>
          <article className="ln-feature-card">
            <div className="ln-feature-stage">
              <div className="ln-yield-stack ln-float" style={{ animationDelay: '0.5s' }}>
                <div className="ln-mini">
                  <div className="ln-mini-head">
                    <div className="ln-mini-head-left">
                      <Wallet size={16} />
                      <span>Aave position</span>
                    </div>
                    <span className="ln-pill-ok">4.2% APY</span>
                  </div>
                  <p className="ln-yield-amt">G$ 1,240.18</p>
                  <p className="ln-yield-sub">principal + yield · compounding</p>
                  <div className="ln-load-track"><div className="ln-load-fill" /></div>
                </div>
              </div>
            </div>
            <div className="ln-feature-copy">
              <h3>Real yield on Aave</h3>
              <p>The saved amount swaps to cUSD via Mento and supplies Aave V3 on Celo. Your G$ earns DeFi interest.</p>
            </div>
          </article>
        </LandingIn>

        <LandingIn delay={0.3}>
          <article className="ln-feature-card">
            <div className="ln-feature-stage">
              <div className="ln-mini ln-mini-flush ln-float" style={{ animationDelay: '1s' }}>
                <div className="ln-perm-head">
                  <span>Withdraw</span>
                  <span>G$</span>
                  <span>cUSD</span>
                  <span>Aave</span>
                </div>
                <div className="ln-perm-body">
                  <div className="ln-perm-row ln-highlight">
                    <span>Vault</span>
                    <span className="ln-check-box on"><Check size={10} /></span>
                    <span className="ln-check-box" />
                    <span className="ln-check-box" />
                  </div>
                  <div className="ln-perm-row ln-highlight" style={{ animationDelay: '1s' }}>
                    <span>Swap</span>
                    <span className="ln-check-box on"><Check size={10} /></span>
                    <span className="ln-check-box on"><Check size={10} /></span>
                    <span className="ln-check-box" />
                  </div>
                  <div className="ln-perm-row ln-highlight" style={{ animationDelay: '2s' }}>
                    <span>Wallet</span>
                    <span className="ln-check-box on"><Check size={10} /></span>
                    <span className="ln-check-box on"><Check size={10} /></span>
                    <span className="ln-check-box on"><Check size={10} /></span>
                  </div>
                </div>
              </div>
            </div>
            <div className="ln-feature-copy">
              <h3>Withdraw back to G$</h3>
              <p>One tap. Your position redeems from Aave and converts back to G$ in the same transaction. No lock-up.</p>
            </div>
          </article>
        </LandingIn>

        <LandingIn delay={0.4}>
          <article className="ln-feature-card">
            <div className="ln-feature-stage">
              <div className="ln-mini ln-float" style={{ animationDelay: '1.5s' }}>
                <div className="ln-user-row">
                  <div className="ln-avatar">You</div>
                  <div>
                    <strong>Your wallet</strong>
                    <small>Only you can withdraw</small>
                  </div>
                </div>
                <div className="ln-role-label">Guarantees</div>
                <div className="ln-role-chips">
                  <span className="ln-chip-blue ln-scale"><ShieldCheck size={12} /> Non-custodial</span>
                  <span className="ln-chip-zinc ln-scale" style={{ animationDelay: '1.5s' }}><Wallet size={12} /> Your keys</span>
                </div>
              </div>
            </div>
            <div className="ln-feature-copy">
              <h3>Non-custodial by design</h3>
              <p>SageVault holds the position on Celo. Only your wallet can withdraw. Sage never holds your keys.</p>
            </div>
          </article>
        </LandingIn>

        <LandingIn delay={0.5}>
          <article className="ln-feature-card">
            <div className="ln-feature-stage">
              <div className="ln-pause-stack ln-float" style={{ animationDelay: '2s' }}>
                <div className="ln-mini ln-mini-tight">
                  <div className="ln-ws-trigger">
                    <div className="ln-ws-mark">
                      <img src="/assets/sage_S_logo_Dark.png" alt="Sage" style={{ width: '100%', height: '100%', objectFit: 'contain' }} />
                    </div>
                    <span>Saving rule</span>
                    <span className="ln-ws-live">Active</span>
                  </div>
                </div>
                <div className="ln-mini ln-mini-tight">
                  <div className="ln-ws-label">Switch</div>
                  <div className="ln-ws-item ln-highlight">
                    <Play size={12} />
                    <span>Keep saving</span>
                    <Check size={14} className="ln-ml-auto ln-pulse" />
                  </div>
                  <div className="ln-ws-item ln-highlight" style={{ animationDelay: '1.5s' }}>
                    <Pause size={12} />
                    <span>Pause claims</span>
                  </div>
                  <div className="ln-ws-hint">Yield keeps earning either way</div>
                </div>
              </div>
            </div>
            <div className="ln-feature-copy">
              <h3>Pause anytime</h3>
              <p>Stop intercepting new claims with one transaction. Your existing savings stay in Aave and keep earning.</p>
            </div>
          </article>
        </LandingIn>

        <LandingIn delay={0.6}>
          <article className="ln-feature-card">
            <div className="ln-feature-stage">
              <div className="ln-term ln-float" style={{ animationDelay: '2.5s' }}>
                <div className="ln-term-bar">
                  <span /><span /><span />
                  <em>celo · sage-agent</em>
                </div>
                <div className="ln-term-body">
                  <p><i>$</i> executeSaving()</p>
                  <p className="dim">Watching Claimed events…</p>
                  <p><b>[OK]</b> Slice pulled · G$ → cUSD</p>
                  <p><b>[OK]</b> Supplied to Aave V3</p>
                  <div className="ln-term-load">
                    <span>On-chain on Celo</span>
                    <span className="ok">100%</span>
                  </div>
                  <div className="ln-load-track"><div className="ln-load-fill" /></div>
                  <p className="ok ln-cursor">Ready · tx confirmed<span /></p>
                </div>
              </div>
            </div>
            <div className="ln-feature-copy">
              <h3>On-chain on Celo</h3>
              <p>The agent executes on every claim. Risk guards for slippage, price impact, and deposit caps sit in the vault.</p>
            </div>
          </article>
        </LandingIn>
      </div>
    </section>
  );
}
