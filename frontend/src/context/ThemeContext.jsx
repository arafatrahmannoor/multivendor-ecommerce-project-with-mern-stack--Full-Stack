import { createContext, useEffect, useMemo, useRef, useState } from 'react';

const ThemeContext = createContext({ theme: 'light', toggleTheme: () => { } });

export const ThemeProvider = ({ children }) => {
    // Determine initial theme: localStorage > system preference
    const getInitialTheme = () => {
        const saved = localStorage.getItem('theme');
        if (saved === 'light' || saved === 'dark') return saved;
        return window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches
            ? 'dark'
            : 'light';
    };

    const [theme, setTheme] = useState(getInitialTheme);
    // Track if user explicitly chose a theme (so we don't override with system changes)
    const userSetRef = useRef(Boolean(localStorage.getItem('theme')));

    useEffect(() => {
        const root = document.documentElement;
        // Smooth transition for color changes
        root.classList.add('transition-colors');
        root.style.transitionProperty = 'background-color,color,fill,stroke,border-color';
        root.style.transitionDuration = '200ms';

        if (theme === 'dark') {
            root.classList.add('dark');
        } else {
            root.classList.remove('dark');
        }
        // Only persist when user explicitly chooses; otherwise let system preference drive
        if (userSetRef.current) {
            localStorage.setItem('theme', theme);
        }
    }, [theme]);

    const toggleTheme = () => {
        userSetRef.current = true;
        setTheme((t) => {
            const next = t === 'dark' ? 'light' : 'dark';
            // Persist immediately for cross-tab sync
            try { localStorage.setItem('theme', next); } catch { /* ignore */ }
            return next;
        });
    };

    // Sync across tabs
    useEffect(() => {
        const onStorage = (e) => {
            if (e.key === 'theme' && (e.newValue === 'light' || e.newValue === 'dark')) {
                userSetRef.current = true;
                if (e.newValue !== theme) setTheme(e.newValue);
            }
        };
        window.addEventListener('storage', onStorage);
        return () => window.removeEventListener('storage', onStorage);
    }, [theme]);

    // Respond to system theme changes only if user hasn't explicitly chosen
    useEffect(() => {
        const mq = window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)');
        if (!mq || userSetRef.current) return;
        const handler = (e) => {
            if (!userSetRef.current) setTheme(e.matches ? 'dark' : 'light');
        };
        try {
            mq.addEventListener('change', handler);
            return () => mq.removeEventListener('change', handler);
        } catch {
            // Safari fallback
            mq.addListener && mq.addListener(handler);
            return () => mq.removeListener && mq.removeListener(handler);
        }
    }, []);

    // Keyboard shortcut: Shift+D to toggle theme
    useEffect(() => {
        const onKey = (e) => {
            if (e.shiftKey && (e.key === 'D' || e.key === 'd')) {
                e.preventDefault();
                toggleTheme();
            }
        };
        window.addEventListener('keydown', onKey);
        return () => window.removeEventListener('keydown', onKey);
    }, []);

    const value = useMemo(() => ({ theme, toggleTheme }), [theme]);

    return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
};

export default ThemeContext;
