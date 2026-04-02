import React, { useEffect, useState, useRef } from "react";
import { Play, Pause, SkipBack, SkipForward, ChevronDown, Heart, Loader2, Shuffle, Repeat, PanelRightClose } from "lucide-react";
import { usePlayerStore } from "../store/playerStore";
import { getImageUrl } from "../services/api";
import { AnimatePresence, motion } from "framer-motion";

const generateFakeLyrics = (songName, artistName) => [
  songName, "oh yeah...", "I feel it in the air tonight",
  artistName + " — this is for you", "Can you hear me calling out?",
  "Through the night, through the rain", "Every heartbeat says your name",
  "We were dancing in the dark", "Lost between the stars",
  "I cant let you go", "Youre the one I know",
  songName + " again...", "This feeling wont fade away",
  "Hold on, hold on", "I see it in your eyes",
  "Like a cherry blossom falls", "Beautiful and free",
  "Nothing else matters now", "Just you and me",
  songName + "...", "oh...", "yeah...",
];

export const Player = () => {
  const {
    currentSong, isPlaying, isBuffering, isFullScreen, setFullScreen,
    togglePlay, nextSong, prevSong, likedSongs, toggleLike,
    shuffleMode, toggleShuffle, duration, audioElement, seek,
  } = usePlayerStore();

  const [dominantColor, setDominantColor] = useState("#2A1040");
  const [activeView, setActiveView] = useState("player");
  const [currentLyricIdx, setCurrentLyricIdx] = useState(3);
  const [isRepeat, setIsRepeat] = useState(false);
  const isDragging = useRef(false);
  const isSeeking = useRef(false);
  const seekBarRef = useRef(null);
  const [touchStart, setTouchStart] = useState(null);
  const fullProgressRef = useRef(null);
  const fullThumbRef = useRef(null);
  const fullTimeRef = useRef(null);
  const miniProgressRef = useRef(null);

  const isLiked = currentSong ? likedSongs.some(s => s.id === currentSong.id) : false;
  const lyrics = currentSong ? generateFakeLyrics(currentSong.name, currentSong.artists?.primary?.[0]?.name || "Artist") : [];
  const safeDuration = duration > 0 ? duration : 1;

  const fmt = (s) => {
    if (!s || isNaN(s)) return "0:00";
    return Math.floor(s/60) + ":" + String(Math.floor(s%60)).padStart(2,"0");
  };

  useEffect(() => {
    let rafId;
    const update = () => {
      if (isDragging.current || isSeeking.current || !audioElement) return;
      const pct = (audioElement.currentTime / safeDuration) * 100;
      if (fullProgressRef.current) fullProgressRef.current.style.width = pct + "%";
      if (fullThumbRef.current) fullThumbRef.current.style.left = "calc(" + pct + "% - 7px)";
      if (fullTimeRef.current) fullTimeRef.current.innerText = fmt(audioElement.currentTime);
      if (miniProgressRef.current) miniProgressRef.current.style.width = pct + "%";
      if (duration > 0) {
        const idx = Math.floor((audioElement.currentTime / duration) * (lyrics.length - 4)) + 2;
        setCurrentLyricIdx(Math.min(idx, lyrics.length - 3));
      }
      if (isPlaying) rafId = requestAnimationFrame(update);
    };
    if (isPlaying) rafId = requestAnimationFrame(update);
    else if (audioElement) update();
    return () => { if (rafId) cancelAnimationFrame(rafId); };
  }, [isPlaying, audioElement, safeDuration, lyrics.length]);

  useEffect(() => {
    if (!currentSong) return;
    const img = new Image();
    img.crossOrigin = "Anonymous";
    img.src = getImageUrl(currentSong.image);
    img.onload = () => {
      try {
        const canvas = document.createElement("canvas");
        canvas.width = 1; canvas.height = 1;
        const ctx = canvas.getContext("2d");
        ctx.drawImage(img, 0, 0, 1, 1);
        const [r, g, b] = ctx.getImageData(0, 0, 1, 1).data;
        setDominantColor("rgb(" + Math.round(r*0.25+200*0.75) + "," + Math.round(g*0.25+40*0.75) + "," + Math.round(b*0.25+80*0.75) + ")");
      } catch { setDominantColor("#2A1040"); }
    };
    img.onerror = () => setDominantColor("#2A1040");
  }, [currentSong?.id]);

  const calcP = (cx) => {
    if (!seekBarRef.current) return 0;
    const r = seekBarRef.current.getBoundingClientRect();
    return Math.max(0, Math.min(cx - r.left, r.width)) / r.width;
  };
  const updV = (pct) => {
    if (fullProgressRef.current) fullProgressRef.current.style.width = (pct*100)+"%";
    if (fullThumbRef.current) fullThumbRef.current.style.left = "calc("+(pct*100)+"% - 7px)";
    if (fullTimeRef.current) fullTimeRef.current.innerText = fmt(pct * safeDuration);
  };
  const onPD = (e) => { e.stopPropagation(); e.preventDefault(); isDragging.current=true; e.currentTarget.setPointerCapture(e.pointerId); updV(calcP(e.clientX)); };
  const onPM = (e) => { if (!isDragging.current) return; e.stopPropagation(); e.preventDefault(); updV(calcP(e.clientX)); };
  const onPU = (e) => {
    if (!isDragging.current) return; e.stopPropagation();
    isDragging.current=false; isSeeking.current=true;
    const t = calcP(e.clientX) * safeDuration;
    if (!isNaN(t) && isFinite(t)) seek(t);
    e.currentTarget.releasePointerCapture(e.pointerId);
    setTimeout(() => { isSeeking.current = false; }, 500);
  };
  const onTS = (e) => setTouchStart({x:e.touches[0].clientX,y:e.touches[0].clientY});
  const onTE = (e) => {
    if (!touchStart) return;
    const dx = touchStart.x - e.changedTouches[0].clientX;
    const dy = touchStart.y - e.changedTouches[0].clientY;
    if (Math.abs(dx)>50 && Math.abs(dx)>Math.abs(dy)) { if(dx>0)nextSong(); else prevSong(); }
    if (dy<-80 && Math.abs(dy)>Math.abs(dx)) setFullScreen(false);
    setTouchStart(null);
  };

  if (!currentSong) return null;
  const imageUrl = getImageUrl(currentSong.image);
  const artistName = currentSong.artists?.primary?.[0]?.name || "Unknown Artist";

  const BtnCircle = ({onClick, size="md", children, active=false, style={}}) => (
    <motion.button whileTap={{scale:0.88}} onClick={onClick}
      className={"rounded-full flex items-center justify-center " + (size==="lg" ? "w-16 h-16" : size==="sm" ? "w-10 h-10" : "w-12 h-12")}
      style={{background: active ? "rgba(255,107,157,0.15)" : "rgba(255,255,255,0.07)", ...style}}>
      {children}
    </motion.button>
  );

  return (
    <AnimatePresence mode="wait">
      {isFullScreen ? (
        <motion.div key="full"
          initial={{y:"100%",opacity:0}} animate={{y:0,opacity:1}} exit={{y:"100%",opacity:0}}
          transition={{type:"spring",damping:30,stiffness:250}}
          className="fixed z-[200] inset-0 md:inset-y-2 md:right-2 md:left-auto md:w-[350px] xl:w-[400px] md:rounded-3xl overflow-hidden flex flex-col"
          style={{background:"#0A0612",border:"1px solid rgba(255,107,157,0.15)"}}
          onTouchStart={onTS} onTouchEnd={onTE}
        >
          <div className="absolute inset-0 z-0 pointer-events-none overflow-hidden">
            <img src={imageUrl} alt="" className="absolute inset-0 w-full h-full object-cover scale-150 blur-3xl opacity-20" />
            <div className="absolute inset-0" style={{background:"linear-gradient(160deg, " + dominantColor + "55 0%, #0A061290 50%, #0A0612 100%)"}} />
          </div>

          <div className="relative z-10 flex items-center justify-between px-5 pt-12 pb-2 shrink-0">
            <motion.button whileTap={{scale:0.9}} onClick={()=>setFullScreen(false)}
              className="w-9 h-9 rounded-2xl flex items-center justify-center" style={{background:"rgba(255,255,255,0.08)"}}>
              <ChevronDown size={20} className="text-white md:hidden" />
              <PanelRightClose size={18} style={{color:"rgba(255,255,255,0.6)"}} className="hidden md:block" />
            </motion.button>
            <span className="text-[10px] font-bold tracking-[0.25em] uppercase" style={{color:"#FF6B9D"}}>NOW PLAYING</span>
            <div className="flex items-center gap-1 rounded-2xl p-1" style={{background:"rgba(255,255,255,0.06)"}}>
              {[{v:"player",l:"♪"},{v:"lyrics",l:"📝"}].map(({v,l})=>(
                <button key={v} onClick={()=>setActiveView(v)}
                  className="w-7 h-7 rounded-xl text-[13px] flex items-center justify-center transition-all"
                  style={activeView===v?{background:"linear-gradient(135deg,#FF6B9D,#C084FC)",color:"#000"}:{color:"rgba(255,255,255,0.4)"}}>
                  {l}
                </button>
              ))}
            </div>
          </div>

          <div className="flex-1 relative z-10 min-h-0 flex flex-col px-5">
            <AnimatePresence mode="wait">
              {activeView==="player" ? (
                <motion.div key="pv" initial={{opacity:0,x:-20}} animate={{opacity:1,x:0}} exit={{opacity:0,x:20}} transition={{duration:0.25}}
                  className="flex-1 flex flex-col justify-center items-center min-h-0 py-4">
                  <div className="relative">
                    {isPlaying && [1,2,3].map(i=>(
                      <motion.div key={i} className="absolute inset-0 rounded-[28px] pointer-events-none"
                        style={{border:"1px solid rgba(255,107,157,"+(0.3/i)+")"}}
                        animate={{scale:[1,1+i*0.06,1],opacity:[0.6,0,0.6]}}
                        transition={{duration:2,delay:i*0.4,repeat:Infinity,ease:"easeInOut"}} />
                    ))}
                    <motion.div className="w-[210px] h-[210px] md:w-[250px] md:h-[250px] rounded-[28px] overflow-hidden"
                      animate={isPlaying?{scale:[1,1.015,1]}:{scale:1}}
                      transition={{duration:4,repeat:isPlaying?Infinity:0,ease:"easeInOut"}}
                      style={{boxShadow:isPlaying?"0 24px 60px rgba(255,107,157,0.35)":"0 20px 40px rgba(0,0,0,0.6)"}}>
                      <img src={imageUrl} alt="Cover" className="w-full h-full object-cover" />
                    </motion.div>
                    {isPlaying && (
                      <motion.div className="absolute inset-4 rounded-full pointer-events-none"
                        style={{border:"1px dashed rgba(255,107,157,0.3)"}}
                        animate={{rotate:360}} transition={{duration:8,repeat:Infinity,ease:"linear"}} />
                    )}
                  </div>
                  <div className="flex items-end gap-[3px] mt-5 h-8">
                    {Array(20).fill(0).map((_,i)=>(
                      isPlaying ? (
                        <motion.div key={i} className="w-[3px] rounded-full"
                          style={{background:"linear-gradient(to top,#FF6B9D,#C084FC)"}}
                          animate={{height:[4,8+Math.sin(i)*10+6,4]}}
                          transition={{duration:0.5+i*0.03,repeat:Infinity,delay:i*0.04,ease:"easeInOut"}} />
                      ) : <div key={i} className="w-[3px] h-1 rounded-full" style={{background:"rgba(255,255,255,0.1)"}} />
                    ))}
                  </div>
                </motion.div>
              ) : (
                <motion.div key="lv" initial={{opacity:0,x:20}} animate={{opacity:1,x:0}} exit={{opacity:0,x:-20}} transition={{duration:0.25}}
                  className="flex-1 flex flex-col justify-center min-h-0 py-6 overflow-hidden">
                  <div className="flex flex-col items-center gap-3.5 relative">
                    <div className="absolute top-0 left-0 right-0 h-16 pointer-events-none z-10" style={{background:"linear-gradient(to bottom,#0A0612,transparent)"}} />
                    <div className="absolute bottom-0 left-0 right-0 h-16 pointer-events-none z-10" style={{background:"linear-gradient(to top,#0A0612,transparent)"}} />
                    {lyrics.map((line,i)=>{
                      const d = i - currentLyricIdx;
                      const active = d===0;
                      const near = Math.abs(d)<=2;
                      return (
                        <motion.p key={i} className="text-center font-display font-bold leading-tight px-4 select-none"
                          style={{
                            fontSize:active?"22px":near?"15px":"12px",
                            color:active?"transparent":near?"rgba(255,255,255,"+(0.4-Math.abs(d)*0.1)+")":"rgba(255,255,255,0.08)",
                            filter:active?"none":"blur("+(Math.abs(d)*0.4)+"px)",
                            background:active?"linear-gradient(135deg,#FFB7C5,#FF6B9D,#C084FC)":"none",
                            WebkitBackgroundClip:active?"text":"unset",
                            WebkitTextFillColor:active?"transparent":"unset",
                            backgroundClip:active?"text":"unset",
                          }}>
                          {line}
                        </motion.p>
                      );
                    })}
                    <p className="text-[10px] mt-1" style={{color:"rgba(255,255,255,0.2)"}}>✦ Auto-generated lyrics</p>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          <div className="relative z-10 px-5 pb-10 flex flex-col gap-4 shrink-0">
            <div className="flex items-center justify-between">
              <div className="flex flex-col overflow-hidden mr-3 min-w-0">
                <h2 className="text-[20px] font-display font-bold text-white truncate">{currentSong.name}</h2>
                <p className="text-[14px] truncate mt-0.5" style={{color:"rgba(255,107,157,0.8)"}}>{artistName}</p>
              </div>
              <motion.button whileTap={{scale:0.85}} onClick={()=>toggleLike(currentSong)}
                className="w-10 h-10 rounded-2xl flex items-center justify-center"
                style={{background:isLiked?"rgba(255,107,157,0.15)":"rgba(255,255,255,0.06)"}}>
                <Heart size={20} fill={isLiked?"#FF6B9D":"none"} style={{color:isLiked?"#FF6B9D":"rgba(255,255,255,0.5)"}} />
              </motion.button>
            </div>

            <div className="flex flex-col gap-2" onClick={e=>e.stopPropagation()}>
              <div ref={seekBarRef} className="relative h-5 flex items-center cursor-pointer touch-none group"
                onPointerDown={onPD} onPointerMove={onPM} onPointerUp={onPU} onPointerCancel={onPU}
                style={{touchAction:"none"}}>
                <div className="absolute left-0 right-0 h-[3px] rounded-full overflow-hidden group-hover:h-[5px] transition-all" style={{background:"rgba(255,255,255,0.1)"}}>
                  <div ref={fullProgressRef} className="h-full rounded-full progress-sakura" style={{width:"0%"}} />
                </div>
                <div ref={fullThumbRef} className="absolute w-3.5 h-3.5 rounded-full z-10 pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity"
                  style={{left:"-7px",background:"white",boxShadow:"0 0 8px rgba(255,107,157,0.7)"}} />
              </div>
              <div className="flex justify-between text-[11px] font-mono" style={{color:"rgba(255,255,255,0.35)"}}>
                <span ref={fullTimeRef}>0:00</span>
                <span>{fmt(duration)}</span>
              </div>
            </div>

            <div className="flex items-center justify-between" onClick={e=>e.stopPropagation()}>
              <motion.button whileTap={{scale:0.85}} onClick={toggleShuffle}
                className="w-10 h-10 rounded-2xl flex items-center justify-center"
                style={shuffleMode!=='off'?{background:"rgba(255,107,157,0.15)",color:"#FF6B9D"}:{color:"rgba(255,255,255,0.3)"}}>
                <Shuffle size={18} />
              </motion.button>
              <motion.button whileTap={{scale:0.9}} onClick={prevSong}
                className="w-12 h-12 rounded-full flex items-center justify-center" style={{background:"rgba(255,255,255,0.07)"}}>
                <SkipBack size={22} className="text-white" fill="white" />
              </motion.button>
              <motion.button whileTap={{scale:0.93}} onClick={togglePlay}
                className="w-16 h-16 rounded-full flex items-center justify-center"
                style={{background:"linear-gradient(135deg,#FF6B9D,#C084FC)",boxShadow:"0 0 30px rgba(255,107,157,0.5)"}}>
                {isBuffering ? <Loader2 size={28} className="animate-spin text-white" />
                  : isPlaying ? <Pause size={28} fill="white" className="text-white" />
                  : <Play size={28} fill="white" className="text-white ml-1" />}
              </motion.button>
              <motion.button whileTap={{scale:0.9}} onClick={nextSong}
                className="w-12 h-12 rounded-full flex items-center justify-center" style={{background:"rgba(255,255,255,0.07)"}}>
                <SkipForward size={22} className="text-white" fill="white" />
              </motion.button>
              <motion.button whileTap={{scale:0.85}} onClick={()=>setIsRepeat(!isRepeat)}
                className="w-10 h-10 rounded-2xl flex items-center justify-center"
                style={isRepeat?{background:"rgba(192,132,252,0.15)",color:"#C084FC"}:{color:"rgba(255,255,255,0.3)"}}>
                <Repeat size={18} />
              </motion.button>
            </div>
          </div>
        </motion.div>
      ) : (
        <motion.div key="mini"
          initial={{y:80,opacity:0}} animate={{y:0,opacity:1}} exit={{y:80,opacity:0}}
          transition={{type:"spring",damping:28,stiffness:260}}
          className="fixed z-[200] bottom-[76px] md:bottom-6 left-0 right-0 mx-auto w-[calc(100%-24px)] max-w-[390px] md:left-auto md:right-5 md:mx-0 md:w-[330px] xl:w-[390px] h-[64px] rounded-[22px] overflow-hidden cursor-pointer"
          style={{background:"rgba(18,13,28,0.96)",border:"1px solid rgba(255,107,157,0.2)",boxShadow:"0 8px 40px rgba(0,0,0,0.7)"}}
          onClick={()=>setFullScreen(true)}>
          <div className="absolute inset-0 z-0 pointer-events-none opacity-25" style={{backgroundColor:dominantColor}} />
          <div className="absolute inset-0 flex items-center px-3 gap-3 z-10">
            <div className="w-11 h-11 shrink-0 rounded-[14px] overflow-hidden" style={{border:"1px solid rgba(255,107,157,0.25)"}}>
              <img src={imageUrl} alt="" className="w-full h-full object-cover" />
            </div>
            {isPlaying && (
              <div className="flex items-end gap-[2px] shrink-0 h-5">
                {[10,16,8,14,11].map((h,i)=>(
                  <div key={i} className="wave-bar w-[2.5px]" style={{height:h+"px"}} />
                ))}
              </div>
            )}
            <div className="flex-1 min-w-0 flex flex-col justify-center">
              <p className="text-white font-bold text-[13px] truncate">{currentSong.name}</p>
              <p className="text-[11px] truncate" style={{color:"rgba(255,107,157,0.7)"}}>{artistName}</p>
            </div>
            <div className="flex items-center gap-0.5 shrink-0">
              <motion.button whileTap={{scale:0.85}} onClick={e=>{e.stopPropagation();toggleLike(currentSong);}} className="w-9 h-9 flex items-center justify-center rounded-xl">
                <Heart size={17} fill={isLiked?"#FF6B9D":"none"} style={{color:isLiked?"#FF6B9D":"rgba(255,255,255,0.5)"}} />
              </motion.button>
              <motion.button whileTap={{scale:0.85}} onClick={e=>{e.stopPropagation();togglePlay();}} className="w-9 h-9 flex items-center justify-center rounded-xl">
                {isBuffering?<Loader2 size={19} className="animate-spin" style={{color:"#FF6B9D"}} />
                  :isPlaying?<Pause size={19} fill="white" className="text-white" />
                  :<Play size={19} fill="white" className="text-white" />}
              </motion.button>
              <motion.button whileTap={{scale:0.85}} onClick={e=>{e.stopPropagation();nextSong();}} className="w-9 h-9 flex items-center justify-center rounded-xl">
                <SkipForward size={17} className="text-white/60" />
              </motion.button>
            </div>
          </div>
          <div className="absolute bottom-0 left-0 right-0 h-[2px]" style={{background:"rgba(255,255,255,0.06)"}}>
            <div ref={miniProgressRef} className="h-full progress-sakura" style={{width:"0%"}} />
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};
