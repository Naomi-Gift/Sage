import { useEffect, useRef, useState } from 'react';
import confetti from 'canvas-confetti';
import { toPng } from 'html-to-image';
import { motion, useReducedMotion } from 'framer-motion';
import { CalendarClock, CheckCircle2, Repeat2, ShieldCheck, Sprout } from 'lucide-react';
import type { ActivityEvent, Instruction, Milestone, Position } from '../types';
import { ActivityFeed } from '../components/dashboard/ActivityFeed';
import { CheckInBubble } from '../components/mascot/CheckInBubble';
import { EmptyState } from '../components/dashboard/EmptyState';
import { EvolutionUnlock } from '../components/mascot/EvolutionUnlock';
import { FlexCard } from '../components/dashboard/FlexCard';
import { GoalProgressLabel } from '../components/dashboard/GoalProgressLabel';
import { Mascot, type MascotStage } from '../components/mascot/Mascot';
import { getMascotStage } from '../components/mascot/stage';
import { MilestoneBadges } from '../components/dashboard/MilestoneBadges';
import { PauseButton } from '../components/dashboard/PauseButton';
import { PrimaryButton } from '../components/ui/PrimaryButton';
import { SavingsDonut } from '../components/dashboard/SavingsDonut';
import { StatChip } from '../components/dashboard/StatChip';
import { WithdrawModal } from '../components/dashboard/WithdrawModal';
import { YieldBadge } from '../components/dashboard/YieldBadge';
import { CoachMarks } from '../components/onboarding/CoachMark';

type DashboardViewProps = {
  instruction: Instruction;
  position: Position;
  streak: number;
  apy: number;
  activity: ActivityEvent[];
  milestones: Milestone[];
  pausing: boolean;
  onStreakChange: (streak: number) => void;
  onAdjust: () => void;
  onTogglePause: () => void;
  onAddActivity: (event: ActivityEvent) => void;
};

const checkInMessages = [
  'Still growing 🌱',
  'We saved without you again 😎',
  'Look at you — consistent and thriving',
  "You didn't even have to try 🔥",
  'Another day, another save 💪',
];

const stageRank: Record<MascotStage, number> = {
  seedling: 0, sprout: 1, bloom: 2, 'glow-up': 3,
};

function todayKey() {
  return new Date().toISOString().slice(0, 10);
}

function uid() {
  return Math.random().toString(36).slice(2, 9);
}

function burstConfetti(particleCount: number, spread: number) {
  confetti({
    particleCount, spread,
    startVelocity: 22, scalar: 0.85,
    colors: ['#F25EAE', '#FFC844', '#7C6AF0'],
    origin: { y: 0.42 },
  });
}

