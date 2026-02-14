import React from 'react';

const StatusBar = ({ dark = false, notch = false }) => (
    <div className={`px-8 pt-4 pb-2 flex justify-between items-center text-[10px] font-black tracking-widest uppercase ${dark ? 'text-white/40' : 'text-slate-400 dark:text-white/20'}`}>
        <div className="flex items-center gap-2">
            <div className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse"></div>
            <span>Base Mainnet</span>
        </div>
        <div className="flex items-center gap-3">
            <div className="flex items-center gap-1">
                <span className="material-icons text-[12px]">sensors</span>
                <span>Live</span>
            </div>
            <div className="h-3 w-px bg-slate-200 dark:bg-white/10"></div>
            <span>v1.0.4</span>
        </div>
    </div>
);

export default StatusBar;
