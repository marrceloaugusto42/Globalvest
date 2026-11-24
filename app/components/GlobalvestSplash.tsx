'use client';

import { useEffect, useState } from "react";

const SPLASH_KEY = "globalvest-entry-splash-seen";

export default function GlobalvestSplash() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    try {
      if (window.sessionStorage.getItem(SPLASH_KEY) === "1") return;
      window.sessionStorage.setItem(SPLASH_KEY, "1");
    } catch {
      // If storage is unavailable, still show the entry animation for this visit.
    }

    setVisible(true);
    const timeout = window.setTimeout(() => setVisible(false), 1850);
    return () => window.clearTimeout(timeout);
  }, []);

  if (!visible) return null;

  return (
    <div className="gvEntrySplash" role="status" aria-label="Loading Globalvest Capital">
      <div className="gvSplashGlow gvSplashGlowOne" />
      <div className="gvSplashGlow gvSplashGlowTwo" />
      <div className="gvSplashContent">
        <div className="gvSplashMark" aria-hidden="true">
          <svg viewBox="0 0 64 64" fill="none">
            <path d="M32 5.5 55 18.75v26.5L32 58.5 9 45.25v-26.5L32 5.5Z" stroke="currentColor" strokeWidth="2.2" />
            <path d="M42.8 23.5a15.5 15.5 0 1 0 2.1 16.2H32v-8.1h22v4.1c0 13.2-9.8 22.8-22 22.8A22.5 22.5 0 1 1 49.4 20l-6.6 3.5Z" fill="currentColor" transform="translate(0 -4) scale(.91)" />
          </svg>
        </div>
        <div className="gvSplashWordmark">GLOBALVEST</div>
        <div className="gvSplashSubline">C A P I T A L</div>
        <div className="gvSplashLoader" aria-hidden="true"><span /></div>
        <div className="gvSplashLoadingText">A world of opportunity</div>
      </div>
    </div>
  );
}
