import { useEffect, useState, useMemo, useCallback } from 'react';
import { Shell } from './components/Shell';
import { useSageIdentity } from './auth/useSageIdentity';
import { useToast } from './context/ToastContext';
import {
  readGDollarBalance,
  readInstruction,
  readPosition,
  writeInstruction,
  writePause,
  writeWithdraw,
} from './contract';
import { appChain, appConfig } from './config';
import { DashboardView } from './views/DashboardView';
import { SetupView } from './views/SetupView';
import { captureInboundReferral } from './lib/referral';
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
  const { ready, authenticated, address, login, logout, getWalletClient } = useSageIdentity();
  const toast = useToast();

  const [instruction, setInstruction] = useState<Instruction>(initialInstruction);
  const [position, setPosition] = useState<Position>(initialPosition);
  const [gdBalance, setGdBalance] = useState<number | null>(null);
  const [streak, setStreak] = useState(() => Number(localStorage.getItem('sage.streak') || 0));
  const [activity, setActivity] = useState<ActivityEvent[]>([]);
  const [saving, setSaving] = useState(false);
  const [pausing, setPausing] = useState(false);
  const apy = PROTOCOL_APY;

  // Dynamic milestones derived from live on-chain position & check-in streak
  const milestones = useMemo<Milestone[]>(() => {
    const totalSaved = position.principalGD + position.yieldGD;
    return [
      { kind: '7d',    label: '7-day streak',    reached: streak >= 7,    icon: 'zap' },
      { kind: '30d',   label: '30-day streak',   reached: streak >= 30,   icon: 'flame' },
      { kind: '100d',  label: '100-day streak',  reached: streak >= 100,  icon: 'diamond' },
      { kind: '500g',  label: '500 G$ saved',    reached: totalSaved >= 500,  icon: 'sprout' },
      { kind: '1000g', label: '1,000 G$ saved',  reached: totalSaved >= 1000, icon: 'tree' },
      { kind: '2000g', label: '2,000 G$ saved',  reached: totalSaved >= 2000, icon: 'trophy' },
    ];
  }, [streak, position]);

  function navigateTo(nextView: View) {
    if (nextView === 'dashboard') {
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

  // Handle route changes on load & browser back/forward navigation
  useEffect(() => {
    function enforceRoute() {
      const path = window.location.pathname;
      if (path === '/dashboard') {
        setView('dashboard');
      } else {
        setView('setup');
      }
    }

    enforceRoute();
    captureInboundReferral();
    window.addEventListener('popstate', enforceRoute);
    return () => window.removeEventListener('popstate', enforceRoute);
  }, []);

  const loadChainState = useCallback(async (addr: `0x${string}`) => {
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
  }, []);

  // Hydrate blockchain state whenever authenticated canonical address is available
  useEffect(() => {
    if (authenticated && address) {
      loadChainState(address);
    }
  }, [authenticated, address, loadChainState]);

  // Disconnect / logout handler
  async function handleDisconnect() {
    try {
      await logout();
    } catch {
      // ignore logout errors
    }

    // Reset transient Sage on-chain state
    setGdBalance(null);
    setInstruction(initialInstruction);
    setPosition(initialPosition);

    // Force navigation to landing page
    window.history.replaceState(null, '', '/');
    setView('setup');
    window.scrollTo({ top: 0, behavior: 'smooth' });
    toast.info('Disconnected wallet.');
  }

  // Save / update savings instruction
  async function saveInstruction() {
    if (!authenticated || !address) {
      toast.error('Please log in with Privy first.');
      return;
    }

    try {
      setSaving(true);
      toast.info('Submitting transaction to Celo Sepolia…');

      const walletClient = await getWalletClient();
      const hash = await writeInstruction(
        walletClient,
        address,
        instruction.percentBps,
        instruction.goalLabel
      );

      const explorerBase = appChain.blockExplorers?.default?.url ?? '';
      const txUrl = explorerBase ? `${explorerBase}/tx/${hash}` : '';
      toast.success('Savings rule is active on Celo!', 'Rule Updated', txUrl || undefined);
      await loadChainState(address);

      setInstruction((prev) => ({ ...prev, active: instruction.percentBps > 0 }));
    } catch (error) {
      toast.error(error);
    } finally {
      window.setTimeout(() => setSaving(false), 800);
    }
  }

  // Pause / unpause savings
  async function togglePause() {
    if (!authenticated || !address) {
      toast.error('Please log in with Privy first.');
      return;
    }

    setPausing(true);
    try {
      const walletClient = await getWalletClient();
      if (instruction.active) {
        await writePause(walletClient, address);
        setInstruction((prev) => ({ ...prev, active: false }));
        toast.success('Saving paused. Your funds continue earning yield in Aave.');
      } else {
        await writeInstruction(walletClient, address, instruction.percentBps, instruction.goalLabel);
        setInstruction((prev) => ({ ...prev, active: true }));
        toast.success('Saving resumed. Sage agent is active.');
      }
      await loadChainState(address);
    } catch (error) {
      toast.error(error);
    } finally {
      window.setTimeout(() => setPausing(false), 400);
    }
  }

  // Withdraw callback passed to DashboardView
  async function handleWithdraw(amountGD: number): Promise<string> {
    if (!authenticated || !address) {
      throw new Error('Please log in with Privy first.');
    }

    toast.info('Submitting withdrawal transaction…');
    const walletClient = await getWalletClient();
    const stableUnits = BigInt(Math.floor(amountGD * 1e18));
    const minGdUnits = BigInt(Math.floor(amountGD * 0.95 * 100)); // 5% slippage

    const hash = await writeWithdraw(walletClient, address, stableUnits, minGdUnits);
    const explorerBase = appChain.blockExplorers?.default?.url ?? '';
    const txUrl = explorerBase ? `${explorerBase}/tx/${hash}` : '';
    toast.success(`Successfully withdrew G$ ${amountGD.toLocaleString()}!`, 'Withdrawal Complete', txUrl || undefined);

    await loadChainState(address);
    return hash;
  }

  function addActivity(event: ActivityEvent) {
    setActivity((prev) => [event, ...prev]);
    if (event.kind === 'withdraw' && address) {
      loadChainState(address).catch(() => {});
    }
  }

  return (
    <Shell>
      {view === 'setup' && (
        <SetupView
          onConnect={login}
          onLaunchApp={() => navigateTo('dashboard')}
          connected={Boolean(authenticated && address)}
          connectedAddress={address}
          saving={saving}
        />
      )}

      {view === 'dashboard' && (
        <DashboardView
          instruction={instruction}
          position={position}
          gdBalance={gdBalance}
          streak={streak}
          apy={apy}
          activity={activity}
          pausing={pausing}
          connectedAddress={address}
          authenticated={Boolean(authenticated && address)}
          saving={saving}
          onStreakChange={setStreak}
          onNavigateHome={() => navigateTo('setup')}
          onTogglePause={togglePause}
          onAddActivity={addActivity}
          onInstructionChange={setInstruction}
          onSaveInstruction={saveInstruction}
          onWithdraw={handleWithdraw}
          onConnect={login}
          onDisconnect={handleDisconnect}
        />
      )}
    </Shell>
  );
}
