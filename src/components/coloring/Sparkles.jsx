import React, { useEffect, useState } from 'react';

export default function Sparkles({ activeSparkles }) {
  return (
    <div style={{ position: 'fixed', inset: 0, pointerEvents: 'none', zIndex: 9999, overflow: 'hidden' }}>
      {activeSparkles.map((sp) => (
        <SparkleParticle key={sp.id} x={sp.x} y={sp.y} color={sp.color} />
      ))}
    </div>
  );
}

function SparkleParticle({ x, y, color }) {
  const [particles] = useState(() => {
    const items = [];
    const count = 10;
    for (let i = 0; i < count; i++) {
      const angle = (i / count) * Math.PI * 2 + Math.random() * 0.5;
      const speed = 40 + Math.random() * 60;
      const size = 12 + Math.random() * 14;
      const duration = 0.6 + Math.random() * 0.4;
      const symbols = ['⭐', '✨', '🌟', '💖', '🎉'];
      const symbol = symbols[Math.floor(Math.random() * symbols.length)];

      items.push({
        id: i,
        dx: Math.cos(angle) * speed,
        dy: Math.sin(angle) * speed,
        size,
        duration,
        symbol,
      });
    }
    return items;
  });

  return (
    <div style={{ position: 'absolute', left: x, top: y, pointerEvents: 'none' }}>
      {particles.map((p) => (
        <div
          key={p.id}
          style={{
            position: 'absolute',
            fontSize: `${p.size}px`,
            color: color || '#FFD700',
            userSelect: 'none',
            pointerEvents: 'none',
            animation: `magicSparkleFly ${p.duration}s cubic-bezier(0.1, 0.8, 0.3, 1) forwards`,
            transform: 'translate(-50%, -50%)',
            '--dx': `${p.dx}px`,
            '--dy': `${p.dy}px`,
          }}
        >
          {p.symbol}
        </div>
      ))}
      <style>{`
        @keyframes magicSparkleFly {
          0% {
            transform: translate(-50%, -50%) scale(0.3) rotate(0deg);
            opacity: 1;
          }
          70% {
            opacity: 1;
          }
          100% {
            transform: translate(calc(-50% + var(--dx)), calc(-50% + var(--dy))) scale(1.3) rotate(180deg);
            opacity: 0;
          }
        }
      `}</style>
    </div>
  );
}
