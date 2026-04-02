import React, { useEffect, useRef } from 'react';

export const SakuraPetals: React.FC = () => {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;
    const petals = ['🌸', '🌺', '✿', '❀'];
    let active = true;

    const spawnPetal = () => {
      if (!active || !container) return;
      const el = document.createElement('div');
      el.textContent = petals[Math.floor(Math.random() * petals.length)];
      const size = 8 + Math.random() * 8;
      const left = Math.random() * 100;
      const duration = 10 + Math.random() * 15;
      const delay = Math.random() * 2;
      el.style.cssText = `
        position:fixed; left:${left}%; top:-20px; font-size:${size}px;
        opacity:0; pointer-events:none; z-index:1; user-select:none;
        animation: petalFall ${duration}s ${delay}s linear forwards;
      `;
      container.appendChild(el);
      setTimeout(() => { if (container.contains(el)) container.removeChild(el); }, (duration + delay) * 1000 + 100);
    };

    const interval = setInterval(spawnPetal, 3000);
    spawnPetal();
    return () => { active = false; clearInterval(interval); };
  }, []);

  return <div ref={containerRef} className="fixed inset-0 pointer-events-none z-0 overflow-hidden" />;
};
