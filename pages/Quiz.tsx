import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Play, Pause, CheckCircle2, XCircle, Trophy, RotateCcw, Loader2 } from 'lucide-react';
import { api, getImageUrl, getAudioUrl } from '../services/api';
import { usePlayerStore } from '../store/playerStore';
import { motion, AnimatePresence } from 'framer-motion';
import { Song } from '../types';

const QUIZ_SONGS_QUERIES = ['Top Hits 2024', 'Bollywood hits', 'Pop songs', 'Hindi songs 2024'];

interface QuizRound {
  song: Song;
  options: string[];
  correct: string;
  type: 'artist' | 'title';
}

export const Quiz: React.FC = () => {
  const navigate = useNavigate();
  const { streamingQuality } = usePlayerStore();
  const audioRef = useRef<HTMLAudioElement | null>(null);

  const [phase, setPhase] = useState<'loading' | 'ready' | 'playing' | 'answered' | 'result'>('loading');
  const [songs, setSongs] = useState<Song[]>([]);
  const [rounds, setRounds] = useState<QuizRound[]>([]);
  const [currentRound, setCurrentRound] = useState(0);
  const [score, setScore] = useState(0);
  const [selected, setSelected] = useState<string | null>(null);
  const [isAudioPlaying, setIsAudioPlaying] = useState(false);
  const [timer, setTimer] = useState(10);
  const timerRef = useRef<any>(null);

  // Load songs
  useEffect(() => {
    const load = async () => {
      try {
        const query = QUIZ_SONGS_QUERIES[Math.floor(Math.random() * QUIZ_SONGS_QUERIES.length)];
        const result = await api.searchSongs(query);
        const valid = result.filter(s => s.downloadUrl && s.downloadUrl.length > 0).slice(0, 20);
        setSongs(valid);
        if (valid.length >= 4) buildRounds(valid);
        else setPhase('result');
      } catch { setPhase('result'); }
    };
    load();
  }, []);

  const buildRounds = (songList: Song[]) => {
    const shuffled = [...songList].sort(() => Math.random() - 0.5).slice(0, 6);
    const built: QuizRound[] = shuffled.map(song => {
      const type = Math.random() > 0.5 ? 'title' : 'artist';
      const correct = type === 'title' ? song.name : (song.artists?.primary?.[0]?.name || 'Unknown');
      const wrongPool = songList.filter(s => s.id !== song.id);
      const wrongs = wrongPool.sort(() => Math.random() - 0.5).slice(0, 3).map(s =>
        type === 'title' ? s.name : (s.artists?.primary?.[0]?.name || 'Unknown')
      );
      const options = [...new Set([correct, ...wrongs])].slice(0, 4).sort(() => Math.random() - 0.5);
      return { song, options, correct, type };
    });
    setRounds(built);
    setPhase('ready');
  };

  const startRound = () => {
    setPhase('playing');
    setSelected(null);
    setTimer(10);
    playClip(rounds[currentRound]);
    startTimer();
  };

  const playClip = (round: QuizRound) => {
    if (audioRef.current) { audioRef.current.pause(); audioRef.current = null; }
    const url = getAudioUrl(round.song.downloadUrl, streamingQuality);
    if (!url) return;
    const audio = new Audio(url);
    audio.volume = 0.7;
    const startTime = Math.floor(Math.random() * 30) + 10;
    audio.currentTime = startTime;
    audio.play().then(() => setIsAudioPlaying(true)).catch(() => {});
    audioRef.current = audio;
    setTimeout(() => { audio.pause(); setIsAudioPlaying(false); }, 5000);
  };

  const startTimer = () => {
    clearInterval(timerRef.current);
    let t = 10;
    timerRef.current = setInterval(() => {
      t--;
      setTimer(t);
      if (t <= 0) { clearInterval(timerRef.current); handleAnswer(null); }
    }, 1000);
  };

  const handleAnswer = (ans: string | null) => {
    clearInterval(timerRef.current);
    if (audioRef.current) { audioRef.current.pause(); setIsAudioPlaying(false); }
    setSelected(ans);
    setPhase('answered');
    if (ans === rounds[currentRound]?.correct) setScore(s => s + 1);
  };

  const nextRound = () => {
    if (currentRound + 1 >= rounds.length) { setPhase('result'); return; }
    setCurrentRound(r => r + 1);
    setPhase('playing');
    setSelected(null);
    setTimer(10);
    setTimeout(() => { playClip(rounds[currentRound + 1]); startTimer(); }, 300);
  };

  const restart = () => {
    setScore(0); setCurrentRound(0); setSelected(null);
    if (songs.length >= 4) { buildRounds(songs); }
  };

  useEffect(() => () => { clearInterval(timerRef.current); if (audioRef.current) audioRef.current.pause(); }, []);

  const round = rounds[currentRound];
  const scorePercent = rounds.length > 0 ? (score / rounds.length) * 100 : 0;
  const grade = scorePercent >= 80 ? '🏆' : scorePercent >= 60 ? '🌸' : scorePercent >= 40 ? '🎵' : '😅';

  return (
    <div className="min-h-full pb-36 mesh-bg">
      {/* Header */}
      <div className="sticky top-0 z-20 px-5 pt-5 pb-3" style={{ background: 'rgba(10,6,18,0.9)', backdropFilter: 'blur(24px)', borderBottom: '1px solid rgba(255,107,157,0.08)' }}>
        <div className="flex items-center gap-3">
          <motion.button whileTap={{ scale: 0.9 }} onClick={() => navigate(-1)}
            className="w-9 h-9 rounded-2xl flex items-center justify-center" style={{ background: 'rgba(255,255,255,0.07)' }}>
            <ArrowLeft size={18} className="text-white" />
          </motion.button>
          <div className="flex-1">
            <h1 className="font-display font-extrabold text-[22px] text-white">Music Quiz 🎮</h1>
          </div>
          {phase !== 'loading' && phase !== 'result' && (
            <div className="px-3 py-1.5 rounded-full" style={{ background: 'rgba(255,107,157,0.15)', border: '1px solid rgba(255,107,157,0.3)' }}>
              <span className="font-bold text-[13px]" style={{ color: '#FF6B9D' }}>{score}/{rounds.length}</span>
            </div>
          )}
        </div>
      </div>

      <div className="px-5 pt-6 flex flex-col items-center">
        <AnimatePresence mode="wait">

          {/* Loading */}
          {phase === 'loading' && (
            <motion.div key="load" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              className="flex flex-col items-center gap-4 py-20">
              <Loader2 size={40} className="animate-spin" style={{ color: '#FF6B9D' }} />
              <p className="font-display font-bold text-[16px] text-white">Loading songs...</p>
            </motion.div>
          )}

          {/* Ready */}
          {phase === 'ready' && (
            <motion.div key="ready" initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0 }}
              className="flex flex-col items-center gap-6 py-12 text-center w-full">
              <div className="text-6xl">🎵</div>
              <div>
                <h2 className="font-display font-extrabold text-[26px] text-white mb-2">Ready to Play?</h2>
                <p className="text-[14px]" style={{ color: 'rgba(255,255,255,0.5)' }}>Listen to a 5-second clip and guess the song or artist</p>
              </div>
              <div className="flex flex-col gap-3 w-full max-w-[300px]">
                {['🎵 Guess the Title', '🎤 Guess the Artist', '⏱️ 10 seconds per question'].map(t => (
                  <div key={t} className="px-4 py-3 rounded-2xl text-[13px] font-medium text-white" style={{ background: 'rgba(255,255,255,0.05)' }}>{t}</div>
                ))}
              </div>
              <motion.button whileTap={{ scale: 0.95 }} onClick={startRound}
                className="px-10 py-4 rounded-3xl font-display font-bold text-[16px] text-black"
                style={{ background: 'linear-gradient(135deg,#FF6B9D,#C084FC)', boxShadow: '0 8px 24px rgba(255,107,157,0.4)' }}>
                Start Quiz 🎮
              </motion.button>
            </motion.div>
          )}

          {/* Playing / Answered */}
          {(phase === 'playing' || phase === 'answered') && round && (
            <motion.div key={`round-${currentRound}`} initial={{ opacity: 0, x: 30 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -30 }}
              transition={{ duration: 0.3 }} className="w-full flex flex-col gap-5">

              {/* Progress */}
              <div className="flex items-center gap-3">
                <div className="flex-1 h-1.5 rounded-full overflow-hidden" style={{ background: 'rgba(255,255,255,0.08)' }}>
                  <div className="h-full rounded-full progress-sakura transition-all" style={{ width: `${((currentRound) / rounds.length) * 100}%` }} />
                </div>
                <span className="text-[12px] font-bold shrink-0" style={{ color: 'rgba(255,255,255,0.4)' }}>{currentRound + 1}/{rounds.length}</span>
              </div>

              {/* Album art + audio */}
              <div className="flex flex-col items-center gap-4">
                <div className="relative w-40 h-40 rounded-[28px] overflow-hidden"
                  style={{ boxShadow: isAudioPlaying ? '0 0 40px rgba(255,107,157,0.5)' : '0 16px 40px rgba(0,0,0,0.5)', filter: phase === 'answered' ? 'none' : 'blur(8px)' }}>
                  <img src={getImageUrl(round.song.image)} alt="" className="w-full h-full object-cover" />
                  {phase === 'playing' && (
                    <div className="absolute inset-0 flex items-center justify-center" style={{ background: 'rgba(0,0,0,0.5)' }}>
                      <div className="flex items-end gap-1 h-8">
                        {isAudioPlaying ? Array(8).fill(0).map((_, i) => (
                          <motion.div key={i} className="w-1.5 rounded-full" style={{ background: '#FF6B9D' }}
                            animate={{ height: [4, 16 + i * 2, 4] }} transition={{ duration: 0.4, repeat: Infinity, delay: i * 0.05 }} />
                        )) : <Play size={30} fill="white" className="text-white" />}
                      </div>
                    </div>
                  )}
                </div>

                {/* Timer */}
                {phase === 'playing' && (
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-full flex items-center justify-center font-display font-extrabold text-[14px]"
                      style={{ background: timer <= 3 ? 'rgba(255,59,48,0.2)' : 'rgba(255,107,157,0.15)', color: timer <= 3 ? '#FF3B30' : '#FF6B9D', border: `2px solid ${timer <= 3 ? 'rgba(255,59,48,0.5)' : 'rgba(255,107,157,0.4)'}` }}>
                      {timer}
                    </div>
                    <span className="text-[12px]" style={{ color: 'rgba(255,255,255,0.4)' }}>seconds left</span>
                  </div>
                )}

                <div className="text-center">
                  <p className="text-[12px] font-bold tracking-widest uppercase" style={{ color: 'rgba(255,107,157,0.7)' }}>
                    {round.type === 'title' ? '🎵 What is this song?' : '🎤 Who is the artist?'}
                  </p>
                </div>
              </div>

              {/* Options */}
              <div className="flex flex-col gap-2.5 w-full">
                {round.options.map((opt, i) => {
                  const isCorrect = opt === round.correct;
                  const isSelected = selected === opt;
                  let bg = 'rgba(255,255,255,0.05)'; let border = 'rgba(255,255,255,0.08)'; let color = 'rgba(255,255,255,0.85)';
                  if (phase === 'answered') {
                    if (isCorrect) { bg = 'rgba(52,211,153,0.15)'; border = '#34D399'; color = '#34D399'; }
                    else if (isSelected) { bg = 'rgba(255,59,48,0.15)'; border = '#FF3B30'; color = '#FF3B30'; }
                  }
                  return (
                    <motion.button key={opt} whileTap={phase === 'playing' ? { scale: 0.97 } : {}}
                      onClick={() => phase === 'playing' && handleAnswer(opt)}
                      className="w-full px-4 py-4 rounded-2xl text-left font-semibold text-[14px] flex items-center gap-3 transition-all"
                      style={{ background: bg, border: `1px solid ${border}`, color }}>
                      <span className="w-6 h-6 rounded-full flex items-center justify-center text-[12px] font-bold shrink-0"
                        style={{ background: 'rgba(255,255,255,0.08)' }}>{String.fromCharCode(65 + i)}</span>
                      <span className="flex-1">{opt}</span>
                      {phase === 'answered' && isCorrect && <CheckCircle2 size={18} style={{ color: '#34D399' }} />}
                      {phase === 'answered' && isSelected && !isCorrect && <XCircle size={18} style={{ color: '#FF3B30' }} />}
                    </motion.button>
                  );
                })}
              </div>

              {phase === 'answered' && (
                <motion.button initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
                  whileTap={{ scale: 0.96 }} onClick={nextRound}
                  className="w-full py-4 rounded-3xl font-display font-bold text-[15px] text-black"
                  style={{ background: 'linear-gradient(135deg,#FF6B9D,#C084FC)', boxShadow: '0 6px 20px rgba(255,107,157,0.4)' }}>
                  {currentRound + 1 >= rounds.length ? 'See Results 🏆' : 'Next Question →'}
                </motion.button>
              )}
            </motion.div>
          )}

          {/* Results */}
          {phase === 'result' && (
            <motion.div key="result" initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }}
              className="flex flex-col items-center gap-6 py-8 text-center w-full">
              <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ type: 'spring', stiffness: 400, damping: 20, delay: 0.2 }} className="text-7xl">{grade}</motion.div>
              <div>
                <h2 className="font-display font-extrabold text-[30px] text-white mb-2">{score}/{rounds.length}</h2>
                <p className="text-[14px]" style={{ color: 'rgba(255,255,255,0.5)' }}>
                  {scorePercent >= 80 ? 'You\'re a music legend! 🔥' : scorePercent >= 60 ? 'Not bad! Keep listening 🎵' : scorePercent >= 40 ? 'Keep exploring music! 🌸' : 'Practice makes perfect! 😅'}
                </p>
              </div>
              <div className="w-full max-w-[260px] h-3 rounded-full overflow-hidden" style={{ background: 'rgba(255,255,255,0.08)' }}>
                <motion.div className="h-full rounded-full progress-sakura" initial={{ width: 0 }} animate={{ width: `${scorePercent}%` }} transition={{ duration: 1, delay: 0.4 }} />
              </div>
              <div className="flex flex-col gap-3 w-full">
                <motion.button whileTap={{ scale: 0.96 }} onClick={restart}
                  className="w-full py-4 rounded-3xl font-display font-bold text-[15px] text-black flex items-center justify-center gap-2"
                  style={{ background: 'linear-gradient(135deg,#FF6B9D,#C084FC)', boxShadow: '0 6px 20px rgba(255,107,157,0.4)' }}>
                  <RotateCcw size={18} /> Play Again
                </motion.button>
                <motion.button whileTap={{ scale: 0.96 }} onClick={() => navigate('/stats')}
                  className="w-full py-4 rounded-3xl font-display font-bold text-[15px] flex items-center justify-center gap-2"
                  style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)', color: 'white' }}>
                  <Trophy size={18} style={{ color: '#FFB743' }} /> View Stats
                </motion.button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
};
