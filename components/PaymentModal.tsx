import React, { useState } from 'react';
import { Icons } from './Icons';
import { CardElement, useStripe, useElements } from '@stripe/react-stripe-js';

interface PaymentModalProps {
    onClose: () => void;
    onUpgrade: () => void;
    isPro?: boolean;
}

const PaymentModal: React.FC<PaymentModalProps> = ({ onClose, onUpgrade, isPro }) => {
    const stripe = useStripe();
    const elements = useElements();

    const [step, setStep] = useState<'plans' | 'payment' | 'success'>('plans');
    const [selectedPlan, setSelectedPlan] = useState<'monthly' | 'semesterly'>('monthly');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const handleSubscribe = async () => {
        if (!stripe || !elements) return;

        setLoading(true);
        setError(null);

        const cardElement = elements.getElement(CardElement);
        if (!cardElement) return;

        // In a real app, you would create a PaymentMethod or confirm a PaymentIntent here
        const { error: stripeError, paymentMethod } = await stripe.createPaymentMethod({
            type: 'card',
            card: cardElement as any,
        });

        if (stripeError) {
            setError(stripeError.message || 'An error occurred');
            setLoading(false);
        } else {
            console.log('PaymentMethod Created:', paymentMethod);
            // Simulate server-side processing delay
            await new Promise(resolve => setTimeout(resolve, 1500));
            setLoading(false);
            setStep('success');
        }
    };

    // If user is already pro, show subscription management view
    if (isPro) {
        return (
            <div className="fixed inset-0 z-[250] flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm animate-in fade-in duration-200">
                <div className="bg-white rounded-2xl w-full max-w-lg overflow-hidden shadow-2xl scale-100 animate-in zoom-in-95 duration-200">
                    <div className="relative h-32 bg-gradient-to-br from-indigo-600 to-violet-600 overflow-hidden">
                        <div className="absolute inset-0 opacity-20">
                            <div className="absolute top-0 left-0 w-64 h-64 bg-white rounded-full mix-blend-overlay filter blur-3xl -translate-x-1/2 -translate-y-1/2"></div>
                            <div className="absolute bottom-0 right-0 w-64 h-64 bg-indigo-300 rounded-full mix-blend-overlay filter blur-3xl translate-x-1/2 translate-y-1/2"></div>
                        </div>
                        <button onClick={onClose} className="absolute top-4 right-4 p-2 bg-white/10 hover:bg-white/20 text-white rounded-full transition-colors backdrop-blur-sm z-50">
                            <Icons.Close className="w-5 h-5" />
                        </button>
                        <div className="relative z-10 flex flex-col items-center justify-center h-full text-white">
                            <div className="p-2 bg-white/20 rounded-full mb-2 backdrop-blur-sm">
                                <Icons.Check className="w-6 h-6 text-white" />
                            </div>
                            <h2 className="text-2xl font-black uppercase tracking-widest">Your Subscription</h2>
                            <p className="text-indigo-100 text-sm font-medium">Pro Member</p>
                        </div>
                    </div>
                    <div className="p-6">
                        <div className="text-center space-y-4">
                            <div className="p-4 bg-indigo-50 rounded-xl border border-indigo-100">
                                <p className="text-sm text-indigo-900 font-medium">Current Plan</p>
                                <p className="text-2xl font-black text-indigo-600">Pro Monthly</p>
                                <p className="text-xs text-indigo-400 mt-1">Next billing date: Feb 26, 2026</p>
                            </div>
                            <button className="w-full py-3 border-2 border-slate-100 text-slate-500 font-bold rounded-xl hover:bg-slate-50 transition-colors text-sm uppercase tracking-wide">
                                Manage Payment Method
                            </button>
                            <button className="w-full py-3 text-red-500 hover:text-red-600 font-bold text-xs uppercase tracking-wide">
                                Cancel Subscription
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="fixed inset-0 z-[250] flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm animate-in fade-in duration-200">
            <div className="bg-white rounded-2xl w-full max-w-lg overflow-hidden shadow-2xl scale-100 animate-in zoom-in-95 duration-200">
                {/* Header */}
                <div className="relative h-32 bg-gradient-to-br from-indigo-600 to-violet-600 overflow-hidden">
                    <div className="absolute inset-0 opacity-20">
                        <div className="absolute top-0 left-0 w-64 h-64 bg-white rounded-full mix-blend-overlay filter blur-3xl -translate-x-1/2 -translate-y-1/2"></div>
                        <div className="absolute bottom-0 right-0 w-64 h-64 bg-indigo-300 rounded-full mix-blend-overlay filter blur-3xl translate-x-1/2 translate-y-1/2"></div>
                    </div>

                    <button
                        onClick={onClose}
                        className="absolute top-4 right-4 p-2 bg-white/10 hover:bg-white/20 text-white rounded-full transition-colors backdrop-blur-sm z-50"
                    >
                        <Icons.Close className="w-5 h-5" />
                    </button>

                    <div className="relative z-10 flex flex-col items-center justify-center h-full text-white">
                        <div className="p-2 bg-white/20 rounded-full mb-2 backdrop-blur-sm">
                            <Icons.Lightning className="w-6 h-6 text-yellow-300" />
                        </div>
                        <h2 className="text-2xl font-black uppercase tracking-widest">Upgrade to Pro</h2>
                        <p className="text-indigo-100 text-sm font-medium">Unlock the full potential of your vocabulary</p>
                    </div>
                </div>

                {/* Content */}
                <div className="p-6">
                    {step === 'plans' && (
                        <div className="space-y-6">
                            {/* Features Grid */}
                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-3">
                                    <div className="flex items-center gap-2 text-sm text-gray-600">
                                        <div className="p-1 rounded-full bg-green-100 text-green-600"><Icons.Check className="w-3 h-3" /></div>
                                        <span>Unlimited Custom Lists</span>
                                    </div>
                                    <div className="flex items-center gap-2 text-sm text-gray-600">
                                        <div className="p-1 rounded-full bg-green-100 text-green-600"><Icons.Check className="w-3 h-3" /></div>
                                        <span>Advanced Stats & Analytics</span>
                                    </div>
                                    <div className="flex items-center gap-2 text-sm text-gray-600">
                                        <div className="p-1 rounded-full bg-green-100 text-green-600"><Icons.Check className="w-3 h-3" /></div>
                                        <span>Priority Cloud Sync</span>
                                    </div>
                                </div>
                                <div className="space-y-3">
                                    <div className="flex items-center gap-2 text-sm text-gray-600">
                                        <div className="p-1 rounded-full bg-green-100 text-green-600"><Icons.Check className="w-3 h-3" /></div>
                                        <span>Smart Review Algorithm</span>
                                    </div>
                                    <div className="flex items-center gap-2 text-sm text-gray-600">
                                        <div className="p-1 rounded-full bg-green-100 text-green-600"><Icons.Check className="w-3 h-3" /></div>
                                        <span>Export to PDF/Anki</span>
                                    </div>
                                    <div className="flex items-center gap-2 text-sm text-gray-600">
                                        <div className="p-1 rounded-full bg-green-100 text-green-600"><Icons.Check className="w-3 h-3" /></div>
                                        <span>Support Development</span>
                                    </div>
                                </div>
                            </div>

                            {/* Plan Selection */}
                            <div className="grid grid-cols-2 gap-4 pt-4 border-t border-gray-100">
                                <button
                                    onClick={() => setSelectedPlan('monthly')}
                                    className={`relative p-4 rounded-xl border-2 transition-all duration-200 text-left cursor-pointer group
                                        ${selectedPlan === 'monthly'
                                            ? 'border-indigo-600 bg-indigo-50 shadow-md transform scale-[1.02]'
                                            : 'border-gray-200 hover:border-indigo-200 hover:bg-gray-50'
                                        }`}
                                >
                                    {selectedPlan === 'monthly' && (
                                        <div className="absolute -top-3 -right-3 bg-indigo-600 text-white p-1 rounded-full shadow-lg">
                                            <Icons.Check className="w-4 h-4" />
                                        </div>
                                    )}
                                    <div className="text-xs font-black text-gray-400 uppercase tracking-widest mb-1">Monthly</div>
                                    <div className="flex items-baseline gap-1">
                                        <span className="text-2xl font-black text-gray-900">$6.99</span>
                                        <span className="text-gray-500 text-sm">/mo</span>
                                    </div>
                                </button>

                                <button
                                    onClick={() => setSelectedPlan('semesterly')}
                                    className={`relative p-4 rounded-xl border-2 transition-all duration-200 text-left cursor-pointer group
                                        ${selectedPlan === 'semesterly'
                                            ? 'border-indigo-600 bg-indigo-50 shadow-md transform scale-[1.02]'
                                            : 'border-gray-200 hover:border-indigo-200 hover:bg-gray-50'
                                        }`}
                                >
                                    <div className="absolute -top-2.5 left-1/2 -translate-x-1/2 bg-gradient-to-r from-amber-500 to-orange-500 text-white px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wide shadow-sm whitespace-nowrap">
                                        Save 28%
                                    </div>
                                    {selectedPlan === 'semesterly' && (
                                        <div className="absolute -top-3 -right-3 bg-indigo-600 text-white p-1 rounded-full shadow-lg">
                                            <Icons.Check className="w-4 h-4" />
                                        </div>
                                    )}
                                    <div className="text-xs font-black text-gray-400 uppercase tracking-widest mb-1">Semesterly</div>
                                    <div className="flex items-baseline gap-1">
                                        <span className="text-2xl font-black text-gray-900">$29.99</span>
                                        <span className="text-gray-500 text-sm">/6mo</span>
                                    </div>
                                </button>
                            </div>

                            <button
                                onClick={() => setStep('payment')}
                                className="w-full py-4 bg-indigo-600 text-white font-black rounded-xl hover:bg-indigo-700 transition-all shadow-lg shadow-indigo-200 uppercase tracking-widest text-sm flex items-center justify-center gap-2 group"
                            >
                                Continue to Checkout <Icons.ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                            </button>
                        </div>
                    )}

                    {step === 'payment' && (
                        <div className="space-y-6 animate-in slide-in-from-right-8 duration-300">
                            <div className="text-center mb-6">
                                <h3 className="text-lg font-bold text-gray-900">Payment Details</h3>
                                <p className="text-sm text-gray-500">Secure transaction via Stripe</p>
                            </div>

                            {/* Real Stripe Card Element */}
                            <div className="space-y-4">
                                <div className="p-4 border-2 border-gray-100 rounded-xl focus-within:border-indigo-500 transition-all bg-gray-50/50">
                                    <CardElement
                                        options={{
                                            style: {
                                                base: {
                                                    fontSize: '16px',
                                                    color: '#1e293b',
                                                    '::placeholder': {
                                                        color: '#94a3b8',
                                                    },
                                                    fontFamily: 'Outfit, sans-serif',
                                                },
                                                invalid: {
                                                    color: '#ef4444',
                                                },
                                            },
                                        }}
                                    />
                                </div>
                                {error && (
                                    <div className="text-xs font-bold text-red-500 flex items-center gap-1 bg-red-50 p-2 rounded-lg animate-in fade-in slide-in-from-top-1">
                                        <Icons.Alert className="w-3 h-3" /> {error}
                                    </div>
                                )}
                            </div>

                            <div className="pt-4 space-y-3">
                                <button
                                    onClick={handleSubscribe}
                                    disabled={loading || !stripe}
                                    className="w-full py-4 bg-indigo-600 text-white font-black rounded-xl hover:bg-indigo-700 transition-all shadow-lg shadow-indigo-200 uppercase tracking-widest text-sm flex items-center justify-center gap-2 disabled:opacity-70 disabled:cursor-not-allowed"
                                >
                                    {loading ? (
                                        <>
                                            <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                                            Processing...
                                        </>
                                    ) : (
                                        <>Pay ${selectedPlan === 'monthly' ? '6.99' : '29.99'}</>
                                    )}
                                </button>
                                <button
                                    onClick={() => setStep('plans')}
                                    disabled={loading}
                                    className="w-full py-2 text-gray-400 hover:text-gray-600 font-bold text-xs uppercase tracking-wider transition-colors"
                                >
                                    Back to Plans
                                </button>
                            </div>
                        </div>
                    )}

                    {step === 'success' && (
                        <div className="py-8 text-center space-y-6 animate-in zoom-in-95 duration-300">
                            <div className="relative inline-block">
                                <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto text-green-600 relative z-10">
                                    <Icons.Check className="w-10 h-10" />
                                </div>
                                <div className="absolute inset-0 bg-green-400 rounded-full animate-ping opacity-20"></div>
                            </div>

                            <div className="space-y-2">
                                <h3 className="text-2xl font-black text-gray-900">Welcome to Pro!</h3>
                                <p className="text-gray-500 max-w-xs mx-auto">Your subscription is active. You now have access to all premium features.</p>
                            </div>

                            <button
                                onClick={() => {
                                    onUpgrade();
                                    onClose();
                                }}
                                className="w-full py-4 bg-indigo-600 text-white font-black rounded-xl hover:bg-indigo-700 transition-all shadow-lg shadow-indigo-200 uppercase tracking-widest text-sm"
                            >
                                Get Started
                            </button>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default PaymentModal;
