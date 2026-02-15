import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';

const TabBar = () => {
    const location = useLocation();
    const navigate = useNavigate();
    const isActive = (path) => location.pathname === path;
    const routes = ['/', '/checkin', '/gm', '/settings'];
    const containerRef = useRef(null);
    const btnRefs = [useRef(null), useRef(null), useRef(null), useRef(null)];
    const [ringLeft, setRingLeft] = useState('50%');
    const [ringSize, setRingSize] = useState(52);
    const [pillLeft, setPillLeft] = useState(0);
    const [pillWidth, setPillWidth] = useState(100);
    const pillHeight = 56;
    const [touchX, setTouchX] = useState(null);
    const currentIndex = routes.indexOf(location.pathname);
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
        const updateRing = () => {
            const c = containerRef.current;
            const b = btnRefs[currentIndex]?.current;
            if (!c || !b) return;
            const cr = c.getBoundingClientRect();
            const br = b.getBoundingClientRect();
            const center = br.left + br.width / 2 - cr.left;
            setRingLeft(center);
            setRingSize(Math.min(48, Math.max(40, br.width * 0.6)));
            setPillLeft(br.left - cr.left + 4);
            setPillWidth(Math.max(80, br.width - 8));
        };
        updateRing();
        window.addEventListener('resize', updateRing);
        return () => window.removeEventListener('resize', updateRing);
    }, [currentIndex]);
    return (
        <nav
            className="fixed bottom-4 left-1/2 -translate-x-1/2 w-[92%] sm:w-[85%] max-w-[720px] h-16 glass-effect dark:bg-surface-dark/90 rounded-full flex items-center justify-around px-2 ios-shadow border border-slate-200 dark:border-white/5 z-50"
            onTouchStart={handleTouchStart}
            onTouchEnd={handleTouchEnd}
            ref={containerRef}
        >
            <div
                className="absolute top-1/2 -translate-y-1/2 pointer-events-none z-0"
                style={{ left: pillLeft, width: pillWidth, height: 48, transition: 'left 300ms cubic-bezier(0.22, 1, 0.36, 1), width 200ms ease' }}
            >
                <div className="w-full h-full rounded-full bg-gradient-to-br from-primary/20 to-blue-600/10 border border-primary/20 shadow-[0_0_15px_rgba(59,130,246,0.15)]" />
            </div>
            {/* center ring removed by request */}
            <button ref={btnRefs[0]} onClick={() => navigate('/')} className={`relative z-10 flex flex-col items-center flex-1 transition-all duration-300 ${isActive('/') ? 'text-white scale-105' : 'text-text-muted hover:text-text-secondary'}`}>
                <span className={`material-icons text-xl transition-colors ${isActive('/') ? 'text-primary drop-shadow-[0_0_8px_rgba(59,130,246,0.5)]' : ''}`}>home</span>
                <span className="text-[9px] font-bold mt-0.5 uppercase tracking-tighter">Home</span>
            </button>
            <button ref={btnRefs[1]} onClick={() => navigate('/checkin')} className={`relative z-10 flex flex-col items-center flex-1 transition-all duration-300 ${isActive('/checkin') ? 'text-white scale-105' : 'text-text-muted hover:text-text-secondary'}`}>
                <span className={`material-icons text-xl transition-colors ${isActive('/checkin') ? 'text-primary drop-shadow-[0_0_8px_rgba(59,130,246,0.5)]' : ''}`}>calendar_today</span>
                <span className="text-[9px] font-bold mt-0.5 uppercase tracking-tighter">Check-In</span>
            </button>
            <button ref={btnRefs[2]} onClick={() => navigate('/gm')} className={`relative z-10 flex flex-col items-center flex-1 transition-all duration-300 ${isActive('/gm') ? 'text-white scale-105' : 'text-text-muted hover:text-text-secondary'}`}>
                <span className={`material-icons text-xl transition-colors ${isActive('/gm') ? 'text-primary drop-shadow-[0_0_8px_rgba(59,130,246,0.5)]' : ''}`}>bolt</span>
                <span className="text-[9px] font-bold mt-0.5 uppercase tracking-tighter">Send GM</span>
            </button>
            <button ref={btnRefs[3]} onClick={() => navigate('/settings')} className={`relative z-10 flex flex-col items-center flex-1 transition-all duration-300 ${isActive('/settings') ? 'text-white scale-105' : 'text-text-muted hover:text-text-secondary'}`}>
                <span className={`material-icons text-xl transition-colors ${isActive('/settings') ? 'text-primary drop-shadow-[0_0_8px_rgba(59,130,246,0.5)]' : ''}`}>settings</span>
                <span className="text-[9px] font-bold mt-0.5 uppercase tracking-tighter">Settings</span>
            </button>
        </nav>
    );

};

export default TabBar;
