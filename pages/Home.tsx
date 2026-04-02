import React, { useEffect, useState, useRef } from 'react';
import { api, getImageUrl } from '../services/api';
import { Song, Album } from '../types';
import { usePlayerStore } from '../store/playerStore';
import {
  WifiOff, Sparkles, Clock, Heart, ChevronRight, Music2,
  TrendingUp, Radio, Zap, BarChart2, Gamepad2, Moon, Sun,
  Coffee, Sunset, Star, Trophy, Flame, Gift
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { SongCard } from '../components/SongCard';
import { motion, AnimatePresence } from 'framer-motion';

// ─── Recommendation Engine ────────────────────────────────────────────────────
interface ListeningProfile {
  topArtists: { name: string; id?: string; count: number; image?: any[] }[];
  topLanguages: { lang: string; count: number }[];
  currentMood: string;
  moodEmoji: string;
  aura: string;
  auraColor: string;
  totalSongs: number;
  streakDays: number;
}

const AURA_TYPES = [
  { name: 'Night Owl Indie Soul', min: 0, color: '#6366F1', emoji: '🦉' },
  { name: 'Bollywood Romantic', min: 3, color: '#FF6B9D', emoji: '💕' },
  { name: 'Hip-Hop Energy', min: 5, color: '#FB923C', emoji: '🔥' },
  { name: 'Chill Vibes Master', min: 8, color: '#34D399', emoji: '🌊' },
  { name: 'Pop Princess', min: 10, color: '#C084FC', emoji: '👑' },
  { name: 'Melody Wanderer', min: 15, color: '#60A5FA', emoji: '🌌' },
];

function buildProfile(history: Song[], likedSongs: Song[], favArtists: any[]): ListeningProfile {
  const artistMap: Record<string, { count: number; id?: string; image?: any[] }> = {};
  history.forEach(s => s.artists?.primary?.forEach(a => {
    if (!artistMap[a.name]) artistMap[a.name] = { count: 0, id: a.id, image: a.image };
    artistMap[a.name].count += 1;
  }));
  likedSongs.forEach(s => s.artists?.primary?.forEach(a => {
    if (!artistMap[a.name]) artistMap[a.name] = { count: 0, id: a.id, image: a.image };
    artistMap[a.name].count += 3;
  }));
  (favArtists || []).forEach((a: any) => {
    if (!artistMap[a.name]) artistMap[a.name] = { count: 0, id: a.id, image: a.image };
    artistMap[a.name].count += 5;
  });
  const langMap: Record<string, number> = {};
  [...history, ...likedSongs].forEach(s => { if (s.language) langMap[s.language] = (langMap[s.language] || 0) + 1; });
  const h = new Date().getHours();
  const moods = [
    { m: 'Night Feels', e: '🌙', h: [0, 5] },
    { m: 'Morning Energy', e: '☀️', h: [5, 9] },
    { m: 'Focus Mode', e: '☕', h: [9, 12] },
    { m: 'Afternoon Vibes', e: '🌤️', h: [12, 17] },
    { m: 'Golden Hour', e: '🌅', h: [17, 21] },
    { m: 'Evening Chill', e: '🌆', h: [21, 24] },
  ];
  const mood = moods.find(m => h >= m.h[0] && h < m.h[1]) || moods[5];
  const total = history.length + likedSongs.length;
  const aura = AURA_TYPES.filter(a => total >= a.min).pop() || AURA_TYPES[0];
  const streakDays = Math.min(Math.floor(total / 3) + 1, 30);
  return {
    topArtists: Object.entries(artistMap).sort((a, b) => b[1].count - a[1].count).slice(0, 8).map(([name, v]) => ({ name, id: v.id, count: v.count, image: v.image })),
    topLanguages: Object.entries(langMap).sort((a, b) => b[1] - a[1]).slice(0, 3).map(([lang, count]) => ({ lang, count })),
    currentMood: mood.m, moodEmoji: mood.e,
    aura: aura.name, auraColor: aura.color,
    totalSongs: total, streakDays,
  };
}

async function fetchRecommendations(profile: ListeningProfile, isFresh: boolean): Promise<Song[]> {
  if (isFresh) {
    const h = new Date().getHours();
    const q = h < 9 ? 'Morning Acoustic Chill' : h < 17 ? 'Top Hits 2024' : 'Late Night Lofi';
    return api.searchSongs(q);
  }
  const queries: Promise<Song[]>[] = [];
  profile.topArtists.slice(0, 2).forEach(a => queries.push(api.searchSongs(a.name)));
  if (profile.topLanguages[0]) queries.push(api.searchSongs(`Best ${profile.topLanguages[0].lang} songs`));
  queries.push(api.searchSongs(profile.currentMood));
  const results = await Promise.allSettled(queries);
  const seen = new Set<string>(); const all: Song[] = [];
  results.forEach(r => { if (r.status === 'fulfilled') r.value.forEach(s => { if (!seen.has(s.id)) { seen.add(s.id); all.push(s); } }); });
  return all.slice(0, 24);
}

const DAILY_MIXES = [
  { title: 'Morning Boost', query: 'Morning Energy upbeat', emoji: '☀️', color: '#FFB743' },
  { title: 'Deep Focus', query: 'lofi study focus', emoji: '☕', color: '#60A5FA' },
  { title: 'Workout Fire', query: 'workout gym songs', emoji: '🔥', color: '#FB923C' },
  { title: 'Chill Wave', query: 'chill vibes relaxing', emoji: '🌊', color: '#34D399' },
  { title: 'Romance', query: 'romantic hindi songs', emoji: '💕', color: '#FF6B9D' },
  { title: 'Night Drive', query: 'night drive songs', emoji: '🌙', color: '#6366F1' },
];

// ─── UI Components ─────────────────────────────────────────────────────────────
const Shimmer = ({ w = 'w-full', h = 'h-4', r = 'rounded-xl' }: any) => (
  <div className={`${w} ${h} ${r} skeleton`} />
);
const SkeletonCard = () => (
  <div className="shrink-0 w-[148px]">
    <Shimmer w="w-[148px]" h="h-[148px]" r="rounded-[20px]" />
    <div className="mt-3 px-1 flex flex-col gap-2"><Shimmer w="w-4/5" h="h-3" /><Shimmer w="w-1/2" h="h-2.5" /></div>
  </div>
);
const SkeletonQuick = () => <div className="h-[52px] rounded-2xl skeleton" />;

const QuickCard: React.FC<{ title: string; image?: string; isLiked?: boolean; onClick?: () => void }> = ({ title, image, isLiked, onClick }) => (
  <motion.div whileTap={{ scale: 0.96 }} onClick={onClick}
    className="flex items-center cursor-pointer rounded-2xl overflow-hidden h-[52px] group"
    style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.07)' }}>
    {isLiked
      ? <div className="h-[52px] w-[52px] shrink-0 flex items-center justify-center" style={{ background: 'linear-gradient(135deg,#FF6B9D,#C084FC)' }}>
          <Heart size={17} fill="white" stroke="none" />
        </div>
      : <img src={image} alt="" className="h-[52px] w-[52px] object-cover shrink-0" />
    }
    <span className="px-3 text-[13px] font-semibold text-white line-clamp-2 leading-tight flex-1">{title}</span>
  </motion.div>
);

