import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { SearchIcon, CheckCircle2, ChevronLeft, Loader2, ArrowRight } from 'lucide-react';
import { api, getImageUrl } from '../services/api';
import { Artist } from '../types';
import { usePlayerStore } from '../store/playerStore';
import { motion, AnimatePresence } from 'framer-motion';

const POPULAR_ARTISTS = [
  'Taylor Swift', 'The Weeknd', 'Drake', 'Bad Bunny', 'BTS',
  'Ariana Grande', 'Eminem', 'Coldplay', 'Dua Lipa', 'Post Malone',
  'Billie Eilish', 'Harry Styles', 'Bruno Mars', 'Adele', 'Arijit Singh',
  'Shreya Ghoshal', 'AR Rahman', 'Atif Aslam', 'Sonu Nigam', 'Neha Kakkar',
];

export const ArtistSelection: React.FC = () => {
  const navigate = useNavigate();
  const { favoriteArtists, toggleArtistLike, syncUserToCloud } = usePlayerStore();
  const [artists, setArtists] = useState<Artist[]>([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetch = async () => {
      setLoading(true);
      try {
        const results = await Promise.all(POPULAR_ARTISTS.slice(0, 14).map(n => api.searchArtists(n)));
        const flat = results.flat().filter((v, i, a) => a.findIndex(t => t.id === v.id) === i);
        setArtists(flat);
      } catch (e) { console.error(e); }
      finally { setLoading(false); }
    };
    fetch();
  }, []);

  useEffect(() => {
    const timer = setTimeout(async () => {
      if (search.trim()) {
        setLoading(true);
        try {
          const r = await api.searchArtists(search);
          setArtists(r);
        } catch { } finally { setLoading(false); }
      }
    }, 400);
    return () => clearTimeout(timer);
  }, [search]);

  const isSelected = (a: Artist) => favoriteArtists.some(f => f.id === a.id);
  const selCount = favoriteArtists.length;

  const handleDone = () => {
    if (navigator.onLine) syncUserToCloud('private');
    navigate('/');
  };

  return (
    <div className="min-h-screen flex flex-col relative overflow-hidden"
      style={{ background: 'radial-gradient(ellipse at 30% 10%, rgba(255,107,157,0.14) 0%, transparent 55%), radial-gradient(ellipse at 80% 90%, rgba(192,132,252,0.10) 0%, transparent 50%), #0A0612' }}>

      {/* Floating petals */}
      {['12%', '40%', '70%', '88%'].map((l, i) => (
        <div key={i} className="absolute pointer-events-none select-none text-[14px] opacity-15"
          style={{ left: l, top: `${i * 22 + 5}%`, animation: `petalFall ${9 + i * 2}s ${i}s linear infinite` }}>
          🌸
        </div>
      ))}

      {/* Header */}
      <div className="relative z-10 px-5 pt-12 pb-6">
        <motion.div initial={{ opacity: 0, y: -16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
          {/* Logo */}
          <div className="flex items-center gap-2 mb-8">
            <div className="w-8 h-8 rounded-[12px] flex items-center justify-center text-[16px]"
              style={{ background: 'linear-gradient(135deg, #FF6B9D, #C084FC)' }}>
              🌸
            </div>
            <span className="font-display font-extrabold text-[15px] tracking-[0.18em] text-white">KAWAI SAKURA</span>
          </div>

          <p className="text-[13px] font-medium mb-2" style={{ color: 'rgba(255,107,157,0.8)' }}>
            ✦ Personalize your experience
          </p>
          <h1 className="font-display font-extrabold text-[28px] text-white leading-tight mb-1">
            Who do you<br />love to listen to?
          </h1>
          <p className="text-[13px]" style={{ color: 'rgba(255,255,255,0.4)' }}>
            Pick 3+ artists to build your perfect mix
          </p>
        </motion.div>
      </div>

      {/* Search */}
      <div className="relative z-10 px-5 mb-5">
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2, duration: 0.4 }}
          className="relative">
          <SearchIcon size={16} className="absolute left-4 top-1/2 -translate-y-1/2 z-10" style={{ color: '#FF6B9D' }} />
          <input type="text" value={search} onChange={e => setSearch(e.target.value)} placeholder="Search artists..."
            className="w-full pl-11 pr-4 py-3.5 rounded-2xl text-white text-[14px] placeholder-white/25 outline-none transition-all"
            style={{ background: 'rgba(255,107,157,0.08)', border: '1px solid rgba(255,107,157,0.2)' }}
            onFocus={e => { e.target.style.borderColor = 'rgba(255,107,157,0.5)'; }}
            onBlur={e => { e.target.style.borderColor = 'rgba(255,107,157,0.2)'; }} />
        </motion.div>
      </div>

      {/* Artist grid */}
      <div className="flex-1 overflow-y-auto no-scrollbar px-5 pb-32 relative z-10">
        {loading ? (
          <div className="grid grid-cols-3 gap-3">
            {Array(12).fill(0).map((_, i) => (
              <div key={i} className="flex flex-col items-center gap-2">
                <div className="w-full aspect-square rounded-2xl skeleton" />
                <div className="h-2.5 w-3/4 skeleton rounded-lg" />
              </div>
            ))}
          </div>
        ) : (
          <motion.div className="grid grid-cols-3 gap-3"
            initial="hidden" animate="visible"
            variants={{ visible: { transition: { staggerChildren: 0.04 } } }}>
            {artists.map((artist, i) => {
              const selected = isSelected(artist);
              return (
                <motion.div key={artist.id}
                  variants={{ hidden: { opacity: 0, scale: 0.85 }, visible: { opacity: 1, scale: 1, transition: { duration: 0.3 } } }}
                  whileTap={{ scale: 0.93 }}
                  onClick={() => toggleArtistLike(artist)}
                  className="flex flex-col items-center gap-2 cursor-pointer">
                  <div className="relative w-full aspect-square rounded-2xl overflow-hidden"
                    style={{
                      border: selected ? '2px solid #FF6B9D' : '2px solid transparent',
                      boxShadow: selected ? '0 0 20px rgba(255,107,157,0.4)' : 'none',
                      transition: 'all 0.25s ease',
                    }}>
                    <img src={getImageUrl(artist.image)} alt={artist.name} className="w-full h-full object-cover" loading="lazy" />
                    <div className="absolute inset-0 transition-all"
                      style={{ background: selected ? 'rgba(255,107,157,0.25)' : 'rgba(0,0,0,0.1)' }} />
                    <AnimatePresence>
                      {selected && (
                        <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} exit={{ scale: 0 }}
                          transition={{ type: 'spring', stiffness: 400, damping: 20 }}
                          className="absolute top-2 right-2 w-6 h-6 rounded-full flex items-center justify-center"
                          style={{ background: '#FF6B9D' }}>
                          <CheckCircle2 size={14} className="text-white" fill="white" />
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                  <span className="text-[11px] font-semibold text-center leading-tight line-clamp-2 w-full"
                    style={{ color: selected ? '#FF6B9D' : 'rgba(255,255,255,0.7)' }}>
                    {artist.name}
                  </span>
                </motion.div>
              );
            })}
          </motion.div>
        )}
      </div>

      {/* Bottom CTA */}
      <AnimatePresence>
        {selCount > 0 && (
          <motion.div
            initial={{ y: 80, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: 80, opacity: 0 }}
            transition={{ type: 'spring', damping: 25, stiffness: 260 }}
            className="fixed bottom-0 left-0 right-0 z-50 p-5 pb-8"
            style={{ background: 'linear-gradient(to top, #0A0612 60%, transparent)' }}>
            <motion.button whileTap={{ scale: 0.97 }} onClick={handleDone}
              className="w-full py-4 rounded-3xl flex items-center justify-center gap-3 font-display font-bold text-[16px] text-black"
              style={{ background: 'linear-gradient(135deg, #FF6B9D, #C084FC)', boxShadow: '0 8px 30px rgba(255,107,157,0.5)' }}>
              <span>Continue with {selCount} artist{selCount > 1 ? 's' : ''}</span>
              <ArrowRight size={18} />
            </motion.button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
