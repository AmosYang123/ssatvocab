import React from 'react';
import { Sun, Moon, Monitor } from 'lucide-react';
import { ThemeMode } from '../../types';

interface ToggleThemeProps {
    theme: ThemeMode;
    onThemeChange: (theme: ThemeMode) => void;
}

export function ToggleTheme({ theme, onThemeChange }: ToggleThemeProps) {
    // Simple cycle through light -> dark -> system themes
    const themeOptions: { id: ThemeMode; icon: typeof Sun; label: string }[] = [
        { id: 'light', icon: Sun, label: 'Light' },
        { id: 'dark', icon: Moon, label: 'Dark' },
    ];

    const currentIndex = themeOptions.findIndex(t => t.id === theme);
    const activeTheme = currentIndex >= 0 ? themeOptions[currentIndex] : themeOptions[0];

    const cycleTheme = () => {
        const nextIndex = (currentIndex + 1) % themeOptions.length;
        onThemeChange(themeOptions[nextIndex].id);
    };

    return (
        <button
            onClick={cycleTheme}
            className="flex items-center gap-1.5 h-8 px-3 rounded-lg bg-slate-100 hover:bg-slate-200 transition-all text-slate-600 text-xs font-medium"
            title={`Theme: ${activeTheme.label}`}
        >
            <activeTheme.icon className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">{activeTheme.label}</span>
        </button>
    );
}

export default ToggleTheme;
