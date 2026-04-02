import React from 'react';
import { Home, Search, Library, Plus, Heart, Music, Sparkles, Pin } from 'lucide-react';
import { NavLink, useNavigate } from 'react-router-dom';
import { usePlayerStore } from '../store/playerStore';
import { getImageUrl } from '../services/api';
import { motion } from 'framer-motion';

const itemVariants = {
  hidden: { opacity: 0, x: -10 },
  visible: { opacity: 1, x: 0 }
};

// Kawai Sakura Logo
const SakuraLogo: React.FC = () => (
  <div className="flex items-center gap-2.5 cursor-pointer select-none">
    <div className="relative w-9 h-9 flex items-center justify-center rounded-2xl"
      style={{ background: 'linear-gradient(135deg, #FF6B9D, #C084FC)', boxShadow: '0 0 16px rgba(255,107,157,0.4)' }}>
      <span className="text-[18px]">🌸</span>
    </div>
    <div className="flex flex-col">
      <span className="font-display font-extrabold text-[15px] text-white tracking-widest leading-none" style={{ letterSpacing: '0.18em' }}>KAWAI</span>
      <span className="font-display font-extrabold text-[15px] tracking-widest leading-none" style={{ letterSpacing: '0.18em', background: 'linear-gradient(90deg, #FF6B9D, #C084FC)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text' }}>SAKURA</span>
    </div>
  </div>
);

const navLinkStyle = (isActive: boolean) => ({
  background: isActive ? 'rgba(255,107,157,0.1)' : 'transparent',
  border: isActive ? '1px solid rgba(255,107,157,0.2)' : '1px solid transparent',
});