const ArtistBubble: React.FC<{ name: string; image?: any[]; onClick?: () => void }> = ({ name, image, onClick }) => {
  const imgUrl = image ? getImageUrl(image) : null;
  return (
    <motion.div whileTap={{ scale: 0.93 }} onClick={onClick} className="shrink-0 flex flex-col items-center gap-2 cursor-pointer w-[84px]">
      <div className="w-[72px] h-[72px] rounded-full overflow-hidden" style={{ border: '2px solid rgba(255,107,157,0.3)' }}>
        {imgUrl ? <img src={imgUrl} alt={name} className="w-full h-full object-cover" />
          : <div className="w-full h-full flex items-center justify-center font-black text-xl text-white" style={{ background: 'linear-gradient(135deg,#1C1530,#2A1545)' }}>{name.charAt(0)}</div>}
      </div>
      <span className="text-[11px] font-semibold text-center line-clamp-2 leading-tight w-full" style={{ color: 'rgba(255,255,255,0.6)' }}>{name}</span>
    </motion.div>
  );
};

const SectionTitle: React.FC<{ icon: React.ReactNode; title: string; sub?: string; onMore?: () => void }> = ({ icon, title, sub, onMore }) => (
  <div className="flex items-start justify-between px-5 mb-4">
    <div className="flex items-center gap-2.5">
      <span style={{ color: '#FF6B9D' }}>{icon}</span>
      <div>
        <h2 className="text-[16px] font-display font-bold text-white leading-tight">{title}</h2>
        {sub && <p className="text-[11px] mt-0.5 font-medium" style={{ color: 'rgba(255,255,255,0.35)' }}>{sub}</p>}
      </div>
    </div>
    {onMore && (
      <button onClick={onMore} className="flex items-center gap-0.5 text-[11px] font-bold tracking-widest uppercase mt-1" style={{ color: 'rgba(255,255,255,0.3)' }}>
        More <ChevronRight size={12} />
      </button>
    )}
  </div>
);

