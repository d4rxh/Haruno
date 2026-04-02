import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { Song } from '../types';

export interface Badge {
  id: string;
  name: string;
  emoji: string;
  desc: string;
  unlocked: boolean;
  unlockedAt?: number;
}

export interface DailyStats {
  date: string; // YYYY-MM-DD
  songsPlayed: number;
  minutesListened: number;
  topGenre: string;
}

export interface WeeklyTop {
  song: Song;
  playCount: number;
}

interface FeaturesState {
  // Streaks
  currentStreak: number;
  longestStreak: number;
  lastListenedDate: string;
  
  // Total stats
  totalSongsPlayed: number;
  totalMinutesListened: number;
  allTimeFavoriteArtist: string;

  // Weekly
  weeklyPlays: Record<string, number>; // songId -> count this week
  weeklyStart: string; // date of current week start

  // Daily history
  dailyStats: DailyStats[];

  // Sleep timer
  sleepTimerEnd: number | null; // timestamp
  sleepTimerMinutes: number;

  // Quiz
  quizScore: number;
  quizBestStreak: number;

  // Badges
  badges: Badge[];

  // Aura
  auraType: string;
  auraColor: string;
  auraEmoji: string;

  // Share card last generated
  lastShareCard: string | null;

  // Actions
  recordPlay: (song: Song, durationSeconds: number) => void;
  setSleepTimer: (minutes: number) => void;
  clearSleepTimer: () => void;
  addQuizScore: (correct: boolean) => void;
  computeAura: (history: Song[], likedSongs: Song[]) => void;
  getWeeklyTop: () => WeeklyTop[];
  checkAndUnlockBadges: () => void;
}

const DEFAULT_BADGES: Badge[] = [
  { id: 'first_song', name: 'First Note', emoji: '🎵', desc: 'Play your first song', unlocked: false },
  { id: 'night_owl', name: 'Night Owl', emoji: '🦉', desc: 'Listen after midnight', unlocked: false },
  { id: 'early_bird', name: 'Early Bird', emoji: '🌅', desc: 'Listen before 7 AM', unlocked: false },
  { id: '100_songs', name: 'Century', emoji: '💯', desc: 'Play 100 songs total', unlocked: false },
  { id: '3_streak', name: 'On a Roll', emoji: '🔥', desc: '3 day listening streak', unlocked: false },
  { id: '7_streak', name: 'Dedicated', emoji: '⚡', desc: '7 day listening streak', unlocked: false },
  { id: 'hindi_lover', name: 'Hindi Lover', emoji: '🇮🇳', desc: 'Play 20 Hindi songs', unlocked: false },
  { id: 'explorer', name: 'Explorer', emoji: '🗺️', desc: 'Listen to 5 genres', unlocked: false },
  { id: 'marathon', name: 'Marathon', emoji: '🏃', desc: 'Listen for 2+ hours in a day', unlocked: false },
  { id: 'quiz_master', name: 'Quiz Master', emoji: '🎯', desc: 'Get 10 quiz answers right', unlocked: false },
  { id: 'social', name: 'Social Butterfly', emoji: '🦋', desc: 'Add your first friend', unlocked: false },
  { id: 'collector', name: 'Collector', emoji: '💎', desc: 'Like 50 songs', unlocked: false },
];

const AURA_TYPES = [
  { type: 'Night Owl Indie Soul', color: '#6B46C1', emoji: '🌙', keywords: ['english', 'indie', 'alternative'] },
  { type: 'Desi Heartbeat', color: '#DC2626', emoji: '❤️', keywords: ['hindi', 'punjabi', 'bollywood'] },
  { type: 'Global Wanderer', color: '#059669', emoji: '🌍', keywords: ['english', 'pop', 'international'] },
  { type: 'Midnight Dreamer', color: '#7C3AED', emoji: '✨', keywords: ['lofi', 'chill', 'acoustic'] },
  { type: 'Energy Surge', color: '#D97706', emoji: '⚡', keywords: ['hip-hop', 'rap', 'trap', 'edm'] },
  { type: 'Romantic Soul', color: '#FF6B9D', emoji: '🌸', keywords: ['romantic', 'love', 'soft'] },
  { type: 'Rhythm Explorer', color: '#0891B2', emoji: '🎸', keywords: ['rock', 'metal', 'alternative'] },
  { type: 'Pure Vibe', color: '#FF6B9D', emoji: '🎶', keywords: [] },
];

const todayStr = () => new Date().toISOString().split('T')[0];
const weekStart = () => {
  const d = new Date();
  d.setDate(d.getDate() - d.getDay());
  return d.toISOString().split('T')[0];
};

