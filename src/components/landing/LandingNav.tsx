import { useEffect, useState } from 'react';
import { HoverCta } from './HoverCta';
import { SolarIcon } from './SolarIcon';

type LandingNavProps = {
  connected: boolean;
  saving: boolean;
  shortAddress?: string;
  onConnect?: () => void;
  onActivate?: () => void;
  onLaunchApp?: () => void;
};

function scrollTo(id: string) {
  document.getElementById(id)?.scrollIntoView({ behavior: 'smooth', block: 'start' });
}

export function LandingNav({
  connected, saving, shortAddress, onConnect, onActivate, onLaunchApp,
}: LandingNavProps) {
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    function onScroll() {
      setScrolled(window.scrollY > 20);
    }
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  const handleAction = onLaunchApp || onActivate || onConnect;

  return (
    <header className={`ln-nav${scrolled ? ' is-scrolled' : ''}`}>
      <div className="ln-nav-container">
        <a href="#top" className="ln-wordmark" onClick={(e) => { e.preventDefault(); window.scrollTo({ top: 0, behavior: 'smooth' }); }}>
          <img src="/assets/sageLogoDark.png" alt="Sage" className="ln-wordmark-icon"/>
        </a>

        <nav className="ln-nav-links" aria-label="Landing">
          <button className="ln-nav-link" onClick={() => scrollTo('how-it-works')}>
            How it works
            <SolarIcon icon="solar:alt-arrow-down-linear" width={16} height={16} className="ln-nav-caret" />
          </button>
          <button className="ln-nav-link" onClick={() => scrollTo('savings')}>
            Savings
            <SolarIcon icon="solar:alt-arrow-down-linear" width={16} height={16} className="ln-nav-caret" />
          </button>
        </nav>

        <div className="ln-nav-actions">
          <HoverCta
            size="nav"
            disabled={saving}
            onClick={handleAction}
          >
            {saving ? 'Saving…' : 'Launch App'}
          </HoverCta>
        </div>
      </div>
    </header>
  );
}
