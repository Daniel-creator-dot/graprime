import React, { useState } from 'react';
import { Mail, Lock, LogIn, ShieldCheck, KeyRound, ChevronLeft, CheckCircle2, Eye, EyeOff } from 'lucide-react';
import { authApi } from '../api/client';
import { motion, AnimatePresence } from 'motion/react';
import logo from '../gra.png';
import StatusModal from './StatusModal';

type LoginMode = 'login' | 'forgot' | 'reset';

export default function Login({ onLogin }: { onLogin: (user: any) => void }) {
  const [mode, setMode] = useState<LoginMode>('login');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [otp, setOtp] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [statusModal, setStatusModal] = useState<any>({ isOpen: false, type: 'success', title: '', message: '' });

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      const res = await authApi.login({ username, password });
      localStorage.setItem('token', res.data.token);
      localStorage.setItem('user', JSON.stringify(res.data.user));
      onLogin(res.data.user);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Login failed. Please check your credentials.');
    } finally {
      setLoading(false);
    }
  };

  const handleForgotPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      await authApi.forgotPassword(username);
      setMode('reset');
      setStatusModal({
        isOpen: true,
        type: 'info',
        title: 'OTP Sent',
        message: 'A verification code has been sent to your registered phone number.'
      });
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to send OTP.');
    } finally {
      setLoading(false);
    }
  };

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      await authApi.resetPassword({ username, code: otp, newPassword });
      
      // Auto-login after successful reset
      const res = await authApi.login({ username, password: newPassword });
      localStorage.setItem('token', res.data.token);
      localStorage.setItem('user', JSON.stringify(res.data.user));
      
      setStatusModal({
        isOpen: true,
        type: 'success',
        title: 'Success!',
        message: 'Your password has been reset successfully. Logging you in now...'
      });

      setTimeout(() => {
        onLogin(res.data.user);
      }, 1500);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Reset failed.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#F1F5F9] flex items-center justify-center p-6 relative overflow-hidden">
      {/* Abstract Background Shapes */}
      <div className="absolute top-0 right-0 w-[800px] h-[800px] bg-indigo-500/5 rounded-full -mr-96 -mt-96 blur-3xl"></div>
      <div className="absolute bottom-0 left-0 w-[600px] h-[600px] bg-blue-500/5 rounded-full -ml-64 -mb-64 blur-3xl"></div>

      <motion.div
        layout
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-[480px] bg-white rounded-[40px] shadow-2xl shadow-indigo-100/50 p-12 relative z-10 border border-white"
      >
        <div className="flex flex-col items-center mb-12">
          <div className="w-24 h-24 bg-white rounded-[28px] flex items-center justify-center shadow-xl shadow-indigo-100 mb-8 overflow-hidden p-2">
            <img src={logo} alt="GRA Logo" className="w-full h-full object-contain" />
          </div>
          <h1 className="text-3xl font-black text-slate-900 tracking-tight mb-3">
            {mode === 'login' ? 'Welcome Back' : mode === 'forgot' ? 'Forgot Access?' : 'Reset Password'}
          </h1>
          <p className="text-slate-400 font-medium uppercase text-[10px] tracking-widest">
            {mode === 'login' ? 'PRIME INTERNAL PORTAL' : 'SECURE ACCOUNT RECOVERY'}
          </p>
        </div>

        {error && (
          <motion.div
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            className="mb-8 p-4 bg-red-50 border border-red-100 text-red-600 rounded-2xl text-sm font-bold flex items-center gap-3"
          >
            <ShieldCheck className="w-5 h-5" />
            {error}
          </motion.div>
        )}

        <AnimatePresence mode="wait">
          {mode === 'login' && (
            <motion.form
              key="login"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20 }}
              onSubmit={handleLogin}
              className="space-y-6"
            >
              <div className="space-y-2">
                <label className="text-[11px] font-black text-slate-400 uppercase tracking-widest ml-1">Staff ID / Username</label>
                <div className="relative group">
                  <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-slate-400 group-focus-within:text-indigo-600 transition-colors">
                    <Mail className="w-5 h-5" />
                  </div>
                  <input
                    required
                    type="text"
                    placeholder="Enter your ID"
                    className="w-full pl-12 pr-4 py-4 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 outline-none transition-all font-medium text-slate-900"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-[11px] font-black text-slate-400 uppercase tracking-widest ml-1">Secure Password</label>
                <div className="relative group">
                  <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-slate-400 group-focus-within:text-indigo-600 transition-colors">
                    <Lock className="w-5 h-5" />
                  </div>
                  <input
                    required
                    type={showPassword ? "text" : "password"}
                    placeholder="••••••••"
                    className="w-full pl-12 pr-12 py-4 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 outline-none transition-all font-medium text-slate-900"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute inset-y-0 right-0 pr-4 flex items-center text-slate-400 hover:text-indigo-600 transition-colors"
                  >
                    {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                  </button>
                </div>
              </div>

              <div className="flex items-center justify-between py-2">
                <label className="flex items-center gap-3 cursor-pointer group">
                  <input type="checkbox" className="w-5 h-5 rounded-lg border-slate-300 text-indigo-600 focus:ring-indigo-500 cursor-pointer" />
                  <span className="text-sm font-bold text-slate-500 group-hover:text-slate-900 transition-colors">Remember me</span>
                </label>
                <button type="button" onClick={() => { setMode('forgot'); setError(''); }} className="text-sm font-bold text-indigo-600 hover:text-indigo-700">Forgot access?</button>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full py-5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-[24px] font-black text-lg shadow-2xl shadow-indigo-200 transition-all active:scale-[0.98] disabled:opacity-50 flex items-center justify-center gap-3 mt-4"
              >
                {loading ? 'AUTHENTICATING...' : (
                  <>
                    SIGN IN
                    <LogIn className="w-6 h-6" />
                  </>
                )}
              </button>
            </motion.form>
          )}

          {mode === 'forgot' && (
            <motion.form
              key="forgot"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              onSubmit={handleForgotPassword}
              className="space-y-6"
            >
              <div className="space-y-2">
                <label className="text-[11px] font-black text-slate-400 uppercase tracking-widest ml-1">Staff ID / Username</label>
                <div className="relative group">
                  <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-slate-400 group-focus-within:text-indigo-600 transition-colors">
                    <Mail className="w-5 h-5" />
                  </div>
                  <input
                    required
                    type="text"
                    placeholder="Enter your ID to receive OTP"
                    className="w-full pl-12 pr-4 py-4 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 outline-none transition-all font-medium text-slate-900"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                  />
                </div>
              </div>

              <div className="flex gap-4">
                <button
                  type="button"
                  onClick={() => setMode('login')}
                  className="flex-1 py-5 bg-slate-100 text-slate-600 rounded-[24px] font-black text-sm transition-all hover:bg-slate-200 flex items-center justify-center gap-2"
                >
                  <ChevronLeft className="w-4 h-4" />
                  BACK
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="flex-[2] py-5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-[24px] font-black text-sm shadow-xl shadow-indigo-100 transition-all active:scale-[0.98] disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  {loading ? 'SENDING...' : 'SEND RECOVERY OTP'}
                </button>
              </div>
            </motion.form>
          )}

          {mode === 'reset' && (
            <motion.form
              key="reset"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              onSubmit={handleResetPassword}
              className="space-y-6"
            >
              <div className="space-y-2">
                <label className="text-[11px] font-black text-slate-400 uppercase tracking-widest ml-1">Verification Code (OTP)</label>
                <div className="relative group">
                  <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-slate-400 group-focus-within:text-indigo-600 transition-colors">
                    <KeyRound className="w-5 h-5" />
                  </div>
                  <input
                    required
                    type="text"
                    maxLength={6}
                    placeholder="6-digit code"
                    className="w-full pl-12 pr-4 py-4 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 outline-none transition-all font-bold tracking-widest text-slate-900"
                    value={otp}
                    onChange={(e) => setOtp(e.target.value)}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-[11px] font-black text-slate-400 uppercase tracking-widest ml-1">New Secure Password</label>
                <div className="relative group">
                  <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-slate-400 group-focus-within:text-indigo-600 transition-colors">
                    <Lock className="w-5 h-5" />
                  </div>
                  <input
                    required
                    type={showNewPassword ? "text" : "password"}
                    placeholder="••••••••"
                    className="w-full pl-12 pr-12 py-4 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 outline-none transition-all font-medium text-slate-900"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                  />
                  <button
                    type="button"
                    onClick={() => setShowNewPassword(!showNewPassword)}
                    className="absolute inset-y-0 right-0 pr-4 flex items-center text-slate-400 hover:text-indigo-600 transition-colors"
                  >
                    {showNewPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                  </button>
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full py-5 bg-green-600 hover:bg-green-700 text-white rounded-[24px] font-black text-lg shadow-2xl shadow-green-200 transition-all active:scale-[0.98] disabled:opacity-50 flex items-center justify-center gap-3 mt-4"
              >
                {loading ? 'RESETTING...' : (
                  <>
                    UPDATE PASSWORD
                    <CheckCircle2 className="w-6 h-6" />
                  </>
                )}
              </button>
            </motion.form>
          )}
        </AnimatePresence>

        <div className="mt-12 text-center">
          <p className="text-sm font-bold text-slate-400">
            Trouble logging in? <button className="text-indigo-600 hover:underline">Contact IT Support</button>
          </p>
        </div>
      </motion.div>

      <StatusModal 
        isOpen={statusModal.isOpen}
        onClose={() => setStatusModal({ ...statusModal, isOpen: false })}
        type={statusModal.type}
        title={statusModal.title}
        message={statusModal.message}
      />
    </div>
  );
}
