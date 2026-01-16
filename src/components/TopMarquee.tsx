import React, { useEffect, useState } from "react";
import { Truck, ShieldCheck, RotateCcw, Hand } from "lucide-react";

export function TopMarquee() {
  const items = [
    {
      icon: Truck,
      text: "Free Shipping — You shop, we ship",
    },
    {
      icon: Hand,
      text: "Made in India — Crafted with pride",
    },
    {
      icon: ShieldCheck,
      text: "Secure Payments — SSL protected",
    },
    {
      icon: RotateCcw,
      text: "Easy Returns — 7-day money back",
    },
  ];

  const [index, setIndex] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setIndex((prev) => (prev + 1) % items.length);
    }, 2000);

    return () => clearInterval(interval);
  }, []);

  const Icon = items[index].icon;

  return (
    <div className="topbar">
      <div key={index} className="topbar-content">
        <span className="icon-glow">
          <Icon size={18} />
        </span>
        <span className="topbar-text">{items[index].text}</span>
      </div>

      {/* INTERNAL CSS */}
      <style>{`
        .topbar {
          position: fixed;
          top: 0;
          left: 0;
          width: 100%;
          z-index: 50;
          background: linear-gradient(180deg, #ffffff, #f8fafc);
          border-bottom: 1px solid rgba(109, 103, 103, 0.06);
          height: 40px;
          display: flex;
          align-items: center;
          justify-content: center;
          overflow: hidden;
          font-family: 'Inter', sans-serif;
        }

        .topbar-content {
          display: flex;
          align-items: center;
          gap: 10px;
          color: #334155;
          font-size: 14px;
          font-weight: 500;
          animation: fadeSlide 0.6s ease forwards;
        }

        .topbar-text {
          letter-spacing: 0.2px;
        }

        .icon-glow {
          color: #14b8a6;
          display: flex;
          align-items: center;
          filter: drop-shadow(0 0 6px rgba(20,184,166,0.45));
          animation: glowPulse 2s infinite ease-in-out;
        }

        @keyframes fadeSlide {
          from {
            opacity: 0;
            transform: translateY(8px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        @keyframes glowPulse {
          0% {
            filter: drop-shadow(0 0 4px rgba(20,184,166,0.35));
          }
          50% {
            filter: drop-shadow(0 0 10px rgba(20,184,166,0.6));
          }
          100% {
            filter: drop-shadow(0 0 4px rgba(20,184,166,0.35));
          }
        }
      `}</style>
    </div>
  );
}
