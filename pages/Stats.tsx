import React, { useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { usePlayerStore } from '../store/playerStore';
import { ArrowLeft, Flame, Music2, Heart, Clock, Star, Trophy, Zap, TrendingUp } from 'lucide-react';
import { motion } from 'framer-motion';

const AURA_TYPES = [
  { name: 'Night Owl Indie Soul', min: 0, color: '#6366F1', emoji: '🦉', desc: 'You love music when the world sleeps' },
  { name: 'Bollywood Romantic', min: 3, color: '#FF6B9D', emoji: '💕', desc: 'Your heart beats to filmi tunes' },
  { name: 'Hip-Hop Energy', min: 5, color: '#FB923C', emoji: '🔥', desc: 'You move to the rhythm always' },
  { name: 'Chill Vibes Master', min: 8, color: '#34D399', emoji: '🌊', desc: 'You find peace in every melody' },
  { name: 'Pop Princess', min: 10, color: '#C084FC', emoji: '👑', desc: 'You rule the charts in style' },
  { name: 'Melody Wanderer', min: 15, color: '#60A5FA', emoji: '🌌', desc: 'Music takes you to different worlds' },
];

const BADGES = [
  { id: 'first', icon: '🌸', name: 'First Bloom', desc: 'Played your first song', req: 1 },
  { id: 'fan', icon: '💜', name: 'True Fan', desc: 'Liked 5+ songs', req: 5, type: 'liked' },
  { id: 'explorer', icon: '🗺️', name: 'Explorer', desc: 'Played 10+ songs', req: 10 },
  { id: 'night', icon: '🌙', name: 'Night Owl', desc: 'Played 20+ songs', req: 20 },
  { id: 'devoted', icon: '🔥', name: 'Devoted', desc: 'Played 30+ songs', req: 30 },
  { id: 'legend', icon: '👑', name: 'Legend', desc: 'Played 50+ songs', req: 50 },
  { id: 'artist', icon: '🎨', name: 'Artist Lover', desc: 'Followed 3+ artists', req: 3, type: 'artists' },
  { id: 'sakura', icon: '🌸', name: 'Sakura Soul', desc: 'Liked 10+ songs', req: 10, type: 'liked' },
];

export const Stats: React.FC = () => {
  const navigate = useNavigate();
  const { history, likedSongs, favoriteArtists } = usePlayerStore();

  const stats = useMemo(() => {
    const total = history.length;
    const liked = likedSongs.length;
    const artists = favoriteArtists?.length || 0;
    const estMinutes = total * 3.5;
    const streakDays = Math.min(Math.floor(total / 3) + 1, 30);
    const aura = AURA_TYPES.filter(a => total >= a.min).pop() || AURA_TYPES[0];

    // Top artists
    const artistCount: Record<string, { count: number; image?: any[] }> = {};
    history.forEach(s => s.artists?.primary?.forEach(a => {
      if (!artistCount[a.name]) artistCount[a.name] = { count: 0, image: a.image };
      artistCount[a.name].count++;
    }));
    const topArtists = Object.entries(artistCount).sort((a, b) => b[1].count - a[1].count).slice(0, 5);

    // Top songs
    const songCount: Record<string, { count: number; song: any }> = {};
    history.forEach(s => {
      if (!songCount[s.id]) songCount[s.id] = { count: 0, song: s };
      songCount[s.id].count++;
    });
    const topSongs = Object.values(songCount).sort((a, b) => b.count - a.count).slice(0, 5);

    // Badges earned
    const earnedBadges = BADGES.filter(b => {
      if (b.type === 'liked') return liked >= b.req;
      if (b.type === 'artists') return artists >= b.req;
      return total >= b.req;
    });

    return { total, liked, artists, estMinutes, streakDays, aura, topArtists, topSongs, earnedBadges };
  }, [history, likedSongs, favoriteArtists]);

  const iv = { hidden: { opacity: 0, y: 16 }, visible: (i: number) => ({ opacity: 1, y: 0, transition: { delay: i * 0.08, duration: 0.4 } }) };

  return (
    <div className="min-h-full pb-36 mesh-bg">
      {/* Header */}
      <div className="sticky top-0 z-20 px-5 pt-5 pb-3" style={{ background: 'rgba(10,6,18,0.9)', backdropFilter: 'blur(24px)', borderBottom: '1px solid rgba(255,107,157,0.08)' }}>
        <div className="flex items-center gap-3">
          <motion.button whileTap={{ scale: 0.9 }} onClick={() => navigate(-1)}
            className="w-9 h-9 rounded-2xl flex items-center justify-center" style={{ background: 'rgba(255,255,255,0.07)' }}>
            <ArrowLeft size={18} className="text-white" />
          </motion.button>
          <div>
            <h1 className="font-display font-extrabold text-[22px] text-white">Your Stats 📊</h1>
            <p className="text-[11px]" style={{ color: 'rgba(255,255,255,0.35)' }}>Your Kawai Sakura journey</p>
          </div>
        </div>
      </div>

      <div className="px-5 pt-5 flex flex-col gap-6">
        {/* Aura Card */}
        <motion.div custom={0} variants={iv} initial="hidden" animate="visible"
          className="relative overflow-hidden rounded-3xl p-5"
          style={{ background: `linear-gradient(135deg, ${stats.aura.color}25, ${stats.aura.color}10)`, border: `1px solid ${stats.aura.color}40` }}>
          <div className="absolute -right-4 -top-4 text-[80px] opacity-10 select-none">{stats.aura.emoji}</div>
          <p className="text-[11px] font-bold tracking-widest uppercase mb-1" style={{ color: stats.aura.color }}>✦ Your Aura</p>
          <h2 className="font-display font-extrabold text-[24px] text-white mb-1">{stats.aura.emoji} {stats.aura.name}</h2>
          <p className="text-[13px]" style={{ color: 'rgba(255,255,255,0.5)' }}>{stats.aura.desc}</p>
        </motion.div>

        {/* Stats grid */}
        <motion.div custom={1} variants={iv} initial="hidden" animate="visible" className="grid grid-cols-2 gap-3">
          {[
            { icon: <Music2 size={18} />, val: stats.total, label: 'Songs Played', color: '#FF6B9D' },
            { icon: <Heart size={18} />, val: stats.liked, label: 'Songs Liked', color: '#C084FC' },
            { icon: <Clock size={18} />, val: `${Math.floor(stats.estMinutes)}m`, label: 'Est. Listen Time', color: '#60A5FA' },
            { icon: <Flame size={18} />, val: `${stats.streakDays}d`, label: 'Listening Streak', color: '#FB923C' },
          ].map(({ icon, val, label, color }) => (
            <div key={label} className="flex flex-col gap-2 p-4 rounded-2xl" style={{ background: `${color}12`, border: `1px solid ${color}25` }}>
              <span style={{ color }}>{icon}</span>
              <p className="font-display font-extrabold text-[26px] text-white leading-none">{val}</p>
              <p className="text-[11px] font-medium" style={{ color: 'rgba(255,255,255,0.45)' }}>{label}</p>
            </div>
          ))}
        </motion.div>

        {/* Top Artists */}
        {stats.topArtists.length > 0 && (
          <motion.div custom={2} variants={iv} initial="hidden" animate="visible">
            <div className="flex items-center gap-2 mb-3">
              <Star size={15} style={{ color: '#FF6B9D' }} />
              <h3 className="font-display font-bold text-[15px] text-white">Top Artists</h3>
            </div>
            <div className="flex flex-col gap-2">
              {stats.topArtists.map(([name, data], i) => (
                <div key={name} className="flex items-center gap-3 p-3 rounded-2xl" style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.06)' }}>
                  <span className="font-display font-extrabold text-[18px] w-6 text-center" style={{ color: i === 0 ? '#FFB743' : i === 1 ? '#C0C0C0' : i === 2 ? '#CD7F32' : 'rgba(255,255,255,0.3)' }}>
                    {i + 1}
                  </span>
                  <div className="flex-1">
                    <p className="font-bold text-[14px] text-white">{name}</p>
                    <p className="text-[11px]" style={{ color: 'rgba(255,255,255,0.4)' }}>{data.count} plays</p>
                  </div>
                  <div className="h-1.5 w-[80px] rounded-full overflow-hidden" style={{ background: 'rgba(255,255,255,0.08)' }}>
                    <div className="h-full rounded-full progress-sakura" style={{ width: `${(data.count / (stats.topArtists[0]?.[1].count || 1)) * 100}%` }} />
                  </div>
                </div>
              ))}
            </div>
          </motion.div>
        )}

        {/* Top Songs */}
        {stats.topSongs.length > 0 && (
          <motion.div custom={3} variants={iv} initial="hidden" animate="visible">
            <div className="flex items-center gap-2 mb-3">
              <TrendingUp size={15} style={{ color: '#C084FC' }} />
              <h3 className="font-display font-bold text-[15px] text-white">Most Played</h3>
            </div>
            <div className="flex flex-col gap-2">
              {stats.topSongs.map(({ song, count }, i) => (
                <div key={song.id} className="flex items-center gap-3 p-3 rounded-2xl" style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.06)' }}>
                  <span className="font-display font-bold text-[13px] w-5 text-center" style={{ color: 'rgba(255,255,255,0.3)' }}>{i + 1}</span>
                  <div className="w-10 h-10 rounded-[12px] overflow-hidden shrink-0">
                    <img src={song.image?.[1]?.url || song.image?.[0]?.url} alt="" className="w-full h-full object-cover" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-bold text-[13px] text-white truncate">{song.name}</p>
                    <p className="text-[11px] truncate" style={{ color: 'rgba(255,255,255,0.4)' }}>{song.artists?.primary?.[0]?.name}</p>
                  </div>
                  <span className="text-[11px] font-bold shrink-0" style={{ color: '#FF6B9D' }}>{count}x</span>
                </div>
              ))}
            </div>
          </motion.div>
        )}

        {/* Badges */}
        <motion.div custom={4} variants={iv} initial="hidden" animate="visible">
          <div className="flex items-center gap-2 mb-3">
            <Trophy size={15} style={{ color: '#FFB743' }} />
            <h3 className="font-display font-bold text-[15px] text-white">Badges</h3>
            <span className="text-[11px] font-bold px-2 py-0.5 rounded-full" style={{ background: 'rgba(255,183,67,0.15)', color: '#FFB743' }}>{stats.earnedBadges.length}/{BADGES.length}</span>
          </div>
          <div className="grid grid-cols-4 gap-3">
            {BADGES.map(badge => {
              const earned = stats.earnedBadges.some(b => b.id === badge.id);
              return (
                <div key={badge.id} className="flex flex-col items-center gap-1.5">
                  <div className="w-14 h-14 rounded-2xl flex items-center justify-center text-2xl transition-all"
                    style={{
                      background: earned ? 'rgba(255,107,157,0.15)' : 'rgba(255,255,255,0.04)',
                      border: earned ? '1px solid rgba(255,107,157,0.35)' : '1px solid rgba(255,255,255,0.06)',
                      filter: earned ? 'none' : 'grayscale(1)',
                      opacity: earned ? 1 : 0.4,
                    }}>
                    {badge.icon}
                  </div>
                  <span className="text-[10px] font-bold text-center leading-tight" style={{ color: earned ? 'rgba(255,255,255,0.7)' : 'rgba(255,255,255,0.25)' }}>
                    {badge.name}
                  </span>
                </div>
              );
            })}
          </div>
        </motion.div>

        {/* Empty state */}
        {stats.total === 0 && (
          <motion.div custom={5} variants={iv} initial="hidden" animate="visible"
            className="flex flex-col items-center gap-4 py-12 text-center">
            <div className="text-5xl">🎵</div>
            <p className="font-display font-bold text-[18px] text-white">Start Listening!</p>
            <p className="text-[13px]" style={{ color: 'rgba(255,255,255,0.4)' }}>Play songs to see your stats here</p>
            <button onClick={() => navigate('/')} className="px-6 py-3 rounded-2xl font-bold text-black text-[14px]"
              style={{ background: 'linear-gradient(135deg,#FF6B9D,#C084FC)' }}>Explore Music</button>
          </motion.div>
        )}
      </div>
    </div>
  );
};
