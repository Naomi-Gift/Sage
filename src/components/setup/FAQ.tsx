import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronDown } from 'lucide-react';

type FAQItem = {
  q: string;
  a: string;
};

const ITEMS: FAQItem[] = [
  {
    q: 'Do I lose my G$ when I use Sage?',
    a: "No. Sage converts a slice of your daily claim into a yield-bearing stablecoin via GoodDollar's own official exchange, then deposits it in Aave. When you withdraw, it converts back to G$ automatically. You never hold anything other than G$.",
  },
  {
    q: 'What happens if I stop claiming G$?',
    a: "Nothing bad. Your saved G$ stays in Aave earning yield whether you claim or not. Sage only saves when a new claim comes in — if there's no claim, there's nothing to save. Your existing savings are always safe.",
  },
  {
    q: 'Is this safe? Who controls my money?',
    a: "Sage is non-custodial — no one holds your funds. The SageVault smart contract on Celo holds your position, and only your wallet can withdraw. The underlying yield comes from Aave, one of the most battle-tested DeFi protocols with over $10B in TVL.",
  },
  {
    q: 'What fees does Sage charge?',
    a: "Sage itself charges no fees. A standard 3% protocol fee applies when converting G$ through GoodDollar's exchange — the same fee used throughout the GoodDollar ecosystem. Aave's interest rates are already reflected in your yield.",
  },
  {
    q: 'Can I withdraw anytime?',
    a: "Yes. There are no lock-up periods. Hit Withdraw, enter an amount, and your savings convert back to G$ in the same transaction. No waiting, no approvals needed.",
  },
];

export function FAQ() {
  const [open, setOpen] = useState<number | null>(null);

  return (
    <div className="faq-section">
      <h2 className="faq-title">Common questions</h2>
      <div className="faq-list">
        {ITEMS.map((item, i) => {
          const isOpen = open === i;
          return (
            <div key={i} className={`faq-item ${isOpen ? 'faq-item-open' : ''}`}>
              <button
                className="faq-trigger"
                onClick={() => setOpen(isOpen ? null : i)}
                aria-expanded={isOpen}
              >
                <span className="faq-q">{item.q}</span>
                <motion.span
                  className="faq-chevron"
                  animate={{ rotate: isOpen ? 180 : 0 }}
                  transition={{ duration: 0.22, ease: 'easeInOut' }}
                >
                  <ChevronDown size={16} strokeWidth={2.5} />
                </motion.span>
              </button>
              <AnimatePresence initial={false}>
                {isOpen && (
                  <motion.div
                    className="faq-answer"
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    exit={{   height: 0, opacity: 0 }}
                    transition={{ duration: 0.28, ease: [0.22, 1, 0.36, 1] }}
                  >
                    <p>{item.a}</p>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          );
        })}
      </div>
    </div>
  );
}
