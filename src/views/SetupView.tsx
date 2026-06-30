import { motion, type Variants } from 'framer-motion';
import { ArrowLeftRight, RefreshCw, TrendingUp } from 'lucide-react';
import { Instruction } from '../types';
import { FAQ } from '../components/setup/FAQ';
import { GoalNameInput } from '../components/setup/GoalNameInput';
import { GoalTargetInput } from '../components/setup/GoalTargetInput';
import { HeroDemo } from '../components/setup/HeroDemo';
import { PrimaryButton } from '../components/ui/PrimaryButton';
import { SavingsEstimator } from '../components/setup/SavingsEstimator';
import { SavingsSlider } from '../components/setup/SavingsSlider';
import { TrustBar } from '../components/setup/TrustBar';

type SetupViewProps = {
  instruction: Instruction;
  onInstructionChange: (instruction: Instruction) => void;
  onSave: () => void;
  onConnect: () => void;
  connected: boolean;
  saving: boolean;
};

const cardVariants: Variants = {
  hidden:  { opacity: 0, y: 28 },
  visible: (i: number) => ({
    opacity: 1, y: 0,
    transition: { duration: 0.45, delay: i * 0.12, ease: 'easeOut' },
  }),
};

const steps = [
  {
    icon: RefreshCw,
    title: 'Sage watches your daily claim',
    desc:  'Every time GoodDollar processes your daily claim, Sage intercepts the configured slice — automatically, no action needed.',
  },
  {
    icon: TrendingUp,
    title: 'Your G$ earns real yield',
    desc:  'The saved amount is deposited into Aave via GoodDollar\'s own exchange. It earns DeFi interest and compounds daily.',
  },
  {
    icon: ArrowLeftRight,
    title: 'Withdraw back to G$ anytime',
    desc:  'One tap. Your position converts back to G$ in the same transaction. No waiting periods, no lock-ups, no surprises.',
  },
];

export function SetupView({
  instruction, onInstructionChange,
  onSave, onConnect, connected, saving,
}: SetupViewProps) {
  const percent = instruction.percentBps / 100;

  function updatePercent(value: number) {
    onInstructionChange({ ...instruction, percentBps: value * 100, active: value > 0 });
  }

  return (
    <section className="setup-screen landing-page">

      {/* ─────────────────────────────────────────────── */}
      {/* HERO                                           */}
      {/* ─────────────────────────────────────────────── */}
      <div className="landing-hero">

        {/* Copy — always first on mobile via order */}
        <div className="landing-copy">
          <img
            src="/assets/sage-logo.svg"
            alt="Sage"
            className="landing-logo"
            width="110"
            height="40"
          />
          <h1>Your G$<br /><em>grows itself.</em></h1>
          <p>Set it once. Sage saves a slice of every daily GoodDollar claim and puts it to work — automatically.</p>

          <PrimaryButton
            className="hero-connect-button"
            onClick={connected ? onSave : onConnect}
            disabled={saving}
          >
            {saving ? 'Saving…' : connected ? 'Activate Sage →' : 'Connect Wallet'}
          </PrimaryButton>

          {/* Trust anchors right under the CTA */}
          <div className="hero-trust-pills">
            <span>🔒 Non-custodial</span>
            <span>⚡ Withdraw anytime</span>
            <span>✦ No setup fees</span>
          </div>
        </div>

        {/* Animated demo card */}
        <HeroDemo />
      </div>

      {/* ─────────────────────────────────────────────── */}
      {/* SAVINGS ESTIMATOR                              */}
      {/* ─────────────────────────────────────────────── */}
      <motion.div
        initial={{ opacity: 0, y: 24 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, amount: 0.2 }}
        transition={{ duration: 0.5, ease: 'easeOut' }}
      >
        <SavingsEstimator pct={percent} />
      </motion.div>

      {/* ─────────────────────────────────────────────── */}
      {/* SAVINGS RULE (shown after wallet connect)      */}
      {/* ─────────────────────────────────────────────── */}
      {connected && (
        <motion.div
          className="setup-rule-card"
          id="setup-rule"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, ease: 'easeOut' }}
        >
          <div>
            <h2>Choose your savings rule</h2>
            <p>Sage saves from your future daily claims. Adjust or pause anytime from your dashboard.</p>
          </div>
          <div className="setup-controls">
            <SavingsSlider value={percent} onChange={updatePercent} />
            <GoalNameInput
              value={instruction.goalLabel}
              onChange={(goalLabel) => onInstructionChange({ ...instruction, goalLabel })}
            />
            <GoalTargetInput
              value={instruction.goalTargetGD}
              onChange={(goalTargetGD) => onInstructionChange({ ...instruction, goalTargetGD })}
            />
            <PrimaryButton fullWidth disabled={saving} onClick={onSave}>
              {saving ? 'Saving…' : 'Activate Sage →'}
            </PrimaryButton>
          </div>
        </motion.div>
      )}

      {/* ─────────────────────────────────────────────── */}
      {/* HOW IT WORKS                                   */}
      {/* ─────────────────────────────────────────────── */}
      <div className="how-it-works-section">
        <h2>How it works</h2>
        <div className="how-it-works-grid">
          {steps.map((step, i) => {
            const Icon = step.icon;
            return (
              <motion.article
                className="how-it-works-step"
                key={step.title}
                custom={i}
                variants={cardVariants}
                initial="hidden"
                whileInView="visible"
                viewport={{ once: true, amount: 0.25 }}
              >
                <span className="how-it-works-icon">
                  <Icon size={20} strokeWidth={2} />
                </span>
                <div>
                  <p className="how-it-works-title">{step.title}</p>
                  <p className="how-it-works-desc">{step.desc}</p>
                </div>
              </motion.article>
            );
          })}
        </div>
      </div>

      {/* ─────────────────────────────────────────────── */}
      {/* TRUST BAR                                      */}
      {/* ─────────────────────────────────────────────── */}
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, amount: 0.3 }}
        transition={{ duration: 0.4, ease: 'easeOut' }}
      >
        <TrustBar />
      </motion.div>

      {/* ─────────────────────────────────────────────── */}
      {/* FAQ                                            */}
      {/* ─────────────────────────────────────────────── */}
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, amount: 0.1 }}
        transition={{ duration: 0.4, ease: 'easeOut' }}
      >
        <FAQ />
      </motion.div>

      {/* ─────────────────────────────────────────────── */}
      {/* FINAL CTA                                      */}
      {/* ─────────────────────────────────────────────── */}
      <div className="final-cta">
        <div className="final-cta-mascot" aria-hidden="true">🌱</div>
        <h2>Start saving today.<br />Your future self will thank you.</h2>
        <p className="final-cta-sub">
          Thousands of G$ claims happen every day. Yours could be growing too.
        </p>
        <PrimaryButton onClick={connected ? onSave : onConnect} disabled={saving}>
          {saving ? 'Saving…' : connected ? 'Activate Sage →' : 'Connect Wallet'}
        </PrimaryButton>
        <div className="final-cta-trust">
          <span>Non-custodial</span>
          <span aria-hidden="true">·</span>
          <span>Built on Celo</span>
          <span aria-hidden="true">·</span>
          <span>Powered by GoodDollar</span>
          <span aria-hidden="true">·</span>
          <span>Yield via Aave</span>
        </div>
      </div>

    </section>
  );
}
