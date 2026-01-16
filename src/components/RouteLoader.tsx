import React, { useEffect, useState } from "react";
import { useLocation } from "react-router-dom";

export function RouteLoader() {
  const location = useLocation();
  const [visible, setVisible] = useState(true);
  const [seconds, setSeconds] = useState(2);

  useEffect(() => {
    setVisible(true);
    setSeconds(2);
    const t = setTimeout(() => setVisible(false), 2000);
    const iv = setInterval(() => setSeconds(s => Math.max(0, s - 1)), 1000);
    return () => { clearTimeout(t); clearInterval(iv); };
  }, [location.pathname]);

  if (!visible) return null;

  return (
    <div className="route-loader-overlay" aria-busy="true" aria-live="polite">
      <div className="route-loader-card">
        <svg className="route-loader-spinner" viewBox="0 0 50 50">
          <circle className="route-loader-track" cx="25" cy="25" r="20" fill="none" strokeWidth="6" />
          <circle className="route-loader-indicator" cx="25" cy="25" r="20" fill="none" strokeWidth="6" />
        </svg>
        <div className="route-loader-text">Loading DECORIZZ…</div>
        {/* <div className="route-loader-count" aria-label="seconds remaining">{seconds}</div> */}
        <div className="route-loader-progress"><span className="route-loader-bar" /></div>
      </div>
    </div>
  );
}
