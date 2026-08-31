import { SolarIcon } from './SolarIcon';

export function LandingFooter() {
  function jump(id: string) {
    document.getElementById(id)?.scrollIntoView({ behavior: 'smooth' });
  }

  return (
    <footer className="ln-footer">
      <div className="ln-container ln-footer-grid">
        <div className="ln-footer-brand">
          <a href="#top" className="ln-wordmark" onClick={(e) => { e.preventDefault(); window.scrollTo({ top: 0, behavior: 'smooth' }); }}>
            <img src="/assets/sageLogoDark.png" alt="" className="ln-wordmark-icon" width={20} height={20} />
          </a>
          <p>Your G$ grows itself. Non-custodial savings for GoodDollar claimers on Celo.</p>
        </div>
        <div>
          <h4>Product</h4>
          <button type="button" onClick={() => jump('how-it-works')}>How it works</button>
          <button type="button" onClick={() => jump('savings')}>Savings</button>
        </div>
        <div>
          <h4>Stack</h4>
          <a href="https://gooddollar.org" target="_blank" rel="noopener noreferrer">GoodDollar</a>
          <a href="https://aave.com" target="_blank" rel="noopener noreferrer">Aave</a>
          <a href="https://celo.org" target="_blank" rel="noopener noreferrer">Celo</a>
          <a href="https://www.mento.org" target="_blank" rel="noopener noreferrer">Mento</a>
        </div>
        <div>
          <h4>App</h4>
          <button type="button" onClick={() => jump('top')}>Connect wallet</button>
          <button type="button" onClick={() => jump('setup-rule')}>Set a rule</button>
          <a href="https://sepolia.celoscan.io/address/0x765951171682073c94814B00482a1a0FBa2d7011" target="_blank" rel="noopener noreferrer">
            Vault on Celoscan
          </a>
        </div>
      </div>
      <div className="ln-container ln-footer-bottom">
        <p>© {new Date().getFullYear()} Sage. Built for GoodDollar claimers.</p>
        <div className="ln-footer-social">
          <a href="https://x.com" target="_blank" rel="noopener noreferrer" aria-label="X">
            <SolarIcon icon="mdi:twitter" width={20} height={20} />
          </a>
          <a href="https://github.com/Naomi-Gift/Sage" target="_blank" rel="noopener noreferrer" aria-label="GitHub">
            <SolarIcon icon="mdi:github" width={20} height={20} />
          </a>
        </div>
      </div>
    </footer>
  );
}
