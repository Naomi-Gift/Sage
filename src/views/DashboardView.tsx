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
  Repeat2,
  Search,
  Share2,
  ShieldCheck,
  Sparkles,
  Sprout,
  Target,
  Wallet,
  X,
} from 'lucide-react';
import type { ActivityEvent, Instruction, Position } from '../types';
import { SolarIcon } from '../components/landing/SolarIcon';
import { UnicornBackground } from '../components/landing/UnicornBackground';
import { appConfig, appChain } from '../config';
import { writeWithdraw, quoteGdToUsdt } from '../contract';
import { makePlatformUrl, copyToClipboard, type SharePlatform } from '../lib/shareLinks';
import type { WalletClient } from 'viem';

type DashboardViewProps = {
  instruction: Instruction;
  position: Position;
  gdBalance: number | null;
  streak: number;
  apy: number;
  activity: ActivityEvent[];
  pausing: boolean;
  connectedAddress?: string;
  walletClient?: WalletClient;
  saving?: boolean;
  onStreakChange?: (streak: number) => void;
  onNavigateHome: () => void;
  onTogglePause: () => void;
  onAddActivity: (event: ActivityEvent) => void;
  onInstructionChange: (instruction: Instruction) => void;
  onSaveInstruction: () => Promise<void>;
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
  walletClient,
  saving,
  onStreakChange,
  onNavigateHome,
  onTogglePause,
  onAddActivity,
  onInstructionChange,
  onSaveInstruction,
  onDisconnect,
}: DashboardViewProps) {
  const [sidebarExpanded, setSidebarExpanded] = useState(true);
  const [ruleModalOpen, setRuleModalOpen] = useState(false);
  const [withdrawModalOpen, setWithdrawModalOpen] = useState(false);
  const [withdrawAmount, setWithdrawAmount] = useState('');
  const [withdrawing, setWithdrawing] = useState(false);
  const [withdrawError, setWithdrawError] = useState('');
  const [claimInfoOpen, setClaimInfoOpen] = useState(false);
  const [streakModalOpen, setStreakModalOpen] = useState(false);
  const [scheduleModalOpen, setScheduleModalOpen] = useState(false);
  const [vaultModalOpen, setVaultModalOpen] = useState(false);
  const [allActivitiesModalOpen, setAllActivitiesModalOpen] = useState(false);
  const [shareModalOpen, setShareModalOpen] = useState(false);
  const [disconnectModalOpen, setDisconnectModalOpen] = useState(false);
  const [claimCelebrationOpen, setClaimCelebrationOpen] = useState(false);
  const [alreadyClaimedNoticeOpen, setAlreadyClaimedNoticeOpen] = useState(false);
  const [copiedLink, setCopiedLink] = useState(false);
  const [activitySearchQuery, setActivitySearchQuery] = useState('');
  const [activityFilterKind, setActivityFilterKind] = useState<'all' | 'save' | 'yield' | 'withdraw'>('all');
  const [activitySortOrder, setActivitySortOrder] = useState<'newest' | 'oldest' | 'highest'>('newest');
  const [activityCurrentPage, setActivityCurrentPage] = useState(1);
  const [activeTab, setActiveTab] = useState<'history' | 'upcoming'>('history');
  const [usdtRate, setUsdtRate] = useState(0.000125);

  const todayKey = new Date().toISOString().slice(0, 10);
  const isCheckedInToday = localStorage.getItem('sage.lastCheckIn') === todayKey;

  useEffect(() => {
    quoteGdToUsdt(1000).then((usdt) => {
      if (usdt > 0) {
        setUsdtRate(usdt / 1000);
      }
    }).catch(() => {});
  }, []);

  const total = position.principalGD + position.yieldGD;
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
    if (!walletClient || !connectedAddress) {
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
      const stableUnits = BigInt(Math.floor(amountNum * 1e18));
      const minGdUnits = BigInt(Math.floor(amountNum * 0.95 * 100)); // 5% slippage
      const txHash = await writeWithdraw(walletClient, connectedAddress as `0x${string}`, stableUnits, minGdUnits);
      if (onAddActivity) {
        onAddActivity({
          id: `tx-w-${Date.now()}`,
          kind: 'withdraw',
          date: new Date().toISOString().slice(0, 10),
          amountGD: amountNum,
          txHash,
        });
      }
      setWithdrawModalOpen(false);
      setWithdrawAmount('');
    } catch (err: any) {
      setWithdrawError(err.shortMessage || err.message || 'Withdrawal failed');
    } finally {
      setWithdrawing(false);
    }
  }

  function handleCheckIn() {
    const todayKey = new Date().toISOString().slice(0, 10);
    const lastCheckIn = localStorage.getItem('sage.lastCheckIn');
    if (lastCheckIn === todayKey) {
      setAlreadyClaimedNoticeOpen(true);
      return;
    }
    const nextStreak = streak + 1;
    localStorage.setItem('sage.lastCheckIn', todayKey);
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

          {connectedAddress && (
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
                  <span className="fs-rail-profile-network">Celo Sepolia</span>
                </div>
              )}
            </div>
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
              <button
                type="button"
                className="fs-status-pill"
                onClick={() => setRuleModalOpen(true)}
                title="Configure savings rule"
              >
                <SolarIcon icon="solar:restart-linear" width={14} height={14} />
                <span>{instruction.active ? `${savePercent}% Auto-Saving` : 'Savings Paused'}</span>
              </button>

              {/* Connected Address with Logout Icon at Top-Right */}
              <button
                type="button"
                className="fs-wallet-chip"
                title={connectedAddress ? `Connected: ${connectedAddress}\nClick to disconnect` : 'Connected Wallet\nClick to disconnect'}
                onClick={() => setDisconnectModalOpen(true)}
              >
                <span className="fs-wallet-address">{shortAddress}</span>
                <LogOut size={14} className="fs-logout-icon" />
              </button>
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
                      {streak >= 100
                        ? '💎 Diamond Saver'
                        : streak >= 30
                        ? '🔥 Flame Master'
                        : streak >= 7
                        ? '⚡ 7-Day Champion'
                        : '🌱 Growing Saver'}
                    </span>
                  </div>
                  <p className="fs-streak-sub-text">
                    {isCheckedInToday
                      ? 'You claimed and auto-saved today! Keep the momentum alive tomorrow.'
                      : 'Claim your daily GoodDollar today to grow your streak and boost automated vault yield.'}
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
                  title="Share your claim streak"
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
                  <strong className="fs-stat-value">
                    G$ {total.toLocaleString(undefined, {
                      minimumFractionDigits: 2,
                      maximumFractionDigits: 2,
                    })}
                  </strong>
                  <div className="fs-stat-footer">
                    <span className="fs-stat-sub">{formatUsdt(total)}</span>
                    <span className="fs-stat-tag">Non-custodial</span>
                  </div>
                </div>
              </div>

              {/* Card 3: Yield Earned */}
              <div className="fs-stat-card">
                <div className="fs-stat-card-top">
                  <div className="fs-stat-icon fs-stat-icon-yield">
                    <ArrowDownLeft size={18} />
                  </div>
                  <span className="fs-stat-pill fs-pill-amber">4.2% APY</span>
                </div>
                <div className="fs-stat-body">
                  <span className="fs-stat-label">Yield earned</span>
                  <strong className="fs-stat-value">
                    +G$ {position.yieldGD.toFixed(2)}
                  </strong>
                  <div className="fs-stat-footer">
                    <span className="fs-stat-sub">{formatUsdt(position.yieldGD)}</span>
                    <span className="fs-stat-tag">Aave V3</span>
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
                    <button
                      type="button"
                      className="fs-action-btn fs-add-btn"
                      aria-label="Add Rule"
                      title="Add / Edit Rule"
                      onClick={() => setRuleModalOpen(true)}
                    >
                      <Plus size={15} />
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
                                      : 'solar:transfer-horizontal-linear'
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
                                <Wallet size={12} />
                              ) : ev.kind === 'yield' ? (
                                <Repeat2 size={12} />
                              ) : (
                                <Sprout size={12} />
                              )}
                              <span>{ev.kind}</span>
                            </div>
                            <div className="fs-tx-tail">
                              <span className="fs-tx-doc">
                                <SolarIcon
                                  icon="solar:document-text-linear"
                                  width={14}
                                  height={14}
                                />
                              </span>
                              <div className="fs-tx-amount-col">
                                <span className={`fs-tx-amount ${ev.kind === 'withdraw' ? 'is-neg' : 'is-pos'}`}>
                                  {ev.kind === 'withdraw' ? '-' : '+'}G${' '}
                                  {(ev.amountGD ?? 0).toFixed(2)}
                                </span>
                                <small className="fs-tx-usdt-sub">{formatUsdt(ev.amountGD ?? 0)}</small>
                              </div>
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
                    kind: 'save',
                    label: `Updated rule to ${savePercent}% (${instruction.goalLabel || 'Savings'})`,
                    amountGD: 0,
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

      {/* Withdraw Modal */}
      {withdrawModalOpen && (
        <div className="db-modal-overlay" onClick={() => setWithdrawModalOpen(false)}>
          <div className="db-modal-card" onClick={(e) => e.stopPropagation()}>
            <div className="db-modal-head">
              <h4>Withdraw to G$</h4>
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
                Your position redeems directly from Aave V3 on Celo and swaps back to G$.
                No lock-up period.
              </p>

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

              {withdrawError && <p className="db-error">{withdrawError}</p>}
            </div>

            <div className="db-modal-foot">
              <button
                type="button"
                className="ln-plan-cta-solid db-activate-btn"
                disabled={withdrawing || total <= 0}
                onClick={handleWithdraw}
              >
                {withdrawing ? 'Submitting to Aave…' : 'Withdraw to G$ →'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Daily Streak Modal */}
      {streakModalOpen && (
        <div className="db-modal-overlay" onClick={() => setStreakModalOpen(false)}>
          <div className="db-modal-card" onClick={(e) => e.stopPropagation()}>
            <div className="db-modal-head">
              <h4>Daily Streak & Check-in</h4>
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
                  Check in daily and claim your GoodDollar to maintain your streak and maximize compound yield.
                </p>
              </div>

              <div className="db-claim-box">
                <p>
                  <strong>Today's Status:</strong>{' '}
                  {localStorage.getItem('sage.lastCheckIn') === new Date().toISOString().slice(0, 10) ? (
                    <span className="text-emerald-400">Checked In ✅</span>
                  ) : (
                    <span className="text-amber-400">Pending Check-in</span>
                  )}
                </p>
                <p>
                  <strong>Savings Automation:</strong>{' '}
                  <span className="text-emerald-400">Active on Celo Sepolia</span>
                </p>
              </div>
            </div>

            <div className="db-modal-foot">
              <button
                type="button"
                className="ln-plan-cta-solid db-activate-btn"
                onClick={handleCheckIn}
              >
                Check in for Today 🔥
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Share Claim Streak Modal */}
      {shareModalOpen && (
        <div className="db-modal-overlay" onClick={() => setShareModalOpen(false)}>
          <div className="db-modal-card fs-share-streak-modal" onClick={(e) => e.stopPropagation()}>
            <div className="db-modal-head">
              <h4>Share Your Claim Streak</h4>
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
                    <span className="fs-share-card-sub">Automated non-custodial savings on Celo</span>
                  </div>
                </div>
                <div className="fs-share-metrics-row">
                  <div className="fs-share-metric">
                    <span className="fs-share-metric-lbl">Total Vault Assets</span>
                    <strong className="fs-share-metric-val">G$ {total.toLocaleString()}</strong>
                  </div>
                  <div className="fs-share-metric">
                    <span className="fs-share-metric-lbl">Compound APY</span>
                    <strong className="fs-share-metric-val text-emerald-400">4.2% APY</strong>
                  </div>
                </div>
              </div>

              <p className="fs-share-instructions">
                Flex your savings discipline and invite fellow community members to grow their GoodDollar yield automatically.
              </p>

              <div className="fs-share-buttons-grid">
                <a
                  href={makePlatformUrl('twitter', {
                    streak,
                    savedAmountGD: total,
                    apy: 4.2,
                    goalLabel: instruction.goalLabel,
                    address: connectedAddress,
                  })}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="fs-share-btn fs-share-twitter"
                >
                  <span>Share on X</span>
                  <ExternalLink size={13} />
                </a>

                <a
                  href={makePlatformUrl('telegram', {
                    streak,
                    savedAmountGD: total,
                    apy: 4.2,
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
                    apy: 4.2,
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

                <a
                  href={makePlatformUrl('warpcast', {
                    streak,
                    savedAmountGD: total,
                    apy: 4.2,
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
              </div>
            </div>

            <div className="db-modal-foot">
              <button
                type="button"
                className="ln-plan-cta-solid db-activate-btn"
                style={{ width: '100%', justifyContent: 'center' }}
                onClick={async () => {
                  const shareTxt = `${streak} day streak 🔥 G$ ${Math.round(total).toLocaleString()} saved with @SageApp. Try it: ${window.location.origin}`;
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
                                : 'solar:transfer-horizontal-linear'
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
                          <Wallet size={12} />
                        ) : ev.kind === 'yield' ? (
                          <Repeat2 size={12} />
                        ) : (
                          <Sprout size={12} />
                        )}
                        <span>{ev.kind}</span>
                      </div>
                      <div className="fs-tx-tail">
                        <div className="fs-tx-amount-col">
                          <span className={`fs-tx-amount ${ev.kind === 'withdraw' ? 'is-neg' : 'is-pos'}`}>
                            {ev.kind === 'withdraw' ? '-' : '+'}G${' '}
                            {(ev.amountGD ?? 0).toFixed(2)}
                          </span>
                          <small className="fs-tx-usdt-sub">{formatUsdt(ev.amountGD ?? 0)}</small>
                        </div>
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
