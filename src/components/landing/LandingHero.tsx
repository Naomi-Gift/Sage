import { HoverCta } from './HoverCta';
import { LandingIn } from './LandingIn';
import { SolarIcon } from './SolarIcon';

type LandingHeroProps = {
  connected: boolean;
  saving: boolean;
  onConnect: () => void;
  onActivate: () => void;
};

const HERO_CARDS = [
  { src: '/assets/landing/hero-seedling.jpg', alt: 'Gold coins beside a young seedling', className: 'ln-glass-1' },
  { src: '/assets/landing/hero-claim.jpg',    alt: 'Daily claim arriving as gold coins', className: 'ln-glass-2' },
  { src: '/assets/landing/hero-growth.jpg',   alt: 'A plant growing through stacked coins', className: 'ln-glass-3' },
  { src: '/assets/landing/hero-vault.jpg',    alt: 'Glass vault of coins glowing with yield', className: 'ln-glass-4' },
  { src: '/assets/landing/hero-keys.jpg',     alt: 'A key beside gold coins  your keys, your funds', className: 'ln-glass-5' },
  { src: '/assets/landing/hero-network.jpg',  alt: 'Coins in orbit on a quiet on-chain network', className: 'ln-glass-6' },
];

function scrollToHow() {
  document.getElementById('how-it-works')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
}

export function LandingHero({ connected, saving, onConnect, onActivate }: LandingHeroProps) {
  return (
    <section className="ln-hero ln-container" id="top">
      <div className="ln-hero-grid">
        <div className="ln-hero-copy">
          <LandingIn delay={0.1}>
            <h1 className="ln-hero-title">
              Your G$
              <br />
              Grows Itself
              <br />
              <span>Automatically</span>
            </h1>
          </LandingIn>

          <LandingIn delay={0.2} className="ln-hero-ctas">
            <HoverCta disabled={saving} onClick={connected ? onActivate : onConnect}>
              {saving ? 'Saving…' : connected ? 'Activate Sage' : "Connect Wallet"}
            </HoverCta>
            <button type="button" className="ln-ghost-btn" onClick={scrollToHow}>
              See how it works
            </button>
          </LandingIn>

          <LandingIn delay={0.3} className="ln-hero-checks">
            <p>
              <SolarIcon icon="solar:check-circle-linear" width={24} height={24} />
              <span>
                <strong>Set it once:</strong> Sage saves from every daily claim
              </span>
            </p>
            <p>
              <SolarIcon icon="solar:check-circle-linear" width={24} height={24} />
              <span>
                <strong>Non-custodial:</strong> your keys, your funds
              </span>
            </p>
            <p>
              <SolarIcon icon="solar:check-circle-linear" width={24} height={24} />
              <span>
                <strong>Real yield:</strong> Aave on Celo, withdraw to G$ anytime
              </span>
            </p>
          </LandingIn>
        </div>

        <LandingIn delay={0.4} className="ln-hero-cluster">
          {HERO_CARDS.map((card) => (
            <div key={card.src} className={`ln-glass-card ${card.className}`}>
              <div className="ln-glass-photo">
                <img src={card.src} alt={card.alt} />
                <div className="ln-glass-shade" />
              </div>
              <div className="ln-glass-highlight" />
            </div>
          ))}
        </LandingIn>
      </div>
    </section>
  );
}
