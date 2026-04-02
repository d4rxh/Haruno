import React, { useState, useEffect } from 'react';
import { Moon, X } from 'lucide-react';
import { usePlayerStore } from '../store/playerStore';
import { motion, AnimatePresence } from 'framer-motion';

export const SleepTimer: React.FC<{ onClose: () => void }> = ({ onClose }) => {
  const { setIsPlaying } = usePlayerStore();
  const [selected, setSelected] = useState<number | null>(null);
  const [remaining, setRemaining] = useState<number | null>(null);

  const options = [5, 10, 15, 30, 45, 60];

  useEffect(() => {
    if (remaining === null) return;
    if (remaining <= 0) { setIsPlaying(false); onClose(); return; }
    const t = setTimeout(() => setRemaining(r => (r || 0) - 1), 1000);
    return () => clearTimeout(t);
  }, [remaining]);

  const start = (mins: number) => {
    setSelected(mins);
    setRemaining(mins * 60);
  };

  const fmt = (secs: number) => `${Math.floor(secs / 60)}:${String(secs % 60).padStart(2, '0')}`;

  return (
    <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.9 }}
      className="fixed inset-0 z-[300] flex items-end justify-center p-4" style={{ background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(8px)' }}
      onClick={onClose}>
      <motion.div initial={{ y: 40 }} animate={{ y: 0 }} onClick={e => e.stopPropagation()}
        className="w-full max-w-[380px] rounded-3xl p-5 flex flex-col gap-4"
        style={{ background: '#120D1C', border: '1px solid rgba(255,107,157,0.2)' }}>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Moon size={18} style={{ color: '#FF6B9D' }} />
            <h3 className="font-display font-bold text-[16px] text-white">Sleep Timer</h3>
          </div>
          <button onClick={onClose} className="w-8 h-8 rounded-xl flex items-center justify-center" style={{ background: 'rgba(255,255,255,0.07)' }}>
            <X size={16} className="text-white/60" />
          </button>
        </div>
        {remaining !== null ? (
          <div className="flex flex-col items-center gap-3 py-4">
            <p className="font-display font-extrabold text-[42px] text-white">{fmt(remaining)}</p>
            <p className="text-[13px]" style={{ color: 'rgba(255,255,255,0.4)' }}>Music stops when timer ends</p>
            <button onClick={() => { setRemaining(null); setSelected(null); }}
              className="px-4 py-2 rounded-2xl text-[13px] font-bold" style={{ background: 'rgba(255,59,48,0.15)', color: '#FF3B30', border: '1px solid rgba(255,59,48,0.3)' }}>
              Cancel Timer
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-3 gap-2">
            {options.map(min => (
              <motion.button key={min} whileTap={{ scale: 0.95 }} onClick={() => start(min)}
                className="py-3 rounded-2xl font-bold text-[14px] transition-all"
                style={{ background: 'rgba(255,107,157,0.1)', border: '1px solid rgba(255,107,157,0.2)', color: '#FF6B9D' }}>
                {min}m
              </motion.button>
            ))}
          </div>
        )}
      </motion.div>
    </motion.div>
  );
};
