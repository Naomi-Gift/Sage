import { useEffect } from 'react';
import { FeatureGrid } from '../components/landing/FeatureGrid';
import { FinalCta } from '../components/landing/FinalCta';
import { HowSavingWorks } from '../components/landing/HowSavingWorks';
import { Integrations } from '../components/landing/Integrations';
import { LandingFooter } from '../components/landing/LandingFooter';
import { LandingHero } from '../components/landing/LandingHero';
import { LandingNav } from '../components/landing/LandingNav';
import { ProductPreview } from '../components/landing/ProductPreview';
import { Stories } from '../components/landing/Stories';
import { UnicornBackground } from '../components/landing/UnicornBackground';

type SetupViewProps = {
  onConnect: () => void;
  connected: boolean;
  connectedAddress?: string;
  saving: boolean;
};

export function SetupView({
  onConnect,
  connected, connectedAddress, saving,
}: SetupViewProps) {
  const shortAddress = connectedAddress
    ? `${connectedAddress.slice(0, 6)}…${connectedAddress.slice(-4)}`
    : undefined;

  useEffect(() => {
    document.documentElement.classList.add('landing-mode');
    const id = window.location.hash.replace('#', '') || new URLSearchParams(window.location.search).get('s') || '';
    if (id) {
      window.setTimeout(() => {
        document.getElementById(id)?.scrollIntoView({ behavior: 'auto', block: 'start' });
      }, 50);
    }
    return () => document.documentElement.classList.remove('landing-mode');
  }, []);

  return (
    <div className="ln-root">
      <UnicornBackground />
      <div className="ln-glows" aria-hidden="true">
        <div className="ln-glow-line" />
        <div className="ln-glow-core" />
        <div className="ln-glow-ring-a" />
        <div className="ln-glow-ring-b" />
        <div className="ln-glow-blob-a" />
        <div className="ln-glow-blob-b" />
      </div>

      <LandingNav
        connected={connected}
        saving={saving}
        shortAddress={shortAddress}
        onConnect={onConnect}
        onActivate={onConnect}
      />

      <LandingHero
        connected={connected}
        saving={saving}
        onConnect={onConnect}
        onActivate={onConnect}
      />

      <FeatureGrid />
      <ProductPreview />
      <HowSavingWorks />
      <Integrations />
      <Stories />
      <FinalCta
        connected={connected}
        saving={saving}
        onConnect={onConnect}
        onActivate={onConnect}
      />
      <LandingFooter />
    </div>
  );
}
