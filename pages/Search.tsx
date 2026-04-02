import React, { useState, useEffect, useRef } from 'react';
import { Search as SearchIcon, X, Play, Heart, Flame, Music, Headphones, Mic2 } from 'lucide-react';
import { api, getImageUrl } from '../services/api';
import { Song, Album, Artist } from '../types';
import { usePlayerStore } from '../store/playerStore';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';

const CATEGORIES = [
  { label: 'Trending 🔥', query: 'trending 2024', emoji: '🔥', color: 'rgba(255,107,157,0.15)', border: 'rgba(255,107,157,0.3)', text: '#FF6B9D' },
  { label: 'Hindi', query: 'hindi hits', emoji: '🎵', color: 'rgba(255,183,67,0.12)', border: 'rgba(255,183,67,0.3)', text: '#FFB743' },
  { label: 'Punjabi', query: 'punjabi songs', emoji: '✨', color: 'rgba(192,132,252,0.12)', border: 'rgba(192,132,252,0.3)', text: '#C084FC' },
  { label: 'Tamil', query: 'tamil songs 2024', emoji: '🌟', color: 'rgba(96,165,250,0.12)', border: 'rgba(96,165,250,0.3)', text: '#60A5FA' },
  { label: 'Pop', query: 'pop hits', emoji: '💫', color: 'rgba(251,113,133,0.12)', border: 'rgba(251,113,133,0.3)', text: '#FB7185' },
  { label: 'Lofi', query: 'lofi chill', emoji: '🌙', color: 'rgba(99,102,241,0.12)', border: 'rgba(99,102,241,0.3)', text: '#6366F1' },
  { label: 'Hip-Hop', query: 'hip hop 2024', emoji: '🎤', color: 'rgba(251,146,60,0.12)', border: 'rgba(251,146,60,0.3)', text: '#FB923C' },
  { label: 'K-Pop', query: 'kpop hits', emoji: '💜', color: 'rgba(167,139,250,0.12)', border: 'rgba(167,139,250,0.3)', text: '#A78BFA' },
  { label: 'Chill', query: 'chill vibes', emoji: '🌊', color: 'rgba(52,211,153,0.12)', border: 'rgba(52,211,153,0.3)', text: '#34D399' },
  { label: 'Romance', query: 'romantic songs', emoji: '🌸', color: 'rgba(255,107,157,0.12)', border: 'rgba(255,107,157,0.3)', text: '#FF6B9D' },
  { label: 'Party', query: 'party songs', emoji: '🎉', color: 'rgba(250,204,21,0.12)', border: 'rgba(250,204,21,0.3)', text: '#FACC15' },
  { label: 'Indie', query: 'indie hits', emoji: '🎸', color: 'rgba(248,113,113,0.12)', border: 'rgba(248,113,113,0.3)', text: '#F87171' },
];

const Shimmer = ({ w = 'w-full', h = 'h-4', r = 'rounded-xl' }) => (
  <div className={`${w} ${h} ${r} skeleton`} />
);

