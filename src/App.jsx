import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, useLocation, useNavigate } from 'react-router-dom';
import HomePage from './pages/HomePage';
import CheckInPage from './pages/CheckInPage';
import GMPage from './pages/GMPage';
import DeployPage from './pages/DeployPage';
import SettingsPage from './pages/SettingsPage';
import TabBar from './components/TabBar';
import MintPage from './pages/MintPage';

const AppContent = () => {
    const [isDark, setIsDark] = useState(false);
    const navigate = useNavigate();
    const location = useLocation();
    const routes = ['/', '/checkin', '/gm', '/settings'];
    const currentIndex = routes.indexOf(location.pathname);
    const [touchX, setTouchX] = useState(null);
    const handleTouchStart = (e) => {
        const t = e.changedTouches?.[0] || e.touches?.[0];
        if (t) setTouchX(t.clientX);
    };
    const handleTouchEnd = (e) => {
        const t = e.changedTouches?.[0] || e.touches?.[0];
        if (!t || touchX === null) return;
        const dx = t.clientX - touchX;
        const threshold = 50;
        if (dx < -threshold && currentIndex < routes.length - 1) {
            navigate(routes[currentIndex + 1]);
        } else if (dx > threshold && currentIndex > 0) {
            navigate(routes[currentIndex - 1]);
        }
        setTouchX(null);
    };

    useEffect(() => {
        if (isDark) {
            document.documentElement.classList.add('dark');
            document.documentElement.classList.remove('light');
        } else {
            document.documentElement.classList.add('light');
            document.documentElement.classList.remove('dark');
        }
    }, [isDark]);

    return (
        <div 
            className="app-container relative h-full w-full overflow-hidden bg-slate-50 dark:bg-slate-950 transition-colors duration-300"
            onTouchStart={handleTouchStart}
            onTouchEnd={handleTouchEnd}
        >
                {/* Dark Mode Toggle */}
                <button 
                    onClick={() => setIsDark(!isDark)}
                    className="fixed top-24 right-0 z-[100] bg-white/80 dark:bg-slate-900/80 backdrop-blur-md border border-slate-200 dark:border-white/10 shadow-xl p-2.5 rounded-l-2xl flex items-center gap-2 group transition-all hover:pl-4 active:scale-95"
                >
                    <div className="w-8 h-8 rounded-full bg-primary/10 dark:bg-primary/20 flex items-center justify-center transition-colors">
                        <span className="material-icons text-primary text-lg">
                            {isDark ? 'light_mode' : 'dark_mode'}
                        </span>
                    </div>
                </button>

                <Routes>
                    <Route path="/" element={<HomePage />} />
                    <Route path="/checkin" element={<CheckInPage />} />
                    <Route path="/gm" element={<GMPage />} />
                    <Route path="/mint" element={<MintPage />} />
                    <Route path="/deploy" element={<DeployPage />} />
                    <Route path="/settings" element={<SettingsPage />} />
                </Routes>
                
                <TabBar />
                
                {/* iOS Indicator Bar */}
                <div className="absolute bottom-1.5 left-1/2 -translate-x-1/2 w-32 h-1 bg-slate-200 dark:bg-slate-800 rounded-full z-[70]"></div>
        </div>
    );
};

const App = () => (
    <Router>
        <AppContent />
    </Router>
);

export default App;
