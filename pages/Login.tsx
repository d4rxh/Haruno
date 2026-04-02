import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { authService } from '../services/auth';
import { usePlayerStore } from '../store/playerStore';
import { Loader2, AlertTriangle, Eye, EyeOff } from 'lucide-react';
import { motion } from 'framer-motion';

const GoogleIcon = () => (
  <svg width="18" height="18" viewBox="0 0 48 48">
    <path fill="#FFC107" d="M43.611,20.083H42V20H24v8h11.303c-1.649,4.657-6.08,8-11.303,8c-6.627,0-12-5.373-12-12c0-6.627,5.373-12,12-12c3.059,0,5.842,1.154,7.961,3.039l5.657-5.657C34.046,6.053,29.268,4,24,4C12.955,4,4,12.955,4,24c0,11.045,8.955,20,20,20c11.045,0,20-8.955,20-20C44,22.659,43.862,21.35,43.611,20.083z"/>
    <path fill="#FF3D00" d="M6.306,14.691l6.571,4.819C14.655,15.108,18.961,12,24,12c3.059,0,5.842,1.154,7.961,3.039l5.657-5.657C34.046,6.053,29.268,4,24,4C16.318,4,9.656,8.337,6.306,14.691z"/>
    <path fill="#4CAF50" d="M24,44c5.166,0,9.86-1.977,13.409-5.192l-6.19-5.238C29.211,35.091,26.715,36,24,36c-5.202,0-9.619-3.317-11.283-7.946l-6.522,5.025C9.505,39.556,16.227,44,24,44z"/>
    <path fill="#1976D2" d="M43.611,20.083H42V20H24v8h11.303c-0.792,2.237-2.231,4.166-4.087,5.571l6.19,5.238C36.971,39.205,44,34,44,24C44,22.659,43.862,21.35,43.611,20.083z"/>
  </svg>
);