export const Search: React.FC = () => {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<{ songs: Song[]; albums: Album[]; artists: Artist[] }>({ songs: [], albums: [], artists: [] });
  const [isLoading, setIsLoading] = useState(false);
  const [activeCategory, setActiveCategory] = useState<string | null>(null);
  const [categoryResults, setCategoryResults] = useState<Song[]>([]);
  const [catLoading, setCatLoading] = useState(false);
  const { playSong, likedSongs, toggleLike, musicSource } = usePlayerStore();
  const navigate = useNavigate();
  const inputRef = useRef<HTMLInputElement>(null);
  const abortRef = useRef<AbortController | null>(null);

  // Search logic
  useEffect(() => {
    if (abortRef.current) abortRef.current.abort();
    if (!query.trim()) { setResults({ songs: [], albums: [], artists: [] }); setIsLoading(false); return; }
    setIsLoading(true);
    const timer = setTimeout(async () => {
      abortRef.current = new AbortController();
      try {
        const [songs, albums, artists] = await Promise.all([
          api.searchSongs(query, musicSource), api.searchAlbums(query), api.searchArtists(query),
        ]);
        if (!abortRef.current?.signal.aborted) setResults({ songs, albums, artists });
      } catch (e: any) {
        if (e.name !== 'AbortError') console.error(e);
      } finally {
        if (!abortRef.current?.signal.aborted) setIsLoading(false);
      }
    }, 300);
    return () => clearTimeout(timer);
  }, [query, musicSource]);

  const handleCategory = async (cat: typeof CATEGORIES[0]) => {
    if (activeCategory === cat.label) { setActiveCategory(null); return; }
    setActiveCategory(cat.label);
    setCatLoading(true);
    try {
      const songs = await api.searchSongs(cat.query);
      setCategoryResults(songs);
    } catch { } finally { setCatLoading(false); }
  };

  const hasResults = results.songs.length > 0 || results.albums.length > 0 || results.artists.length > 0;

  const ResultRow: React.FC<{ item: Song | Album | Artist; idx: number }> = ({ item, idx }) => {
    const img = getImageUrl(item.image);
    const isArtist = item.type === 'artist';
    const isSong = item.type === 'song';
    const title = isSong || isArtist || item.type === 'album' ? item.name : (item as any).title;
    const sub = isSong
      ? (item as Song).artists?.primary?.[0]?.name || 'Artist'
      : isArtist ? 'Artist'
      : `Album · ${(item as Album).artists?.primary?.[0]?.name || 'Artist'}`;
    const liked = isSong && likedSongs.some(s => s.id === item.id);

    return (
      <motion.div
        initial={{ opacity: 0, x: -10 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ delay: idx * 0.03, duration: 0.3 }}
        className="flex items-center gap-3 px-4 py-2.5 rounded-2xl cursor-pointer group transition-all hover:bg-white/5"
        onClick={() => {
          if (isSong) playSong(item as Song, results.songs);
          else if (item.type === 'album') navigate(`/album/${item.id}`);
          else navigate(`/artist/${item.id}`, { state: { artist: item } });
        }}
      >
        <div className={`w-12 h-12 shrink-0 overflow-hidden ${isArtist ? 'rounded-full' : 'rounded-[14px]'} relative`}>
          <img src={img} alt={title} className="w-full h-full object-cover" loading="lazy" />
          {isSong && (
            <div className="absolute inset-0 bg-black/0 group-hover:bg-black/40 transition-all flex items-center justify-center">
              <Play size={18} fill="white" className="text-white opacity-0 group-hover:opacity-100 transition-opacity" />
            </div>
          )}
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-white font-semibold text-[14px] truncate">{title}</p>
          <p className="text-[12px] truncate mt-0.5" style={{ color: 'rgba(255,255,255,0.4)' }}>{sub}</p>
        </div>
        {isSong && (
          <motion.button whileTap={{ scale: 0.85 }}
            onClick={e => { e.stopPropagation(); toggleLike(item as Song); }}
            className="w-8 h-8 flex items-center justify-center rounded-xl opacity-0 group-hover:opacity-100 transition-opacity">
            <Heart size={16} fill={liked ? '#FF6B9D' : 'none'} style={{ color: liked ? '#FF6B9D' : 'rgba(255,255,255,0.5)' }} />
          </motion.button>
        )}
      </motion.div>
    );
  };

  return (
    <div className="min-h-full pb-4 mesh-bg">
      {/* Sticky search bar */}
      <div className="sticky top-0 z-20 px-4 pt-5 pb-3 transition-all"
        style={{ background: 'rgba(10,6,18,0.88)', backdropFilter: 'blur(24px)', WebkitBackdropFilter: 'blur(24px)', borderBottom: '1px solid rgba(255,107,157,0.07)' }}>
        <h1 className="font-display font-extrabold text-[24px] text-white mb-4">Discover 🔍</h1>
        <div className="relative">
          <SearchIcon size={17} className="absolute left-4 top-1/2 -translate-y-1/2 z-10" style={{ color: '#FF6B9D' }} />
          <input
            ref={inputRef}
            type="text" value={query} onChange={e => setQuery(e.target.value)}
            placeholder="Songs, artists, albums..."
            className="w-full pl-11 pr-10 py-3.5 rounded-2xl text-white text-[14px] font-medium placeholder-white/25 outline-none transition-all"
            style={{ background: 'rgba(255,107,157,0.07)', border: '1px solid rgba(255,107,157,0.18)' }}
            onFocus={e => { e.target.style.borderColor = 'rgba(255,107,157,0.5)'; e.target.style.boxShadow = '0 0 0 3px rgba(255,107,157,0.1)'; }}
            onBlur={e => { e.target.style.borderColor = 'rgba(255,107,157,0.18)'; e.target.style.boxShadow = 'none'; }}
          />
          <AnimatePresence>
            {query && (
              <motion.button initial={{ opacity: 0, scale: 0.8 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.8 }}
                onClick={() => setQuery('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 w-6 h-6 rounded-full flex items-center justify-center"
                style={{ background: 'rgba(255,255,255,0.12)' }}>
                <X size={13} className="text-white" />
              </motion.button>
            )}
          </AnimatePresence>
        </div>
      </div>

      <AnimatePresence mode="wait">
        {/* Search results */}
        {query.trim() ? (
          <motion.div key="results" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }} className="px-2 pt-4">
            {isLoading ? (
              <div className="flex flex-col gap-3 px-4">
                {Array(6).fill(0).map((_, i) => (
                  <div key={i} className="flex items-center gap-3">
                    <Shimmer w="w-12" h="h-12" r="rounded-[14px]" />
                    <div className="flex-1 flex flex-col gap-2">
                      <Shimmer w="w-3/4" h="h-3" />
                      <Shimmer w="w-1/2" h="h-2.5" />
                    </div>
                  </div>
                ))}
              </div>
            ) : hasResults ? (
              <div className="flex flex-col">
                {results.songs.length > 0 && (
                  <div className="mb-4">
                    <p className="text-[11px] font-bold tracking-widest uppercase px-4 mb-2" style={{ color: 'rgba(255,107,157,0.7)' }}>Songs</p>
                    {results.songs.slice(0, 8).map((item, i) => <ResultRow key={item.id} item={item} idx={i} />)}
                  </div>
                )}
                {results.artists.length > 0 && (
                  <div className="mb-4">
                    <p className="text-[11px] font-bold tracking-widest uppercase px-4 mb-2" style={{ color: 'rgba(192,132,252,0.7)' }}>Artists</p>
                    {results.artists.slice(0, 4).map((item, i) => <ResultRow key={item.id} item={item} idx={i} />)}
                  </div>
                )}
                {results.albums.length > 0 && (
                  <div className="mb-4">
                    <p className="text-[11px] font-bold tracking-widest uppercase px-4 mb-2" style={{ color: 'rgba(255,255,255,0.3)' }}>Albums</p>
                    {results.albums.slice(0, 4).map((item, i) => <ResultRow key={item.id} item={item} idx={i} />)}
                  </div>
                )}
              </div>
            ) : (
              <div className="flex flex-col items-center gap-3 py-16 text-center">
                <div className="text-5xl">🔍</div>
                <p className="text-white font-bold text-[16px]">No results for "{query}"</p>
                <p className="text-[13px]" style={{ color: 'rgba(255,255,255,0.35)' }}>Try a different search term</p>
              </div>
            )}
          </motion.div>
        ) : (
          /* Browse categories */
          <motion.div key="browse" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }} className="px-4 pt-5">
            <div className="flex items-center gap-2 mb-4">
              <Flame size={16} style={{ color: '#FF6B9D' }} />
              <h2 className="font-display font-bold text-[16px] text-white">Browse Genres</h2>
            </div>

            {/* Category grid */}
            <div className="grid grid-cols-2 gap-2.5 mb-6">
              {CATEGORIES.map((cat, i) => (
                <motion.button
                  key={cat.label}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.04, duration: 0.3 }}
                  whileTap={{ scale: 0.96 }}
                  onClick={() => handleCategory(cat)}
                  className="flex items-center gap-3 px-4 py-3.5 rounded-2xl text-left transition-all"
                  style={{
                    background: activeCategory === cat.label ? cat.color : 'rgba(255,255,255,0.04)',
                    border: `1px solid ${activeCategory === cat.label ? cat.border : 'rgba(255,255,255,0.07)'}`,
                    boxShadow: activeCategory === cat.label ? `0 4px 16px ${cat.color}` : 'none',
                  }}
                >
                  <span className="text-xl">{cat.emoji}</span>
                  <span className="font-bold text-[13px]" style={{ color: activeCategory === cat.label ? cat.text : 'rgba(255,255,255,0.7)' }}>
                    {cat.label.replace(/[^\w\s]/g, '').trim()}
                  </span>
                </motion.button>
              ))}
            </div>

            {/* Category results */}
            <AnimatePresence>
              {activeCategory && (
                <motion.div key={activeCategory} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }}
                  transition={{ duration: 0.3 }}>
                  <p className="text-[11px] font-bold tracking-widest uppercase mb-3" style={{ color: 'rgba(255,107,157,0.6)' }}>
                    {activeCategory} Songs
                  </p>
                  {catLoading ? (
                    <div className="flex flex-col gap-3">
                      {Array(5).fill(0).map((_, i) => (
                        <div key={i} className="flex items-center gap-3">
                          <Shimmer w="w-12" h="h-12" r="rounded-[14px]" />
                          <div className="flex-1 flex flex-col gap-2">
                            <Shimmer w="w-3/4" h="h-3" />
                            <Shimmer w="w-1/2" h="h-2.5" />
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="flex flex-col gap-0.5">
                      {categoryResults.map((song, i) => <ResultRow key={song.id} item={song} idx={i} />)}
                    </div>
                  )}
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
