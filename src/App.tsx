import { useEffect, useState, useMemo } from 'react';
import { type WalletClient } from 'viem';
import { Shell } from './components/Shell';
import {
  connectInjectedWallet,
  readGDollarBalance,
  readInstruction,
  readPosition,
  writeInstruction,
  writePause,
} from './contract';
import { appChain, appConfig } from './config';
import { DashboardView } from './views/DashboardView';
import { SetupView } from './views/SetupView';
import {
  type ActivityEvent,
  type Instruction,
  type Milestone,
  type Position,
  initialInstruction,
  initialPosition,
  PROTOCOL_APY,
} from './types';

type View = 'setup' | 'dashboard';

export function App() {
  const [view, setView] = useState<View>('setup');
  const [address, setAddress] = useState<`0x${string}`>();
  const [walletClient, setWalletClient] = useState<WalletClient>();
  const [instruction, setInstruction] = useState<Instruction>(initialInstruction);
  const [position, setPosition] = useState<Position>(initialPosition);
  const [gdBalance, setGdBalance] = useState<number | null>(null);
  const [streak, setStreak] = useState(() => Number(localStorage.getItem('sage.streak') || 0));
  const [activity, setActivity] = useState<ActivityEvent[]>([]);
  const [notice, setNotice] = useState('');
  const [noticeType, setNoticeType] = useState<'info' | 'success' | 'error'>('info');
  const [noticeTxUrl, setNoticeTxUrl] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [pausing, setPausing] = useState(false);
  const apy = PROTOCOL_APY;

  // Dynamic milestones derived from live on-chain position & check-in streak
  const milestones = useMemo<Milestone[]>(() => {
    const totalSaved = position.principalGD + position.yieldGD;
    return [
      { kind: '7d',    label: '7-day streak',    reached: streak >= 7,    icon: '⚡' },
      { kind: '30d',   label: '30-day streak',   reached: streak >= 30,   icon: '🔥' },
      { kind: '100d',  label: '100-day streak',  reached: streak >= 100,  icon: '💎' },
      { kind: '500g',  label: '500 G$ saved',    reached: totalSaved >= 500,  icon: '🌿' },
      { kind: '1000g', label: '1,000 G$ saved',  reached: totalSaved >= 1000, icon: '🌳' },
      { kind: '2000g', label: '2,000 G$ saved',  reached: totalSaved >= 2000, icon: '🏆' },
    ];
  }, [streak, position]);

  function navigateTo(nextView: View) {
    if (nextView === 'dashboard') {
      if (!address && !walletClient) {
        // Strictly protect dashboard - unauthorized access redirects to landing
        window.history.replaceState(null, '', '/');
        setView('setup');
        return;
      }
      if (window.location.pathname !== '/dashboard') {
        window.history.pushState(null, '', '/dashboard');
      }
      setView('dashboard');
    } else {
      if (window.location.pathname !== '/') {
        window.history.pushState(null, '', '/');
      }
      setView('setup');
    }
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  // Handle route protection on load & browser back/forward navigation
  useEffect(() => {
    function enforceRoute() {
      const path = window.location.pathname;
      if (path === '/dashboard') {
        if (!address && !walletClient) {
          // Strictly protect dashboard route if no active wallet is authenticated
          window.history.replaceState(null, '', '/');
          setView('setup');
        } else {
          setView('dashboard');
        }
      } else {
        setView('setup');
      }
    }

    enforceRoute();
    window.addEventListener('popstate', enforceRoute);
    return () => window.removeEventListener('popstate', enforceRoute);
  }, [address, walletClient]);

  // Auto-dismiss all error, success, and info alerts after 3 seconds
  useEffect(() => {
    if (!notice) return;
    const timer = window.setTimeout(() => {
      setNotice('');
      setNoticeTxUrl(null);
    }, 3000);
    return () => window.clearTimeout(timer);
  }, [notice]);

  function showNotice(msg: string, type: 'info' | 'success' | 'error' = 'info', txUrl?: string) {
    setNotice(msg);
    setNoticeType(type);
    setNoticeTxUrl(txUrl ?? null);
  }

  async function loadChainState(addr: `0x${string}`) {
    await Promise.all([
      // G$ wallet balance
      readGDollarBalance(addr, appConfig.gDollarAddress)
        .then(setGdBalance)
        .catch(() => {}),

      // Vault instruction + position
      Promise.all([readInstruction(addr), readPosition(addr)])
        .then(([onChainInstruction, onChainPosition]) => {
          if (onChainInstruction) {
            setInstruction((prev) => ({ ...onChainInstruction, goalTargetGD: prev.goalTargetGD }));
          }
          if (onChainPosition) setPosition(onChainPosition);
        })
        .catch(() => {}),
    ]);
  }

  async function connect() {
    try {
      const connected = await connectInjectedWallet();
      setAddress(connected.address);
      setWalletClient(connected.walletClient);
      showNotice('');
      await loadChainState(connected.address);
      localStorage.setItem('sage.setupComplete', 'true');
      localStorage.setItem('sage.userAddress', connected.address);
      
      // Navigate and unlock protected /dashboard route
      if (window.location.pathname !== '/dashboard') {
        window.history.pushState(null, '', '/dashboard');
      }
      setView('dashboard');
      window.scrollTo({ top: 0, behavior: 'smooth' });
      return connected;
    } catch (error) {
      showNotice(error instanceof Error ? error.message : 'Wallet connection failed.', 'error');
      return undefined;
    }
  }

  function handleDisconnect() {
    // 1. Reset connected wallet & on-chain state
    setAddress(undefined);
    setWalletClient(undefined);
    setGdBalance(null);
    setInstruction(initialInstruction);
    setPosition(initialPosition);

    // 2. Completely wipe local & session storage auth keys
    localStorage.removeItem('sage.setupComplete');
    localStorage.removeItem('sage.userAddress');
    localStorage.removeItem('sage.walletConnected');
    sessionStorage.clear();

    // 3. Clear transient notices
    setNotice('');
    setNoticeTxUrl(null);

    // 4. Force navigation to landing page and seal /dashboard
    window.history.replaceState(null, '', '/');
    setView('setup');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  async function saveInstruction(nextWalletClient = walletClient, nextAddress = address) {
    try {
      setSaving(true);
      showNotice('Submitting transaction…', 'info');

      if (nextWalletClient && nextAddress) {
        const hash = await writeInstruction(
          nextWalletClient,
          nextAddress,
          instruction.percentBps,
          instruction.goalLabel
        );
        const explorerBase = appChain.blockExplorers?.default?.url ?? '';
        const txUrl = explorerBase ? `${explorerBase}/tx/${hash}` : '';
        showNotice('✅ Savings rule is active!', 'success', txUrl || undefined);
        await loadChainState(nextAddress);
      } else {
        showNotice(
          `Preview: Sage will save ${instruction.percentBps / 100}% of each claim. Connect a wallet to activate on-chain.`,
          'info'
        );
      }

      setInstruction((prev) => ({ ...prev, active: instruction.percentBps > 0 }));
      localStorage.setItem('sage.setupComplete', 'true');
    } catch (error) {
      showNotice(error instanceof Error ? error.message : 'Could not save instruction.', 'error');
    } finally {
      window.setTimeout(() => setSaving(false), 800);
    }
  }

  async function togglePause() {
    setPausing(true);
    try {
      if (instruction.active) {
        if (walletClient && address) await writePause(walletClient, address);
        setInstruction((prev) => ({ ...prev, active: false }));
        showNotice('✅ Saving paused. Your savings keep earning yield.', 'success');
      } else {
        if (walletClient && address) {
          await writeInstruction(walletClient, address, instruction.percentBps, instruction.goalLabel);
        }
        setInstruction((prev) => ({ ...prev, active: true }));
        showNotice('✅ Saving resumed. Sage is watching again.', 'success');
      }
    } catch (error) {
      showNotice(error instanceof Error ? error.message : 'Could not update savings status.', 'error');
    } finally {
      window.setTimeout(() => setPausing(false), 400);
    }
  }

  function addActivity(event: ActivityEvent) {
    setActivity((prev) => [event, ...prev]);
    if (event.kind === 'withdraw' && address) {
      loadChainState(address).catch(() => {});
    }
  }

  return (
    <Shell>
      {notice && (
        <div className={`notice notice-${noticeType}`}>
          {notice}
          {noticeTxUrl && (
            <a
              href={noticeTxUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="notice-tx-link"
            >
              View transaction ↗
            </a>
          )}
        </div>
      )}

      {view === 'setup' && (
        <SetupView
          onConnect={connect}
          connected={Boolean(address && walletClient)}
          connectedAddress={address}
          saving={saving}
        />
      )}

      {view === 'dashboard' && address && (
        <DashboardView
          instruction={instruction}
          position={position}
          gdBalance={gdBalance}
          streak={streak}
          apy={apy}
          activity={activity}
          pausing={pausing}
          connectedAddress={address}
          walletClient={walletClient}
          saving={saving}
          onStreakChange={setStreak}
          onNavigateHome={() => navigateTo('setup')}
          onTogglePause={togglePause}
          onAddActivity={addActivity}
          onInstructionChange={setInstruction}
          onSaveInstruction={() => saveInstruction(walletClient, address)}
          onDisconnect={handleDisconnect}
        />
      )}
    </Shell>
  );
}
