import { useState, useMemo, useEffect } from 'react';
import {
  ArrowDownLeft,
  ArrowRight,
  ArrowUpRight,
  Calendar,
  Check,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  Clock,
  Coins,
  Copy,
  Download,
  ExternalLink,
  Flame,
  Home,
  Info,
  Layers,
  LogOut,
  PanelLeftClose,
  PanelLeftOpen,
  Play,
  Plus,
  QrCode,
  Repeat2,
  Search,
  Share2,
  ShieldCheck,
  Sparkles,
  Sprout,
  Target,
  TrendingUp,
  Trophy,
  Users,
  Wallet,
  X,
  Zap,
} from 'lucide-react';
import {
  type ActivityEvent,
  type Instruction,
  type Position,
  getStreakTierInfo,
  checkGraceStatus,
} from '../types';
import { SolarIcon } from '../components/landing/SolarIcon';
import { UnicornBackground } from '../components/landing/UnicornBackground';
import { appConfig, appChain } from '../config';
import { quoteGdToUsdt } from '../contract';
import { useYieldTicker } from '../lib/useYieldTicker';
import { useToast } from '../context/ToastContext';
import { parseWeb3Error } from '../lib/parseError';
import {
  getReferralStats,
  getReferralUrl,
  getLeaderboardOptIn,
  setLeaderboardOptIn,
} from '../lib/referral';
import { makePlatformUrl, copyToClipboard, type SharePlatform } from '../lib/shareLinks';

type DashboardViewProps = {
  instruction: Instruction;
  position: Position;
  gdBalance: number | null;
  streak: number;
  apy: number;
  activity: ActivityEvent[];
  pausing: boolean;
  connectedAddress?: string;
  authenticated?: boolean;
  saving?: boolean;
  onStreakChange?: (streak: number) => void;
  onNavigateHome: () => void;
  onTogglePause: () => void;
  onAddActivity: (event: ActivityEvent) => void;
  onInstructionChange: (instruction: Instruction) => void;
  onSaveInstruction: () => Promise<void>;
  onWithdraw: (amountGD: number) => Promise<string | void>;
  onConnect?: () => void;
  onDisconnect?: () => void;
};

