import { useEffect } from 'react';

declare global {
  interface Window {
    UnicornStudio?: {
      isInitialized?: boolean;
      init: () => Promise<unknown> | void;
    };
  }
}

const SCRIPT_SRC =
  'https://cdn.jsdelivr.net/gh/hiunicornstudio/unicornstudio.js@v1.4.29/dist/unicornStudio.umd.js';

export function UnicornBackground() {
  useEffect(() => {
    function boot() {
      const studio = window.UnicornStudio;
      if (!studio) return;
      if (!studio.isInitialized) {
        void studio.init();
        studio.isInitialized = true;
      } else {
        void studio.init();
      }
    }

    const pinCanvas = () => {
      document.querySelectorAll('.ln-unicorn-wrap canvas, canvas[data-us-project], .ln-unicorn-scene canvas').forEach((node) => {
        const el = node as HTMLCanvasElement;
        el.style.pointerEvents = 'none';
        el.style.zIndex = '-1';
        el.style.maxHeight = '100vh';
      });
    };
    const pinTimer = window.setInterval(pinCanvas, 400);
    window.setTimeout(() => window.clearInterval(pinTimer), 8000);

    if (window.UnicornStudio) {
      boot();
    } else {
      const existing = document.querySelector<HTMLScriptElement>(`script[src="${SCRIPT_SRC}"]`);
      if (existing) {
        existing.addEventListener('load', boot);
      } else {
        const script = document.createElement('script');
        script.src = SCRIPT_SRC;
        script.async = true;
        script.onload = boot;
        document.body.appendChild(script);
      }
    }

    return () => window.clearInterval(pinTimer);
  }, []);

  return (
    <div className="ln-unicorn-wrap" aria-hidden="true">
      <div className="ln-unicorn-inner">
        <div data-us-project="uFY4IYPs2LU8fWm96Im2" className="ln-unicorn-scene" />
      </div>
    </div>
  );
}
