import React, { useState } from 'react';
import { hybridService } from '../services/hybridService';
import { Icons } from './Icons';

interface LoginPageProps {
    onLoginSuccess: (username: string) => void;
}

const LoginPage: React.FC<LoginPageProps> = ({ onLoginSuccess }) => {
    const [isLogin, setIsLogin] = useState(true);
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const [successMessage, setSuccessMessage] = useState('');
    const [useCloud, setUseCloud] = useState(true);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        setSuccessMessage('');
        setLoading(true);

        try {
            // Configure storage mode preference
            if (useCloud && hybridService.isCloudAvailable()) {
                hybridService.setStorageMode('hybrid');
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
                    setSuccessMessage('Account created! Please sign in.');
                    setIsLogin(true);
                    setPassword('');
                    setConfirmPassword('');
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
        <div className="min-h-screen flex items-center justify-center bg-[#f8fafc] px-4 font-sans">
            <div className="w-full max-w-[380px]">
                {/* Header */}
                <div className="text-center mb-6">
                    <h1 className="text-2xl font-bold text-[#1e293b] tracking-tight">
                        SSAT Mastery
                    </h1>
                    <p className="text-[#64748b] text-sm mt-1">
                        {isLogin ? 'Sign in to your account' : 'Create your account'}
                    </p>
                </div>

                {/* Form Container */}
                <div className="bg-white rounded-xl shadow-[0_4px_20px_rgba(0,0,0,0.05)] border border-[#e2e8f0] p-6">
                    {/* Cloud/Local Toggle */}
                    {isCloudAvailable && (
                        <div className="flex bg-[#f1f5f9] p-1 rounded-lg mb-5">
                            <button
                                type="button"
                                onClick={() => setUseCloud(true)}
                                className={`flex-1 py-1.5 text-xs font-semibold rounded-md transition-all ${useCloud ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'
                                    }`}
                            >
                                Cloud Sync
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
                    )}

                    <form onSubmit={handleSubmit} className="space-y-4">
                        <div className="space-y-2">
                            <label className="block text-sm font-medium text-[#334155]">
                                Username
                            </label>
                            <input
                                type="text"
                                required
                                value={username}
                                onChange={(e) => setUsername(e.target.value)}
                                className="w-full bg-[#f0f4f9] border border-[#d1d5db] rounded-lg py-2.5 px-3 text-[#1e293b] placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all text-base"
                                placeholder="Enter your username"
                            />
                        </div>

                        <div className="space-y-2">
                            <label className="block text-sm font-medium text-[#334155]">
                                Password
                            </label>
                            <div className="relative">
                                <input
                                    type={showPassword ? 'text' : 'password'}
                                    required
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    className="w-full bg-[#f0f4f9] border border-[#d1d5db] rounded-lg py-2.5 px-3 pr-10 text-[#1e293b] placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all text-base"
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
                                <label className="block text-sm font-medium text-[#334155]">
                                    Confirm Password
                                </label>
                                <input
                                    type={showPassword ? 'text' : 'password'}
                                    required
                                    value={confirmPassword}
                                    onChange={(e) => setConfirmPassword(e.target.value)}
                                    className="w-full bg-[#f0f4f9] border border-[#d1d5db] rounded-lg py-2.5 px-3 text-[#1e293b] placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all text-base"
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
                            className={`w-full text-white font-bold py-3 rounded-lg transition-all active:scale-[0.98] mt-2 text-base shadow-sm ${loading ? 'bg-indigo-400' : 'bg-[#4f46e5] hover:bg-indigo-700'
                                }`}
                        >
                            {loading ? 'Processing...' : (isLogin ? 'Sign In' : 'Sign Up')}
                        </button>
                    </form>

                    <div className="mt-5 pt-4 border-t border-[#f1f5f9] text-center">
                        <p className="text-[#475569] text-sm font-medium">
                            {isLogin ? "Don't have an account?" : "Already have an account?"}{' '}
                            <button
                                onClick={() => { setIsLogin(!isLogin); setError(''); setSuccessMessage(''); }}
                                className="text-[#4f46e5] hover:text-indigo-800 font-bold"
                            >
                                {isLogin ? 'Sign up' : 'Sign in'}
                            </button>
                        </p>
                    </div>
                </div>

                <p className="mt-8 text-center text-sm font-medium text-[#94a3b8]">
                    {useCloud
                        ? 'Your data syncs across devices'
                        : 'Data stored locally on this device'}
                </p>
            </div>
        </div>
    );
};

export default LoginPage;