export const useFeaturesStore = create<FeaturesState>()(
  persist(
    (set, get) => ({
      currentStreak: 0,
      longestStreak: 0,
      lastListenedDate: '',
      totalSongsPlayed: 0,
      totalMinutesListened: 0,
      allTimeFavoriteArtist: '',
      weeklyPlays: {},
      weeklyStart: weekStart(),
      dailyStats: [],
      sleepTimerEnd: null,
      sleepTimerMinutes: 0,
      quizScore: 0,
      quizBestStreak: 0,
      badges: DEFAULT_BADGES,
      auraType: 'Pure Vibe',
      auraColor: '#FF6B9D',
      auraEmoji: '🎶',
      lastShareCard: null,

      recordPlay: (song, durationSeconds) => {
        const today = todayStr();
        const wStart = weekStart();
        set(state => {
          // Streak logic
          let { currentStreak, longestStreak, lastListenedDate } = state;
          const yesterday = new Date();
          yesterday.setDate(yesterday.getDate() - 1);
          const yStr = yesterday.toISOString().split('T')[0];
          if (lastListenedDate === yStr) {
            currentStreak += 1;
          } else if (lastListenedDate !== today) {
            currentStreak = 1;
          }
          longestStreak = Math.max(longestStreak, currentStreak);

          // Weekly reset
          let weeklyPlays = { ...state.weeklyPlays };
          if (state.weeklyStart !== wStart) weeklyPlays = {};
          weeklyPlays[song.id] = (weeklyPlays[song.id] || 0) + 1;

          // Daily stats
          const existingDay = state.dailyStats.find(d => d.date === today);
          let dailyStats = [...state.dailyStats];
          if (existingDay) {
            dailyStats = dailyStats.map(d => d.date === today
              ? { ...d, songsPlayed: d.songsPlayed + 1, minutesListened: d.minutesListened + Math.round(durationSeconds / 60) }
              : d);
          } else {
            dailyStats = [...dailyStats.slice(-29), {
              date: today,
              songsPlayed: 1,
              minutesListened: Math.round(durationSeconds / 60),
              topGenre: song.language || 'Unknown',
            }];
          }

          return {
            currentStreak, longestStreak, lastListenedDate: today,
            totalSongsPlayed: state.totalSongsPlayed + 1,
            totalMinutesListened: state.totalMinutesListened + Math.round(durationSeconds / 60),
            weeklyPlays, weeklyStart: wStart, dailyStats,
          };
        });
        setTimeout(() => get().checkAndUnlockBadges(), 100);
      },

      setSleepTimer: (minutes) => {
        const end = Date.now() + minutes * 60 * 1000;
        set({ sleepTimerEnd: end, sleepTimerMinutes: minutes });
      },

      clearSleepTimer: () => set({ sleepTimerEnd: null, sleepTimerMinutes: 0 }),

      addQuizScore: (correct) => {
        set(state => ({
          quizScore: correct ? state.quizScore + 1 : state.quizScore,
          quizBestStreak: correct ? Math.max(state.quizBestStreak, state.quizScore + 1) : state.quizBestStreak,
        }));
        setTimeout(() => get().checkAndUnlockBadges(), 100);
      },

      computeAura: (history, likedSongs) => {
        const all = [...history, ...likedSongs];
        const langCount: Record<string, number> = {};
        all.forEach(s => { if (s.language) langCount[s.language] = (langCount[s.language] || 0) + 1; });
        const topLang = Object.entries(langCount).sort((a, b) => b[1] - a[1])[0]?.[0]?.toLowerCase() || '';
        const hour = new Date().getHours();
        
        let matched = AURA_TYPES.find(a => a.keywords.some(k => topLang.includes(k)));
        if (!matched && hour >= 22 || hour < 4) matched = AURA_TYPES[0];
        if (!matched) matched = AURA_TYPES[7];
        
        set({ auraType: matched.type, auraColor: matched.color, auraEmoji: matched.emoji });
      },

      getWeeklyTop: () => {
        // This needs to be called with history from playerStore
        return [];
      },

      checkAndUnlockBadges: () => {
        const state = get();
        const newBadges = state.badges.map(b => {
          if (b.unlocked) return b;
          let shouldUnlock = false;
          if (b.id === 'first_song' && state.totalSongsPlayed >= 1) shouldUnlock = true;
          if (b.id === '100_songs' && state.totalSongsPlayed >= 100) shouldUnlock = true;
          if (b.id === '3_streak' && state.currentStreak >= 3) shouldUnlock = true;
          if (b.id === '7_streak' && state.currentStreak >= 7) shouldUnlock = true;
          if (b.id === 'night_owl') {
            const h = new Date().getHours();
            if (h >= 0 && h < 4) shouldUnlock = true;
          }
          if (b.id === 'early_bird') {
            const h = new Date().getHours();
            if (h >= 4 && h < 7) shouldUnlock = true;
          }
          if (b.id === 'marathon') {
            const today = todayStr();
            const todayD = state.dailyStats.find(d => d.date === today);
            if (todayD && todayD.minutesListened >= 120) shouldUnlock = true;
          }
          if (b.id === 'quiz_master' && state.quizScore >= 10) shouldUnlock = true;
          if (shouldUnlock) return { ...b, unlocked: true, unlockedAt: Date.now() };
          return b;
        });
        set({ badges: newBadges });
      },
    }),
    {
      name: 'kawai-sakura-features',
      partialize: (s) => ({
        currentStreak: s.currentStreak,
        longestStreak: s.longestStreak,
        lastListenedDate: s.lastListenedDate,
        totalSongsPlayed: s.totalSongsPlayed,
        totalMinutesListened: s.totalMinutesListened,
        weeklyPlays: s.weeklyPlays,
        weeklyStart: s.weeklyStart,
        dailyStats: s.dailyStats,
        quizScore: s.quizScore,
        quizBestStreak: s.quizBestStreak,
        badges: s.badges,
        auraType: s.auraType,
        auraColor: s.auraColor,
        auraEmoji: s.auraEmoji,
      }),
    }
  )
);
