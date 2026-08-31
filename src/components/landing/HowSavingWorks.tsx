import { Check, Minus } from 'lucide-react';
import { LandingIn } from './LandingIn';

type Plan = {
  name: string;
  blurb: string;
  price: string;
  period?: string;
  cta: string;
  popular?: boolean;
  items: string[];
};

const PLANS: Plan[] = [
  {
    name: 'Claim',
    blurb: 'Keep claiming G$ as usual. Sage never touches the rest.',
    price: 'G$ 0',
    period: 'fees from Sage',
    cta: 'Keep claiming',
    items: ['You claim G$ every day', 'Sage waits for your rule', 'Nothing leaves your wallet'],
  },
  {
    name: 'Save',
    blurb: 'Set a % once. Sage intercepts that slice on every claim.',
    price: 'Free',
    cta: 'Set a savings rule',
    popular: true,
    items: [
      'Auto-save 1% to 50% of each claim',
      'Pause or adjust anytime',
      'Non-custodial vault on Celo',
      'No Sage protocol fee',
    ],
  },
  {
    name: 'Grow',
    blurb: 'cUSD on Aave. Withdraw back to G$ whenever you want.',
    price: 'Anytime',
    cta: 'Withdraw to G$',
    items: [
      'Real yield via Aave V3',
      'One-tap withdraw to G$',
      '3% GoodDollar conversion fee',
      'Goal tracking & streaks',
    ],
  },
];

export function HowSavingWorks() {
  function onCta() {
    document.getElementById('top')?.scrollIntoView({ behavior: 'smooth' });
  }

  return (
    <section className="ln-section ln-container" id="savings">
      <LandingIn delay={0.1} className="ln-section-intro">
        <h2>Simple, transparent saving</h2>
        <p>Sage is free to use. You only ever pay the GoodDollar conversion fee when G$ swaps, the same fee used across the ecosystem.</p>
      </LandingIn>

      <LandingIn delay={0.2} className="ln-plans">
        {PLANS.map((plan) => (
          <article key={plan.name} className={`ln-plan ${plan.popular ? 'is-popular' : ''}`}>
            {plan.popular && <span className="ln-plan-glow" aria-hidden="true" />}
            <div className="ln-plan-top">
              <h3>{plan.name}</h3>
              {plan.popular && <span className="ln-plan-badge">Most popular</span>}
            </div>
            <p className="ln-plan-blurb">{plan.blurb}</p>
            <div className="ln-plan-price">
              <strong>{plan.price}</strong>
              {plan.period && <small>{plan.period}</small>}
            </div>
            <button type="button" className={plan.popular ? 'ln-plan-cta-solid' : 'ln-plan-cta'} onClick={onCta}>
              {plan.cta}
            </button>
            <ul>
              {plan.items.map((item) => (
                <li key={item}>
                  <Check size={16} className={plan.popular ? 'ok' : ''} />
                  {item}
                </li>
              ))}
            </ul>
          </article>
        ))}
      </LandingIn>

      <LandingIn delay={0.3} className="ln-compare">
        <div className="ln-compare-scroll">
          <table>
            <thead>
              <tr>
                <th>Compare Sage</th>
                <th>Claim</th>
                <th>Save</th>
                <th>Grow</th>
              </tr>
            </thead>
            <tbody>
              <tr className="ln-compare-section">
                <td colSpan={4}>Core</td>
              </tr>
              <tr>
                <td>Sage protocol fee</td>
                <td>0%</td>
                <td>0%</td>
                <td>0%</td>
              </tr>
              <tr>
                <td>Auto-save from claims</td>
                <td><Minus size={16} /></td>
                <td className="ok"><Check size={16} /></td>
                <td><Check size={16} /></td>
              </tr>
              <tr>
                <td>Aave yield</td>
                <td><Minus size={16} /></td>
                <td className="ok"><Check size={16} /></td>
                <td><Check size={16} /></td>
              </tr>
              <tr className="ln-compare-section">
                <td colSpan={4}>Withdraw &amp; control</td>
              </tr>
              <tr>
                <td>Withdraw to G$ anytime</td>
                <td><Minus size={16} /></td>
                <td className="ok"><Check size={16} /></td>
                <td><Check size={16} /></td>
              </tr>
              <tr>
                <td>Pause saving</td>
                <td><Minus size={16} /></td>
                <td className="ok"><Check size={16} /></td>
                <td><Check size={16} /></td>
              </tr>
              <tr>
                <td>Goal tracking</td>
                <td><Minus size={16} /></td>
                <td><Minus size={16} /></td>
                <td><Check size={16} /></td>
              </tr>
              <tr>
                <td>Non-custodial</td>
                <td><Check size={16} /></td>
                <td className="ok"><Check size={16} /></td>
                <td><Check size={16} /></td>
              </tr>
            </tbody>
          </table>
        </div>
      </LandingIn>
    </section>
  );
}
