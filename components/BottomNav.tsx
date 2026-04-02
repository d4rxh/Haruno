import React from 'react';
import { Home, Search, Library, Users, BarChart2 } from 'lucide-react';
import { NavLink } from 'react-router-dom';
import { motion } from 'framer-motion';
import { usePlayerStore } from '../store/playerStore';

export const BottomNav: React.FC = () => {
  const { isFullScreen, currentSong } = usePlayerStore();

  const rightOffset = isFullScreen
    ? 'md:right-[416px] xl:right-[466px]'
    : currentSong ? 'md:right-[380px] xl:right-[420px]' : 'right-0';

  const navItems = [
    { to: '/', icon: Home, label: 'Home' },
    { to: '/search', icon: Search, label: 'Discover' },
    { to: '/library', icon: Library, label: 'Library' },
    { to: '/stats', icon: BarChart2, label: 'Stats' },
    { to: '/social', icon: Users, label: 'Friends' },
  ];

  return (
    <motion.div
      initial={{ y: 100, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: 100, opacity: 0 }}
      transition={{ type: 'tween', ease: 'easeOut', duration: 0.35 }}
      className={`xl:hidden fixed bottom-4 left-0 right-0 mx-auto z-[160] pointer-events-none transition-all duration-300 w-[calc(100%-24px)] max-w-[420px] ${rightOffset}`}>
      <div className="pointer-events-auto flex items-center justify-around py-2 px-2 rounded-[26px]"
        style={{
          background: 'rgba(12,8,20,0.96)',
          backdropFilter: 'blur(28px)',
          WebkitBackdropFilter: 'blur(28px)',
          border: '1px solid rgba(255,107,157,0.14)',
          boxShadow: '0 8px 40px rgba(0,0,0,0.7), 0 0 0 1px rgba(255,107,157,0.06) inset',
        }}>
        {navItems.map(({ to, icon: Icon, label }) => (
          <NavLink key={to} to={to} className="flex flex-col items-center gap-1 min-w-[52px] py-2 relative group">
            {({ isActive }) => (
              <>
                {isActive && (
                  <motion.div layoutId="sakura-nav-pill" className="absolute inset-0 rounded-2xl"
                    style={{ background: 'rgba(255,107,157,0.1)' }}
                    transition={{ type: 'spring', damping: 28, stiffness: 320 }} />
                )}
                <div className="relative z-10">
                  {isActive ? (
                    <div className="relative">
                      <Icon size={19} strokeWidth={2.5} style={{ color: '#FF6B9D' }}
                        fill={label === 'Home' || label === 'Library' ? '#FF6B9D' : 'none'} />
                      <div className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-1 h-1 rounded-full"
                        style={{ background: '#FF6B9D', boxShadow: '0 0 6px #FF6B9D' }} />
                    </div>
                  ) : (
                    <Icon size={19} strokeWidth={1.7} style={{ color: 'rgba(255,255,255,0.3)' }} />
                  )}
                </div>
                <span className="text-[9px] font-bold relative z-10 tracking-wide"
                  style={{ color: isActive ? '#FF6B9D' : 'rgba(255,255,255,0.25)' }}>
                  {label}
                </span>
              </>
            )}
          </NavLink>
        ))}
      </div>
    </motion.div>
  );
};