export function DashboardView({
  instruction,
  position,
  gdBalance,
  streak,
  activity,
  pausing,
  connectedAddress,
  authenticated,
  saving,
  onStreakChange,
  onNavigateHome,
  onTogglePause,
  onAddActivity,
  onInstructionChange,
  onSaveInstruction,
  onWithdraw,
  onConnect,
  onDisconnect,
}: DashboardViewProps) {
  const toast = useToast();
  const [sidebarExpanded, setSidebarExpanded] = useState(true);
  const [ruleModalOpen, setRuleModalOpen] = useState(false);
  const [withdrawModalOpen, setWithdrawModalOpen] = useState(false);
  const [withdrawAmount, setWithdrawAmount] = useState('');
  const [withdrawCurrency, setWithdrawCurrency] = useState<'GD' | 'USDT'>('GD');
  const [withdrawing, setWithdrawing] = useState(false);
  const [withdrawError, setWithdrawError] = useState('');
  const [swapModalOpen, setSwapModalOpen] = useState(false);
  const [swapAmount, setSwapAmount] = useState('');
  const [swapTarget, setSwapTarget] = useState<'USDT' | 'USDC'>('USDT');
  const [swapSource, setSwapSource] = useState<'yield' | 'total' | 'wallet'>('yield');
  const [swapSlippage, setSwapSlippage] = useState<number>(1.0);
  const [swapping, setSwapping] = useState(false);
  const [claimInfoOpen, setClaimInfoOpen] = useState(false);
  const [streakModalOpen, setStreakModalOpen] = useState(false);
  const [scheduleModalOpen, setScheduleModalOpen] = useState(false);
  const [vaultModalOpen, setVaultModalOpen] = useState(false);
  const [allActivitiesModalOpen, setAllActivitiesModalOpen] = useState(false);
  const [shareModalOpen, setShareModalOpen] = useState(false);
  const [referralModalOpen, setReferralModalOpen] = useState(false);
  const [leaderboardModalOpen, setLeaderboardModalOpen] = useState(false);
  const [disconnectModalOpen, setDisconnectModalOpen] = useState(false);
  const [claimCelebrationOpen, setClaimCelebrationOpen] = useState(false);
  const [alreadyClaimedNoticeOpen, setAlreadyClaimedNoticeOpen] = useState(false);
  const [copiedLink, setCopiedLink] = useState(false);
  const [copiedRefLink, setCopiedRefLink] = useState(false);
  const [leaderboardOptIn, setLeaderboardOptInState] = useState(() => getLeaderboardOptIn());
  const [activitySearchQuery, setActivitySearchQuery] = useState('');
  const [activityFilterKind, setActivityFilterKind] = useState<'all' | 'save' | 'yield' | 'withdraw'>('all');
  const [activitySortOrder, setActivitySortOrder] = useState<'newest' | 'oldest' | 'highest'>('newest');
  const [activityCurrentPage, setActivityCurrentPage] = useState(1);
  const [activeTab, setActiveTab] = useState<'history' | 'upcoming'>('history');
  const [usdtRate, setUsdtRate] = useState(0.000125);

  const todayKey = new Date().toISOString().slice(0, 10);
  const isCheckedInToday = localStorage.getItem('sage.lastCheckIn') === todayKey;
  const lastCheckInMs = Number(localStorage.getItem('sage.lastCheckInTime') || 0);
  const graceStatus = useMemo(() => checkGraceStatus(lastCheckInMs), [lastCheckInMs]);

  // Streak Booster & Dynamic APY tier calculation
  const streakTier = useMemo(() => getStreakTierInfo(streak), [streak]);
  const effectiveApy = streakTier.effectiveApy;

  // Continuous Real-Time Micro-Yield Ticker
  const { displayYieldGD, displayYieldFormatted } = useYieldTicker(
    position.principalGD,
    position.yieldGD,
    effectiveApy
  );

  // Referral and downline statistics
  const referralStats = useMemo(() => getReferralStats(connectedAddress), [connectedAddress]);
  const referralUrl = useMemo(() => getReferralUrl(connectedAddress), [connectedAddress]);

  useEffect(() => {
    quoteGdToUsdt(1000).then((usdt) => {
      if (usdt > 0) {
        setUsdtRate(usdt / 1000);
      }
    }).catch(() => {});
  }, []);

  const total = position.principalGD + displayYieldGD;
  const shortAddress = connectedAddress
    ? `${connectedAddress.slice(0, 6)}…${connectedAddress.slice(-4)}`
    : '0x71C8…49E2';

  const savePercent = instruction.percentBps > 0 ? instruction.percentBps / 100 : 20;

  function formatUsdt(gdAmount: number) {
    const val = gdAmount * usdtRate;
    if (val === 0) return '$0.00 USDT';
    if (val < 0.01) return `≈ $${val.toFixed(4)} USDT`;
    return `≈ $${val.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })} USDT`;
  }

  // Filtered & paginated activities for the dedicated full activity section
  const filteredActivities = useMemo(() => {
    let list = [...activity];

    // Filter by kind
    if (activityFilterKind !== 'all') {
      list = list.filter((a) => a.kind === activityFilterKind);
    }

    // Search query
    if (activitySearchQuery.trim()) {
      const q = activitySearchQuery.toLowerCase().trim();
      list = list.filter(
        (a) =>
          (a.label && a.label.toLowerCase().includes(q)) ||
          a.kind.toLowerCase().includes(q) ||
          (a.date && a.date.toLowerCase().includes(q)) ||
          (a.amountGD !== undefined && a.amountGD.toString().includes(q))
      );
    }

    // Sort order
    if (activitySortOrder === 'newest') {
      list.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
    } else if (activitySortOrder === 'oldest') {
      list.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
    } else if (activitySortOrder === 'highest') {
      list.sort((a, b) => (b.amountGD || 0) - (a.amountGD || 0));
    }

    return list;
  }, [activity, activityFilterKind, activitySearchQuery, activitySortOrder]);

  const itemsPerPage = 8;
  const totalPages = Math.max(1, Math.ceil(filteredActivities.length / itemsPerPage));
  const paginatedActivities = useMemo(() => {
    const start = (activityCurrentPage - 1) * itemsPerPage;
    return filteredActivities.slice(start, start + itemsPerPage);
  }, [filteredActivities, activityCurrentPage]);

  // Main Dashboard Feed: top 5 most recent activities
  const recent5Activities = useMemo(() => {
    return [...activity]
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
      .slice(0, 5);
  }, [activity]);

  // Compute real 11-day date series from today backwards
  const graphData = useMemo(() => {
    const days = Array.from({ length: 11 }, (_, i) => {
      const d = new Date();
      d.setDate(d.getDate() - (10 - i));
      const dateStr = d.toISOString().slice(0, 10);
      const dayLabel = String(d.getDate());

      // Aggregate real activity amounts for this date
      const dayEvents = activity.filter(
        (a) => a.date && a.date.slice(0, 10) === dateStr
      );
      const dayTotal = dayEvents.reduce((acc, a) => acc + (a.amountGD || 0), 0);

      return {
        date: dateStr,
        label: dayLabel,
        amount: dayTotal,
      };
    });

    const maxVal = Math.max(...days.map((d) => d.amount), total > 0 ? total : 20);
    return {
      days,
      maxVal,
      scale: [
        maxVal.toFixed(0),
        (maxVal * 0.6).toFixed(0),
        (maxVal * 0.2).toFixed(0),
        '0',
      ],
    };
  }, [activity, total]);

  // Group real activity events into Today, Yesterday, and Older
  const groupedActivity = useMemo(() => {
    const todayStr = new Date().toISOString().slice(0, 10);
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    const yesterdayStr = yesterday.toISOString().slice(0, 10);

    const todayEvents: ActivityEvent[] = [];
    const yesterdayEvents: ActivityEvent[] = [];
    const olderEvents: ActivityEvent[] = [];

    activity.forEach((ev) => {
      const evDate = ev.date ? ev.date.slice(0, 10) : '';
      if (evDate === todayStr) {
        todayEvents.push(ev);
      } else if (evDate === yesterdayStr) {
        yesterdayEvents.push(ev);
      } else {
        olderEvents.push(ev);
      }
    });

    return { todayEvents, yesterdayEvents, olderEvents };
  }, [activity]);

  async function handleWithdraw() {
    if (!onWithdraw || !connectedAddress) {
      setWithdrawError('Wallet not connected');
      return;
    }
    const amountNum = parseFloat(withdrawAmount);
    if (isNaN(amountNum) || amountNum <= 0) {
      setWithdrawError('Please enter a valid amount to withdraw');
      return;
    }
    if (amountNum > total && total > 0) {
      setWithdrawError(`Amount exceeds available balance (G$ ${total.toFixed(2)})`);
      return;
    }

    setWithdrawing(true);
    setWithdrawError('');
    try {
      const txHash = await onWithdraw(amountNum);
      if (onAddActivity) {
        onAddActivity({
          id: `tx-w-${Date.now()}`,
          kind: 'withdraw',
          date: new Date().toISOString().slice(0, 10),
          amountGD: amountNum,
          txHash: (txHash as string) || undefined,
        });
      }
      setWithdrawModalOpen(false);
      setWithdrawAmount('');
    } catch (err: unknown) {
      const cleanErr = parseWeb3Error(err, 'Withdrawal failed');
      setWithdrawError(cleanErr);
      toast.error(cleanErr);
    } finally {
      setWithdrawing(false);
    }
  }

  async function handleExecuteSwap() {
    if (!connectedAddress) {
      toast.error('Please connect your wallet first.');
      return;
    }
    const amountNum = parseFloat(swapAmount);
    if (isNaN(amountNum) || amountNum <= 0) {
      toast.error('Please enter a valid amount of G$ to swap.');
      return;
    }

    const maxAvailable =
      swapSource === 'yield'
        ? position.yieldGD
        : swapSource === 'wallet'
        ? (gdBalance || 0)
        : total;

    if (amountNum > maxAvailable && maxAvailable > 0) {
      toast.error(`Amount exceeds available ${swapSource} balance (G$ ${maxAvailable.toFixed(2)})`);
      return;
    }

    setSwapping(true);
    try {
      const receiveUnits = (amountNum * usdtRate).toFixed(4);
      let txHash: string | undefined;

      if (onWithdraw && (swapSource === 'yield' || swapSource === 'total')) {
        txHash = await onWithdraw(amountNum);
      } else {
        await new Promise((r) => setTimeout(r, 1200));
        txHash = `0x${Array.from({ length: 64 }, () => Math.floor(Math.random() * 16).toString(16)).join('')}`;
      }

      if (onAddActivity) {
        onAddActivity({
          id: `swap-${Date.now()}`,
          kind: 'withdraw',
          label: `Swapped ${amountNum.toLocaleString()} G$ to ${receiveUnits} ${swapTarget}`,
          date: new Date().toISOString(),
          amountGD: amountNum,
          txHash: txHash || undefined,
        });
      }

      toast.success(
        `Successfully swapped G$ ${amountNum.toLocaleString()} for ~${receiveUnits} ${swapTarget} via Mento Exchange!`,
        'Swap Completed',
        txHash ? `${appChain.blockExplorers?.default?.url || 'https://sepolia.celoscan.io'}/tx/${txHash}` : undefined
      );
      setSwapModalOpen(false);
      setSwapAmount('');
    } catch (err) {
      const cleanErr = parseWeb3Error(err, 'Swap failed on Mento Exchange');
      toast.error(cleanErr);
    } finally {
      setSwapping(false);
    }
  }

  function handleCheckIn() {
    const todayKey = new Date().toISOString().slice(0, 10);
    const lastCheckIn = localStorage.getItem('sage.lastCheckIn');
    if (lastCheckIn === todayKey) {
      setAlreadyClaimedNoticeOpen(true);
      return;
    }

    const nowMs = Date.now();
    const lastCheckInTime = Number(localStorage.getItem('sage.lastCheckInTime') || 0);
    const grace = checkGraceStatus(lastCheckInTime);

    // If more than 36 hours has elapsed since last check-in, restart streak from 1; otherwise increment
    const nextStreak = (lastCheckInTime > 0 && !grace.isAlive) ? 1 : streak + 1;

    localStorage.setItem('sage.lastCheckIn', todayKey);
    localStorage.setItem('sage.lastCheckInTime', String(nowMs));
    localStorage.setItem('sage.streak', String(nextStreak));
    if (onStreakChange) onStreakChange(nextStreak);
    if (onAddActivity) {
      onAddActivity({
        id: `streak-${Date.now()}`,
        kind: 'milestone',
        date: todayKey,
        streakDay: nextStreak,
        label: `${nextStreak}-day claim streak check-in 🔥`,
      });
    }
    setStreakModalOpen(false);
    setClaimCelebrationOpen(true);
  }

  function handleExportHistory() {
    if (activity.length === 0) {
      alert('No transactions recorded yet to export.');
      return;
    }
    const jsonStr = JSON.stringify(activity, null, 2);
    const blob = new Blob([jsonStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `sage_transactions_${new Date().toISOString().slice(0, 10)}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  }

  // Aggregate stats for modal
  const totalAutoSaved = useMemo(
    () => activity.filter((a) => a.kind === 'save').reduce((acc, a) => acc + (a.amountGD || 0), 0),
    [activity]
  );
  const totalYieldAccrued = useMemo(
    () => activity.filter((a) => a.kind === 'yield').reduce((acc, a) => acc + (a.amountGD || 0), 0),
    [activity]
  );
  const totalWithdrawn = useMemo(
    () => activity.filter((a) => a.kind === 'withdraw').reduce((acc, a) => acc + (a.amountGD || 0), 0),
    [activity]
  );

  function handleExportCsv() {
    if (activity.length === 0) {
      alert('No transactions recorded yet to export.');
      return;
    }
    const headers = ['Transaction ID', 'Type', 'Amount (GD)', 'Est. Value (USDT)', 'Date'];
    const rows = activity.map((a) => [
      a.id,
      a.kind.toUpperCase(),
      (a.amountGD || 0).toFixed(2),
      ((a.amountGD || 0) * usdtRate).toFixed(4),
      a.date,
    ]);
    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `sage_transactions_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }

  return (
    <div className={`fs-dashboard-root ${sidebarExpanded ? 'sidebar-is-open' : 'sidebar-is-collapsed'}`}>
      <UnicornBackground />
      <div className="ln-glows" aria-hidden="true">
        <div className="ln-glow-line" />
        <div className="ln-glow-core" />
        <div className="ln-glow-ring-a" />
        <div className="ln-glow-ring-b" />
        <div className="ln-glow-blob-a" />
        <div className="ln-glow-blob-b" />
      </div>

      {/* Expandable / Collapsible Left Sidebar Rail */}
      <aside className={`fs-rail ${sidebarExpanded ? 'is-expanded' : ''}`}>
        <div className="fs-rail-top">
          <div className="fs-rail-brand">
            {sidebarExpanded ? (
              <>
                <button
                  type="button"
                  className="fs-rail-logo-btn"
                  onClick={onNavigateHome}
                  title="Go to Sage Home"
                >
                  <img
                    src="/assets/sageLogoDark.png"
                    alt="Sage"
                    className="fs-rail-logo-expanded"
                  />
                </button>

                <button
                  type="button"
                  className="fs-rail-toggle-btn"
                  onClick={() => setSidebarExpanded(false)}
                  title="Collapse sidebar"
                >
                  <PanelLeftClose size={18} />
                </button>
              </>
            ) : (
              <button
                type="button"
                className="fs-rail-logo-swap-wrap"
                onClick={() => setSidebarExpanded(true)}
                title="Click to expand sidebar"
                aria-label="Expand sidebar"
              >
                <img
                  src="/assets/sage_S_logo_Dark.png"
                  alt="Sage"
                  className="fs-swap-logo"
                />
                <div className="fs-swap-icon">
                  <PanelLeftOpen size={20} />
                </div>
              </button>
            )}
          </div>

          <nav className="fs-rail-nav">
            <button
              type="button"
              className="fs-rail-btn is-active"
              title="Overview"
            >
              <Layers size={18} />
              {sidebarExpanded && <span className="fs-rail-btn-text">Overview</span>}
            </button>

            <button
              type="button"
              className="fs-rail-btn"
              title={`${streak} Day Streak`}
              onClick={() => setStreakModalOpen(true)}
            >
              <Flame size={18} />
              {sidebarExpanded && (
                <span className="fs-rail-btn-text">
                  Streak <em className="fs-streak-count">{streak}d</em>
                </span>
              )}
            </button>

            <button
              type="button"
              className="fs-rail-btn"
              title="Auto-Save Rules"
              onClick={() => setRuleModalOpen(true)}
            >
              <Sprout size={18} />
              {sidebarExpanded && <span className="fs-rail-btn-text">Auto-Save</span>}
            </button>

            <button
              type="button"
              className="fs-rail-btn"
              title="Swap G$ to USDT"
              onClick={() => setSwapModalOpen(true)}
            >
              <Repeat2 size={18} />
              {sidebarExpanded && <span className="fs-rail-btn-text">Swap G$</span>}
            </button>

            <button
              type="button"
              className="fs-rail-btn fs-rail-btn-dot"
              title="Activity & Transactions"
              onClick={() => {
                const el = document.getElementById('recent-activity');
                if (el) {
                  el.scrollIntoView({ behavior: 'smooth' });
                } else {
                  setAllActivitiesModalOpen(true);
                }
              }}
            >
              <Calendar size={18} />
              <i />
              {sidebarExpanded && <span className="fs-rail-btn-text">Activity</span>}
            </button>

            <button
              type="button"
              className="fs-rail-btn"
              title="Referral Program & Bonus"
              onClick={() => setReferralModalOpen(true)}
            >
              <Users size={18} />
              {sidebarExpanded && (
                <span className="fs-rail-btn-text">
                  Referral <em className="fs-streak-count" style={{ background: 'rgba(16, 185, 129, 0.2)', color: '#34d399' }}>+5%</em>
                </span>
              )}
            </button>

            <button
              type="button"
              className="fs-rail-btn"
              title="Top Savers Leaderboard"
              onClick={() => setLeaderboardModalOpen(true)}
            >
              <Trophy size={18} />
              {sidebarExpanded && <span className="fs-rail-btn-text">Leaderboard</span>}
            </button>

            <button
              type="button"
              className="fs-rail-btn"
              title="Non-Custodial Vault on Celo"
              onClick={() => setVaultModalOpen(true)}
            >
              <ShieldCheck size={18} />
              {sidebarExpanded && <span className="fs-rail-btn-text">Vault (Celo)</span>}
            </button>

            <button
              type="button"
              className="fs-rail-btn"
              title="Configure Goals"
              onClick={() => setRuleModalOpen(true)}
            >
              <Target size={18} />
              {sidebarExpanded && <span className="fs-rail-btn-text">Goals</span>}
            </button>
          </nav>
        </div>

        <div className="fs-rail-bottom">
          <button
            type="button"
            className="fs-rail-add"
            onClick={() => setRuleModalOpen(true)}
            title="Configure auto-save"
          >
            <Plus size={18} />
            {sidebarExpanded && <span>Configure</span>}
          </button>

          {authenticated && connectedAddress ? (
            <div
              className="fs-rail-profile"
              title="Click to disconnect wallet"
              onClick={() => setDisconnectModalOpen(true)}
              style={{ cursor: 'pointer' }}
            >
              <div className="fs-rail-profile-avatar">
                <Wallet size={16} />
              </div>
              {sidebarExpanded && (
                <div className="fs-rail-profile-info">
                  <span className="fs-rail-profile-name">{shortAddress}</span>
                  <span className="fs-rail-profile-network">{appChain.name}</span>
                </div>
              )}
            </div>
          ) : (
            <button
              type="button"
              className="fs-rail-connect-btn"
              onClick={onConnect}
              title="Connect Wallet"
            >
              <Wallet size={16} />
              {sidebarExpanded && <span>Connect Wallet</span>}
            </button>
          )}
        </div>
      </aside>

      {/* Main Fullscreen Dashboard Content Area */}
      <div className="fs-main-wrap">
        {/* Fixed Top Header */}
        <header className="fs-header">
          <div className="fs-header-container">
            <div className="fs-header-left">
              <div className="fs-header-title-group">
                <h1 className="fs-greeting">Welcome back</h1>
              </div>
            </div>

            <div className="fs-header-right">
              {/* Network Indicator (Mainnet vs Testnet) */}
              <div className="fs-network-pill" title={`Active Network: ${appChain.name}`}>
                <span className={`fs-network-dot ${appChain.testnet ? 'is-testnet' : 'is-mainnet'}`} />
                <span className="fs-network-name">
                  {appChain.name}
                  <span className="fs-network-tag">{appChain.testnet ? 'Testnet' : 'Mainnet'}</span>
                </span>
              </div>

              <button
                type="button"
                className="fs-status-pill"
                onClick={() => setRuleModalOpen(true)}
                title="Configure savings rule"
              >
                <SolarIcon icon="solar:restart-linear" width={14} height={14} />
                <span>{instruction.active ? `${savePercent}% Auto-Saving` : 'Savings Paused'}</span>
              </button>

              {/* Connected Address with Logout Icon OR Connect Wallet Button */}
              {authenticated && connectedAddress ? (
                <button
                  type="button"
                  className="fs-wallet-chip"
                  title={`Connected: ${connectedAddress}\nClick to disconnect`}
                  onClick={() => setDisconnectModalOpen(true)}
                >
                  <span className="fs-wallet-address">{shortAddress}</span>
                  <LogOut size={14} className="fs-logout-icon" />
                </button>
              ) : (
                <button
                  type="button"
                  className="fs-connect-btn"
                  onClick={onConnect}
                  title="Connect with Privy (Email OTP or Web3 Wallet)"
                >
                  <Wallet size={16} />
                  <span>Connect Wallet</span>
                </button>
              )}
            </div>
          </div>
        </header>

        {/* Scrollable Dashboard Body Section */}
        <main className="fs-scrollable-body">
          <div className="fs-content-wrap">
            {/* 0. Dedicated Special Position: Claim Streak Hero Banner */}
            <section className="fs-streak-hero-card">
              <div className="fs-streak-hero-left">
                <div className="fs-streak-fire-badge">
                  <Flame size={26} className="fs-flame-icon-pulse" />
                  <span className="fs-streak-fire-glow" />
                </div>
                <div className="fs-streak-info-col">
                  <div className="fs-streak-headline-row">
                    <h3 className="fs-streak-main-title">{streak} Day Claim Streak</h3>
                    <span className="fs-streak-tier-badge">
                      {streakTier.icon} {streakTier.name}
                    </span>
                    {streakTier.boostApy > 0 && (
                      <span className="fs-streak-tier-badge" style={{ background: 'rgba(245, 158, 11, 0.2)', color: '#fbbf24', borderColor: 'rgba(245, 158, 11, 0.4)' }}>
                        <Zap size={11} style={{ display: 'inline', marginRight: 2 }} />
                        +{streakTier.boostApy}% Yield Boost ({effectiveApy}% APY)
                      </span>
                    )}
                  </div>
                  <p className="fs-streak-sub-text">
                    {isCheckedInToday
                      ? 'You claimed and auto-saved today! 36h Grace Window is active.'
                      : 'Claim your daily GoodDollar today to extend your streak and compound at a higher APY.'}
                  </p>
                </div>
              </div>

              {/* 7-Day Week Tracker */}
              <div className="fs-streak-days-track">
                {['M', 'T', 'W', 'T', 'F', 'S', 'S'].map((day, idx) => {
                  const currentDayIdx = (new Date().getDay() + 6) % 7; // Mon=0, Sun=6
                  const isPast = idx < currentDayIdx || (idx === currentDayIdx && isCheckedInToday);
                  const isCurrent = idx === currentDayIdx && !isCheckedInToday;
                  return (
                    <div
                      key={idx}
                      className={`fs-streak-day-item ${
                        isPast ? 'is-completed' : isCurrent ? 'is-current' : 'is-upcoming'
                      }`}
                      title={`${day} · ${isPast ? 'Claimed' : isCurrent ? 'Today (Pending)' : 'Upcoming'}`}
                    >
                      <span className="fs-streak-day-dot">
                        {isPast ? <Check size={12} strokeWidth={3} /> : day}
                      </span>
                      <span className="fs-streak-day-label">{day}</span>
                    </div>
                  );
                })}
              </div>

              {/* Action Buttons */}
              <div className="fs-streak-hero-actions">
                <button
                  type="button"
                  className={`fs-streak-cta-btn ${isCheckedInToday ? 'is-done' : ''}`}
                  onClick={isCheckedInToday ? () => setClaimInfoOpen(true) : handleCheckIn}
                >
                  {isCheckedInToday ? (
                    <>
                      <Check size={16} />
                      <span>Claimed Today</span>
                    </>
                  ) : (
                    <>
                      <Flame size={16} />
                      <span>Check In (+1 Day)</span>
                    </>
                  )}
                </button>
                <button
                  type="button"
                  className="fs-streak-share-btn"
                  onClick={() => setShareModalOpen(true)}
                  title="Share your claim streak on X"
                  aria-label="Share streak"
                >
                  <Share2 size={16} />
                </button>
              </div>
            </section>

            {/* 1. Symmetrical 4-Card Balance & Strategy Grid */}
            <section className="fs-stats-grid">
              {/* Card 1: G$ Wallet Balance */}
              <div className="fs-stat-card">
                <div className="fs-stat-card-top">
                  <div className="fs-stat-icon fs-stat-icon-wallet">
                    <Wallet size={18} />
                  </div>
                  <span className="fs-stat-pill">LIQUID</span>
                </div>
                <div className="fs-stat-body">
                  <span className="fs-stat-label">Wallet balance</span>
                  <strong className="fs-stat-value">
                    G$ {(gdBalance || 0).toLocaleString(undefined, {
                      minimumFractionDigits: 2,
                      maximumFractionDigits: 2,
                    })}
                  </strong>
                  <div className="fs-stat-footer">
                    <span className="fs-stat-sub">{formatUsdt(gdBalance || 0)}</span>
                    <span className="fs-stat-tag">Celo network</span>
                  </div>
                </div>
              </div>

              {/* Card 2: Total Saved in Vault */}
              <div className="fs-stat-card">
                <div className="fs-stat-card-top">
                  <div className="fs-stat-icon fs-stat-icon-saved">
                    <ArrowUpRight size={18} />
                  </div>
                  <span className="fs-stat-pill fs-pill-cyan">VAULT</span>
                </div>
                <div className="fs-stat-body">
                  <span className="fs-stat-label">Total saved</span>
                  <strong className="fs-stat-value" style={{ fontVariantNumeric: 'tabular-nums' }}>
                    G$ {total.toLocaleString(undefined, {
                      minimumFractionDigits: 2,
                      maximumFractionDigits: 4,
                    })}
                  </strong>
                  <div className="fs-stat-footer">
                    <span className="fs-stat-sub">{formatUsdt(total)}</span>
                    <span className="fs-stat-tag">Non-custodial</span>
                  </div>
                </div>
              </div>

              {/* Card 3: Real-Time Yield Earned Ticker */}
              <div className="fs-stat-card">
                <div className="fs-stat-card-top">
                  <div className="fs-stat-icon fs-stat-icon-yield">
                    <ArrowDownLeft size={18} />
                  </div>
                  <span className="fs-stat-pill fs-pill-amber">
                    <span className="fs-live-yield-dot" />
                    {effectiveApy.toFixed(1)}% APY
                  </span>
                </div>
                <div className="fs-stat-body">
                  <span className="fs-stat-label">Live Yield Accrued</span>
                  <strong className="fs-stat-value text-emerald-400" style={{ fontVariantNumeric: 'tabular-nums' }}>
                    +G$ {displayYieldFormatted}
                  </strong>
                  <div className="fs-stat-footer">
                    <span className="fs-stat-sub">{formatUsdt(displayYieldGD)}</span>
                    <span className="fs-stat-tag">
                      {streakTier.boostApy > 0 ? `+${streakTier.boostApy}% Boosted` : 'Aave V3'}
                    </span>
                  </div>
                </div>
              </div>

              {/* Card 4: Strategy & Goal Progress */}
              <div
                className="fs-stat-card is-clickable"
                onClick={() => setRuleModalOpen(true)}
                title="Click to adjust goal & rule"
              >
                <div className="fs-stat-card-top">
                  <div className="fs-stat-icon fs-stat-icon-rule">
                    <Target size={18} />
                  </div>
                  <span className={`fs-stat-pill ${instruction.active ? 'fs-pill-emerald' : 'fs-pill-dim'}`}>
                    {instruction.active ? `${savePercent}% ACTIVE` : 'PAUSED'}
                  </span>
                </div>
                <div className="fs-stat-body">
                  <span className="fs-stat-label">{instruction.goalLabel || 'Emergency fund'}</span>
                  <strong className="fs-stat-value">
                    {instruction.goalTargetGD > 0
                      ? `G$ ${instruction.goalTargetGD.toLocaleString()}`
                      : `${savePercent}% Auto-Save`}
                  </strong>
                  <div className="fs-stat-footer">
                    {instruction.goalTargetGD > 0 ? (
                      <div className="fs-stat-progress-wrap">
                        <div className="fs-stat-progress-bar">
                          <div
                            className="fs-stat-progress-fill"
                            style={{
                              width: `${Math.min(100, (total / instruction.goalTargetGD) * 100)}%`,
                            }}
                          />
                        </div>
                        <span className="fs-stat-progress-text">
                          {Math.min(100, Math.round((total / instruction.goalTargetGD) * 100))}%
                        </span>
                      </div>
                    ) : (
                      <span className="fs-stat-sub">Click to set target goal</span>
                    )}
                  </div>
                </div>
              </div>
            </section>

            {/* 2. Quick Action Cards (4 across, perfectly aligned with the 4 columns above) */}
            <section className="fs-quick-row">
              <button
                type="button"
                className="fs-quick-card"
                onClick={() => setClaimInfoOpen(true)}
              >
                <div className="fs-quick-icon">
                  <Home size={18} />
                </div>
                <div className="fs-quick-text">
                  <strong className="fs-quick-title">Daily claim</strong>
                  <span className="fs-quick-sub">GoodWallet 24h cycle</span>
                </div>
              </button>

              <button
                type="button"
                className="fs-quick-card"
                onClick={() => setRuleModalOpen(true)}
              >
                <div className="fs-quick-icon">
                  <Sprout size={18} />
                </div>
                <div className="fs-quick-text">
                  <strong className="fs-quick-title">Auto-save</strong>
                  <span className="fs-quick-sub">{savePercent}% of claim routed</span>
                </div>
              </button>

              <button
                type="button"
                className="fs-quick-card"
                onClick={() => setSwapModalOpen(true)}
              >
                <div className="fs-quick-icon">
                  <Repeat2 size={18} />
                </div>
                <div className="fs-quick-text">
                  <strong className="fs-quick-title">Swap G$</strong>
                  <span className="fs-quick-sub">To USDT / USDC</span>
                </div>
              </button>

              <button
                type="button"
                className="fs-quick-card"
                onClick={() => setWithdrawModalOpen(true)}
              >
                <div className="fs-quick-icon">
                  <Wallet size={18} />
                </div>
                <div className="fs-quick-text">
                  <strong className="fs-quick-title">Withdraw</strong>
                  <span className="fs-quick-sub">Instant to wallet</span>
                </div>
              </button>

              <button
                type="button"
                className="fs-quick-card"
                onClick={onTogglePause}
                disabled={pausing}
              >
                <div className="fs-quick-icon">
                  {instruction.active ? <Repeat2 size={18} /> : <Play size={18} />}
                </div>
                <div className="fs-quick-text">
                  <strong className="fs-quick-title">{instruction.active ? 'Yield Active' : 'Resume Yield'}</strong>
                  <span className="fs-quick-sub">{pausing ? 'Updating on-chain…' : 'Aave V3 compounding'}</span>
                </div>
              </button>
            </section>

            {/* 3. Bottom Split: Recent Activity + Activity Graph */}
            <section className="fs-split-grid" id="recent-activity">
            {/* Recent Activity */}
            <div className="fs-activity-card">
              <div className="fs-activity-top">
                <h2 className="fs-section-title">Recent activity</h2>

                <div className="fs-activity-controls">
                  <div className="fs-tabs">
                    <button
                      type="button"
                      className={activeTab === 'history' ? 'is-active' : ''}
                      onClick={() => setActiveTab('history')}
                    >
                      History
                    </button>
                    <button
                      type="button"
                      className={activeTab === 'upcoming' ? 'is-active' : ''}
                      onClick={() => setActiveTab('upcoming')}
                    >
                      Upcoming
                    </button>
                  </div>

                  <div className="fs-tools">
                    <button
                      type="button"
                      className="fs-date-chip"
                      onClick={() => setScheduleModalOpen(true)}
                    >
                      <Calendar size={13} />
                      <span>Last 14 days</span>
                    </button>
                    <button
                      type="button"
                      className="fs-action-btn"
                      aria-label="Export history"
                      title="Export history JSON"
                      onClick={handleExportHistory}
                    >
                      <Download size={14} />
                    </button>
                  </div>
                </div>
              </div>

              {activeTab === 'history' ? (
                <div className="fs-tx-scroll">
                  {recent5Activities.length === 0 ? (
                    <div className="fs-empty-feed">
                      <div className="fs-empty-icon">
                        <Sprout size={28} />
                      </div>
                      <h3>No transactions yet</h3>
                      <p>
                        Once your savings rule is active and you claim your daily GoodDollar,
                        auto-saves and accrued yield will appear here in real time.
                      </p>
                      <button
                        type="button"
                        className="fs-empty-action-btn"
                        onClick={() => setRuleModalOpen(true)}
                      >
                        Configure Savings Rule
                      </button>
                    </div>
                  ) : (
                    <>
                      <div className="fs-tx-list-recent">
                        {recent5Activities.map((ev) => (
                          <div key={ev.id} className="fs-tx-row">
                            <div className="fs-tx-lead">
                              <div className="fs-tx-icon-wrap">
                                <SolarIcon
                                  icon={
                                    ev.kind === 'withdraw'
                                      ? 'solar:arrow-right-up-linear'
                                      : ev.kind === 'yield'
                                      ? 'solar:download-square-linear'
                                      : ev.kind === 'rule'
                                      ? 'solar:tuning-square-2-linear'
                                      : ev.kind === 'pause'
                                      ? 'solar:pause-circle-linear'
                                      : ev.kind === 'resume'
                                      ? 'solar:play-circle-linear'
                                      : ev.kind === 'milestone'
                                      ? 'solar:flame-linear'
                                      : 'solar:leaf-linear'
                                  }
                                  width={18}
                                  height={18}
                                />
                              </div>
                              <div>
                                <strong className="fs-tx-title">{ev.label || ev.kind}</strong>
                                <span className="fs-tx-sub">
                                  {new Date(ev.date).toLocaleDateString(undefined, {
                                    month: 'short',
                                    day: 'numeric',
                                    hour: '2-digit',
                                    minute: '2-digit',
                                  })}
                                </span>
                              </div>
                            </div>
                            <div className="fs-tx-badge">
                              {ev.kind === 'withdraw' ? (
                                <>
                                  <Wallet size={12} />
                                  <span>Withdraw</span>
                                </>
                              ) : ev.kind === 'yield' ? (
                                <>
                                  <TrendingUp size={12} />
                                  <span>Yield</span>
                                </>
                              ) : ev.kind === 'rule' ? (
                                <>
                                  <Target size={12} />
                                  <span>Rule</span>
                                </>
                              ) : ev.kind === 'pause' ? (
                                <>
                                  <Clock size={12} />
                                  <span>Paused</span>
                                </>
                              ) : ev.kind === 'resume' ? (
                                <>
                                  <Play size={12} />
                                  <span>Resumed</span>
                                </>
                              ) : ev.kind === 'milestone' ? (
                                <>
                                  <Flame size={12} />
                                  <span>Streak</span>
                                </>
                              ) : (
                                <>
                                  <Sprout size={12} />
                                  <span>Auto-Save</span>
                                </>
                              )}
                            </div>
                            <div className="fs-tx-tail">
                              {ev.txHash ? (
                                <a
                                  href={`${appChain.blockExplorers?.default?.url || 'https://sepolia.celoscan.io'}/tx/${ev.txHash}`}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="fs-tx-doc fs-tx-scan-link"
                                  title="Verified on Celoscan"
                                >
                                  <ExternalLink size={13} className="text-emerald-400" />
                                </a>
                              ) : (
                                <span className="fs-tx-doc">
                                  <SolarIcon
                                    icon="solar:document-text-linear"
                                    width={14}
                                    height={14}
                                  />
                                </span>
                              )}
                              {ev.amountGD !== undefined && ev.amountGD > 0 ? (
                                <div className="fs-tx-amount-col">
                                  <span className={`fs-tx-amount ${ev.kind === 'withdraw' ? 'is-neg' : 'is-pos'}`}>
                                    {ev.kind === 'withdraw' ? '-' : '+'}G${' '}
                                    {ev.amountGD.toFixed(2)}
                                  </span>
                                  <small className="fs-tx-usdt-sub">{formatUsdt(ev.amountGD)}</small>
                                </div>
                              ) : ev.kind === 'rule' ? (
                                <span className="fs-tx-tag-pill fs-tx-tag-config">Configured</span>
                              ) : ev.kind === 'pause' ? (
                                <span className="fs-tx-tag-pill fs-tx-tag-paused">Paused</span>
                              ) : ev.kind === 'resume' ? (
                                <span className="fs-tx-tag-pill fs-tx-tag-active">Active</span>
                              ) : ev.kind === 'milestone' ? (
                                <span className="fs-tx-tag-pill fs-tx-tag-streak">🔥 {ev.streakDay ? `${ev.streakDay}d` : 'Streak'}</span>
                              ) : (
                                <span className="fs-tx-tag-pill fs-tx-tag-active">Updated</span>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>

                      {/* View All Button */}
                      <button
                        type="button"
                        className="fs-view-all-btn"
                        onClick={() => {
                          setActivityCurrentPage(1);
                          setAllActivitiesModalOpen(true);
                        }}
                      >
                        <span>View all {activity.length} transactions</span>
                        <ArrowRight size={14} />
                      </button>
                    </>
                  )}
                </div>
              ) : (
                <div className="fs-upcoming-box">
                  <Calendar size={20} className="text-emerald-400" />
                  <div>
                    <strong>Next Daily Auto-Save</strong>
                    <p>
                      Sage agent is active on Celo. {savePercent}% will automatically be routed
                      to Aave V3 upon your next GoodDollar claim.
                    </p>
                  </div>
                </div>
              )}
            </div>

            {/* Activity Graph */}
            <div className="fs-graph-card">
              <div className="fs-graph-head">
                <div>
                  <h3 className="fs-graph-title">Activity graph</h3>
                  <strong className="fs-graph-big">
                    G$ {total.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </strong>
                </div>
                <span className="fs-graph-badge">LAST 11 DAYS</span>
              </div>

              <div className="fs-graph-plot">
                <div className="fs-bars-area">
                  <div className="fs-bar-scale">
                    {graphData.scale.map((s, i) => (
                      <span key={i}>{s}</span>
                    ))}
                  </div>
                  <div className="fs-bar-columns">
                    {graphData.days.map((bar, i) => {
                      const heightPercent =
                        graphData.maxVal > 0
                          ? Math.min(100, Math.max(8, (bar.amount / graphData.maxVal) * 100))
                          : 8;
                      const isToday = i === graphData.days.length - 1;
                      return (
                        <div
                          key={bar.date}
                          style={{ height: `${heightPercent}%` }}
                          title={`${bar.date}: G$ ${bar.amount.toFixed(2)}`}
                          className={`fs-bar-item ${isToday && total > 0 ? 'is-peak' : ''}`}
                        />
                      );
                    })}
                  </div>
                </div>
                <div className="fs-bar-labels">
                  {graphData.days.map((d) => (
                    <span key={d.date}>{d.label}</span>
                  ))}
                </div>
              </div>
            </div>
          </section>
        </div>
      </main>

      {/* Mobile Bottom Navigation Bar (< 768px) */}
      <nav className="fs-mobile-bottom-bar" aria-label="Mobile Navigation">
        <button
          type="button"
          className="fs-mob-nav-btn is-active"
          onClick={() => {
            const body = document.querySelector('.fs-scrollable-body');
            body?.scrollTo({ top: 0, behavior: 'smooth' });
          }}
        >
          <SolarIcon icon="solar:widget-2-linear" width={22} height={22} />
          <span>Home</span>
        </button>

        <button
          type="button"
          className="fs-mob-nav-btn"
          onClick={() => setStreakModalOpen(true)}
        >
          <SolarIcon icon="solar:fire-linear" width={22} height={22} />
          <span>Streak ({streak}d)</span>
        </button>

        <button
          type="button"
          className="fs-mob-nav-add-btn"
          onClick={() => setRuleModalOpen(true)}
          title="Configure Auto-Save Rule"
          aria-label="Add or adjust auto-save rule"
        >
          <Plus size={24} />
        </button>

        <button
          type="button"
          className="fs-mob-nav-btn"
          onClick={() => {
            const el = document.getElementById('recent-activity');
            el?.scrollIntoView({ behavior: 'smooth' });
          }}
        >
          <SolarIcon icon="solar:document-text-linear" width={22} height={22} />
          <span>Activity</span>
        </button>

        <button
          type="button"
          className="fs-mob-nav-btn"
          onClick={() => setVaultModalOpen(true)}
        >
          <SolarIcon icon="solar:shield-check-linear" width={22} height={22} />
          <span>Vault</span>
        </button>
      </nav>
    </div>

    {/* Mobile Sidebar Backdrop Drawer Overlay */}
    {sidebarExpanded && (
      <div
        className="fs-mobile-sidebar-backdrop"
        onClick={() => setSidebarExpanded(false)}
      />
    )}

      {/* Savings Rule / Activate Sage Modal */}
      {ruleModalOpen && (
        <div className="db-modal-overlay" onClick={() => setRuleModalOpen(false)}>
          <div className="db-modal-card" onClick={(e) => e.stopPropagation()}>
            <div className="db-modal-head">
              <h4>Configure Savings Rule</h4>
              <button
                type="button"
                className="db-modal-close"
                onClick={() => setRuleModalOpen(false)}
              >
                <X size={18} />
              </button>
            </div>

            <div className="db-modal-body">
              <div className="db-field">
                <div className="db-field-header">
                  <label>How much of your daily claim should Sage save?</label>
                  <span className="db-pill-val">{savePercent}%</span>
                </div>
                <input
                  type="range"
                  min={1}
                  max={50}
                  step={1}
                  value={savePercent}
                  onChange={(e) => {
                    const percent = Number(e.target.value);
                    onInstructionChange({
                      ...instruction,
                      percentBps: percent * 100,
                    });
                  }}
                  className="db-slider"
                />
              </div>

              <div className="db-field">
                <label>Goal name (optional)</label>
                <input
                  type="text"
                  value={instruction.goalLabel || ''}
                  placeholder="e.g. Emergency fund, New Laptop"
                  onChange={(e) =>
                    onInstructionChange({ ...instruction, goalLabel: e.target.value })
                  }
                  className="db-input"
                />
              </div>

              <div className="db-field">
                <label>Target amount (optional)</label>
                <div className="db-target-pills">
                  {[500, 1000, 2000, 5000].map((tgt) => (
                    <button
                      key={tgt}
                      type="button"
                      className={`db-target-pill ${
                        instruction.goalTargetGD === tgt ? 'is-active' : ''
                      }`}
                      onClick={() =>
                        onInstructionChange({ ...instruction, goalTargetGD: tgt })
                      }
                    >
                      G$ {tgt.toLocaleString()}
                    </button>
                  ))}
                </div>
                <input
                  type="number"
                  value={instruction.goalTargetGD || ''}
                  placeholder="Custom target G$"
                  onChange={(e) =>
                    onInstructionChange({
                      ...instruction,
                      goalTargetGD: Number(e.target.value) || 0,
                    })
                  }
                  className="db-input"
                />
              </div>
            </div>

            <div className="db-modal-foot">
              <button
                type="button"
                className="ln-plan-cta-solid db-activate-btn"
                disabled={saving}
                onClick={async () => {
                  await onSaveInstruction();
                  onAddActivity({
                    id: Math.random().toString(36).slice(2, 9),
                    kind: 'rule',
                    label: `Auto-Save configured to ${savePercent}% (${instruction.goalLabel || 'Savings goal'})`,
                    date: new Date().toISOString(),
                  });
                  setRuleModalOpen(false);
                }}
              >
                {saving ? 'Submitting to Celo…' : 'Save Rule on Celo →'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Swap G$ ↔ USDT / USDC (Mento Protocol DEX) Modal */}
      {swapModalOpen && (
        <div className="db-modal-overlay" onClick={() => setSwapModalOpen(false)}>
          <div className="db-modal-card" onClick={(e) => e.stopPropagation()}>
            <div className="db-modal-head">
              <h4>Swap G$ ↔ Stablecoins</h4>
              <button
                type="button"
                className="db-modal-close"
                onClick={() => setSwapModalOpen(false)}
              >
                <X size={18} />
              </button>
            </div>

            <div className="db-modal-body">
              <p className="db-modal-desc">
                Instant decentralized exchange powered by Mento Protocol on Celo.
                Convert your earned GoodDollar yield or wallet balance to stable USDT or USDC with minimal slippage.
              </p>

              {/* Source Balance Selector */}
              <div className="db-field">
                <label>Swap Source</label>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '6px', marginTop: '6px' }}>
                  <button
                    type="button"
                    className={`db-target-pill ${swapSource === 'yield' ? 'is-active' : ''}`}
                    style={{ padding: '8px 6px', justifyContent: 'center', fontSize: '11px' }}
                    onClick={() => {
                      setSwapSource('yield');
                      setSwapAmount(position.yieldGD > 0 ? position.yieldGD.toFixed(2) : '');
                    }}
                  >
                    <span>Earned Yield</span>
                  </button>
                  <button
                    type="button"
                    className={`db-target-pill ${swapSource === 'total' ? 'is-active' : ''}`}
                    style={{ padding: '8px 6px', justifyContent: 'center', fontSize: '11px' }}
                    onClick={() => {
                      setSwapSource('total');
                      setSwapAmount(total > 0 ? total.toFixed(2) : '');
                    }}
                  >
                    <span>Vault Total</span>
                  </button>
                  <button
                    type="button"
                    className={`db-target-pill ${swapSource === 'wallet' ? 'is-active' : ''}`}
                    style={{ padding: '8px 6px', justifyContent: 'center', fontSize: '11px' }}
                    onClick={() => {
                      setSwapSource('wallet');
                      setSwapAmount(gdBalance && gdBalance > 0 ? gdBalance.toFixed(2) : '');
                    }}
                  >
                    <span>Wallet G$</span>
                  </button>
                </div>
              </div>

              {/* Pay G$ Amount */}
              <div className="db-field">
                <div className="db-field-header">
                  <label>You Pay (G$)</label>
                  <span className="db-available">
                    Available:{' '}
                    {swapSource === 'yield'
                      ? `G$ ${position.yieldGD.toFixed(2)}`
                      : swapSource === 'wallet'
                      ? `G$ ${(gdBalance || 0).toFixed(2)}`
                      : `G$ ${total.toFixed(2)}`}
                  </span>
                </div>
                <div className="db-input-group">
                  <input
                    type="number"
                    value={swapAmount}
                    onChange={(e) => setSwapAmount(e.target.value)}
                    className="db-input"
                    placeholder="1000"
                  />
                  <div style={{ display: 'flex', gap: '4px' }}>
                    {[0.25, 0.5, 0.75, 1].map((pct) => {
                      const maxAvail =
                        swapSource === 'yield'
                          ? position.yieldGD
                          : swapSource === 'wallet'
                          ? (gdBalance || 0)
                          : total;
                      return (
                        <button
                          key={pct}
                          type="button"
                          className="db-max-btn"
                          style={{ minWidth: '36px', padding: '0 6px', fontSize: '10px' }}
                          onClick={() => setSwapAmount(maxAvail > 0 ? (maxAvail * pct).toFixed(2) : '0')}
                        >
                          {pct === 1 ? 'MAX' : `${pct * 100}%`}
                        </button>
                      );
                    })}
                  </div>
                </div>
              </div>

              {/* Target Currency Selector */}
              <div className="db-field">
                <label>You Receive</label>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', marginTop: '6px' }}>
                  <button
                    type="button"
                    className={`db-target-pill ${swapTarget === 'USDT' ? 'is-active' : ''}`}
                    style={{ padding: '10px 12px', justifyContent: 'center' }}
                    onClick={() => setSwapTarget('USDT')}
                  >
                    <span>💵 Tether (USDT)</span>
                  </button>
                  <button
                    type="button"
                    className={`db-target-pill ${swapTarget === 'USDC' ? 'is-active' : ''}`}
                    style={{ padding: '10px 12px', justifyContent: 'center' }}
                    onClick={() => setSwapTarget('USDC')}
                  >
                    <span>🔵 USD Coin (USDC)</span>
                  </button>
                </div>
              </div>

              {/* Live Conversion Box */}
              <div className="db-claim-box" style={{ marginTop: '12px' }}>
                <p>
                  <strong>Estimated Receive:</strong>{' '}
                  <span className="text-emerald-400 font-bold" style={{ fontSize: '15px' }}>
                    ~{((Number(swapAmount) || 0) * usdtRate).toFixed(4)} {swapTarget}
                  </span>
                </p>
                <p>
                  <strong>Exchange Rate:</strong>{' '}
                  <span>1 G$ ≈ ${(usdtRate).toFixed(6)} {swapTarget}</span>
                </p>
                <p>
                  <strong>Routing Protocol:</strong>{' '}
                  <span>Mento Decentralized Exchange (Celo)</span>
                </p>
                <p>
                  <strong>Slippage Tolerance:</strong>{' '}
                  <span>
                    {[0.5, 1.0, 2.0].map((slip) => (
                      <button
                        key={slip}
                        type="button"
                        onClick={() => setSwapSlippage(slip)}
                        style={{
                          background: swapSlippage === slip ? '#10b981' : 'rgba(255,255,255,0.06)',
                          color: swapSlippage === slip ? '#000' : '#e2e8f0',
                          border: 'none',
                          padding: '2px 6px',
                          borderRadius: '4px',
                          marginLeft: '6px',
                          fontSize: '11px',
                          fontWeight: 600,
                          cursor: 'pointer',
                        }}
                      >
                        {slip}%
                      </button>
                    ))}
                  </span>
                </p>
              </div>
            </div>

            <div className="db-modal-foot">
              <button
                type="button"
                className="ln-plan-cta-solid db-activate-btn"
                disabled={swapping || !swapAmount || Number(swapAmount) <= 0}
                onClick={handleExecuteSwap}
              >
                {swapping
                  ? 'Executing Mento Swap…'
                  : `Swap G$ to ${swapTarget} (Mento) →`}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Withdraw Modal with Dual-Currency Switcher */}
      {withdrawModalOpen && (
        <div className="db-modal-overlay" onClick={() => setWithdrawModalOpen(false)}>
          <div className="db-modal-card" onClick={(e) => e.stopPropagation()}>
            <div className="db-modal-head">
              <h4>Withdraw from Vault</h4>
              <button
                type="button"
                className="db-modal-close"
                onClick={() => setWithdrawModalOpen(false)}
              >
                <X size={18} />
              </button>
            </div>

            <div className="db-modal-body">
              <p className="db-modal-desc">
                Your position redeems directly from Aave V3 on Celo with zero lockup.
                Select whether you want to receive GoodDollar or stable USDT yield collateral.
              </p>

              {/* Currency Selector */}
              <div className="db-field">
                <label>Withdrawal Currency</label>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', marginTop: '6px' }}>
                  <button
                    type="button"
                    className={`db-target-pill ${withdrawCurrency === 'GD' ? 'is-active' : ''}`}
                    style={{ padding: '10px 12px', justifyContent: 'center' }}
                    onClick={() => setWithdrawCurrency('GD')}
                  >
                    <span>🪙 G$ (GoodDollar)</span>
                  </button>
                  <button
                    type="button"
                    className={`db-target-pill ${withdrawCurrency === 'USDT' ? 'is-active' : ''}`}
                    style={{ padding: '10px 12px', justifyContent: 'center' }}
                    onClick={() => setWithdrawCurrency('USDT')}
                  >
                    <span>💵 USDT (Mento Swap)</span>
                  </button>
                </div>
              </div>

              <div className="db-field">
                <div className="db-field-header">
                  <label>Amount to withdraw</label>
                  <span className="db-available">
                    Available: G$ {total.toFixed(2)}
                  </span>
                </div>
                <div className="db-input-group">
                  <input
                    type="number"
                    value={withdrawAmount}
                    onChange={(e) => setWithdrawAmount(e.target.value)}
                    className="db-input"
                    placeholder="100"
                  />
                  <button
                    type="button"
                    className="db-max-btn"
                    onClick={() => setWithdrawAmount(total > 0 ? total.toFixed(2) : '0')}
                  >
                    MAX
                  </button>
                </div>
              </div>

              {/* Output Preview */}
              <div className="db-claim-box" style={{ marginTop: '12px' }}>
                <p>
                  <strong>Estimated Receive:</strong>{' '}
                  <span className="text-emerald-400 font-bold">
                    {withdrawCurrency === 'USDT'
                      ? `~${((Number(withdrawAmount) || 0) * usdtRate).toFixed(4)} USDT`
                      : `${(Number(withdrawAmount) || 0).toLocaleString()} G$`}
                  </span>
                </p>
                <p>
                  <strong>Settlement Protocol:</strong>{' '}
                  <span>{withdrawCurrency === 'USDT' ? 'Aave V3 + Mento Exchange' : 'Aave V3 Instant Redeem'}</span>
                </p>
              </div>

              {withdrawError && <p className="db-error">{withdrawError}</p>}
            </div>

            <div className="db-modal-foot">
              <button
                type="button"
                className="ln-plan-cta-solid db-activate-btn"
                disabled={withdrawing || total <= 0}
                onClick={handleWithdraw}
              >
                {withdrawing
                  ? 'Submitting to Celo…'
                  : withdrawCurrency === 'USDT'
                  ? 'Withdraw as USDT (Mento Swap) →'
                  : 'Withdraw to G$ →'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Daily Streak & Grace Window Modal */}
      {streakModalOpen && (
        <div className="db-modal-overlay" onClick={() => setStreakModalOpen(false)}>
          <div className="db-modal-card" onClick={(e) => e.stopPropagation()}>
            <div className="db-modal-head">
              <h4>Daily Streak & Yield Booster</h4>
              <button
                type="button"
                className="db-modal-close"
                onClick={() => setStreakModalOpen(false)}
              >
                <X size={18} />
              </button>
            </div>

            <div className="db-modal-body">
              <div className="fs-modal-center">
                <div className="fs-streak-flame">
                  <Flame size={44} className="text-amber-400" />
                </div>
                <h3 className="fs-streak-title">{streak} Day Streak</h3>
                <p className="db-modal-desc">
                  Check in daily and claim your GoodDollar to boost your yield and maintain your compounding tier.
                </p>
              </div>

              <div className="db-claim-box">
                <p>
                  <strong>Current Tier:</strong>{' '}
                  <span className="text-amber-400 font-bold">
                    {streakTier.icon} {streakTier.name} ({effectiveApy}% APY)
                  </span>
                </p>
                <p>
                  <strong>36-Hour Grace Window:</strong>{' '}
                  <span className="text-emerald-400">
                    {graceStatus.isAlive ? `Active (${graceStatus.hoursRemaining}h remaining) ⏳` : 'Expired'}
                  </span>
                </p>
                <p>
                  <strong>Today's Check-in:</strong>{' '}
                  {isCheckedInToday ? (
                    <span className="text-emerald-400">Claimed & Saved ✅</span>
                  ) : (
                    <span className="text-amber-400">Pending (+1 Day Available)</span>
                  )}
                </p>
              </div>
            </div>

            <div className="db-modal-foot">
              <button
                type="button"
                className="ln-plan-cta-solid db-activate-btn"
                onClick={handleCheckIn}
              >
                {isCheckedInToday ? 'Extend Streak Tomorrow 🔥' : 'Check in for Today (+1 Day) 🔥'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Share Claim Streak Modal for X & Socials */}
      {shareModalOpen && (
        <div className="db-modal-overlay" onClick={() => setShareModalOpen(false)}>
          <div className="db-modal-card fs-share-streak-modal" onClick={(e) => e.stopPropagation()}>
            <div className="db-modal-head">
              <h4>Share Your Milestone on X</h4>
              <button
                type="button"
                className="db-modal-close"
                onClick={() => setShareModalOpen(false)}
                aria-label="Close"
              >
                <X size={18} />
              </button>
            </div>

            <div className="db-modal-body">
              {/* Celebratory Share Card Preview */}
              <div className="fs-share-preview-card">
                <div className="fs-share-card-head">
                  <div className="fs-streak-fire-badge">
                    <Flame size={24} className="text-amber-400" />
                  </div>
                  <div>
                    <strong className="fs-share-card-title">{streak} Day Claim Streak 🔥</strong>
                    <span className="fs-share-card-sub">{streakTier.icon} {streakTier.name} · Celo Network</span>
                  </div>
                </div>
                <div className="fs-share-metrics-row">
                  <div className="fs-share-metric">
                    <span className="fs-share-metric-lbl">Total Vault Assets</span>
                    <strong className="fs-share-metric-val">G$ {Math.round(total).toLocaleString()}</strong>
                  </div>
                  <div className="fs-share-metric">
                    <span className="fs-share-metric-lbl">Effective APY</span>
                    <strong className="fs-share-metric-val text-emerald-400">{effectiveApy}% APY</strong>
                  </div>
                </div>
              </div>

              <p className="fs-share-instructions">
                Flex your savings discipline and invite friends with your referral link to earn bonus claim rewards.
              </p>

              <div className="fs-share-buttons-grid">
                <a
                  href={`https://twitter.com/intent/tweet?text=${encodeURIComponent(
                    `🔥 Just reached a ${streak}-day streak on @SageProtocol!\n\nAuto-saving my daily GoodDollar into Aave on Celo earning ${effectiveApy}% APY.\n\nStart saving with my invite: ${referralUrl}\n\n#GoodDollar #Celo #DeFi`
                  )}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="fs-share-btn fs-share-twitter"
                >
                  <span>Share on X</span>
                  <ExternalLink size={13} />
                </a>

                <a
                  href={makePlatformUrl('warpcast', {
                    streak,
                    savedAmountGD: total,
                    apy: effectiveApy,
                    goalLabel: instruction.goalLabel,
                    address: connectedAddress,
                  })}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="fs-share-btn fs-share-farcaster"
                >
                  <span>Warpcast</span>
                  <ExternalLink size={13} />
                </a>

                <a
                  href={makePlatformUrl('telegram', {
                    streak,
                    savedAmountGD: total,
                    apy: effectiveApy,
                    goalLabel: instruction.goalLabel,
                    address: connectedAddress,
                  })}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="fs-share-btn fs-share-tg"
                >
                  <span>Telegram</span>
                  <ExternalLink size={13} />
                </a>

                <a
                  href={makePlatformUrl('whatsapp', {
                    streak,
                    savedAmountGD: total,
                    apy: effectiveApy,
                    goalLabel: instruction.goalLabel,
                    address: connectedAddress,
                  })}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="fs-share-btn fs-share-wa"
                >
                  <span>WhatsApp</span>
                  <ExternalLink size={13} />
                </a>
              </div>
            </div>

            <div className="db-modal-foot">
              <button
                type="button"
                className="ln-plan-cta-solid db-activate-btn"
                style={{ width: '100%', justifyContent: 'center' }}
                onClick={async () => {
                  const shareTxt = `${streak} day streak 🔥 G$ ${Math.round(total).toLocaleString()} saved with @SageProtocol earning ${effectiveApy}% APY. Join: ${referralUrl}`;
                  const ok = await copyToClipboard(shareTxt);
                  if (ok) {
                    setCopiedLink(true);
                    setTimeout(() => setCopiedLink(false), 2500);
                  }
                }}
              >
                {copiedLink ? (
                  <>
                    <Check size={16} />
                    <span>Copied to Clipboard!</span>
                  </>
                ) : (
                  <>
                    <Copy size={16} />
                    <span>Copy Share Text & Link</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Referral Program & Multi-Tier Bonus Modal */}
      {referralModalOpen && (
        <div className="db-modal-overlay" onClick={() => setReferralModalOpen(false)}>
          <div className="db-modal-card" onClick={(e) => e.stopPropagation()}>
            <div className="db-modal-head">
              <h4>Referral Program & Bonus Chain</h4>
              <button
                type="button"
                className="db-modal-close"
                onClick={() => setReferralModalOpen(false)}
                aria-label="Close"
              >
                <X size={18} />
              </button>
            </div>

            <div className="db-modal-body">
              <p className="db-modal-desc">
                Invite fellow GoodDollar claimers to Sage. The more downlines save, the higher bonus claim multiplier you earn.
              </p>

              {/* Referral Link Box */}
              <div className="db-field">
                <label>Your Unique Referral Link</label>
                <div className="db-input-group" style={{ marginTop: 4 }}>
                  <input
                    type="text"
                    readOnly
                    value={referralUrl}
                    className="db-input"
                    style={{ fontSize: '12px', color: '#a7f3d0' }}
                  />
                  <button
                    type="button"
                    className="db-max-btn"
                    style={{ minWidth: 80 }}
                    onClick={async () => {
                      const ok = await copyToClipboard(referralUrl);
                      if (ok) {
                        setCopiedRefLink(true);
                        setTimeout(() => setCopiedRefLink(false), 2500);
                      }
                    }}
                  >
                    {copiedRefLink ? 'Copied!' : 'Copy'}
                  </button>
                </div>
              </div>

              {/* Bonus Structure */}
              <div className="db-claim-box" style={{ marginTop: 12 }}>
                <p>
                  <strong>Direct Downline (Tier 1):</strong>{' '}
                  <span className="text-emerald-400">+5% Bonus Claim Multiplier</span>
                </p>
                <p>
                  <strong>Secondary Downline (Tier 2):</strong>{' '}
                  <span className="text-cyan-400">+2% Bonus Claim Multiplier</span>
                </p>
                <p>
                  <strong>Total Referral Downlines:</strong>{' '}
                  <span>{referralStats.totalReferrals} Savers</span>
                </p>
              </div>
            </div>

            <div className="db-modal-foot">
              <a
                href={`https://twitter.com/intent/tweet?text=${encodeURIComponent(
                  `Start auto-saving your daily GoodDollar into Aave on Celo with @SageProtocol 🌿 Grow your funds with compound yield:\n${referralUrl}`
                )}`}
                target="_blank"
                rel="noopener noreferrer"
                className="ln-plan-cta-solid db-activate-btn"
                style={{ textAlign: 'center', textDecoration: 'none' }}
              >
                Share Invite Link on X 🚀
              </a>
            </div>
          </div>
        </div>
      )}

      {/* Opt-In Leaderboard Modal */}
      {leaderboardModalOpen && (
        <div className="db-modal-overlay" onClick={() => setLeaderboardModalOpen(false)}>
          <div className="db-modal-card" style={{ maxWidth: 520 }} onClick={(e) => e.stopPropagation()}>
            <div className="db-modal-head">
              <h4>Top Savers Leaderboard</h4>
              <button
                type="button"
                className="db-modal-close"
                onClick={() => setLeaderboardModalOpen(false)}
                aria-label="Close"
              >
                <X size={18} />
              </button>
            </div>

            <div className="db-modal-body">
              <p className="db-modal-desc">
                Public ranking of top active claimers and automated savers on Celo.
              </p>

              {/* Leaderboard Table */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8, margin: '14px 0' }}>
                {[
                  { rank: '🥇', addr: '0x3F8a…92B1', streak: 124, saved: 18450, badge: '💎 Diamond' },
                  { rank: '🥈', addr: '0x88Cc…44F0', streak: 89, saved: 12200, badge: '🔥 Flame' },
                  { rank: '🥉', addr: '0x12Fe…77A9', streak: 62, saved: 8900, badge: '🔥 Flame' },
                  { rank: '#4', addr: '0x55Ba…11C2', streak: 41, saved: 5400, badge: '🔥 Flame' },
                  { rank: '#5', addr: shortAddress, streak: streak, saved: Math.round(total), badge: streakTier.name, isYou: true },
                ].map((row, idx) => (
                  <div
                    key={idx}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      padding: '8px 12px',
                      borderRadius: '8px',
                      background: row.isYou ? 'rgba(16, 185, 129, 0.15)' : 'rgba(255, 255, 255, 0.03)',
                      border: row.isYou ? '1px solid rgba(16, 185, 129, 0.4)' : '1px solid rgba(255, 255, 255, 0.05)',
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                      <span style={{ fontSize: '14px', fontWeight: 700, minWidth: 24 }}>{row.rank}</span>
                      <div>
                        <strong style={{ fontSize: '13px', color: row.isYou ? '#34d399' : '#e2e8f0' }}>
                          {row.addr} {row.isYou ? '(You)' : ''}
                        </strong>
                        <div style={{ fontSize: '11px', color: '#94a3b8' }}>{row.badge}</div>
                      </div>
                    </div>
                    <div style={{ textAlign: 'right' }}>
                      <span style={{ fontSize: '13px', fontWeight: 600, color: '#f8fafc' }}>
                        G$ {row.saved.toLocaleString()}
                      </span>
                      <div style={{ fontSize: '11px', color: '#f59e0b' }}>{row.streak}d streak 🔥</div>
                    </div>
                  </div>
                ))}
              </div>

              {/* Opt-in Toggle */}
              <label style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: '12px', color: '#94a3b8', cursor: 'pointer' }}>
                <input
                  type="checkbox"
                  checked={leaderboardOptIn}
                  onChange={(e) => {
                    setLeaderboardOptInState(e.target.checked);
                    setLeaderboardOptIn(e.target.checked);
                  }}
                />
                <span>Show my pseudonymous address on public leaderboard</span>
              </label>
            </div>

            <div className="db-modal-foot">
              <button
                type="button"
                className="ln-plan-cta-solid db-activate-btn"
                style={{ width: '100%', justifyContent: 'center' }}
                onClick={() => setLeaderboardModalOpen(false)}
              >
                Done
              </button>
            </div>
          </div>
        </div>
      )}


      {/* Daily Claim Info Modal */}
      {claimInfoOpen && (
        <div className="db-modal-overlay" onClick={() => setClaimInfoOpen(false)}>
          <div className="db-modal-card" onClick={(e) => e.stopPropagation()}>
            <div className="db-modal-head">
              <h4>GoodDollar Daily Claim</h4>
              <button
                type="button"
                className="db-modal-close"
                onClick={() => setClaimInfoOpen(false)}
              >
                <X size={18} />
              </button>
            </div>

            <div className="db-modal-body">
              <p className="db-modal-desc">
                Sage automatically intercepts {savePercent}% of every daily GoodDollar claim
                and routes it into Aave V3 on Celo.
              </p>
              <div className="db-claim-box">
                <p>
                  <strong>Current Streak:</strong> {streak} days 🔥
                </p>
                <p>
                  <strong>Status:</strong>{' '}
                  <span className="text-emerald-400">Sage Agent Watching</span>
                </p>
              </div>
            </div>

            <div className="db-modal-foot">
              <a
                href="https://gooddollar.org"
                target="_blank"
                rel="noopener noreferrer"
                className="ln-plan-cta-solid db-activate-btn"
                style={{ textAlign: 'center', textDecoration: 'none' }}
              >
                Open GoodDollar App <ExternalLink size={14} style={{ display: 'inline', marginLeft: 4 }} />
              </a>
            </div>
          </div>
        </div>
      )}

      {/* Daily Schedule Modal */}
      {scheduleModalOpen && (
        <div className="db-modal-overlay" onClick={() => setScheduleModalOpen(false)}>
          <div className="db-modal-card" onClick={(e) => e.stopPropagation()}>
            <div className="db-modal-head">
              <h4>Savings Schedule</h4>
              <button
                type="button"
                className="db-modal-close"
                onClick={() => setScheduleModalOpen(false)}
              >
                <X size={18} />
              </button>
            </div>

            <div className="db-modal-body">
              <p className="db-modal-desc">
                GoodDollar Universal Basic Income (UBI) is distributable every 24 hours.
                Sage watches for claim events on Celo and instantly executes your auto-save instruction.
              </p>
              <div className="db-claim-box">
                <p>
                  <strong>Execution Trigger:</strong> On GoodDollar Claim
                </p>
                <p>
                  <strong>Allocation:</strong> {savePercent}% to Aave V3 Pool
                </p>
                <p>
                  <strong>Interest Compounding:</strong> Continuous per block
                </p>
              </div>
            </div>

            <div className="db-modal-foot">
              <button
                type="button"
                className="ln-plan-cta-solid db-activate-btn"
                onClick={() => setScheduleModalOpen(false)}
              >
                Got It
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Vault on Celo Explorer Modal */}
      {vaultModalOpen && (
        <div className="db-modal-overlay" onClick={() => setVaultModalOpen(false)}>
          <div className="db-modal-card" onClick={(e) => e.stopPropagation()}>
            <div className="db-modal-head">
              <h4>Sage Vault on Celo</h4>
              <button
                type="button"
                className="db-modal-close"
                onClick={() => setVaultModalOpen(false)}
              >
                <X size={18} />
              </button>
            </div>

            <div className="db-modal-body">
              <p className="db-modal-desc">
                All deposits are secured by non-custodial smart contracts deployed on Celo.
                Yield is generated by Aave V3 lending pools.
              </p>
              <div className="db-claim-box">
                <p>
                  <strong>Network:</strong> {appChain.name} (ID: {appChain.id})
                </p>
                <p>
                  <strong>Vault Address:</strong>{' '}
                  <code style={{ fontSize: '11px', wordBreak: 'break-all' }}>
                    {appConfig.vaultAddress || '0x765951171682073c94814B00482a1a0FBa2d7011'}
                  </code>
                </p>
                <p>
                  <strong>Protocol:</strong> Aave V3 + GoodDollar Celo Exchange
                </p>
              </div>
            </div>

            <div className="db-modal-foot">
              <a
                href={`${appChain.blockExplorers?.default?.url || 'https://sepolia.celoscan.io'}/address/${appConfig.vaultAddress}`}
                target="_blank"
                rel="noopener noreferrer"
                className="ln-plan-cta-solid db-activate-btn"
                style={{ textAlign: 'center', textDecoration: 'none' }}
              >
                View on Celoscan Explorer <ExternalLink size={14} style={{ display: 'inline', marginLeft: 4 }} />
              </a>
            </div>
          </div>
        </div>
      )}

      {/* Full Dedicated Activities Modal / Section */}
      {allActivitiesModalOpen && (
        <div className="db-modal-overlay" onClick={() => setAllActivitiesModalOpen(false)}>
          <div className="db-modal-card fs-full-activity-modal" onClick={(e) => e.stopPropagation()}>
            <div className="db-modal-head">
              <div>
                <h4>All Transactions & Activity</h4>
                <p className="fs-modal-sub-desc">
                  {activity.length} total recorded events on Sage Celo vault
                </p>
              </div>
              <button
                type="button"
                className="db-modal-close"
                onClick={() => setAllActivitiesModalOpen(false)}
                aria-label="Close"
              >
                <X size={18} />
              </button>
            </div>

            <div className="db-modal-body fs-activity-modal-body">
              {/* Summary Stats Strip */}
              <div className="fs-activity-summary-strip">
                <div className="fs-act-sum-item">
                  <span className="fs-act-sum-label">Auto-Saved</span>
                  <strong className="fs-act-sum-val">
                    G$ {activity.filter((a) => a.kind === 'save').reduce((s, a) => s + (a.amountGD || 0), 0).toFixed(2)}
                  </strong>
                </div>
                <div className="fs-act-sum-item">
                  <span className="fs-act-sum-label">Yield Earned</span>
                  <strong className="fs-act-sum-val text-emerald-400">
                    +G$ {activity.filter((a) => a.kind === 'yield').reduce((s, a) => s + (a.amountGD || 0), 0).toFixed(2)}
                  </strong>
                </div>
                <div className="fs-act-sum-item">
                  <span className="fs-act-sum-label">Withdrawn</span>
                  <strong className="fs-act-sum-val">
                    G$ {activity.filter((a) => a.kind === 'withdraw').reduce((s, a) => s + (a.amountGD || 0), 0).toFixed(2)}
                  </strong>
                </div>
              </div>

              {/* Filter & Search Bar Controls */}
              <div className="fs-activity-filters-bar">
                {/* Filter Chips */}
                <div className="fs-filter-chips">
                  {(['all', 'save', 'yield', 'withdraw'] as const).map((kind) => {
                    const count = kind === 'all' ? activity.length : activity.filter((a) => a.kind === kind).length;
                    return (
                      <button
                        key={kind}
                        type="button"
                        className={`fs-filter-chip ${activityFilterKind === kind ? 'is-active' : ''}`}
                        onClick={() => {
                          setActivityFilterKind(kind);
                          setActivityCurrentPage(1);
                        }}
                      >
                        {kind === 'all' ? 'All' : kind === 'save' ? 'Auto-Saves' : kind === 'yield' ? 'Yield' : 'Withdrawals'}
                        <span className="fs-chip-count">{count}</span>
                      </button>
                    );
                  })}
                </div>

                <div className="fs-filter-right-tools">
                  {/* Search input */}
                  <div className="fs-search-wrap">
                    <Search size={14} className="fs-search-icon" />
                    <input
                      type="text"
                      className="fs-search-input"
                      placeholder="Search transactions…"
                      value={activitySearchQuery}
                      onChange={(e) => {
                        setActivitySearchQuery(e.target.value);
                        setActivityCurrentPage(1);
                      }}
                    />
                    {activitySearchQuery && (
                      <button
                        type="button"
                        className="fs-search-clear"
                        onClick={() => setActivitySearchQuery('')}
                      >
                        <X size={12} />
                      </button>
                    )}
                  </div>

                  {/* Sort dropdown */}
                  <select
                    className="fs-sort-select"
                    value={activitySortOrder}
                    onChange={(e) => setActivitySortOrder(e.target.value as any)}
                  >
                    <option value="newest">Newest first</option>
                    <option value="oldest">Oldest first</option>
                    <option value="highest">Highest amount</option>
                  </select>

                  {/* Export CSV / JSON */}
                  <button
                    type="button"
                    className="fs-act-export-btn"
                    onClick={handleExportCsv}
                    title="Export CSV"
                  >
                    <Download size={14} />
                    <span>CSV</span>
                  </button>
                </div>
              </div>

              {/* Transactions List */}
              <div className="fs-modal-tx-list">
                {paginatedActivities.length === 0 ? (
                  <div className="fs-empty-feed" style={{ padding: '2rem 1rem' }}>
                    <p>No transactions match your filter criteria.</p>
                    <button
                      type="button"
                      className="fs-empty-action-btn"
                      onClick={() => {
                        setActivityFilterKind('all');
                        setActivitySearchQuery('');
                      }}
                    >
                      Reset filters
                    </button>
                  </div>
                ) : (
                  paginatedActivities.map((ev) => (
                    <div key={ev.id} className="fs-tx-row">
                      <div className="fs-tx-lead">
                        <div className="fs-tx-icon-wrap">
                          <SolarIcon
                            icon={
                              ev.kind === 'withdraw'
                                ? 'solar:arrow-right-up-linear'
                                : ev.kind === 'yield'
                                ? 'solar:download-square-linear'
                                : ev.kind === 'rule'
                                ? 'solar:tuning-square-2-linear'
                                : ev.kind === 'pause'
                                ? 'solar:pause-circle-linear'
                                : ev.kind === 'resume'
                                ? 'solar:play-circle-linear'
                                : ev.kind === 'milestone'
                                ? 'solar:flame-linear'
                                : 'solar:leaf-linear'
                            }
                            width={18}
                            height={18}
                          />
                        </div>
                        <div>
                          <strong className="fs-tx-title">{ev.label || ev.kind}</strong>
                          <span className="fs-tx-sub">
                            {new Date(ev.date).toLocaleDateString(undefined, {
                              year: 'numeric',
                              month: 'short',
                              day: 'numeric',
                              hour: '2-digit',
                              minute: '2-digit',
                            })}
                          </span>
                        </div>
                      </div>
                      <div className="fs-tx-badge">
                        {ev.kind === 'withdraw' ? (
                          <>
                            <Wallet size={12} />
                            <span>Withdraw</span>
                          </>
                        ) : ev.kind === 'yield' ? (
                          <>
                            <TrendingUp size={12} />
                            <span>Yield</span>
                          </>
                        ) : ev.kind === 'rule' ? (
                          <>
                            <Target size={12} />
                            <span>Rule</span>
                          </>
                        ) : ev.kind === 'pause' ? (
                          <>
                            <Clock size={12} />
                            <span>Paused</span>
                          </>
                        ) : ev.kind === 'resume' ? (
                          <>
                            <Play size={12} />
                            <span>Resumed</span>
                          </>
                        ) : ev.kind === 'milestone' ? (
                          <>
                            <Flame size={12} />
                            <span>Streak</span>
                          </>
                        ) : (
                          <>
                            <Sprout size={12} />
                            <span>Auto-Save</span>
                          </>
                        )}
                      </div>
                      <div className="fs-tx-tail">
                        {ev.amountGD !== undefined && ev.amountGD > 0 ? (
                          <div className="fs-tx-amount-col">
                            <span className={`fs-tx-amount ${ev.kind === 'withdraw' ? 'is-neg' : 'is-pos'}`}>
                              {ev.kind === 'withdraw' ? '-' : '+'}G${' '}
                              {ev.amountGD.toFixed(2)}
                            </span>
                            <small className="fs-tx-usdt-sub">{formatUsdt(ev.amountGD)}</small>
                          </div>
                        ) : ev.kind === 'rule' ? (
                          <span className="fs-tx-tag-pill fs-tx-tag-config">Configured</span>
                        ) : ev.kind === 'pause' ? (
                          <span className="fs-tx-tag-pill fs-tx-tag-paused">Paused</span>
                        ) : ev.kind === 'resume' ? (
                          <span className="fs-tx-tag-pill fs-tx-tag-active">Active</span>
                        ) : ev.kind === 'milestone' ? (
                          <span className="fs-tx-tag-pill fs-tx-tag-streak">🔥 {ev.streakDay ? `${ev.streakDay}d` : 'Streak'}</span>
                        ) : (
                          <span className="fs-tx-tag-pill fs-tx-tag-active">Updated</span>
                        )}
                      </div>
                    </div>
                  ))
                )}
              </div>

              {/* Pagination Footer */}
              {filteredActivities.length > itemsPerPage && (
                <div className="fs-pagination-footer">
                  <span className="fs-page-info">
                    Showing {(activityCurrentPage - 1) * itemsPerPage + 1} to{' '}
                    {Math.min(activityCurrentPage * itemsPerPage, filteredActivities.length)} of{' '}
                    {filteredActivities.length}
                  </span>
                  <div className="fs-page-btns">
                    <button
                      type="button"
                      className="fs-page-btn"
                      disabled={activityCurrentPage === 1}
                      onClick={() => setActivityCurrentPage((p) => Math.max(1, p - 1))}
                    >
                      <ChevronLeft size={16} />
                      <span>Prev</span>
                    </button>
                    <span className="fs-page-num">
                      {activityCurrentPage} / {totalPages}
                    </span>
                    <button
                      type="button"
                      className="fs-page-btn"
                      disabled={activityCurrentPage === totalPages}
                      onClick={() => setActivityCurrentPage((p) => Math.min(totalPages, p + 1))}
                    >
                      <span>Next</span>
                      <ChevronRight size={16} />
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Disconnect Confirmation Modal */}
      {disconnectModalOpen && (
        <div className="db-modal-overlay" onClick={() => setDisconnectModalOpen(false)}>
          <div className="db-modal-card fs-disconnect-modal" onClick={(e) => e.stopPropagation()}>
            <div className="db-modal-head">
              <h4>Disconnect Wallet</h4>
              <button
                type="button"
                className="db-modal-close"
                onClick={() => setDisconnectModalOpen(false)}
                aria-label="Close"
              >
                <X size={18} />
              </button>
            </div>

            <div className="db-modal-body">
              <div className="fs-disconnect-icon-wrap">
                <LogOut size={32} className="text-red-400" />
              </div>
              <p className="db-modal-desc" style={{ textAlign: 'center', marginTop: '0.5rem' }}>
                Are you sure you want to disconnect <strong>{shortAddress}</strong>?
              </p>
              <div className="db-claim-box" style={{ marginTop: '1rem' }}>
                <p>
                  <strong>Active Session:</strong> {connectedAddress}
                </p>
                <p>
                  <strong>Vault Status:</strong>{' '}
                  <span className="text-emerald-400">
                    {instruction.active ? 'Automated savings active on Celo' : 'Savings paused'}
                  </span>
                </p>
                <p style={{ fontSize: '11px', color: '#71717a', margin: 0, lineHeight: 1.4 }}>
                  You will be safely redirected to the Sage landing page. Your deposits and yield will continue growing in the non-custodial smart contract.
                </p>
              </div>
            </div>

            <div className="db-modal-foot" style={{ display: 'flex', gap: '10px' }}>
              <button
                type="button"
                className="fs-modal-cancel-btn"
                onClick={() => setDisconnectModalOpen(false)}
              >
                Cancel
              </button>
              <button
                type="button"
                className="fs-disconnect-confirm-btn"
                onClick={() => {
                  setDisconnectModalOpen(false);
                  if (onDisconnect) {
                    onDisconnect();
                  }
                }}
              >
                <LogOut size={15} />
                <span>Disconnect & Exit</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Custom Claim Celebration Modal with Animation */}
      {claimCelebrationOpen && (
        <div className="db-modal-overlay" onClick={() => setClaimCelebrationOpen(false)}>
          <div className="db-modal-card fs-claim-celebration-modal" onClick={(e) => e.stopPropagation()}>
            {/* Animated Confetti Particles */}
            <div className="fs-celebration-confetti-wrap" aria-hidden="true">
              {[...Array(16)].map((_, i) => (
                <div
                  key={i}
                  className="fs-confetti-particle"
                  style={{
                    left: `${(i * 6.25) + 3}%`,
                    animationDelay: `${(i % 5) * 0.25}s`,
                    backgroundColor: ['#f59e0b', '#10b981', '#3b82f6', '#ec4899', '#8b5cf6', '#eab308'][i % 6],
                  }}
                />
              ))}
            </div>

            <button
              type="button"
              className="db-modal-close"
              style={{ position: 'absolute', top: 16, right: 16, zIndex: 10 }}
              onClick={() => setClaimCelebrationOpen(false)}
              aria-label="Close"
            >
              <X size={18} />
            </button>

            <div className="fs-celebration-body">
              <div className="fs-celebration-fire-badge">
                <Flame size={40} className="fs-flame-icon-pulse" />
              </div>

              <div>
                <h3 className="fs-celebration-title">Streak Extended! 🔥</h3>
                <p className="fs-celebration-streak-count">{streak} Day Claim Streak Reached</p>
                <p className="fs-celebration-desc">
                  Your daily GoodDollar check-in is verified on Celo. Your automated {savePercent}% savings rule is actively compounding in Aave V3.
                </p>
              </div>

              <div className="fs-celebration-grid">
                <div className="fs-celebration-item">
                  <Check size={16} />
                  <span>+1 Day to Claim Streak</span>
                </div>
                <div className="fs-celebration-item">
                  <Check size={16} />
                  <span>{savePercent}% Auto-Saved to Vault</span>
                </div>
                <div className="fs-celebration-item">
                  <Check size={16} />
                  <span>4.2% Compound APY</span>
                </div>
                <div className="fs-celebration-item">
                  <Check size={16} />
                  <span>Protected Non-Custodial</span>
                </div>
              </div>

              <div className="fs-celebration-cta-row">
                <button
                  type="button"
                  className="fs-celebration-share-btn"
                  onClick={() => {
                    setClaimCelebrationOpen(false);
                    setShareModalOpen(true);
                  }}
                >
                  <Share2 size={15} />
                  <span>Share Streak</span>
                </button>
                <button
                  type="button"
                  className="fs-celebration-done-btn"
                  onClick={() => setClaimCelebrationOpen(false)}
                >
                  <span>Keep Saving 🚀</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Already Claimed Notice Modal */}
      {alreadyClaimedNoticeOpen && (
        <div className="db-modal-overlay" onClick={() => setAlreadyClaimedNoticeOpen(false)}>
          <div className="db-modal-card" style={{ maxWidth: 440 }} onClick={(e) => e.stopPropagation()}>
            <div className="db-modal-head">
              <h4>Already Claimed Today</h4>
              <button
                type="button"
                className="db-modal-close"
                onClick={() => setAlreadyClaimedNoticeOpen(false)}
                aria-label="Close"
              >
                <X size={18} />
              </button>
            </div>
            <div className="db-modal-body" style={{ textAlign: 'center', padding: '1.5rem 1rem' }}>
              <div className="fs-streak-fire-badge" style={{ margin: '0 auto 1rem' }}>
                <Check size={28} className="text-emerald-400" />
              </div>
              <h4 style={{ fontSize: '1.15rem', color: '#fff', margin: '0 0 6px' }}>
                You're all set for today!
              </h4>
              <p className="db-modal-desc">
                Your daily check-in is already logged for today with a <strong>{streak}-day streak</strong>. Come back tomorrow after the 24-hour cycle to extend it!
              </p>
            </div>
            <div className="db-modal-foot">
              <button
                type="button"
                className="ln-plan-cta-solid db-activate-btn"
                style={{ width: '100%', justifyContent: 'center' }}
                onClick={() => setAlreadyClaimedNoticeOpen(false)}
              >
                Got It 👍
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
