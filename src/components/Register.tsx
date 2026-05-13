import React, { useState } from 'react';
import { Mail, Lock, User, Phone, UserPlus, ChevronLeft, ShieldCheck, Eye, EyeOff } from 'lucide-react';
import { authApi } from '../api/client';
import { motion } from 'motion/react';
import graLogo from '../gra.png';
import graaLogo from '../graa.png';
import StatusModal from './StatusModal';

export default function Register({ onRegister, onBackToLogin }: { onRegister: (user: any) => void, onBackToLogin: () => void }) {
  const [formData, setFormData] = useState({
    username: '',
    password: '',
    name: '',
    phone_number: '',
    email: ''
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [statusModal, setStatusModal] = useState<any>({ isOpen: false, type: 'success', title: '', message: '' });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      const res = await authApi.register(formData);
      localStorage.setItem('token', res.data.token);
      localStorage.setItem('user', JSON.stringify(res.data.user));
      
      setStatusModal({
        isOpen: true,
        type: 'success',
        title: 'Registration Successful!',
        message: 'Welcome to CSA Health. Your account has been created successfully.'
      });

      setTimeout(() => {
        onRegister(res.data.user);
      }, 2000);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Registration failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#F1F5F9] flex items-center justify-center p-6 relative overflow-hidden">
      <div className="absolute top-0 right-0 w-[800px] h-[800px] bg-indigo-500/5 rounded-full -mr-96 -mt-96 blur-3xl"></div>
      <div className="absolute bottom-0 left-0 w-[600px] h-[600px] bg-blue-500/5 rounded-full -ml-64 -mb-64 blur-3xl"></div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-[550px] bg-white rounded-[40px] shadow-2xl shadow-indigo-100/50 p-10 relative z-10 border border-white"
      >
        <div className="flex flex-col items-center mb-8">
          <div className="flex items-center gap-4 mb-6">
            <div className="w-16 h-16 bg-white rounded-[20px] flex items-center justify-center shadow-lg shadow-indigo-100 overflow-hidden p-2">
              <img src={graaLogo} alt="CSAA Logo" className="w-full h-full object-contain" />
            </div>
            <div className="h-8 w-px bg-slate-200" />
            <div className="w-16 h-16 bg-white rounded-[20px] flex items-center justify-center shadow-lg shadow-indigo-100 overflow-hidden p-2">
              <img src={graLogo} alt="CSA Logo" className="w-full h-full object-contain" />
            </div>
          </div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight mb-2">Create Patient Account</h1>
          <p className="text-slate-400 font-medium uppercase text-[9px] tracking-widest">JOIN THE TELEMEDICINE NETWORK</p>
        </div>

        {error && (
          <motion.div
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            className="mb-6 p-4 bg-red-50 border border-red-100 text-red-600 rounded-2xl text-sm font-bold flex items-center gap-3"
          >
            <ShieldCheck className="w-5 h-5" />
            {error}
          </motion.div>
        )}

        <form onSubmit={handleRegister} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Full Name</label>
              <div className="relative group">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-slate-400 group-focus-within:text-indigo-600">
                  <User className="w-4 h-4" />
                </div>
                <input
                  required
                  name="name"
                  type="text"
                  placeholder="John Doe"
                  className="w-full pl-10 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 outline-none transition-all font-medium text-slate-900 text-sm"
                  value={formData.name}
                  onChange={handleChange}
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Phone Number</label>
              <div className="relative group">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-slate-400 group-focus-within:text-indigo-600">
                  <Phone className="w-4 h-4" />
                </div>
                <input
                  required
                  name="phone_number"
                  type="tel"
                  placeholder="024 XXX XXXX"
                  className="w-full pl-10 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 outline-none transition-all font-medium text-slate-900 text-sm"
                  value={formData.phone_number}
                  onChange={handleChange}
                />
              </div>
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Email Address</label>
            <div className="relative group">
              <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-slate-400 group-focus-within:text-indigo-600">
                <Mail className="w-4 h-4" />
              </div>
              <input
                required
                name="email"
                type="email"
                placeholder="john@example.com"
                className="w-full pl-10 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 outline-none transition-all font-medium text-slate-900 text-sm"
                value={formData.email}
                onChange={handleChange}
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Username</label>
            <div className="relative group">
              <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-slate-400 group-focus-within:text-indigo-600">
                <UserPlus className="w-4 h-4" />
              </div>
              <input
                required
                name="username"
                type="text"
                placeholder="Choose a username"
                className="w-full pl-10 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 outline-none transition-all font-medium text-slate-900 text-sm"
                value={formData.username}
                onChange={handleChange}
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Secure Password</label>
            <div className="relative group">
              <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-slate-400 group-focus-within:text-indigo-600">
                <Lock className="w-4 h-4" />
              </div>
              <input
                required
                name="password"
                type={showPassword ? "text" : "password"}
                placeholder="••••••••"
                className="w-full pl-10 pr-12 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 outline-none transition-all font-medium text-slate-900 text-sm"
                value={formData.password}
                onChange={handleChange}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute inset-y-0 right-0 pr-4 flex items-center text-slate-400 hover:text-indigo-600"
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          <div className="flex gap-4 pt-4">
            <button
              type="button"
              onClick={onBackToLogin}
              className="flex-1 py-4 bg-slate-100 text-slate-600 rounded-2xl font-black text-xs transition-all hover:bg-slate-200 flex items-center justify-center gap-2"
            >
              <ChevronLeft className="w-4 h-4" />
              BACK
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex-[2] py-4 bg-indigo-600 hover:bg-indigo-700 text-white rounded-2xl font-black text-xs shadow-xl shadow-indigo-100 transition-all active:scale-[0.98] disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {loading ? 'CREATING...' : 'CREATE ACCOUNT'}
            </button>
          </div>
        </form>
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
