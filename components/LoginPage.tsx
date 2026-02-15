import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { hybridService } from '../services/hybridService';
import { cloudService } from '../services/cloudService';
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
    const [useCloud, setUseCloud] = useState(true); // Default to cloud for social login support

    // Auto-clear error after 15 seconds
    useEffect(() => {
        if (error) {
            const timer = setTimeout(() => setError(''), 15000);
            return () => clearTimeout(timer);
        }
    }, [error]);

    useEffect(() => {
        setIsLogin(initialMode === 'login');
        setError('');
        setSuccessMessage('');
    }, [initialMode]);

    const handleSocialLogin = async (provider: 'google' | 'github' | 'apple' | 'azure') => {
        setError('');
        setLoading(true);
        try {
            const res = await cloudService.signInWithOAuth(provider);
            if (!res.success) {
                setError(res.message);
                setLoading(false);
            }
            // If success, Supabase handles redirection
        } catch (err) {
            setError('Social login failed.');
            setLoading(false);
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        setSuccessMessage('');
        setLoading(true);

        try {
            // Configure storage mode preference - Quick accounts always use hybrid/cloud if available
            if (useCloud) {
                if (cloudService.isConfigured()) {
                    // Logic handled in cloudService
                } else {
                    setError('Cloud Sync is not configured. Please add keys to your Supabase project or use Local Only.');
                    setLoading(false);
                    return;
                }
            }

            if (isLogin) {
                const res = await (useCloud ? cloudService.login(username, password) : hybridService.login(username, password));
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

                const res = await (useCloud ? cloudService.register(username, password) : hybridService.register(username, password));

                if (res.success) {
                    const loginRes = await (useCloud ? cloudService.login(username, password) : hybridService.login(username, password));
                    if (loginRes.success) {
                        onLoginSuccess(loginRes.username!);
                    } else {
                        setSuccessMessage('Account created! Please sign in.');
                        setIsLogin(true);
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
            {/* Back to Home button removed as Landing Page is disabled */}
            {/* <button
                onClick={() => navigate('/')}
                className="absolute top-8 left-8 flex items-center gap-2 text-slate-400 hover:text-indigo-600 transition-all group"
            >
                <div className="p-2 bg-white rounded-xl shadow-sm border border-slate-100 group-hover:border-indigo-100 group-hover:shadow-md transition-all">
                    <MoveLeft className="w-4 h-4" />
                </div>
                <span className="text-[10px] font-black uppercase tracking-[0.2em]">Back to Landing</span>
            </button> */}

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
                <div className="bg-white rounded-xl shadow-[0_8px_30px_rgba(0,0,0,0.04)] border border-[#e2e8f0] p-6">
                    {/* Social Login Section */}
                    <div className="space-y-3 mb-6">
                        <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 text-center mb-4">
                            Secure Cloud Sign In
                        </p>
                        <div className="space-y-3">
                            <button
                                onClick={() => handleSocialLogin('google')}
                                className="w-full flex items-center justify-center gap-3 py-2.5 border border-slate-200 rounded-lg hover:bg-slate-50 transition-all text-sm font-bold text-slate-700 active:scale-95"
                            >
                                <Icons.Google className="w-4 h-4" /> Sign in with Google
                            </button>
                            <button
                                onClick={() => handleSocialLogin('github')}
                                className="w-full flex items-center justify-center gap-3 py-2.5 border border-slate-200 rounded-lg hover:bg-slate-50 transition-all text-sm font-bold text-slate-700 active:scale-95"
                            >
                                <Icons.GitHub className="w-4 h-4" /> Sign in with GitHub
                            </button>
                        </div>
                    </div>

                    <div className="relative flex items-center gap-4 mb-6">
                        <div className="flex-1 h-px bg-slate-100"></div>
                        <span className="text-[10px] font-black text-slate-300 uppercase tracking-[0.2em]">or</span>
                        <div className="flex-1 h-px bg-slate-100"></div>
                    </div>

                    {/* Mode Toggle */}
                    <div className="flex bg-[#f1f5f9] p-1 rounded-lg mb-5">
                        <button
                            type="button"
                            onClick={() => setUseCloud(true)}
                            className={`flex-1 py-1.5 text-[10px] font-black uppercase tracking-widest rounded-md transition-all ${useCloud ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-400 hover:text-slate-600'}`}
                        >
                            Quick Account
                        </button>
                        <button
                            type="button"
                            onClick={() => setUseCloud(false)}
                            className={`flex-1 py-1.5 text-[10px] font-black uppercase tracking-widest rounded-md transition-all ${!useCloud ? 'bg-white text-slate-700 shadow-sm' : 'text-slate-400 hover:text-slate-600'}`}
                        >
                            Local Only
                        </button>
                    </div>

                    {/* Quick Account Warning removed */}

                    {!useCloud && (
                        <div className="mb-5 bg-blue-50 border border-blue-100 rounded-lg p-3 flex items-start gap-2.5">
                            <Icons.Info className="w-4 h-4 text-blue-600 shrink-0 mt-0.5" />
                            <p className="text-[10px] leading-relaxed text-blue-800 font-medium">
                                <strong className="block text-blue-900 mb-0.5">Private Mode</strong>
                                Progress is saved 100% on this device. No data ever leaves your browser.
                            </p>
                        </div>
                    )}

                    <form onSubmit={handleSubmit} className="space-y-4">
                        <div className="space-y-2">
                            <label className="block text-[10px] font-black uppercase tracking-widest text-slate-500 ml-1">
                                {isLogin ? 'Identity' : 'Pick a Name'}
                            </label>
                            <input
                                type="text"
                                required
                                value={username}
                                onChange={(e) => setUsername(e.target.value)}
                                className="w-full bg-[#f8fafc] border border-slate-200 rounded-lg py-2.5 px-3 text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all text-sm font-medium"
                                placeholder={isLogin ? "Username" : "Choose a unique username"}
                            />
                        </div>

                        <div className="space-y-2">
                            <label className="block text-[10px] font-black uppercase tracking-widest text-slate-500 ml-1">
                                Key
                            </label>
                            <div className="relative">
                                <input
                                    type={showPassword ? 'text' : 'password'}
                                    required
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    className="w-full bg-[#f8fafc] border border-slate-200 rounded-lg py-2.5 px-3 pr-10 text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all text-sm font-medium"
                                    placeholder="Enter your security phrase"
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
                                <label className="block text-[10px] font-black uppercase tracking-widest text-slate-500 ml-1">
                                    Verify
                                </label>
                                <input
                                    type={showPassword ? 'text' : 'password'}
                                    required
                                    value={confirmPassword}
                                    onChange={(e) => setConfirmPassword(e.target.value)}
                                    className="w-full bg-[#f8fafc] border border-slate-200 rounded-lg py-2.5 px-3 text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all text-sm font-medium"
                                    placeholder="Confirm your security phrase"
                                />
                            </div>
                        )}

                        {error && (
                            <div className="flex items-center gap-2 text-red-600 text-[10px] bg-red-50 border border-red-100 rounded-lg p-3 font-bold uppercase tracking-wide">
                                <Icons.Alert className="w-3.5 h-3.5" /> {error}
                            </div>
                        )}

                        {successMessage && (
                            <div className="flex items-center gap-2 text-green-600 text-[10px] bg-green-50 border border-green-100 rounded-lg p-3 font-bold uppercase tracking-wide">
                                <Icons.Check className="w-3.5 h-3.5" /> {successMessage}
                            </div>
                        )}

                        <button
                            type="submit"
                            disabled={loading}
                            className={`w-full text-white font-black uppercase tracking-[0.2em] py-3.5 rounded-xl transition-all active:scale-[0.98] mt-2 text-[11px] shadow-lg shadow-indigo-100 ${loading ? 'bg-indigo-400' : 'bg-indigo-600 hover:bg-indigo-700'
                                }`}
                        >
                            {loading ? 'Processing...' : (isLogin ? 'Launch Session' : 'Create Quick Access')}
                        </button>
                    </form>

                    <div className="mt-6 pt-4 border-t border-slate-100 text-center">
                        <p className="text-slate-400 text-[10px] font-black uppercase tracking-widest">
                            {isLogin ? "New user?" : "Existing user?"}{' '}
                            <button
                                onClick={() => {
                                    setIsLogin(!isLogin);
                                    setError('');
                                    setSuccessMessage('');
                                }}
                                className="text-indigo-600 hover:text-indigo-800 font-black ml-1 uppercase"
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
        </div >
    );
};

export default LoginPage;