export const Login: React.FC = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPass, setShowPass] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const navigate = useNavigate();
  const { loginUser } = usePlayerStore();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true); setError('');
    try {
      const user = await authService.login(email.toLowerCase().trim(), password);
      loginUser(user); navigate('/');
    } catch (err: any) {
      setError(err.message || 'Login failed. Please check your credentials.');
    } finally { setLoading(false); }
  };

  const handleGoogle = async () => {
    setLoading(true); setError('');
    try {
      const user = await authService.loginWithGoogle();
      loginUser(user); navigate('/');
    } catch (err: any) {
      setError(err.message || 'Google Login failed.');
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen text-white flex flex-col items-center justify-center p-6 relative overflow-hidden"
      style={{ background: 'radial-gradient(ellipse at 30% 20%, rgba(255,107,157,0.12) 0%, transparent 55%), radial-gradient(ellipse at 75% 80%, rgba(192,132,252,0.10) 0%, transparent 55%), #0A0612' }}>

      {/* Floating petals decoration */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        {['10%', '30%', '55%', '75%', '90%'].map((left, i) => (
          <div key={i} className="absolute text-[10px] opacity-10"
            style={{ left, top: `${(i * 17 + 5) % 100}%`, animation: `petalFall ${8 + i * 2}s ${i * 1.5}s linear infinite` }}>
            🌸
          </div>
        ))}
      </div>

      <motion.div
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: [0.25, 0.46, 0.45, 0.94] }}
        className="w-full max-w-[360px] flex flex-col gap-5 relative z-10"
      >
        {/* Logo */}
        <div className="flex flex-col items-center gap-3 mb-2">
          <div className="w-14 h-14 rounded-3xl flex items-center justify-center text-3xl"
            style={{ background: 'linear-gradient(135deg, #FF6B9D, #C084FC)', boxShadow: '0 8px 32px rgba(255,107,157,0.4)' }}>
            🌸
          </div>
          <div className="text-center">
            <p className="font-display font-extrabold text-[22px] tracking-widest leading-none" style={{ background: 'linear-gradient(135deg, #FF6B9D, #C084FC)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text' }}>
              KAWAI SAKURA
            </p>
            <p className="text-[13px] font-medium mt-1.5" style={{ color: 'rgba(255,255,255,0.35)' }}>Welcome back 🎵</p>
          </div>
        </div>

        {error && (
          <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }}
            className="flex items-center gap-2 p-3 rounded-2xl text-[13px] font-medium"
            style={{ background: 'rgba(255,59,48,0.12)', border: '1px solid rgba(255,59,48,0.25)', color: '#FF6B6B' }}>
            <AlertTriangle size={14} /> {error}
          </motion.div>
        )}

        {/* Google */}
        <motion.button whileTap={{ scale: 0.97 }} onClick={handleGoogle} disabled={loading}
          className="flex items-center justify-center gap-3 w-full font-bold py-3.5 rounded-2xl transition-all text-[14px]"
          style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)', color: 'white' }}>
          <GoogleIcon />
          <span>Continue with Google</span>
        </motion.button>

        {/* Divider */}
        <div className="flex items-center gap-3">
          <div className="h-px flex-1" style={{ background: 'rgba(255,255,255,0.08)' }} />
          <span className="text-[12px] font-medium" style={{ color: 'rgba(255,255,255,0.3)' }}>or</span>
          <div className="h-px flex-1" style={{ background: 'rgba(255,255,255,0.08)' }} />
        </div>

        {/* Form */}
        <form onSubmit={handleLogin} className="flex flex-col gap-3.5">
          <div className="flex flex-col gap-1.5">
            <label className="text-[12px] font-bold tracking-wide" style={{ color: 'rgba(255,255,255,0.5)' }}>EMAIL</label>
            <input type="email" required placeholder="your@email.com" value={email} onChange={e => setEmail(e.target.value)}
              className="w-full px-4 py-3.5 rounded-2xl text-[14px] text-white placeholder-white/25 outline-none transition-all"
              style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.09)' }}
              onFocus={e => (e.target.style.borderColor = 'rgba(255,107,157,0.5)')}
              onBlur={e => (e.target.style.borderColor = 'rgba(255,255,255,0.09)')} />
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-[12px] font-bold tracking-wide" style={{ color: 'rgba(255,255,255,0.5)' }}>PASSWORD</label>
            <div className="relative">
              <input type={showPass ? 'text' : 'password'} required placeholder="••••••••" value={password} onChange={e => setPassword(e.target.value)}
                className="w-full px-4 py-3.5 pr-12 rounded-2xl text-[14px] text-white placeholder-white/25 outline-none transition-all"
                style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.09)' }}
                onFocus={e => (e.target.style.borderColor = 'rgba(255,107,157,0.5)')}
                onBlur={e => (e.target.style.borderColor = 'rgba(255,255,255,0.09)')} />
              <button type="button" onClick={() => setShowPass(!showPass)}
                className="absolute right-4 top-1/2 -translate-y-1/2" style={{ color: 'rgba(255,255,255,0.3)' }}>
                {showPass ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
          </div>

          <a href="#" className="text-[12px] font-semibold text-right" style={{ color: '#FF6B9D' }}>Forgot password?</a>

          <motion.button type="submit" disabled={loading} whileTap={{ scale: 0.97 }}
            className="w-full font-bold py-3.5 rounded-2xl text-[14px] text-black mt-1 flex items-center justify-center gap-2 transition-all"
            style={{ background: 'linear-gradient(135deg, #FF6B9D, #FF8FB3)', boxShadow: loading ? 'none' : '0 6px 20px rgba(255,107,157,0.4)' }}>
            {loading ? <Loader2 size={18} className="animate-spin text-black" /> : '✦ Log In'}
          </motion.button>
        </form>

        <p className="text-center text-[13px]" style={{ color: 'rgba(255,255,255,0.35)' }}>
          Don't have an account?{' '}
          <Link to="/signup" className="font-bold" style={{ color: '#FF6B9D' }}>Sign up free</Link>
        </p>

        <button onClick={() => navigate('/')} className="text-[12px] text-center transition-colors" style={{ color: 'rgba(255,255,255,0.25)' }}>
          ← Back to app
        </button>
      </motion.div>
    </div>
  );
};
