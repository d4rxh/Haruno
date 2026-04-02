import React, { useState } from 'react';
import { usePlayerStore } from '../store/playerStore';
import { Search, Plus, ArrowUpDown, Pin, Heart, Music, Sparkles, CheckCircle2, WifiOff, UserCircle } from 'lucide-react';
import { getImageUrl } from '../services/api';
import { useNavigate } from 'react-router-dom';
import { CreatePlaylistModal } from '../components/CreatePlaylistModal';
import { motion, Variants } from 'framer-motion';

const containerVariants: Variants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { staggerChildren: 0.06, delayChildren: 0.05 } }
};
const itemVariants: Variants = {
  hidden: { opacity: 0, x: -12 },
  visible: { opacity: 1, x: 0, transition: { type: "tween", ease: "easeOut", duration: 0.2 } }
};

export const Library: React.FC = () => {
  const { likedSongs, userPlaylists, currentUser, isOfflineMode, downloadedSongIds } = usePlayerStore();
  const navigate = useNavigate();
  const [filter, setFilter] = useState<'All' | 'Playlists' | 'Artists' | 'Downloaded'>('All');
  const [isModalOpen, setIsModalOpen] = useState(false);

  const filteredPlaylists = userPlaylists;
  const downloadedLikedSongsCount = likedSongs.filter(s => downloadedSongIds.includes(s.id)).length;

  const FilterChip = ({ label }: { label: string }) => (
    <motion.button
      whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}
      onClick={() => setFilter(label as any)}
      className="px-5 py-2 rounded-full text-xs font-bold whitespace-nowrap transition-all"
      style={filter === label
        ? { background: 'linear-gradient(135deg, #FF6B9D, #FF6B9D)', color: 'white', boxShadow: '0 0 12px rgba(255,107,157,0.4)' }
        : { background: 'rgba(255,255,255,0.07)', color: 'rgba(255,255,255,0.7)', border: '1px solid rgba(255,255,255,0.08)' }
      }
    >{label}</motion.button>
  );

  return (
    <div className="min-h-full pb-32 pt-4 px-4" style={{ background: 'linear-gradient(180deg, #1A0D2E 0%, #0A0612 25%, #0A0612 100%)' }}>
      {/* Header */}
      <div className="flex items-center justify-between mb-5 sticky top-0 z-20 py-2"
        style={{ background: 'rgba(13,13,20,0.9)', backdropFilter: 'blur(20px)', WebkitBackdropFilter: 'blur(20px)' }}>
        <div className="flex items-center gap-3">
          <motion.div
            whileHover={{ scale: 1.08 }} whileTap={{ scale: 0.92 }}
            onClick={() => currentUser ? navigate('/profile') : navigate('/login')}
            className="w-9 h-9 rounded-full flex items-center justify-center font-bold text-sm cursor-pointer overflow-hidden"
            style={{ background: 'linear-gradient(135deg, #FF6B9D, #C084FC)', boxShadow: '0 0 10px rgba(255,107,157,0.4)' }}
          >
            {currentUser?.image
              ? <img src={currentUser.image} alt="Profile" className="w-full h-full object-cover" />
              : currentUser
                ? <span className="text-white font-bold">{currentUser.name.charAt(0).toUpperCase()}</span>
                : <UserCircle size={18} className="text-white" />
            }
          </motion.div>
          <h1 className="text-2xl font-bold text-white">Your Library</h1>
        </div>
        <div className="flex items-center gap-3">
          {!isOfflineMode && (
            <button onClick={() => navigate('/premium')} className="text-pink-400 hover:text-pink-300 transition-colors">
              <Sparkles size={22} />
            </button>
          )}
          <button onClick={() => setIsModalOpen(true)}
            className="w-8 h-8 rounded-xl flex items-center justify-center transition-all hover:bg-pink-500/20"
            style={{ background: 'rgba(255,107,157,0.15)', border: '1px solid rgba(255,107,157,0.2)' }}>
            <Plus size={18} className="text-pink-400" />
          </button>
        </div>
      </div>

      {/* Offline Banner */}
      {isOfflineMode && (
        <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}
          className="mb-4 p-4 rounded-2xl flex items-center gap-3"
          style={{ background: 'rgba(255,107,157,0.1)', border: '1px solid rgba(255,107,157,0.2)' }}>
          <div className="p-2 rounded-xl" style={{ background: 'rgba(255,107,157,0.2)' }}>
            <WifiOff size={18} className="text-pink-400" />
          </div>
          <div>
            <p className="text-sm font-bold text-white">You're offline</p>
            <p className="text-xs text-pink-300/60">Showing only downloaded music.</p>
          </div>
        </motion.div>
      )}

      {/* Filters */}
      <div className="flex items-center gap-2 mb-5 overflow-x-auto no-scrollbar">
        {!isOfflineMode && <FilterChip label="All" />}
        {!isOfflineMode && <FilterChip label="Playlists" />}
        {!isOfflineMode && <FilterChip label="Artists" />}
        <FilterChip label="Downloaded" />
      </div>

      {/* Sort Row */}
      <div className="flex items-center justify-between mb-4 px-1">
        <div className="flex items-center gap-1.5 text-pink-300/60 text-sm cursor-pointer hover:text-pink-300 transition-colors">
          <ArrowUpDown size={14} />
          <span className="font-semibold">Recents</span>
        </div>
      </div>

      {/* Items */}
      <motion.div className="flex flex-col gap-1.5" variants={containerVariants} initial="hidden" animate="visible">
        {/* Liked Songs */}
        {(!isOfflineMode || downloadedLikedSongsCount > 0) && (
          <motion.div
            variants={itemVariants}
            whileHover={{ backgroundColor: 'rgba(255,107,157,0.08)' }}
            whileTap={{ scale: 0.99 }}
            onClick={() => navigate('/liked')}
            className="flex items-center gap-4 p-2.5 rounded-2xl cursor-pointer transition-all group"
          >
            <div className="w-14 h-14 flex items-center justify-center shrink-0 rounded-xl"
              style={{ background: 'linear-gradient(135deg, #6D28D9, #EC4899)', boxShadow: '0 4px 15px rgba(109,40,217,0.3)' }}>
              <Heart size={24} fill="white" className="text-white" />
            </div>
            <div className="flex flex-col flex-1 min-w-0">
              <span className="text-white font-bold text-base truncate">Liked Songs</span>
              <div className="flex items-center gap-1.5 text-pink-300/60 text-xs font-medium">
                <Pin size={11} className="text-pink-400 rotate-45" />
                <span>Playlist • {isOfflineMode ? downloadedLikedSongsCount : likedSongs.length} songs</span>
              </div>
            </div>
          </motion.div>
        )}

        {/* Playlists */}
        {filteredPlaylists.map(playlist => (
          <motion.div
            key={playlist.id}
            variants={itemVariants}
            whileHover={{ backgroundColor: 'rgba(255,107,157,0.08)' }}
            whileTap={{ scale: 0.99 }}
            onClick={() => navigate(`/playlist/${playlist.id}`)}
            className="flex items-center gap-4 p-2.5 rounded-2xl cursor-pointer transition-all group"
          >
            <div className="w-14 h-14 shrink-0 rounded-xl overflow-hidden" style={{ background: '#1C1530', border: '1px solid rgba(255,107,157,0.15)' }}>
              {playlist.image && playlist.image[0]
                ? <img src={getImageUrl(playlist.image)} alt={playlist.title} className="w-full h-full object-cover" />
                : <div className="w-full h-full flex items-center justify-center"><Music size={22} className="text-pink-400/40" /></div>
              }
            </div>
            <div className="flex flex-col flex-1 min-w-0">
              <span className="text-white font-bold text-base truncate">{playlist.title}</span>
              <span className="text-pink-300/60 text-xs font-medium truncate">Playlist • {playlist.subtitle}</span>
            </div>
            {isOfflineMode && <CheckCircle2 size={16} className="text-pink-400 shrink-0" />}
          </motion.div>
        ))}

        {/* Empty offline state */}
        {isOfflineMode && filteredPlaylists.length === 0 && downloadedLikedSongsCount === 0 && (
          <div className="text-center py-16">
            <div className="w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4" style={{ background: 'rgba(255,107,157,0.1)' }}>
              <WifiOff size={28} className="text-pink-400/50" />
            </div>
            <p className="font-bold text-lg text-white/70">No downloads yet.</p>
            <p className="text-sm text-pink-300/40 mt-1">Go online to download music.</p>
          </div>
        )}
      </motion.div>

      {isModalOpen && <CreatePlaylistModal onClose={() => setIsModalOpen(false)} />}
    </div>
  );
};
