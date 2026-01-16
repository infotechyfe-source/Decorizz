import React, { useRef } from "react";

type Props = {
  className?: string;
  children: React.ReactNode;
  style?: React.CSSProperties;
};

export default function TiltCard({ className = "", children, style }: Props) {
  const ref = useRef<HTMLDivElement>(null);

  const onMove = (e: React.MouseEvent<HTMLDivElement>) => {
    const el = ref.current;
    if (!el) return;
    const rect = el.getBoundingClientRect();
    const cx = rect.left + rect.width / 2;
    const cy = rect.top + rect.height / 2;
    const x = e.clientX - cx;
    const y = e.clientY - cy;
    const maxDeg = 8;
    const rx = ((y / rect.height) * maxDeg);
    const ry = -((x / rect.width) * maxDeg);
    el.style.transform = `rotateX(${rx}deg) rotateY(${ry}deg)`;
    el.style.boxShadow = `
      0 10px 20px rgba(0,0,0,.12),
      0 6px 6px rgba(0,0,0,.08)
    `;
  };

  const onLeave = () => {
    const el = ref.current;
    if (!el) return;
    el.style.transform = `rotateX(0deg) rotateY(0deg)`;
    el.style.boxShadow = `
      0 6px 12px rgba(0,0,0,.08)
    `;
  };

  return (
    <div
      className={className}
      style={{
        transformStyle: "preserve-3d",
        transition: "transform 150ms ease, box-shadow 150ms ease",
        boxShadow: "0 6px 12px rgba(0,0,0,.08)",
        ...style,
      }}
      onMouseMove={onMove}
      onMouseLeave={onLeave}
      ref={ref}
    >
      {children}
    </div>
  );
}