export function DashboardView({
  instruction, position, streak, apy,
  activity, milestones, pausing,
  onStreakChange, onAdjust, onTogglePause, onAddActivity,
}: DashboardViewProps) {
  const [withdrawOpen,  setWithdrawOpen]  = useState(false);
  const [bubbleMessage, setBubbleMessage] = useState('');
  const [bubbleVisible, setBubbleVisible] = useState(false);
  const [reactionKey,   setReactionKey]   = useState(0);
  const [evolutionOpen, setEvolutionOpen] = useState(false);
  const [shareOpen,     setShareOpen]     = useState(false);
  const [shareImage,    setShareImage]    = useState('');
  const flexCardRef  = useRef<HTMLDivElement>(null);
  const reduceMotion = useReducedMotion();

  const total       = position.principalGD + position.yieldGD;
  const goalTarget  = instruction.goalTargetGD || 2000;
  const progress    = Math.min((total / goalTarget) * 100, 100);
  const savePercent = instruction.percentBps / 100;
  const stage       = getMascotStage(total, streak);
  const isEmpty     = total < 1;

  useEffect(() => {
    const storedStage = (localStorage.getItem('sage.bestStage') || 'seedling') as MascotStage;
    if (stageRank[stage] > stageRank[storedStage]) {
      localStorage.setItem('sage.bestStage', stage);
      setEvolutionOpen(true);
      if (!reduceMotion) burstConfetti(55, 78);
    }
  }, [reduceMotion, stage]);

  function showBubble(message: string) {
    setBubbleMessage(message);
    setBubbleVisible(true);
    window.setTimeout(() => setBubbleVisible(false), 2400);
  }

  function handleCheckIn() {
    const lastCheckIn = localStorage.getItem('sage.lastCheckIn');
    setReactionKey((c) => c + 1);
    if (lastCheckIn === todayKey()) {
      showBubble('Already checked in. Still cute though 😌');
      return;
    }
    const nextStreak = streak + 1;
    localStorage.setItem('sage.lastCheckIn', todayKey());
    localStorage.setItem('sage.streak', String(nextStreak));
    onStreakChange(nextStreak);
    showBubble(checkInMessages[nextStreak % checkInMessages.length]);
    if (!reduceMotion) burstConfetti(18, 42);
  }

  async function createShareCard(openPreview = true) {
    if (!flexCardRef.current) return;
    const dataUrl = await toPng(flexCardRef.current, {
      cacheBust: true, pixelRatio: 1, backgroundColor: '#F25EAE',
    });
    setShareImage(dataUrl);
    if (openPreview) setShareOpen(true);
    const blob = await (await fetch(dataUrl)).blob();
    const file = new File([blob], 'sage-glow-up.png', { type: 'image/png' });
    if (navigator.canShare?.({ files: [file] })) {
      await navigator.share({ title: 'My Sage glow-up', text: `${streak} day streak 🔥 — my G$ grows itself`, files: [file] });
    }
  }

  function handleWithdraw(amount: number) {
    onAddActivity({
      id: uid(), kind: 'withdraw',
      date: todayKey(), amountGD: amount,
      label: 'Withdrawal',
    });
  }

  return (
    <section className="dashboard-screen">
      {/* First-time coach marks */}
      <CoachMarks />

      <h1>Hi there 👋</h1>

      {/* ── Mascot card ── */}
      <div className="mascot-card">
        <span className="blob blob-purple" />
        <span className="blob blob-pink" />
        <span className="blob blob-yellow" />
        <div className="mascot-ambient" aria-hidden="true">
          <span /><span /><span />
        </div>
        <div className="mascot-stage">
          <CheckInBubble message={bubbleMessage} visible={bubbleVisible} />
          <Mascot stage={stage} reactionKey={reactionKey} onClick={handleCheckIn} />
          <p>{streak} day streak 🔥 — tap to check in</p>
        </div>
      </div>

      {/* ── Empty state for new users ── */}
      {isEmpty ? (
        <EmptyState savePercent={savePercent} />
      ) : (
        <>
          {/* ── Donut + yield badge ── */}
          <div className="donut-section">
            <SavingsDonut amount={total} progress={progress / 100} />
            <YieldBadge apy={apy} />
          </div>

          {/* ── Stats ── */}
          <div className="stat-row">
            <StatChip>🌱 <span className="stat-chip-value">+{Math.round(position.yieldGD)} G$</span> earned</StatChip>
            <StatChip delay={0.5}>🔥 <span className="stat-chip-value">{streak}</span> days saving</StatChip>
          </div>

          <GoalProgressLabel
            goalName={instruction.goalLabel}
            progress={progress}
            target={instruction.goalTargetGD}
            current={total}
          />
        </>
      )}

      {/* ── Primary actions ── */}
      {!isEmpty && (
        <PrimaryButton variant="pink" fullWidth onClick={() => createShareCard()}>
          Share your glow-up ✨
        </PrimaryButton>
      )}
      <PrimaryButton variant="outline" fullWidth onClick={() => setWithdrawOpen(true)}>
        Withdraw
      </PrimaryButton>

      {/* ── Pause / resume ── */}
      <PauseButton
        active={instruction.active}
        loading={pausing}
        onToggle={onTogglePause}
      />

      <button className="adjust-link" onClick={onAdjust}>Adjust savings %</button>

      {/* ── Milestones ── */}
      <MilestoneBadges milestones={milestones} />

      {/* ── Detail cards ── */}
      {!isEmpty && (
        <div className="dashboard-details" aria-label="Savings details">
          <article className="detail-card">
            <span className="detail-icon"><Sprout size={17} /></span>
            <div>
              <p>Saving rule</p>
              <strong>{savePercent}% of each daily claim</strong>
            </div>
            <button onClick={onAdjust} aria-label="Edit saving rule">Edit</button>
          </article>

          <div className="mini-detail-grid">
            <article className="mini-detail">
              <CalendarClock size={16} />
              <span>Next check</span>
              <strong>Tomorrow</strong>
            </article>
            <article className="mini-detail">
              <ShieldCheck size={16} />
              <span>Withdraws as</span>
              <strong>G$</strong>
            </article>
          </div>

          <article className="activity-card">
            <span className="detail-icon success"><CheckCircle2 size={17} /></span>
            <div>
              <p>Latest update</p>
              <strong>We saved without you again. The agent keeps going either way.</strong>
            </div>
          </article>

          <article className="detail-card">
            <span className="detail-icon"><Repeat2 size={17} /></span>
            <div>
              <p>Powered by</p>
              <strong>GoodDollar · Aave · Celo</strong>
            </div>
          </article>
        </div>
      )}

      {/* ── Activity feed ── */}
      <div className="feed-section">
        <div className="feed-section-header">
          <h2 className="feed-section-title">Activity</h2>
        </div>
        <ActivityFeed events={activity} />
      </div>

      {/* ── Off-screen share card ── */}
      <div className="share-card-source" aria-hidden="true">
        <FlexCard ref={flexCardRef} stage={stage} streak={streak} savedAmount={total} />
      </div>

      {/* ── Share preview modal ── */}
      {shareOpen && (
        <div className="modal-backdrop" role="presentation" onClick={() => setShareOpen(false)}>
          <motion.div
            className="share-preview"
            role="dialog"
            aria-modal="true"
            aria-label="Share your glow-up"
            onClick={(e) => e.stopPropagation()}
            initial={reduceMotion ? false : { y: 60, scale: 0.97, opacity: 0 }}
            animate={reduceMotion ? {} : { y: 0, scale: 1, opacity: 1 }}
            transition={{ type: 'spring', stiffness: 220, damping: 20 }}
          >
            {shareImage && <img src={shareImage} alt="Sage share card preview" />}
            <button onClick={() => setShareOpen(false)}>Done</button>
          </motion.div>
        </div>
      )}

      <EvolutionUnlock
        open={evolutionOpen}
        stage={stage}
        onShare={() => { setEvolutionOpen(false); void createShareCard(); }}
        onClose={() => setEvolutionOpen(false)}
      />

      <WithdrawModal
        open={withdrawOpen}
        maxAmount={total}
        onClose={() => setWithdrawOpen(false)}
        onWithdraw={handleWithdraw}
      />
    </section>
  );
}
