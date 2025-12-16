import React, { useState } from 'react';
import { supabase } from '../lib/supabase';
import GlassCard from './GlassCard';
import { Sparkles, ArrowRight, Loader } from 'lucide-react';

const Auth: React.FC = () => {
  const [loading, setLoading] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [mode, setMode] = useState<'signin' | 'signup'>('signin');
  const [error, setError] = useState<string | null>(null);

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
        if (mode === 'signup') {
            const { error } = await supabase.auth.signUp({ email, password });
            if (error) throw error;
            alert('Check your email for the confirmation link!');
        } else {
            const { error } = await supabase.auth.signInWithPassword({ email, password });
            if (error) throw error;
        }
    } catch (err: any) {
        setError(err.message);
    } finally {
        setLoading(false);
    }
  };

  return (
    <div className="w-full h-full flex items-center justify-center p-4">
        <GlassCard className="w-full max-w-md p-8" variant="thick">
            <div className="flex flex-col items-center mb-8">
                <div className="w-16 h-16 bg-white/10 rounded-full flex items-center justify-center mb-4">
                    <Sparkles className="text-pink-400" size={32} />
                </div>
                <h1 className="text-2xl font-bold text-white mb-2">Welcome to Nexus</h1>
                <p className="text-white/50 text-center text-sm">Your personal operating system for productivity and growth.</p>
            </div>

            <form onSubmit={handleAuth} className="space-y-4">
                <div>
                    <label className="text-xs text-white/50 uppercase font-bold block mb-2">Email</label>
                    <input 
                        type="email" 
                        required
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        className="w-full bg-white/5 border border-white/10 rounded-xl p-3 text-white focus:border-pink-500 outline-none transition-colors"
                        placeholder="you@example.com"
                    />
                </div>
                <div>
                    <label className="text-xs text-white/50 uppercase font-bold block mb-2">Password</label>
                    <input 
                        type="password" 
                        required
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        className="w-full bg-white/5 border border-white/10 rounded-xl p-3 text-white focus:border-pink-500 outline-none transition-colors"
                        placeholder="••••••••"
                    />
                </div>

                {error && (
                    <div className="p-3 rounded-lg bg-red-500/20 text-red-200 text-sm">
                        {error}
                    </div>
                )}

                <button 
                    disabled={loading}
                    className="w-full py-3 rounded-xl bg-white text-black font-bold flex items-center justify-center gap-2 hover:bg-gray-200 transition-colors"
                >
                    {loading ? <Loader className="animate-spin" size={20}/> : (
                        <>
                            {mode === 'signin' ? 'Sign In' : 'Sign Up'} <ArrowRight size={18} />
                        </>
                    )}
                </button>
            </form>

            <div className="mt-6 text-center">
                <button 
                    onClick={() => setMode(mode === 'signin' ? 'signup' : 'signin')}
                    className="text-white/40 text-sm hover:text-white transition-colors"
                >
                    {mode === 'signin' ? "Don't have an account? Sign Up" : "Already have an account? Sign In"}
                </button>
            </div>
        </GlassCard>
    </div>
  );
};

export default Auth;