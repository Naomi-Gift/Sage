import { useState } from 'react';
import { type WalletClient } from 'viem';
import { Shell } from './components/Shell';
import { connectInjectedWallet, readInstruction, readPosition, writeInstruction, writePause } from './contract';
import { appConfig } from './config';
import { defaultActivity, defaultInstruction, defaultMilestones, defaultPosition, MOCK_APY } from './mockData';
import { AboutView } from './views/AboutView';
import { DashboardView } from './views/DashboardView';
import { SetupView } from './views/SetupView';
import type { ActivityEvent, Instruction, Milestone, Position } from './types';

type View = 'setup' | 'dashboard' | 'about';

export function App() {
  const [view,         setView]         = useState<View>(() => localStorage.getItem('sage.setupComplete') ? 'dashboard' : 'setup');
  const [address,      setAddress]      = useState<`0x${string}`>();
  const [walletClient, setWalletClient] = useState<WalletClient>();
  const [instruction,  setInstruction]  = useState<Instruction>(defaultInstruction);
  const [position,     setPosition]     = useState<Position>(defaultPosition);
  const [streak,       setStreak]       = useState(() => Number(localStorage.getItem('sage.streak') || 14));
  const [activity,     setActivity]     = useState<ActivityEvent[]>(defaultActivity);
  const [milestones,   setMilestones]   = useState<Milestone[]>(defaultMilestones);
  const [notice,       setNotice]       = useState('');
  const [saving,       setSaving]       = useState(false);
  const [pausing,      setPausing]      = useState(false);
  const apy = MOCK_APY;

  async function loadChainState(addr: `0x${string}`) {
    if (!appConfig.vaultAddress) return;
    try {
      const [onChainInstruction, onChainPosition] = await Promise.all([
        readInstruction(addr),
        readPosition(addr),
      ]);
      if (onChainInstruction) setInstruction({ ...onChainInstruction, goalTargetGD: instruction.goalTargetGD });
      if (onChainPosition)    setPosition(onChainPosition);
    } catch {
      // Non-fatal — fall back to mock/local state
    }
  }

  async function connect() {
    try {
      const connected = await connectInjectedWallet();
      setAddress(connected.address);
      setWalletClient(connected.walletClient);
      setNotice('');
      await loadChainState(connected.address);
      return connected;
    } catch (error) {
      setNotice(error instanceof Error ? error.message : 'Wallet connection failed.');
      return undefined;
    }
  }

  async function saveInstruction(nextWalletClient = walletClient, nextAddress = address) {
    try {
      setSaving(true);
      if (nextWalletClient && nextAddress) {
        await writeInstruction(nextWalletClient, nextAddress, instruction.percentBps, instruction.goalLabel);
        setNotice('Your savings rule is active.');
      } else {
        setNotice(`Saved in preview: Sage will set aside ${instruction.percentBps / 100}% of each claim.`);
      }
      setInstruction({ ...instruction, active: instruction.percentBps > 0 });
      localStorage.setItem('sage.setupComplete', 'true');
      window.setTimeout(() => setView('dashboard'), 420);
    } catch (error) {
      setNotice(error instanceof Error ? error.message : 'Could not save instruction.');
    } finally {
      window.setTimeout(() => setSaving(false), 420);
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
        // Pause
        if (walletClient && address) {
          await writePause(walletClient, address);
        }
        setInstruction((prev) => ({ ...prev, active: false }));
        setNotice('Saving paused. Your existing savings keep earning yield.');
      } else {
        // Resume — re-write the instruction
        if (walletClient && address) {
          await writeInstruction(walletClient, address, instruction.percentBps, instruction.goalLabel);
        }
        setInstruction((prev) => ({ ...prev, active: true }));
        setNotice('Saving resumed. Sage is watching again.');
      }
    } catch (error) {
      setNotice(error instanceof Error ? error.message : 'Could not update savings status.');
    } finally {
      window.setTimeout(() => setPausing(false), 400);
    }
  }

  function addActivity(event: ActivityEvent) {
    setActivity((prev) => [event, ...prev]);
  }

  return (
    <Shell activeView={view} onViewChange={setView} connectedAddress={address} onConnect={connect}>
      {notice && <div className="notice">{notice}</div>}

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
