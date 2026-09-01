import { LandingIn } from './LandingIn';

type FinalCtaProps = {
  connected: boolean;
  saving: boolean;
  onConnect?: () => void;
  onActivate?: () => void;
  onLaunchApp?: () => void;
};

export function FinalCta({ connected, saving, onConnect, onActivate, onLaunchApp }: FinalCtaProps) {
  const handleAction = onLaunchApp || onActivate || onConnect;

  return (
    <section className="ln-section ln-container ln-section-rule ln-final-wrap">
      <LandingIn delay={0.1} className="ln-final">
        <h2>Ready to grow your G$?</h2>
        <p>Join claimers who set a rule once and let Sage save from every daily GoodDollar claim.</p>
        <div className="ln-final-actions">
          <button
            type="button"
            className="ln-plan-cta-solid ln-final-primary"
            disabled={saving}
            onClick={handleAction}
          >
            {saving ? 'Saving…' : 'Launch App'}
          </button>
          <button
            type="button"
            className="ln-ghost-btn"
            onClick={() => document.getElementById('how-it-works')?.scrollIntoView({ behavior: 'smooth' })}
          >
            See how it works
          </button>
        </div>
      </LandingIn>
    </section>
  );
}
