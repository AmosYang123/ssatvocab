import React from "react";
import { motion } from "framer-motion";
import { Hero } from "@/components/ui/animated-hero";
import { StickyNav } from "@/components/ui/StickyNav";
import { Button } from "@/components/ui/button";
import {
    BookOpen,
    Trophy,
    Brain,
    Sparkles,
} from "lucide-react";

function MethodStep({ number, title, description }: { number: string, title: string, description: string }) {
    return (
        <motion.div
            className="flex flex-col md:flex-row gap-6 items-center"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
        >
            <div className="text-4xl md:text-5xl font-bold text-indigo-100 leading-none">{number}</div>
            <div className="flex-1 text-center md:text-left">
                <h4 className="text-lg font-semibold mb-2 text-indigo-600">{title}</h4>
                <p className="text-slate-600 text-sm leading-relaxed">{description}</p>
            </div>
        </motion.div>
    );
}

function LandingPage() {
    return (
        <div className="min-h-screen bg-[#fafaf8] selection:bg-indigo-100 selection:text-indigo-900 font-['Inter']">
            {/* Sticky Navigation */}
            <StickyNav />

            {/* Hero Section */}
            <section id="hero">
                <Hero />
            </section>

            {/* Trust Bar */}
            <div className="bg-white border-b border-slate-100 py-4 overflow-hidden">
                <div className="container mx-auto px-4 flex flex-wrap justify-center items-center gap-x-8 gap-y-3">
                    <span className="text-slate-500 font-semibold tracking-wide text-xs uppercase">Evidence-Based Learning</span>
                    <span className="text-slate-500 font-semibold tracking-wide text-xs uppercase">Curated Vocabulary</span>
                    <span className="text-slate-500 font-semibold tracking-wide text-xs uppercase">Adaptive Practice</span>
                    <span className="text-slate-500 font-semibold tracking-wide text-xs uppercase">625+ Words</span>
                </div>
            </div>

            {/* Features Section */}
            <section id="features" className="py-20 bg-white relative">
                <div className="container mx-auto px-4 text-center mb-16">
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                    >
                        <h2 className="text-3xl md:text-4xl font-bold text-slate-900 mb-4 tracking-tight">
                            Built for SSAT Success
                        </h2>
                        <p className="text-base text-slate-600 max-w-xl mx-auto">
                            A rigorous vocabulary system designed to help you master the verbal section.
                        </p>
                    </motion.div>
                </div>

                <div className="container mx-auto px-4 grid grid-cols-1 md:grid-cols-3 gap-8">
                    <FeatureCard
                        icon={<Brain className="w-5 h-5 text-indigo-600" />}
                        iconBg="bg-indigo-50"
                        title="Adaptive Learning"
                        description="Our algorithm surfaces words at optimal intervals based on your retention patterns."
                        delay={0}
                    />
                    <FeatureCard
                        icon={<Trophy className="w-5 h-5 text-amber-600" />}
                        iconBg="bg-amber-50"
                        title="Test Simulation"
                        description="Practice with timed assessments that mirror the actual SSAT format."
                        delay={0.1}
                    />
                    <FeatureCard
                        icon={<Sparkles className="w-5 h-5 text-violet-600" />}
                        iconBg="bg-violet-50"
                        title="AI-Enhanced"
                        description="Import reading materials and let AI extract high-frequency vocabulary."
                        delay={0.2}
                    />
                </div>
            </section>

            {/* Methodology Section */}
            <section id="methodology" className="py-20 bg-slate-50 border-y border-slate-100">
                <div className="container mx-auto px-4">
                    <div className="max-w-3xl mx-auto">
                        <h2 className="text-2xl md:text-3xl font-bold mb-12 text-center tracking-tight text-slate-900">How It Works</h2>

                        <div className="space-y-12">
                            <MethodStep
                                number="01"
                                title="Study"
                                description="Browse flashcards with definitions, examples, and synonyms. Mark words as mastered or needs review."
                            />
                            <MethodStep
                                number="02"
                                title="Practice"
                                description="Our spaced repetition system reminds you of words just as they begin to fade from memory."
                            />
                            <MethodStep
                                number="03"
                                title="Test"
                                description="Take timed quizzes that simulate the pressure of the actual SSAT verbal section."
                            />
                        </div>
                    </div>
                </div>
            </section>

            {/* Stats Section */}
            <section id="stats" className="py-16 bg-white border-b border-slate-100">
                <div className="container mx-auto px-4 grid grid-cols-2 lg:grid-cols-4 gap-8 text-center">
                    <StatItem label="Vocabulary Words" value="625+" />
                    <StatItem label="Practice Questions" value="5,000+" />
                    <StatItem label="Study Modes" value="3" />
                    <StatItem label="Theme Options" value="7" />
                </div>
            </section>

            {/* CTA Section */}
            <section className="py-20 bg-indigo-600 text-center">
                <div className="container mx-auto px-4 max-w-2xl">
                    <h2 className="text-3xl md:text-4xl font-bold text-white mb-4 tracking-tight">Ready to start?</h2>
                    <p className="text-white/90 mb-10 text-base font-medium">Join students mastering SSAT vocabulary with our precision tools.</p>
                    <div className="flex flex-col sm:flex-row gap-4 justify-center">
                        <Button size="lg" className="bg-white hover:bg-white/90 text-indigo-600 px-8 h-12 rounded-xl font-bold text-sm shadow-xl transition-all active:scale-95" onClick={() => window.location.href = '/signup'}>
                            Create Free Account
                        </Button>
                        <Button size="lg" variant="ghost" className="border-2 border-white/30 text-white hover:bg-white hover:text-indigo-600 px-8 h-12 rounded-xl font-bold text-sm transition-all active:scale-95" onClick={() => window.location.href = '/signin'}>
                            Login
                        </Button>
                    </div>
                </div>
            </section>

            {/* Footer */}
            <footer className="py-10 bg-slate-900">
                <div className="container mx-auto px-4">
                    <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-6">
                        <div className="flex items-center gap-2">
                            <div className="w-7 h-7 bg-indigo-600 rounded-lg flex items-center justify-center">
                                <BookOpen className="w-4 h-4 text-white" />
                            </div>
                            <span className="text-base font-bold text-white">SSAT Mastery</span>
                        </div>

                        <div className="flex flex-wrap gap-6">
                            <a href="#features" className="text-slate-400 hover:text-white transition-colors text-sm">Features</a>
                            <a href="#methodology" className="text-slate-400 hover:text-white transition-colors text-sm">How It Works</a>
                            <a href="/signin" className="text-slate-400 hover:text-white transition-colors text-sm">Login</a>
                            <a href="/signup" className="text-slate-400 hover:text-white transition-colors text-sm">Sign Up</a>
                        </div>
                    </div>

                    <div className="mt-8 pt-6 border-t border-slate-800 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                        <p className="text-slate-500 text-xs">
                            © 2026 SSAT Vocab Mastery. All rights reserved.
                        </p>
                        <div className="flex gap-4">
                            <a href="#" className="text-slate-500 hover:text-slate-300 text-xs">Privacy Policy</a>
                            <a href="#" className="text-slate-500 hover:text-slate-300 text-xs">Terms of Service</a>
                        </div>
                    </div>
                </div>
            </footer>
        </div>
    );
}

function FeatureCard({ icon, title, description, delay, iconBg = "bg-slate-50" }: { icon: React.ReactNode, title: string, description: string, delay: number, iconBg?: string }) {
    return (
        <motion.div
            className="p-6 rounded-xl bg-white border border-slate-100 hover:border-slate-200 hover:shadow-md transition-all"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay }}
        >
            <div className={`w-10 h-10 ${iconBg} rounded-lg flex items-center justify-center mb-4`}>
                {icon}
            </div>
            <h4 className="text-lg font-semibold text-slate-900 mb-2">{title}</h4>
            <p className="text-slate-600 text-sm leading-relaxed">{description}</p>
        </motion.div>
    );
}

function StatItem({ label, value }: { label: string, value: string }) {
    return (
        <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
        >
            <div className="text-3xl md:text-4xl font-bold text-indigo-600 mb-1">{value}</div>
            <div className="text-slate-500 text-xs font-medium uppercase tracking-wide">{label}</div>
        </motion.div>
    );
}

export default LandingPage;
