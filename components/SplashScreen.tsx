import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

export const SplashScreen: React.FC<{ onDone: () => void }> = ({ onDone }) => {
  const [phase, setPhase] = useState<'logo' | 'tagline' | 'out'>('logo');

  useEffect(() => {
    const t1 = setTimeout(() => setPhase('tagline'), 900);
    const t2 = setTimeout(() => setPhase('out'), 2200);
    const t3 = setTimeout(() => onDone(), 2700);
    return () => { clearTimeout(t1); clearTimeout(t2); clearTimeout(t3); };
  }, []);

  const petals = [
    { x: '15%', delay: 0.1, size: 18 },
    { x: '35%', delay: 0.4, size: 12 },
    { x: '60%', delay: 0.2, size: 20 },
    { x: '80%', delay: 0.6, size: 14 },
    { x: '50%', delay: 0.8, size: 10 },
    { x: '25%', delay: 1.0, size: 16 },
    { x: '70%', delay: 0.3, size: 11 },
    { x: '90%', delay: 0.7, size: 13 },
  ];

  return (
    <AnimatePresence>
      {phase !== 'out' ? (
        <motion.div
          key="splash"
          initial={{ opacity: 1 }}
          exit={{ opacity: 0, scale: 1.05 }}
          transition={{ duration: 0.5, ease: [0.4, 0, 0.2, 1] }}
          className="fixed inset-0 z-[999] flex flex-col items-center justify-center overflow-hidden"
          style={{
            background: 'radial-gradient(ellipse at 40% 35%, rgba(255,107,157,0.18) 0%, transparent 60%), radial-gradient(ellipse at 75% 70%, rgba(192,132,252,0.14) 0%, transparent 55%), #0A0612'
          }}
        >
          {/* Falling petals */}
          {petals.map((p, i) => (
            <motion.div
              key={i}
              className="absolute top-0 select-none pointer-events-none"
              style={{ left: p.x, fontSize: p.size }}
              initial={{ y: -30, opacity: 0, rotate: 0, scale: 0 }}
              animate={{ y: '110vh', opacity: [0, 0.3, 0.2, 0], rotate: 360, scale: [0, 1, 0.8] }}
              transition={{ duration: 3.5, delay: p.delay, ease: 'linear' }}
            >
              🌸
            </motion.div>
          ))}

          {/* Logo */}
          <motion.div
            initial={{ scale: 0.3, opacity: 0, rotate: -15 }}
            animate={{ scale: 1, opacity: 1, rotate: 0 }}
            transition={{ duration: 0.7, ease: [0.34, 1.56, 0.64, 1] }}
            className="flex flex-col items-center gap-5"
          >
            {/* Icon */}
            <div className="relative">
              <motion.div
                className="w-24 h-24 rounded-[28px] flex items-center justify-center text-5xl"
                style={{
                  background: 'linear-gradient(135deg, #FF6B9D, #C084FC)',
                  boxShadow: '0 0 60px rgba(255,107,157,0.5), 0 0 120px rgba(255,107,157,0.15)',
                }}
                animate={{ boxShadow: ['0 0 60px rgba(255,107,157,0.5), 0 0 120px rgba(255,107,157,0.15)', '0 0 80px rgba(255,107,157,0.7), 0 0 150px rgba(255,107,157,0.2)', '0 0 60px rgba(255,107,157,0.5), 0 0 120px rgba(255,107,157,0.15)'] }}
                transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
              >
                🌸
              </motion.div>
              {/* Orbiting dots */}
              {[0, 120, 240].map((deg, i) => (
                <motion.div
                  key={i}
                  className="absolute w-2.5 h-2.5 rounded-full"
                  style={{
                    background: i === 0 ? '#FF6B9D' : i === 1 ? '#C084FC' : '#FFB7C5',
                    top: '50%', left: '50%',
                    transformOrigin: '0 0',
                  }}
                  animate={{ rotate: [deg, deg + 360] }}
                  transition={{ duration: 3, repeat: Infinity, ease: 'linear', delay: i * 0.2 }}
                  initial={{ rotate: deg, x: 56, y: -5 }}
                />
              ))}
            </div>

            {/* Brand name */}
            <div className="flex flex-col items-center gap-1">
              <motion.div
                className="flex items-baseline gap-1"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4, duration: 0.5 }}
              >
                <span className="font-display font-extrabold text-[32px] tracking-[0.25em] text-white">KAWAI</span>
              </motion.div>
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.55, duration: 0.5 }}
              >
                <span
                  className="font-display font-extrabold text-[32px] tracking-[0.25em]"
                  style={{
                    background: 'linear-gradient(90deg, #FF6B9D, #FFB7C5, #C084FC)',
                    WebkitBackgroundClip: 'text',
                    WebkitTextFillColor: 'transparent',
                    backgroundClip: 'text',
                  }}
                >
                  SAKURA
                </span>
              </motion.div>
            </div>

            {/* Tagline */}
            <AnimatePresence>
              {phase === 'tagline' && (
                <motion.p
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.4 }}
                  className="text-[13px] font-medium tracking-widest"
                  style={{ color: 'rgba(255,255,255,0.35)', letterSpacing: '0.2em' }}
                >
                  YOUR MUSIC UNIVERSE
                </motion.p>
              )}
            </AnimatePresence>
          </motion.div>

          {/* Bottom loading bar */}
          <motion.div
            className="absolute bottom-16 left-1/2 -translate-x-1/2 h-[2px] rounded-full overflow-hidden"
            style={{ width: 80, background: 'rgba(255,255,255,0.08)' }}
          >
            <motion.div
              className="h-full rounded-full"
              style={{ background: 'linear-gradient(90deg, #FF6B9D, #C084FC)' }}
              initial={{ width: '0%' }}
              animate={{ width: '100%' }}
              transition={{ duration: 2, ease: 'easeInOut' }}
            />
          </motion.div>
        </motion.div>
      ) : null}
    </AnimatePresence>
  );
};
