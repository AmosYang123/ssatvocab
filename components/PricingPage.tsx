import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Icons } from './Icons';
import { useNavigate } from 'react-router-dom';

export const PricingPage: React.FC = () => {
    const navigate = useNavigate();
    const [billingCycle, setBillingCycle] = useState<'monthly' | 'semesterly'>('monthly');

    const handleSelectPlan = (planId: string, cycle: 'monthly' | 'semesterly' | 'lifetime') => {
        if (planId === 'free') {
            navigate('/');
        } else {
            // Navigate to payment with plan details
            navigate(`/payment?plan=${planId}&cycle=${cycle}`);
        }
    };

    return (
        <div className="min-h-screen bg-[#fafaf8] font-['Inter'] py-20 px-4">
            <div className="max-w-7xl mx-auto">
                {/* Header */}
                <div className="text-center mb-16 space-y-4">
                    <h1 className="text-4xl md:text-5xl font-black text-slate-900 tracking-tight">
                        Choose Your Path to Mastery
                    </h1>
                    <p className="text-lg text-slate-600 max-w-2xl mx-auto">
                        Unlock the full potential of your vocabulary with our scientifically proven learning system.
                    </p>

                    {/* Toggle */}
                    <div className="flex items-center justify-center gap-4 mt-8">
                        <span className={`text-sm font-bold uppercase tracking-wider ${billingCycle === 'monthly' ? 'text-indigo-600' : 'text-slate-400'}`}>Monthly</span>
                        <button
                            onClick={() => setBillingCycle(prev => prev === 'monthly' ? 'semesterly' : 'monthly')}
                            className="relative w-16 h-8 bg-indigo-100 rounded-full p-1 transition-colors duration-300 focus:outline-none"
                        >
                            <motion.div
                                className="w-6 h-6 bg-indigo-600 rounded-full shadow-md"
                                animate={{ x: billingCycle === 'monthly' ? 0 : 32 }}
                                transition={{ type: "spring", stiffness: 500, damping: 30 }}
                            />
                        </button>
                        <span className={`text-sm font-bold uppercase tracking-wider ${billingCycle === 'semesterly' ? 'text-indigo-600' : 'text-slate-400'}`}>
                            Semesterly <span className="text-[10px] text-green-600 bg-green-100 px-2 py-0.5 rounded-full ml-1">-28%</span>
                        </span>
                    </div>
                </div>

                {/* Cards Container */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-6xl mx-auto">
                    {/* Free Plan */}
                    <div className="bg-white rounded-2xl p-8 border border-slate-200 flex flex-col hover:shadow-xl transition-shadow duration-300">
                        <div className="mb-6">
                            <h3 className="text-2xl font-bold text-slate-900">Basic</h3>
                            <p className="text-slate-500 mt-2 text-sm">Essential vocabulary building.</p>
                        </div>
                        <div className="mb-8">
                            <span className="text-4xl font-black text-slate-900">$0</span>
                            <span className="text-slate-500 font-medium">/ forever</span>
                        </div>
                        <ul className="space-y-4 mb-8 flex-1">
                            <FeatureItem text="625+ Core SSAT Words" />
                            <FeatureItem text="Standard Flashcards" />
                            <FeatureItem text="Basic Progress Tracking" />
                            <FeatureItem text="1 Custom List" />
                        </ul>
                        <button
                            onClick={() => handleSelectPlan('free', 'monthly')}
                            className="w-full py-4 rounded-xl font-bold text-slate-600 bg-slate-100 hover:bg-slate-200 transition-colors uppercase tracking-widest text-xs"
                        >
                            Continue Free
                        </button>
                    </div>

                    {/* Pro Plan (Highlighted) */}
                    <div className="relative bg-white rounded-2xl p-8 border-2 border-indigo-600 shadow-2xl flex flex-col transform scale-105 z-10">
                        <div className="absolute top-0 right-0 bg-indigo-600 text-white text-[10px] font-black uppercase tracking-widest px-4 py-1 rounded-bl-xl rounded-tr-lg">
                            Most Popular
                        </div>
                        <div className="mb-6">
                            <div className="flex items-center gap-2 mb-2">
                                <h3 className="text-2xl font-bold text-slate-900">Pro</h3>
                                <Icons.Lightning className="w-6 h-6 text-yellow-500 fill-yellow-500" />
                            </div>
                            <p className="text-slate-500 text-sm">Maximum power for serious students.</p>
                        </div>
                        <div className="mb-8">
                            <div className="flex items-baseline gap-1">
                                <span className="text-5xl font-black text-slate-900">
                                    ${billingCycle === 'monthly' ? '6.99' : '4.99'}
                                </span>
                                <span className="text-slate-500 font-medium">/ mo</span>
                            </div>
                            {billingCycle === 'semesterly' && (
                                <p className="text-xs text-green-600 font-bold mt-2">Billed $29.99 every 6 months</p>
                            )}
                        </div>
                        <ul className="space-y-4 mb-8 flex-1">
                            <FeatureItem text="Unlimited Custom Lists" highlighted />
                            <FeatureItem text="Smart Review Algorithm" highlighted />
                            <FeatureItem text="Advanced Analytics" highlighted />
                            <FeatureItem text="Priority Cloud Sync" />
                            <FeatureItem text="Export to PDF/Anki" />
                        </ul>
                        <button
                            onClick={() => handleSelectPlan('pro', billingCycle)}
                            className="w-full py-4 rounded-xl font-black text-white bg-indigo-600 hover:bg-indigo-700 transition-all shadow-lg shadow-indigo-200 uppercase tracking-widest text-xs hover:scale-[1.02]"
                        >
                            Select Pro
                        </button>
                    </div>

                    {/* Lifetime Plan */}
                    <div className="bg-slate-900 rounded-2xl p-8 border border-slate-700 text-white flex flex-col hover:shadow-2xl transition-all duration-300">
                        <div className="mb-6">
                            <h3 className="text-2xl font-bold text-white">Lifetime</h3>
                            <p className="text-slate-400 mt-2 text-sm">Pay once, own it forever.</p>
                        </div>
                        <div className="mb-8">
                            <span className="text-4xl font-black text-white">$99</span>
                            <span className="text-slate-400 font-medium">.99</span>
                        </div>
                        <ul className="space-y-4 mb-8 flex-1">
                            <FeatureItem text="All Pro Features" light />
                            <FeatureItem text="Lifetime Updates" light />
                            <FeatureItem text="Priority Support" light />
                            <FeatureItem text="No Recurring Fees" light />
                            <FeatureItem text="Early Access to New Features" light />
                        </ul>
                        <button
                            onClick={() => handleSelectPlan('lifetime', 'lifetime')}
                            className="w-full py-4 rounded-xl font-bold text-slate-900 bg-white hover:bg-slate-100 transition-colors uppercase tracking-widest text-xs"
                        >
                            Get Lifetime Access
                        </button>
                    </div>
                </div>

                <div className="mt-16 text-center text-slate-400 text-xs">
                    <p>Secure payment processing by Stripe. You can cancel anytime.</p>
                </div>
            </div>
        </div>
    );
};

const FeatureItem = ({ text, highlighted = false, light = false }: { text: string, highlighted?: boolean, light?: boolean }) => (
    <li className="flex items-center gap-3">
        <div className={`p-1 rounded-full ${highlighted ? 'bg-indigo-100 text-indigo-600' : (light ? 'bg-slate-800 text-green-400' : 'bg-green-100 text-green-600')}`}>
            <Icons.Check className="w-3 h-3" />
        </div>
        <span className={`text-sm ${light ? 'text-slate-300' : 'text-slate-600'} ${highlighted ? 'font-bold text-slate-900' : ''}`}>{text}</span>
    </li>
);

export default PricingPage;
