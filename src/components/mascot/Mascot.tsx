import { motion, useReducedMotion } from 'framer-motion';
import { useEffect, useState } from 'react';
import type { MascotStage } from './stage';

export type { MascotStage };

type MascotProps = {
  stage: MascotStage;
  reactionKey?: number;
  compact?: boolean;
  onClick?: () => void;
};

const stageLabel: Record<MascotStage, string> = {
  seedling: 'Seedling',
  sprout: 'Sprout',
  bloom: 'Bloom',
  'glow-up': 'Glow-up'
};

export function Mascot({ stage, reactionKey = 0, compact = false, onClick }: MascotProps) {
  const reduceMotion = useReducedMotion();
  const [blinking, setBlinking] = useState(false);
  const isSprout = stage === 'sprout' || stage === 'bloom' || stage === 'glow-up';
  const isBloom = stage === 'bloom' || stage === 'glow-up';
  const isGlow = stage === 'glow-up';

  useEffect(() => {
    if (reduceMotion) return;
    let blinkTimeout: number;
    let resetTimeout: number;

    function scheduleBlink() {
      const delay = 4000 + Math.random() * 2000;
      blinkTimeout = window.setTimeout(() => {
        setBlinking(true);
        resetTimeout = window.setTimeout(() => setBlinking(false), 150);
        scheduleBlink();
      }, delay);
    }

    scheduleBlink();

    return () => {
      window.clearTimeout(blinkTimeout);
      window.clearTimeout(resetTimeout);
    };
  }, [reduceMotion]);

  return (
    <motion.button
      type="button"
      className={`mascot mascot-${stage} ${compact ? 'mascot-compact' : ''}`}
      aria-label={`${stageLabel[stage]} mascot. Tap for daily check-in.`}
      onClick={onClick}
      initial={false}
      animate={reduceMotion ? {} : {
        rotate: reactionKey ? [0, -5, 5, 0] : 0,
        scale: reactionKey ? [1, 1.08, 1] : [1, 1.02, 1]
      }}
      transition={reduceMotion ? {} : {
        rotate: { duration: 0.5, type: 'spring', stiffness: 260, damping: 12 },
        scale: reactionKey
          ? { duration: 0.5, type: 'spring', stiffness: 260, damping: 12 }
          : { duration: 3, repeat: Infinity, ease: 'easeInOut' }
      }}
    >
      <svg viewBox="0 0 240 220" aria-hidden="true">
        <defs>
          <linearGradient id="mascot-body-green" x1="74" y1="96" x2="166" y2="184" gradientUnits="userSpaceOnUse">
            <stop offset="0%" stopColor="#38D98B" />
            <stop offset="62%" stopColor="#00B86B" />
            <stop offset="100%" stopColor="#008E54" />
          </linearGradient>
          <radialGradient id="mascot-face-glow" cx="38%" cy="28%" r="76%">
            <stop offset="0%" stopColor="#FFE57B" />
            <stop offset="58%" stopColor="#FFD23F" />
            <stop offset="100%" stopColor="#F4B92E" />
          </radialGradient>
        </defs>
        <ellipse cx="120" cy="194" rx="58" ry="12" fill="#ECEAF5" />
        {isGlow && <circle className="mascot-glow-ring" cx="120" cy="104" r="78" fill="none" stroke="#FF5DA2" strokeWidth="4" />}
        <motion.g
          animate={reduceMotion ? {} : { scale: [1, 1.02, 1], y: [0, -2, 0] }}
          transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}
          style={{ originX: '120px', originY: '162px' }}
        >
          <path className="mascot-body" d="M74 175c5-46 23-81 46-81s41 35 46 81c-17 13-75 13-92 0Z" fill={isBloom ? '#6C5CE7' : 'url(#mascot-body-green)'} />
          <path className="mascot-shadow-overlay" d="M83 176c7-36 22-64 43-77 10 25 9 61-6 86-16 0-30-3-37-9Z" />
          <path className="mascot-highlight" d="M93 142c8-14 17-22 27-22 7 0 13 4 18 11-18-5-32-1-45 11Z" />
          <circle cx="120" cy="93" r={isBloom ? 45 : isSprout ? 40 : 34} fill="url(#mascot-face-glow)" />
          <path d="M93 79c13-17 36-25 58-6-18-3-34 0-48 9-5 3-11 2-10-3Z" fill="#FFFFFF" opacity="0.28" />
          <path d="M84 96c18-35 55-45 83-12-24 2-45-3-63-18-8 9-14 19-20 30Z" fill="#6C5CE7" />
          <motion.circle className="mascot-eye" cx="105" cy="101" r="4" fill="#1A1A2E" animate={{ scaleY: blinking ? 0.1 : 1 }} transition={{ duration: 0.15 }} style={{ originX: '105px', originY: '101px' }} />
          <motion.circle className="mascot-eye" cx="135" cy="101" r="4" fill="#1A1A2E" animate={{ scaleY: blinking ? 0.1 : 1 }} transition={{ duration: 0.15 }} style={{ originX: '135px', originY: '101px' }} />
          <path d="M108 119c8 7 17 7 25 0" stroke="#1A1A2E" strokeWidth="4" strokeLinecap="round" fill="none" />
          <path d="M77 146c-18 0-30-10-36-27" stroke="#FFD23F" strokeWidth="13" strokeLinecap="round" fill="none" />
          <path d="M163 146c18 0 30-10 36-27" stroke="#FFD23F" strokeWidth="13" strokeLinecap="round" fill="none" />
          {isSprout && (
            <g>
              <path d="M104 76h32" stroke="#1A1A2E" strokeWidth="7" strokeLinecap="round" />
              <rect x="96" y="68" width="21" height="16" rx="8" fill="#1A1A2E" />
              <rect x="123" y="68" width="21" height="16" rx="8" fill="#1A1A2E" />
            </g>
          )}
          {isBloom && (
            <g>
              <circle cx="158" cy="72" r="10" fill="#FF5DA2" />
              <circle cx="172" cy="78" r="9" fill="#FFD23F" />
              <circle cx="164" cy="86" r="9" fill="#00B86B" />
            </g>
          )}
          {isGlow && (
            <g className="mascot-sparkles">
              <path d="M57 71l5 10 10 5-10 5-5 10-5-10-10-5 10-5 5-10Z" fill="#FF5DA2" />
              <path d="M184 55l4 8 8 4-8 4-4 8-4-8-8-4 8-4 4-8Z" fill="#FFD23F" />
            </g>
          )}
        </motion.g>
      </svg>
    </motion.button>
  );
}
