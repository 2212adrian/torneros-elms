
import React, { useState, useRef } from 'react';
import { User, AccessToken } from '../types';
import { LogIn, ShieldCheck, Key, GraduationCap, QrCode, Camera, X } from 'lucide-react';

interface LoginProps {
  onLogin: (user: User) => void;
  tokens: AccessToken[];
}

const Login: React.FC<LoginProps> = ({ onLogin, tokens }) => {
  const [activeTab, setActiveTab] = useState<'teacher' | 'token'>('teacher');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [tokenInput, setTokenInput] = useState('');
  const [error, setError] = useState('');
  const [isScanning, setIsScanning] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);

  const handleTeacherLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (username === 'torneros@elms.com' && password === 'admin') {
      onLogin({ role: 'teacher' });
    } else {
      setError('Invalid credentials. Hint: torneros@elms.com / admin');
    }
  };

  const handleTokenAccess = (e: React.FormEvent | string) => {
    if (typeof e !== 'string') e.preventDefault();
    const input = (typeof e === 'string' ? e : tokenInput).trim().toUpperCase();
    
    const found = tokens.find(t => t.token === input);
    if (found) {
      onLogin({ role: 'guest', token: input });
    } else {
      setError('Invalid Access Token.');
    }
  };

  const startScanner = async () => {
    setIsScanning(true);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'environment' } });
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }
    } catch (err) {
      setError('Camera access denied or unavailable.');
      setIsScanning(false);
    }
  };

  const stopScanner = () => {
    if (videoRef.current && videoRef.current.srcObject) {
      const stream = videoRef.current.srcObject as MediaStream;
      stream.getTracks().forEach(track => track.stop());
    }
    setIsScanning(false);
  };

  const simulateScan = () => {
    if (tokens.length > 0) {
      const randomToken = tokens[0].token;
      setTokenInput(randomToken);
      stopScanner();
      handleTokenAccess(randomToken);
    } else {
      setError('No active tokens available to scan.');
      stopScanner();
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 p-6">
      <div className="max-w-md w-full animate-fade-in">
        <div className="text-center mb-10">
          <div className="inline-flex items-center justify-center w-20 h-20 bg-blue-600 rounded-2xl shadow-lg shadow-blue-200 mb-4">
            <GraduationCap className="w-12 h-12 text-white" />
          </div>
          <h1 className="text-4xl font-bold text-slate-900 tracking-tight">Torneros ELMS</h1>
          <p className="text-slate-500 mt-2">Electronic Learning Management System</p>
        </div>

        <div className="glass-card rounded-3xl shadow-xl overflow-hidden">
          <div className="flex border-b border-slate-100">
            <button
              onClick={() => { setActiveTab('teacher'); setError(''); }}
              className={`flex-1 py-5 text-sm font-semibold transition-colors flex items-center justify-center gap-2 ${activeTab === 'teacher' ? 'bg-white text-blue-600' : 'text-slate-400 hover:text-slate-600 bg-slate-50/50'}`}
            >
              <ShieldCheck className="w-4 h-4" />
              Teacher Login
            </button>
            <button
              onClick={() => { setActiveTab('token'); setError(''); }}
              className={`flex-1 py-5 text-sm font-semibold transition-colors flex items-center justify-center gap-2 ${activeTab === 'token' ? 'bg-white text-blue-600' : 'text-slate-400 hover:text-slate-600 bg-slate-50/50'}`}
            >
              <Key className="w-4 h-4" />
              Token Access
            </button>
          </div>

          <div className="p-8">
            {activeTab === 'teacher' ? (
              <form onSubmit={handleTeacherLogin} className="space-y-6">
                <div>
                  <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Email Address</label>
                  <input
                    type="email"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:ring-4 focus:ring-blue-100 focus:border-blue-500 outline-none transition-all"
                    placeholder="torneros@elms.com"
                    required
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Password</label>
                  <input
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:ring-4 focus:ring-blue-100 focus:border-blue-500 outline-none transition-all"
                    placeholder="••••••••"
                    required
                  />
                </div>
                <button
                  type="submit"
                  className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-4 rounded-xl shadow-lg shadow-blue-100 transition-all active:scale-95 flex items-center justify-center gap-2"
                >
                  <LogIn className="w-5 h-5" />
                  Sign In
                </button>
              </form>
            ) : (
              <div className="space-y-6">
                <form onSubmit={handleTokenAccess}>
                  <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Manual Access Token</label>
                  <div className="relative">
                    <input
                      type="text"
                      value={tokenInput}
                      onChange={(e) => setTokenInput(e.target.value)}
                      className="w-full pl-4 pr-14 py-4 rounded-xl border border-slate-200 focus:ring-4 focus:ring-blue-100 focus:border-blue-500 outline-none transition-all text-center text-lg font-mono tracking-widest uppercase"
                      placeholder="XXXX-XXXX-XXXX-XXXX"
                      required
                    />
                    <button 
                      type="button"
                      onClick={startScanner}
                      className="absolute right-3 top-1/2 -translate-y-1/2 p-2 bg-blue-50 text-blue-600 rounded-lg hover:bg-blue-100 transition-colors"
                    >
                      <Camera className="w-5 h-5" />
                    </button>
                  </div>
                  <button
                    type="submit"
                    className="w-full mt-4 bg-slate-900 hover:bg-slate-800 text-white font-bold py-4 rounded-xl shadow-lg shadow-slate-200 transition-all active:scale-95 flex items-center justify-center gap-2"
                  >
                    <ShieldCheck className="w-5 h-5" />
                    Validate Access
                  </button>
                </form>

                <div className="flex items-center gap-4 py-2">
                  <div className="flex-1 h-px bg-slate-100" />
                  <span className="text-[10px] font-bold text-slate-300 uppercase tracking-widest">OR</span>
                  <div className="flex-1 h-px bg-slate-100" />
                </div>

                <button
                  onClick={startScanner}
                  className="w-full py-4 border-2 border-dashed border-slate-200 rounded-2xl flex flex-col items-center gap-2 text-slate-400 hover:text-blue-600 hover:border-blue-200 transition-all"
                >
                  <QrCode className="w-8 h-8" />
                  <span className="text-xs font-bold uppercase tracking-wider">Scan Student QR Code</span>
                </button>
              </div>
            )}

            {error && (
              <div className="mt-6 p-4 bg-red-50 border border-red-100 rounded-xl text-red-600 text-sm font-medium animate-pulse text-center">
                {error}
              </div>
            )}
          </div>
        </div>
      </div>

      {isScanning && (
        <div className="fixed inset-0 z-[100] bg-slate-900 flex flex-col items-center justify-center p-6">
          <button onClick={stopScanner} className="absolute top-10 right-10 p-4 bg-white/10 text-white rounded-full hover:bg-white/20 transition-all">
            <X className="w-8 h-8" />
          </button>
          <div className="relative w-full max-w-sm aspect-square bg-black rounded-[3rem] overflow-hidden border-4 border-blue-500/30">
            <video ref={videoRef} autoPlay playsInline className="w-full h-full object-cover" />
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="w-64 h-64 border-2 border-blue-400 rounded-3xl relative">
                <div className="absolute top-0 left-0 w-8 h-8 border-t-4 border-l-4 border-white -translate-x-1 -translate-y-1 rounded-tl-xl" />
                <div className="absolute top-0 right-0 w-8 h-8 border-t-4 border-r-4 border-white translate-x-1 -translate-y-1 rounded-tr-xl" />
                <div className="absolute bottom-0 left-0 w-8 h-8 border-b-4 border-l-4 border-white -translate-x-1 translate-y-1 rounded-bl-xl" />
                <div className="absolute bottom-0 right-0 w-8 h-8 border-b-4 border-r-4 border-white translate-x-1 translate-y-1 rounded-br-xl" />
                <div className="absolute inset-x-0 h-1 bg-blue-400/50 shadow-[0_0_15px_blue] animate-[bounce_2s_infinite]" />
              </div>
            </div>
          </div>
          <div className="mt-12 text-center text-white space-y-4">
            <h3 className="text-xl font-bold">Align QR Code</h3>
            <button onClick={simulateScan} className="mt-6 px-8 py-3 bg-white text-slate-900 rounded-2xl font-black text-xs uppercase tracking-widest">
              Simulate Successful Scan
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default Login;
