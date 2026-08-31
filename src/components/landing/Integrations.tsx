import { LandingIn } from './LandingIn';

const STACK = [
  { name: 'GoodDollar', logo: '/logos/gdollarlogo.png' },
  { name: 'Aave', logo: '/logos/aave.png' },
  { name: 'Celo', logo: '/logos/celo.png' },
  { name: 'Mento', logo: '/logos/mento.png' },
  { name: 'MiniPay', logo: '/logos/mini_pay.png' },
  { name: 'GoodWallet', logo: '/logos/goodwallet.png' },
  { name: 'cUSD', logo: '/logos/cUSD.png' },
];

export function Integrations() {
  return (
    <section className="ln-section ln-container ln-section-rule" id="stack">
      <LandingIn delay={0.1} className="ln-section-intro">
        <h2>Built on the stack you already trust</h2>
        <p>Sage sits on GoodDollar, Mento, Aave, and Celo. Not a new island.</p>
      </LandingIn>
      <LandingIn delay={0.2} className="ln-logos">
        {STACK.map((item) => (
          <div key={item.name} className="ln-logo-tile" title={item.name} aria-label={item.name}>
            <img src={item.logo} alt={item.name} className="ln-logo-img" />
          </div>
        ))}
      </LandingIn>
    </section>
  );
}
