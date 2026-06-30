import { ArrowLeftRight, RefreshCw, TrendingUp } from 'lucide-react';
import { motion, type Variants } from 'framer-motion';
import { HowSageWorksStep } from '../components/about/HowSageWorksStep';

const cardVariants: Variants = {
  hidden:   { opacity: 0, y: 20 },
  visible:  (i: number) => ({
    opacity: 1, y: 0,
    transition: { duration: 0.42, delay: i * 0.1, ease: 'easeOut' },
  }),
};

const steps = [
  {
    icon: RefreshCw,
    title: 'Direct exchange, no middlemen',
    body: 'Your G$ briefly converts through GoodDollar\'s own official exchange — the same one used across the GoodDollar app.',
  },
  {
    icon: TrendingUp,
    title: 'Real yield from Aave',
    body: 'It earns interest on Aave, a battle-tested and audited lending protocol with billions in TVL.',
  },
  {
    icon: ArrowLeftRight,
    title: 'Withdraw whenever you want',
    body: 'You can withdraw anytime. Converts back to G$ automatically. You only ever hold G$.',
  },
];

export function AboutView() {
  return (
    <section className="about-screen">
      <div>
        <h1>How Sage works</h1>
      </div>

      <div className="trust-list">
        {steps.map((step, i) => (
          <motion.div
            key={step.title}
            custom={i}
            variants={cardVariants}
            initial="hidden"
            animate="visible"
          >
            <HowSageWorksStep icon={step.icon} title={step.title}>
              {step.body}
            </HowSageWorksStep>
          </motion.div>
        ))}
      </div>

      <p className="fee-note">
        A small protocol fee (currently 3%) applies when converting back to G$ — the same fee used throughout GoodDollar.
        Sage itself charges no additional fees.
      </p>
    </section>
  );
}