// ─── Main Home ─────────────────────────────────────────────────────────────────
export const Home: React.FC = () => {
  const { history, playSong, currentUser, isOfflineMode, downloadedSongIds, likedSongs, favoriteArtists } = usePlayerStore();
  const navigate = useNavigate();
  const [recommended, setRecommended] = useState<Song[]>([]);
  const [radioSongs, setRadioSongs] = useState<Song[]>([]);
  const [recentItems, setRecentItems] = useState<(Song | Album)[]>([]);
  const [dailyMixSongs, setDailyMixSongs] = useState<Record<string, Song[]>>({});
  const [activeMix, setActiveMix] = useState<string | null>(null);
  const [mixLoading, setMixLoading] = useState(false);
  const [profile, setProfile] = useState<ListeningProfile | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isScrolled, setIsScrolled] = useState(false);
  const [activeTab, setActiveTab] = useState<'all' | 'music' | 'artists'>('all');
  const [radioPlaying, setRadioPlaying] = useState(false);
  const radioIndexRef = useRef(0);

  const greeting = () => {
    const h = new Date().getHours();
    if (h < 5) return 'Up late?'; if (h < 12) return 'Good morning'; if (h < 17) return 'Good afternoon'; return 'Good evening';
  };

  useEffect(() => {
    if (isOfflineMode) { setIsLoading(false); setRecommended(likedSongs.filter(s => downloadedSongIds.includes(s.id))); return; }
    const p = buildProfile(history, likedSongs, favoriteArtists || []);
    setProfile(p);
    const isFresh = history.length === 0 && likedSongs.length === 0 && (favoriteArtists || []).length === 0;
    setIsLoading(true);
    fetchRecommendations(p, isFresh).then(songs => { setRecommended(songs); setRadioSongs(songs); }).catch(console.error).finally(() => setIsLoading(false));
  }, [isOfflineMode]);

  useEffect(() => {
    if (history.length > 0) { setRecentItems(history.slice(0, 8) as any); return; }
    if (!isOfflineMode) {
      Promise.all([api.searchSongs('Arijit Singh hits'), api.searchSongs('Dua Lipa')]).then(([a, b]) => setRecentItems([...a.slice(0, 3), ...b.slice(0, 3)] as any));
    }
  }, [history, isOfflineMode]);

  useEffect(() => {
    const main = document.querySelector('main');
    const fn = () => main && setIsScrolled(main.scrollTop > 10);
    main?.addEventListener('scroll', fn);
    return () => main?.removeEventListener('scroll', fn);
  }, []);

  const handleMix = async (mix: typeof DAILY_MIXES[0]) => {
    if (activeMix === mix.title) { setActiveMix(null); return; }
    setActiveMix(mix.title);
    if (dailyMixSongs[mix.title]) return;
    setMixLoading(true);
    try {
      const songs = await api.searchSongs(mix.query);
      setDailyMixSongs(prev => ({ ...prev, [mix.title]: songs }));
    } catch { } finally { setMixLoading(false); }
  };

  const handleSakuraRadio = () => {
    if (radioSongs.length === 0) return;
    setRadioPlaying(true);
    playSong(radioSongs[radioIndexRef.current], radioSongs);
    radioIndexRef.current = (radioIndexRef.current + 1) % radioSongs.length;
  };

  const userName = currentUser ? currentUser.name.split(' ')[0] : 'Listener';
  const likedArtists = profile?.topArtists || [];

  const cv = { hidden: { opacity: 0 }, visible: { opacity: 1, transition: { staggerChildren: 0.06, delayChildren: 0.02 } } };
  const iv = { hidden: { opacity: 0, y: 16 }, visible: { opacity: 1, y: 0, transition: { duration: 0.4, ease: [0.25, 0.46, 0.45, 0.94] } } };

  return (
    <motion.div variants={cv} initial="hidden" animate="visible" className="flex flex-col min-h-full pb-36 mesh-bg">

      {/* ── Header ── */}
      <div className="px-5 flex items-center justify-between sticky top-0 z-50 py-4 transition-all duration-300"
        style={{ background: isScrolled ? 'rgba(10,6,18,0.92)' : 'transparent', backdropFilter: isScrolled ? 'blur(28px)' : 'none', borderBottom: isScrolled ? '1px solid rgba(255,107,157,0.1)' : '1px solid transparent' }}>
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-[12px] flex items-center justify-center text-[16px]" style={{ background: 'linear-gradient(135deg,#FF6B9D,#C084FC)', boxShadow: '0 4px 12px rgba(255,107,157,0.4)' }}>🌸</div>
          <div className="flex flex-col leading-none">
            <span className="font-display font-extrabold text-[12px] tracking-[0.18em] text-white">KAWAI</span>
            <span className="font-display font-extrabold text-[12px] tracking-[0.18em]" style={{ background: 'linear-gradient(90deg,#FF6B9D,#C084FC)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text' }}>SAKURA</span>
          </div>
        </div>
        <div className="flex items-center gap-2.5">
          {/* Streak badge */}
          {profile && profile.streakDays > 0 && (
            <motion.div whileTap={{ scale: 0.9 }} onClick={() => navigate('/stats')}
              className="flex items-center gap-1 px-3 py-1.5 rounded-full cursor-pointer"
              style={{ background: 'rgba(251,146,60,0.15)', border: '1px solid rgba(251,146,60,0.3)' }}>
              <Flame size={11} style={{ color: '#FB923C' }} />
              <span className="text-[11px] font-bold" style={{ color: '#FB923C' }}>{profile.streakDays}d</span>
            </motion.div>
          )}
          {isOfflineMode && (
            <div className="flex items-center gap-1.5 text-[11px] font-bold px-3 py-1.5 rounded-full" style={{ background: 'rgba(255,255,255,0.07)', color: 'rgba(255,255,255,0.45)' }}>
              <WifiOff size={11} /> Offline
            </div>
          )}
          <motion.div whileTap={{ scale: 0.88 }} onClick={() => navigate(currentUser ? '/profile' : '/login')}
            className="w-8 h-8 rounded-full overflow-hidden cursor-pointer" style={{ border: '2px solid rgba(255,107,157,0.4)' }}>
            {currentUser?.image
              ? <img src={currentUser.image} alt="Profile" className="w-full h-full object-cover" />
              : <div className="w-full h-full flex items-center justify-center text-[13px] font-black" style={{ background: 'linear-gradient(135deg,#FF6B9D22,#C084FC22)', color: '#FF6B9D' }}>
                  {currentUser ? currentUser.name.charAt(0).toUpperCase() : '🌸'}
                </div>
            }
          </motion.div>
        </div>
      </div>

      {/* ── Greeting + Aura ── */}
      <motion.div variants={iv} className="px-5 pt-3 pb-4">
        <p className="text-[13px] font-medium mb-1" style={{ color: 'rgba(255,255,255,0.35)' }}>{greeting()},</p>
        <h1 className="text-[30px] font-display font-extrabold text-white leading-tight">{userName} {profile?.moodEmoji || '🌸'}</h1>
        {profile && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.6 }} className="mt-3 flex items-center gap-2">
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-2xl"
              style={{ background: `${profile.auraColor}18`, border: `1px solid ${profile.auraColor}35` }}>
              <span className="text-[14px]">✨</span>
              <span className="text-[12px] font-bold" style={{ color: profile.auraColor }}>Your Aura: {profile.aura}</span>
            </div>
          </motion.div>
        )}
      </motion.div>

      {/* ── Quick Feature Tiles ── */}
      <motion.div variants={iv} className="px-5 mb-6">
        <div className="grid grid-cols-4 gap-2">
          {[
            { icon: <Radio size={18} />, label: 'Radio', color: '#FF6B9D', action: () => handleSakuraRadio() },
            { icon: <BarChart2 size={18} />, label: 'Stats', color: '#60A5FA', action: () => navigate('/stats') },
            { icon: <Gamepad2 size={18} />, label: 'Quiz', color: '#C084FC', action: () => navigate('/quiz') },
            { icon: <Star size={18} />, label: 'Liked', color: '#FB923C', action: () => navigate('/liked') },
          ].map(({ icon, label, color, action }) => (
            <motion.button key={label} whileTap={{ scale: 0.92 }} onClick={action}
              className="flex flex-col items-center gap-2 py-3 rounded-2xl cursor-pointer"
              style={{ background: `${color}12`, border: `1px solid ${color}25` }}>
              <span style={{ color }}>{icon}</span>
              <span className="text-[11px] font-bold" style={{ color: 'rgba(255,255,255,0.6)' }}>{label}</span>
            </motion.button>
          ))}
        </div>
      </motion.div>

      {/* ── Tabs ── */}
      <motion.div variants={iv} className="px-5 flex gap-2 mb-6">
        {(['all', 'music', 'artists'] as const).map(tab => (
          <motion.button key={tab} whileTap={{ scale: 0.95 }} onClick={() => setActiveTab(tab)}
            className="px-4 py-2 rounded-full text-[12px] font-bold capitalize transition-all"
            style={activeTab === tab
              ? { background: 'linear-gradient(135deg,#FF6B9D,#C084FC)', color: '#000', boxShadow: '0 4px 12px rgba(255,107,157,0.35)' }
              : { background: 'rgba(255,255,255,0.06)', color: 'rgba(255,255,255,0.45)', border: '1px solid rgba(255,255,255,0.07)' }}>
            {tab}
          </motion.button>
        ))}
      </motion.div>

      {/* ── Quick Jump ── */}
      {activeTab !== 'artists' && (
        <motion.div variants={iv} className="px-5 mb-7">
          <div className="grid grid-cols-2 gap-2">
            <QuickCard title="Liked Songs" isLiked onClick={() => navigate('/liked')} />
            {isLoading ? Array(5).fill(0).map((_, i) => <SkeletonQuick key={i} />) : recentItems.slice(0, 5).map((item, i) => (
              <QuickCard key={item.id + i} title={item.name} image={getImageUrl(item.image)}
                onClick={() => (item as Song).type === 'song' ? playSong(item as Song, [item as Song]) : navigate(`/album/${item.id}`)} />
            ))}
          </div>
        </motion.div>
      )}

      {/* ── Sakura Radio Banner ── */}
      {activeTab !== 'artists' && !isOfflineMode && (
        <motion.div variants={iv} className="px-5 mb-7">
          <motion.div whileTap={{ scale: 0.97 }} onClick={handleSakuraRadio}
            className="relative overflow-hidden rounded-3xl cursor-pointer"
            style={{ background: 'linear-gradient(135deg,rgba(255,107,157,0.2),rgba(192,132,252,0.15))', border: '1px solid rgba(255,107,157,0.25)' }}>
            <div className="absolute inset-0 pointer-events-none">
              {['15%', '50%', '80%'].map((l, i) => (
                <div key={i} className="absolute text-[10px] opacity-20 select-none"
                  style={{ left: l, top: `${i * 25 + 10}%`, animation: `petalFall ${8 + i * 2}s ${i}s linear infinite` }}>🌸</div>
              ))}
            </div>
            <div className="relative z-10 flex items-center gap-4 px-5 py-4">
              <div className="w-12 h-12 rounded-2xl flex items-center justify-center shrink-0"
                style={{ background: 'linear-gradient(135deg,#FF6B9D,#C084FC)', boxShadow: '0 6px 20px rgba(255,107,157,0.4)' }}>
                <Radio size={22} className="text-white" />
              </div>
              <div className="flex-1">
                <h3 className="font-display font-bold text-[16px] text-white">Sakura Radio 🌸</h3>
                <p className="text-[12px] mt-0.5" style={{ color: 'rgba(255,255,255,0.5)' }}>
                  {radioSongs.length > 0 ? `${radioSongs.length} songs · Based on your taste` : 'Infinite music for you'}
                </p>
              </div>
              <div className="w-9 h-9 rounded-full flex items-center justify-center" style={{ background: 'rgba(255,255,255,0.1)' }}>
                <Zap size={16} style={{ color: '#FF6B9D' }} />
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}

      {/* ── Made For You ── */}
      {activeTab !== 'artists' && (
        <motion.section variants={iv} className="mb-8">
          <SectionTitle icon={<Sparkles size={15} />}
            title={profile && (history.length > 0 || likedSongs.length > 0) ? 'Made For You' : 'Trending Now'}
            sub={profile?.topArtists.length ? 'Based on your listening' : 'Discover what\'s hot'} />
          <div className="flex overflow-x-auto gap-4 pb-2 no-scrollbar px-5 snap-x">
            {isLoading ? Array(6).fill(0).map((_, i) => <SkeletonCard key={i} />) : recommended.map((song, i) => (
              <div key={song.id + i} className="snap-start"><SongCard item={song} onPlay={() => playSong(song, recommended)} /></div>
            ))}
          </div>
        </motion.section>
      )}

      {/* ── Daily Mixes ── */}
      {activeTab !== 'artists' && !isOfflineMode && (
        <motion.section variants={iv} className="mb-8">
          <SectionTitle icon={<Music2 size={15} />} title="Daily Mixes" sub="Fresh every day, just for you" />
          <div className="flex overflow-x-auto gap-3 pb-2 no-scrollbar px-5">
            {DAILY_MIXES.map((mix, i) => (
              <motion.div key={mix.title} initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: i * 0.05 }}
                whileTap={{ scale: 0.95 }} onClick={() => handleMix(mix)} className="shrink-0 cursor-pointer">
                <div className="w-[130px] h-[130px] rounded-[22px] flex flex-col items-center justify-center gap-2 mb-2.5"
                  style={{
                    background: activeMix === mix.title ? `${mix.color}30` : 'rgba(255,255,255,0.05)',
                    border: `1px solid ${activeMix === mix.title ? mix.color + '60' : 'rgba(255,255,255,0.08)'}`,
                    boxShadow: activeMix === mix.title ? `0 8px 24px ${mix.color}30` : 'none',
                  }}>
                  <span className="text-3xl">{mix.emoji}</span>
                  <span className="text-[12px] font-bold text-white text-center px-2">{mix.title}</span>
                </div>
              </motion.div>
            ))}
          </div>
          {/* Mix songs */}
          <AnimatePresence>
            {activeMix && (
              <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }}>
                <div className="flex overflow-x-auto gap-4 pb-2 no-scrollbar px-5 snap-x mt-3">
                  {mixLoading ? Array(4).fill(0).map((_, i) => <SkeletonCard key={i} />) :
                    (dailyMixSongs[activeMix] || []).map((song, i) => (
                      <div key={song.id + i} className="snap-start"><SongCard item={song} onPlay={() => playSong(song, dailyMixSongs[activeMix] || [])} /></div>
                    ))}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </motion.section>
      )}

      {/* ── Your Artists ── */}
      {activeTab !== 'music' && (
        <motion.section variants={iv} className="mb-8">
          <SectionTitle icon={<Heart size={14} />} title="Your Artists"
            sub={likedArtists.length > 0 ? `${likedArtists.length} artists you love` : 'Artists you follow'}
            onMore={() => navigate('/search')} />
          {likedArtists.length > 0 ? (
            <div className="flex overflow-x-auto gap-4 pb-2 no-scrollbar px-5">
              {likedArtists.map((a, i) => (
                <ArtistBubble key={(a.id || a.name) + i} name={a.name} image={a.image}
                  onClick={() => a.id && navigate(`/artist/${a.id}`, { state: { artist: a } })} />
              ))}
            </div>
          ) : (
            <div className="px-5">
              <div className="rounded-3xl p-6 flex flex-col items-center gap-3 text-center" style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,107,157,0.1)' }}>
                <div className="text-4xl">🌸</div>
                <p className="text-[13px] font-semibold leading-snug" style={{ color: 'rgba(255,255,255,0.4)' }}>Like songs & follow artists<br />and they'll blossom here</p>
                <button onClick={() => navigate('/search')} className="px-5 py-2.5 rounded-2xl text-[13px] font-bold text-black"
                  style={{ background: 'linear-gradient(135deg,#FF6B9D,#C084FC)', boxShadow: '0 4px 14px rgba(255,107,157,0.35)' }}>Find Music</button>
              </div>
            </div>
          )}
        </motion.section>
      )}

      {/* ── Recently Played ── */}
      {activeTab !== 'artists' && (
        <motion.section variants={iv} className="mb-8">
          <SectionTitle icon={<Clock size={14} />} title="Recently Played"
            sub={history.length > 0 ? `${history.length} songs in history` : undefined} />
          <div className="flex overflow-x-auto gap-4 pb-2 no-scrollbar px-5 snap-x">
            {isLoading ? Array(4).fill(0).map((_, i) => <SkeletonCard key={i} />) :
              recentItems.length > 0 ? recentItems.map((item, i) => (
                <div key={item.id + i} className="snap-start">
                  <SongCard item={item} onPlay={() => (item as Song).type === 'song' && playSong(item as Song, recentItems as Song[])} />
                </div>
              )) : (
                <div className="px-1 h-[100px] flex items-center">
                  <p className="text-[13px] font-medium" style={{ color: 'rgba(255,255,255,0.3)' }}>Play some music to see history 🎵</p>
                </div>
              )
            }
          </div>
        </motion.section>
      )}

      {/* ── Sound Tags ── */}
      {activeTab !== 'artists' && profile && profile.topLanguages.length > 0 && (
        <motion.section variants={iv} className="mb-8">
          <SectionTitle icon={<TrendingUp size={14} />} title="Your Sound" sub="Languages & moods" />
          <div className="flex gap-2.5 px-5 flex-wrap">
            {profile.topLanguages.map(({ lang }) => (
              <motion.button key={lang} whileTap={{ scale: 0.95 }} onClick={() => navigate('/search')}
                className="px-4 py-2.5 rounded-2xl text-[12px] font-bold capitalize"
                style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.08)', color: 'rgba(255,255,255,0.6)' }}>
                🎵 {lang}
              </motion.button>
            ))}
            <motion.button whileTap={{ scale: 0.95 }} onClick={() => navigate('/search')}
              className="px-4 py-2.5 rounded-2xl text-[12px] font-bold"
              style={{ background: 'rgba(255,107,157,0.1)', border: '1px solid rgba(255,107,157,0.2)', color: '#FF6B9D' }}>
              {profile.moodEmoji} {profile.currentMood}
            </motion.button>
          </div>
        </motion.section>
      )}

      {/* ── Gamification CTAs ── */}
      <motion.div variants={iv} className="px-5 mb-4 grid grid-cols-2 gap-3">
        <motion.div whileTap={{ scale: 0.96 }} onClick={() => navigate('/quiz')}
          className="flex flex-col gap-2 p-4 rounded-3xl cursor-pointer"
          style={{ background: 'rgba(192,132,252,0.1)', border: '1px solid rgba(192,132,252,0.2)' }}>
          <Gamepad2 size={22} style={{ color: '#C084FC' }} />
          <p className="font-display font-bold text-[14px] text-white">Music Quiz</p>
          <p className="text-[11px]" style={{ color: 'rgba(255,255,255,0.4)' }}>Guess the song!</p>
        </motion.div>
        <motion.div whileTap={{ scale: 0.96 }} onClick={() => navigate('/stats')}
          className="flex flex-col gap-2 p-4 rounded-3xl cursor-pointer"
          style={{ background: 'rgba(96,165,250,0.1)', border: '1px solid rgba(96,165,250,0.2)' }}>
          <Trophy size={22} style={{ color: '#60A5FA' }} />
          <p className="font-display font-bold text-[14px] text-white">Your Stats</p>
          <p className="text-[11px]" style={{ color: 'rgba(255,255,255,0.4)' }}>Wrapped-style recap</p>
        </motion.div>
      </motion.div>
    </motion.div>
  );
};
