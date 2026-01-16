import React, { useEffect, useRef, useState } from "react";

export default function LazyShow({
  children,
  height = "260px",
}: {
  children: React.ReactNode;
  height?: string;
}) {
  const ref = useRef<HTMLDivElement | null>(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (!ref.current) return;

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting) {
          setVisible(true);
          observer.disconnect();
        }
      },
      {
        threshold: 0.2,
      }
    );

    observer.observe(ref.current);
    return () => observer.disconnect();
  }, []);

  return (
    <div ref={ref} style={{ minHeight: height }}>
      {visible ? (
        children
      ) : (
        <div className="w-full h-full bg-gray-200 rounded-xl animate-pulse"></div>
      )}
    </div>
  );
}