export const Sidebar: React.FC = () => {
  const { userPlaylists, currentUser } = usePlayerStore();
  const navigate = useNavigate();

  return (
    <aside className="w-[290px] flex flex-col h-full gap-2 hidden xl:flex">
      {/* Nav Block */}
      <div className="rounded-3xl py-5 px-3 flex flex-col gap-1"
        style={{ background: '#120D1C', border: '1px solid rgba(255,107,157,0.1)' }}>
        <div className="px-4 py-2 mb-4">
          <div onClick={() => navigate('/')}><SakuraLogo /></div>
        </div>

        {[
          { to: '/', icon: Home, label: 'Home' },
          { to: '/search', icon: Search, label: 'Discover' },
        ].map(({ to, icon: Icon, label }) => (
          <NavLink key={to} to={to}
            className={({ isActive }) =>
              `flex items-center gap-3.5 px-4 py-3 rounded-2xl transition-all duration-200 font-semibold text-[14px] ${isActive ? 'text-white' : 'text-white/40 hover:text-white/80'}`
            }
            style={({ isActive }) => navLinkStyle(isActive)}
          >
            {({ isActive }) => (
              <>
                <Icon size={20} strokeWidth={isActive ? 2.5 : 1.8}
                  style={{ color: isActive ? '#FF6B9D' : 'inherit' }}
                  fill={isActive && label === 'Home' ? '#FF6B9D' : 'none'} />
                <span>{label}</span>
                {isActive && (
                  <div className="ml-auto w-1.5 h-1.5 rounded-full"
                    style={{ background: '#FF6B9D', boxShadow: '0 0 6px #FF6B9D' }} />
                )}
              </>
            )}
          </NavLink>
        ))}
      </div>

      {/* Library Block */}
      <div className="rounded-3xl flex-1 flex flex-col overflow-hidden"
        style={{ background: '#120D1C', border: '1px solid rgba(255,107,157,0.1)' }}>

        <div className="flex items-center justify-between px-5 py-4">
          <div className="flex items-center gap-2.5 cursor-pointer hover:opacity-80 transition-opacity"
            onClick={() => navigate('/library')}>
            <Library size={20} strokeWidth={1.8} style={{ color: '#FF6B9D' }} />
            <span className="font-bold text-[14px] text-white">Your Library</span>
          </div>
          <div className="flex items-center gap-1">
            <button onClick={() => navigate('/premium')}
              className="p-1.5 rounded-xl transition-colors hover:bg-white/5"
              style={{ color: 'rgba(255,255,255,0.35)' }}>
              <Sparkles size={16} />
            </button>
            <button className="p-1.5 rounded-xl transition-colors hover:bg-white/5"
              style={{ color: 'rgba(255,255,255,0.35)' }}>
              <Plus size={16} />
            </button>
          </div>
        </div>

        {/* Filter Pills */}
        <div className="px-4 pb-3 flex gap-2">
          {['Playlists', 'Artists'].map((f, i) => (
            <button key={f} className="px-3.5 py-1.5 text-[11px] font-bold rounded-full transition-all"
              style={i === 0
                ? { background: 'rgba(255,107,157,0.15)', border: '1px solid rgba(255,107,157,0.25)', color: '#FF6B9D' }
                : { background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.07)', color: 'rgba(255,255,255,0.4)' }}>
              {f}
            </button>
          ))}
        </div>

        {/* Library Items */}
        <motion.div className="flex-1 overflow-y-auto px-3 pb-4 no-scrollbar"
          initial="hidden" animate="visible"
          variants={{ visible: { transition: { staggerChildren: 0.05 } } }}>

          {/* Liked Songs */}
          <motion.div variants={itemVariants} whileTap={{ scale: 0.97 }}
            onClick={() => navigate('/liked')}
            className="flex items-center gap-3 px-3 py-2.5 rounded-2xl cursor-pointer transition-all hover:bg-white/5 mb-1">
            <div className="w-11 h-11 rounded-xl flex items-center justify-center shrink-0"
              style={{ background: 'linear-gradient(135deg, #FF6B9D, #C084FC)', boxShadow: '0 4px 12px rgba(255,107,157,0.3)' }}>
              <Heart size={16} fill="white" className="text-white" />
            </div>
            <div className="flex flex-col overflow-hidden">
              <span className="text-white font-semibold text-[13px] truncate">Liked Songs</span>
              <div className="flex items-center gap-1 text-[11px] truncate" style={{ color: 'rgba(255,255,255,0.4)' }}>
                <Pin size={10} className="-rotate-45" style={{ color: '#FF6B9D' }} />
                <span>Pinned Playlist</span>
              </div>
            </div>
          </motion.div>

          {userPlaylists.map((playlist) => (
            <motion.div key={playlist.id} variants={itemVariants} whileTap={{ scale: 0.97 }}
              onClick={() => navigate(`/playlist/${playlist.id}`)}
              className="flex items-center gap-3 px-3 py-2.5 rounded-2xl cursor-pointer transition-all hover:bg-white/5 mb-1">
              <div className="w-11 h-11 rounded-xl shrink-0 overflow-hidden flex items-center justify-center"
                style={{ background: '#1C1530' }}>
                {playlist.image && playlist.image[0]
                  ? <img src={getImageUrl(playlist.image)} className="w-full h-full object-cover" alt="" />
                  : <Music size={18} style={{ color: 'rgba(255,107,157,0.5)' }} />
                }
              </div>
              <div className="flex flex-col overflow-hidden">
                <span className="text-white font-semibold text-[13px] truncate">{playlist.title}</span>
                <span className="text-[11px] truncate" style={{ color: 'rgba(255,255,255,0.4)' }}>
                  Playlist • {currentUser ? currentUser.name : 'Guest'}
                </span>
              </div>
            </motion.div>
          ))}
        </motion.div>

        {/* User / Login */}
        <div className="p-4 mt-auto" style={{ borderTop: '1px solid rgba(255,107,157,0.1)' }}>
          {currentUser ? (
            <div onClick={() => navigate('/profile')}
              className="flex items-center gap-3 cursor-pointer p-2 rounded-2xl transition-all hover:bg-white/5">
              {currentUser.image
                ? <img src={currentUser.image} alt={currentUser.name} className="w-9 h-9 rounded-full object-cover"
                    style={{ border: '2px solid rgba(255,107,157,0.4)' }} />
                : <div className="w-9 h-9 rounded-full flex items-center justify-center text-white font-bold text-sm"
                    style={{ background: 'linear-gradient(135deg, #FF6B9D, #C084FC)' }}>
                    {currentUser.name.charAt(0).toUpperCase()}
                  </div>
              }
              <div className="flex flex-col">
                <span className="text-[13px] font-bold text-white truncate max-w-[150px]">{currentUser.name}</span>
                <span className="text-[11px]" style={{ color: '#FF6B9D' }}>View Profile</span>
              </div>
            </div>
          ) : (
            <div className="flex flex-col gap-2">
              <button onClick={() => navigate('/signup')}
                className="w-full text-black font-bold py-2.5 rounded-2xl text-[13px] transition-all hover:opacity-90"
                style={{ background: 'linear-gradient(135deg, #FF6B9D, #FF8FB3)', boxShadow: '0 4px 16px rgba(255,107,157,0.35)' }}>
                Sign Up Free
              </button>
              <button onClick={() => navigate('/login')}
                className="w-full text-white font-bold py-2.5 rounded-2xl text-[13px] transition-all hover:bg-white/10"
                style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)' }}>
                Log In
              </button>
            </div>
          )}
        </div>
      </div>
    </aside>
  );
};
