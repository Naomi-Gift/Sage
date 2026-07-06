import { useState } from 'react';
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
import { defaultActivity, defaultInstruction, defaultMilestones, defaultPosition, MOCK_APY } from './mockData';
import { AboutView } from './views/AboutView';
import { DashboardView } from './views/DashboardView';
import { SetupView } from './views/SetupView';
import type { ActivityEvent, Instruction, Milestone, Position } from './types';

type View = 'setup' | 'dashboard' | 'about';

// G$ token addresses per chain
const G_DOLLAR_ADDRESS: Record<number, `0x${string}`> = {
  42220:    '0x62B8B11039FcfE5aB0C56E502b1C372A3d2a9c7A', // Celo mainnet
  11142220: '0x084DA2de8Cfa7CF714b66c006eAC80791B396A88', // Celo Sepolia (mock deployed)
};

export function App() {
  const [view,         setView]         = useState<View>(() => localStorage.getItem('sage.setupComplete') ? 'dashboard' : 'setup');
  const [address,      setAddress]      = useState<`0x${string}`>();
  const [walletClient, setWalletClient] = useState<WalletClient>();
  const [instruction,  setInstruction]  = useState<Instruction>(defaultInstruction);
  const [position,     setPosition]     = useState<Position>(defaultPosition);
  const [gdBalance,    setGdBalance]    = useState<number | null>(null);
  const [streak,       setStreak]       = useState(() => Number(localStorage.getItem('sage.streak') || 14));
  const [activity,     setActivity]     = useState<ActivityEvent[]>(defaultActivity);
  const [milestones,   setMilestones]   = useState<Milestone[]>(defaultMilestones);
  const [notice,       setNotice]       = useState('');
  const [noticeType,   setNoticeType]   = useState<'info' | 'success' | 'error'>('info');
  const [saving,       setSaving]       = useState(false);
  const [pausing,      setPausing]      = useState(false);
  const apy = MOCK_APY;

  function showNotice(msg: string, type: 'info' | 'success' | 'error' = 'info') {
    setNotice(msg);
    setNoticeType(type);
  }

  async function loadChainState(addr: `0x${string}`) {
    const gDollarAddr = G_DOLLAR_ADDRESS[appChain.id];
    const loads: Promise<void>[] = [];

    // Load G$ wallet balance
    if (gDollarAddr) {
      loads.push(
        readGDollarBalance(addr, gDollarAddr).then(setGdBalance).catch(() => {})
      );
    }

    // Load vault state
    if (appConfig.vaultAddress) {
      loads.push(
        Promise.all([
          readInstruction(addr),
          readPosition(addr),
        ]).then(([onChainInstruction, onChainPosition]) => {
          if (onChainInstruction) {
            setInstruction(prev => ({ ...onChainInstruction, goalTargetGD: prev.goalTargetGD }));
          }
          if (onChainPosition) setPosition(onChainPosition);
        }).catch(() => {})
      );
    }

    await Promise.all(loads);
  }

  async function connect() {
    try {
      const connected = await connectInjectedWallet();
      setAddress(connected.address);
      setWalletClient(connected.walletClient);
      showNotice('');
      await loadChainState(connected.address);
      return connected;
    } catch (error) {
      showNotice(error instanceof Error ? error.message : 'Wallet connection failed.', 'error');
      return undefined;
    }
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
        // Transaction confirmed — show success with hash link
        const explorerBase = appChain.blockExplorers?.default?.url ?? '';
        const txUrl = explorerBase ? `${explorerBase}/tx/${hash}` : '';
        showNotice(
          txUrl
            ? `✅ Savings rule is active! View transaction: ${txUrl}`
            : `✅ Savings rule is active! Tx: ${hash}`,
          'success'
        );
        // Refresh on-chain state
        await loadChainState(nextAddress);
      } else {
        // Preview mode (no wallet connected yet)
        showNotice(
          `Preview: Sage will save ${instruction.percentBps / 100}% of each claim. Connect a wallet to activate.`,
          'info'
        );
      }

      setInstruction(prev => ({ ...prev, active: instruction.percentBps > 0 }));
      localStorage.setItem('sage.setupComplete', 'true');
      window.setTimeout(() => setView('dashboard'), 600);
    } catch (error) {
      showNotice(error instanceof Error ? error.message : 'Could not save instruction.', 'error');
    } finally {
      window.setTimeout(() => setSaving(false), 600);
    }
  }

  async function continueSetup() {
    if (address && walletClient) {
      await saveInstruction(walletClient, address);
      return;
    }
    const connected = await connect();
    if (connected) await saveInstruction(connected.walletClient, connected.address);
  }

  async function togglePause() {
    setPausing(true);
    try {
      if (instruction.active) {
        if (walletClient && address) {
          await writePause(walletClient, address);
        }
        setInstruction(prev => ({ ...prev, active: false }));
        showNotice('✅ Saving paused. Your existing savings keep earning yield.', 'success');
      } else {
        if (walletClient && address) {
          await writeInstruction(walletClient, address, instruction.percentBps, instruction.goalLabel);
        }
        setInstruction(prev => ({ ...prev, active: true }));
        showNotice('✅ Saving resumed. Sage is watching again.', 'success');
      }
    } catch (error) {
      showNotice(error instanceof Error ? error.message : 'Could not update savings status.', 'error');
    } finally {
      window.setTimeout(() => setPausing(false), 400);
    }
  }

  function addActivity(event: ActivityEvent) {
    setActivity(prev => [event, ...prev]);
    // Refresh balance after a withdrawal
    if (event.kind === 'withdraw' && address) {
      loadChainState(address).catch(() => {});
    }
  }

  return (
    <Shell
      activeView={view}
      onViewChange={setView}
      connectedAddress={address}
      gdBalance={gdBalance}
      onConnect={connect}
    >
      {notice && (
        <div className={`notice notice-${noticeType}`}>
          {notice}
        </div>
      )}

      {view === 'setup' && (
        <SetupView
          instruction={instruction}
          onInstructionChange={setInstruction}
          onSave={continueSetup}
          onConnect={connect}
          connected={Boolean(address && walletClient)}
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
          milestones={milestones}
          pausing={pausing}
          onStreakChange={setStreak}
          onAdjust={() => setView('setup')}
          onTogglePause={togglePause}
          onAddActivity={addActivity}
        />
      )}

      {view === 'about' && <AboutView />}
    </Shell>
  );
}
