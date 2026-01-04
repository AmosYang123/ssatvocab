import React, { useState, useEffect, useCallback } from 'react';
import { BookOpen, Menu, X } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface NavItem {
    id: string;
    label: string;
}

const navItems: NavItem[] = [
    { id: 'hero', label: 'Home' },
    { id: 'features', label: 'Features' },
    { id: 'methodology', label: 'How It Works' },
    { id: 'stats', label: 'Stats' },
];

export function StickyNav() {
    const [activeSection, setActiveSection] = useState('hero');
    const [isMenuOpen, setIsMenuOpen] = useState(false);
    const [isScrolled, setIsScrolled] = useState(false);

    useEffect(() => {
        const handleScroll = () => {
            setIsScrolled(window.scrollY > 20);

            // Find active section
            const sections = navItems.map(item => document.getElementById(item.id)).filter(Boolean);
            const scrollPosition = window.scrollY + 100;

            for (let i = sections.length - 1; i >= 0; i--) {
                const section = sections[i];
                if (section && section.offsetTop <= scrollPosition) {
                    setActiveSection(navItems[i].id);
                    break;
                }
            }
        };

        window.addEventListener('scroll', handleScroll, { passive: true });
        handleScroll();
        return () => window.removeEventListener('scroll', handleScroll);
    }, []);

    const scrollToSection = useCallback((id: string) => {
        const element = document.getElementById(id);
        if (element) {
            const offset = id === 'hero' ? 0 : element.offsetTop - 64;
            window.scrollTo({ top: offset, behavior: 'smooth' });
        }
        setIsMenuOpen(false);
    }, []);

    return (
        <nav className={`fixed top-0 w-full z-50 transition-all duration-300 ${isScrolled ? 'bg-white/95 backdrop-blur-lg shadow-sm border-b border-slate-100' : 'bg-transparent'
            }`}>
            <div className="container mx-auto px-4 h-16 flex items-center justify-between">
                {/* Logo */}
                <button
                    onClick={() => scrollToSection('hero')}
                    className="flex items-center gap-2 hover:opacity-80 transition-opacity"
                >
                    <div className="w-8 h-8 bg-indigo-600 rounded-lg flex items-center justify-center">
                        <BookOpen className="w-4 h-4 text-white" />
                    </div>
                    <span className="text-lg font-bold text-slate-900 tracking-tight">SSAT Mastery</span>
                </button>

                {/* Desktop Navigation */}
                <div className="hidden md:flex items-center gap-1">
                    {navItems.map((item) => (
                        <button
                            key={item.id}
                            onClick={() => scrollToSection(item.id)}
                            className={`px-3 py-2 rounded-lg text-sm font-medium transition-all ${activeSection === item.id
                                    ? 'text-indigo-600 bg-indigo-50'
                                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
                                }`}
                        >
                            {item.label}
                        </button>
                    ))}
                </div>

                {/* Auth Buttons */}
                <div className="hidden md:flex items-center gap-3">
                    <Button variant="ghost" className="font-semibold text-slate-600 hover:text-slate-900 text-sm h-9" onClick={() => window.location.href = '/signin'}>
                        Login
                    </Button>
                    <Button className="font-semibold bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg px-4 h-9 text-sm" onClick={() => window.location.href = '/signup'}>
                        Sign Up
                    </Button>
                </div>

                {/* Mobile Menu Button */}
                <button
                    onClick={() => setIsMenuOpen(!isMenuOpen)}
                    className="md:hidden p-2 rounded-lg hover:bg-slate-100 transition-colors"
                >
                    {isMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
                </button>
            </div>

            {/* Mobile Menu */}
            {isMenuOpen && (
                <div className="md:hidden bg-white border-t border-slate-100 shadow-lg">
                    <div className="container mx-auto px-4 py-4 space-y-2">
                        {navItems.map((item) => (
                            <button
                                key={item.id}
                                onClick={() => scrollToSection(item.id)}
                                className={`w-full text-left px-4 py-3 rounded-lg text-sm font-medium transition-all ${activeSection === item.id
                                        ? 'text-indigo-600 bg-indigo-50'
                                        : 'text-slate-600 hover:bg-slate-50'
                                    }`}
                            >
                                {item.label}
                            </button>
                        ))}
                        <div className="pt-4 border-t border-slate-100 flex flex-col gap-2">
                            <Button variant="outline" className="w-full justify-center" onClick={() => window.location.href = '/signin'}>
                                Login
                            </Button>
                            <Button className="w-full justify-center bg-indigo-600 hover:bg-indigo-700" onClick={() => window.location.href = '/signup'}>
                                Sign Up
                            </Button>
                        </div>
                    </div>
                </div>
            )}
        </nav>
    );
}
