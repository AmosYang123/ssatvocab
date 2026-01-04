import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { hybridService } from '../services/hybridService';
import { Icons } from './Icons';
import { MoveLeft } from 'lucide-react';

interface LoginPageProps {
    onLoginSuccess: (username: string) => void;
    initialMode?: 'login' | 'signup';
}

const LoginPage: React.FC<LoginPageProps> = ({ onLoginSuccess, initialMode = 'login' }) => {
    const navigate = useNavigate();
    const [isLogin, setIsLogin] = useState(initialMode === 'login');
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const [successMessage, setSuccessMessage] = useState('');
    const [useCloud, setUseCloud] = useState(hybridService.isCloudAvailable());

    useEffect(() => {
        setIsLogin(initialMode === 'login');
        setError('');
        setSuccessMessage('');
    }, [initialMode]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        setSuccessMessage('');
        setLoading(true);

        try {
            // Configure storage mode preference
            if (useCloud) {
                if (hybridService.isCloudAvailable()) {
                    hybridService.setStorageMode('hybrid');
                } else {
                    setError('Cloud Sync is not configured. Please add VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY to your Vercel project settings or use Local Only.');
                    setLoading(false);
                    return;
                }
            } else {
                hybridService.setStorageMode('local');
            }

            if (isLogin) {
                const res = await hybridService.login(username, password);
                if (res.success) {
                    onLoginSuccess(res.username!);
                } else {
                    setError(res.message);
                }
            } else {
                if (password !== confirmPassword) {
                    setError('Passwords do not match.');
                    setLoading(false);
                    return;
                }

                const res = await hybridService.register(username, password);

                if (res.success) {
                    // Security/UX: Automatically log in after registration
                    const loginRes = await hybridService.login(username, password);
                    if (loginRes.success) {
                        onLoginSuccess(loginRes.username!);
                    } else {
                        // Fallback if auto-login fails
                        setSuccessMessage('Account created! Please sign in.');
                        navigate('/signin');
                    }
                } else {
                    setError(res.message);
                }
            }
        } catch {
            setError('An unexpected error occurred.');
        } finally {
            setLoading(false);
        }
    };

    const isCloudAvailable = hybridService.isCloudAvailable();

    return (
        <div className="min-h-screen flex items-center justify-center bg-[#f8fafc] px-4 font-['Inter'] relative">
            <button
                onClick={() => navigate('/landing')}
                className="absolute top-8 left-8 flex items-center gap-2 text-slate-500 hover:text-indigo-600 font-bold uppercase tracking-widest text-xs transition-colors"
            >
                <MoveLeft className="w-4 h-4" /> Back to Home
            </button>

            <div className="w-full max-w-[380px]">
                {/* Header */}
                <div className="text-center mb-6">
                    <h1 className="text-2xl font-black text-slate-900 tracking-tighter italic">
                        SSAT Mastery
                    </h1>
                    <p className="text-slate-500 text-sm mt-2 font-medium">
                        {isLogin ? 'Sign in to your account' : 'Create your account'}
                    </p>
                </div>

                {/* Form Container */}
                <div className="bg-white rounded-xl shadow-[0_4px_20px_rgba(0,0,0,0.05)] border border-[#e2e8f0] p-6">
                    {/* Cloud/Local Toggle - Always visible for UI consistency */}
                    <div className="flex bg-[#f1f5f9] p-1 rounded-lg mb-5">
                        <button
                            type="button"
                            onClick={() => setUseCloud(true)}
                            className={`flex-1 py-1.5 text-xs font-semibold rounded-md transition-all flex items-center justify-center gap-1.5 ${useCloud ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'
                                }`}
                        >
                            Cloud Sync
                            {!isCloudAvailable && (
                                <span className="flex items-center text-[9px] px-1.5 py-0.5 bg-amber-100 text-amber-700 rounded-full font-bold border border-amber-200 uppercase tracking-tighter">
                                    Off
                                </span>
                            )}
                        </button>
                        <button
                            type="button"
                            onClick={() => setUseCloud(false)}
                            className={`flex-1 py-1.5 text-xs font-semibold rounded-md transition-all ${!useCloud ? 'bg-white text-slate-700 shadow-sm' : 'text-slate-500 hover:text-slate-700'
                                }`}
                        >
                            Local Only
                        </button>
                    </div>

                    <form onSubmit={handleSubmit} className="space-y-4">
                        <div className="space-y-2">
                            <label className="block text-sm font-bold text-slate-700">
                                Username
                            </label>
                            <input
                                type="text"
                                required
                                value={username}
                                onChange={(e) => setUsername(e.target.value)}
                                className="w-full bg-[#f8fafc] border border-slate-200 rounded-lg py-2.5 px-3 text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all text-sm font-medium"
                                placeholder="Enter your username"
                            />
                        </div>

                        <div className="space-y-2">
                            <label className="block text-sm font-bold text-slate-700">
                                Password
                            </label>
                            <div className="relative">
                                <input
                                    type={showPassword ? 'text' : 'password'}
                                    required
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    className="w-full bg-[#f8fafc] border border-slate-200 rounded-lg py-2.5 px-3 pr-10 text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all text-sm font-medium"
                                    placeholder="Enter your password"
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowPassword(!showPassword)}
                                    className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-1"
                                >
                                    {showPassword ? <Icons.EyeOff /> : <Icons.Eye />}
                                </button>
                            </div>
                        </div>

                        {!isLogin && (
                            <div className="space-y-2">
                                <label className="block text-sm font-bold text-slate-700">
                                    Confirm Password
                                </label>
                                <input
                                    type={showPassword ? 'text' : 'password'}
                                    required
                                    value={confirmPassword}
                                    onChange={(e) => setConfirmPassword(e.target.value)}
                                    className="w-full bg-[#f8fafc] border border-slate-200 rounded-lg py-2.5 px-3 text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all text-sm font-medium"
                                    placeholder="Confirm your password"
                                />
                            </div>
                        )}

                        {error && (
                            <div className="flex items-center gap-2 text-red-600 text-sm bg-red-50 border border-red-100 rounded-lg p-3 font-medium">
                                <Icons.Alert /> {error}
                            </div>
                        )}

                        {successMessage && (
                            <div className="flex items-center gap-2 text-green-600 text-sm bg-green-50 border border-green-100 rounded-lg p-3 font-medium">
                                <Icons.Check /> {successMessage}
                            </div>
                        )}

                        <button
                            type="submit"
                            disabled={loading}
                            className={`w-full text-white font-black uppercase tracking-widest py-3 rounded-xl transition-all active:scale-[0.98] mt-2 text-sm shadow-lg shadow-indigo-100 ${loading ? 'bg-indigo-400' : 'bg-indigo-600 hover:bg-indigo-700'
                                }`}
                        >
                            {loading ? 'Processing...' : (isLogin ? 'Sign In' : 'Sign Up')}
                        </button>
                    </form>

                    <div className="mt-6 pt-4 border-t border-slate-100 text-center">
                        <p className="text-slate-500 text-sm font-medium">
                            {isLogin ? "Don't have an account?" : "Already have an account?"}{' '}
                            <button
                                onClick={() => {
                                    navigate(isLogin ? '/signup' : '/signin');
                                    setError('');
                                    setSuccessMessage('');
                                }}
                                className="text-indigo-600 hover:text-indigo-800 font-bold ml-1"
                            >
                                {isLogin ? 'Sign up' : 'Sign in'}
                            </button>
                        </p>
                    </div>
                </div>

                <p className="mt-8 text-center text-xs font-bold uppercase tracking-widest text-slate-400">
                    {useCloud
                        ? (isCloudAvailable ? 'Sync Active' : 'Sync Inactive')
                        : 'Local Mode'}
                </p>
            </div>
        </div>
    );
};

export default LoginPage;
