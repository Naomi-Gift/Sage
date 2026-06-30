import { motion, useReducedMotion } from 'framer-motion';
import { Mascot } from '../mascot/Mascot';

const heroLoop = {
  coin: {
    initial: { y: -36, opacity: 0 },
    animate: { y: [-36, 0, 0, 18], opacity: [0, 1, 1, 0] },
    transition: { duration: 1.2, times: [0, 0.28, 0.72, 1], repeat: Infinity, repeatDelay: 4.8 },
  },
  mascotBounce: {
    animate: { scale: [1, 1, 1.08, 1] },
    transition: { duration: 0.38, delay: 1.0, repeat: Infinity, repeatDelay: 5.6 },
  },
  particleToDonut: {
    initial: { x: 0, y: 0, opacity: 0 },
    animate: { x: 116, y: -56, opacity: [0, 1, 0] },
    transition: { duration: 0.75, delay: 1.3, repeat: Infinity, repeatDelay: 5.2 },
  },
};

export function HeroDemo() {
  const reduceMotion = useReducedMotion();

  return (
    <div className="hero-demo" aria-label="Sage automatically saves from a daily G$ claim">
      <span className="blob blob-purple landing-blob-purple" />
      <span className="blob blob-pink landing-blob-pink" />
      <span className="blob blob-yellow landing-blob-yellow" />

      {/* Falling coin */}
      <motion.div
        className="demo-coin"
        initial={heroLoop.coin.initial}
        animate={reduceMotion ? {} : heroLoop.coin.animate}
        transition={reduceMotion ? {} : heroLoop.coin.transition}
        aria-hidden="true"
      >
        G$
      </motion.div>

      {/* Mascot */}
      <motion.div
        className="hero-mascot-wrap"
        animate={reduceMotion ? {} : heroLoop.mascotBounce.animate}
        transition={reduceMotion ? {} : heroLoop.mascotBounce.transition}
      >
        <Mascot stage="sprout" compact />
      </motion.div>

      {/* Yield particle */}
      <motion.div
        className="demo-particle"
        initial={heroLoop.particleToDonut.initial}
        animate={reduceMotion ? {} : heroLoop.particleToDonut.animate}
        transition={reduceMotion ? {} : heroLoop.particleToDonut.transition}
        aria-hidden="true"
      >
        +G$
      </motion.div>

      {/* Mini donut */}
      <div className="demo-mini-donut" aria-hidden="true">
        <svg viewBox="0 0 76 76">
          <defs>
            <linearGradient id="landingDonutGradient" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%"   stopColor="#7C6AF0" />
              <stop offset="100%" stopColor="#F25EAE" />
            </linearGradient>
          </defs>
          <circle cx="38" cy="38" r="27" className="mini-donut-track" />
          <motion.circle
            cx="38" cy="38" r="27"
            className="mini-donut-fill"
            initial={{ pathLength: 0.3 }}
            animate={reduceMotion
              ? { pathLength: 0.5 }
              : { pathLength: [0.3, 0.3, 0.52, 0.52, 0.3] }
            }
            transition={reduceMotion ? {} : { duration: 6, repeat: Infinity, ease: 'easeInOut' }}
          />
        </svg>
      </div>
    </div>
  );
}
