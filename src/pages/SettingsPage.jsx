import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAccount, useDisconnect } from 'wagmi';
import { useUser } from '../context/UserContext';
import StatusBar from '../components/StatusBar';

const SettingsPage = () => {
    const navigate = useNavigate();
    const { address } = useAccount();
    const { disconnect } = useDisconnect();
    const { userName, setUserName } = useUser();
    const [notifications, setNotifications] = useState(true);
    const [isDarkMode, setIsDarkMode] = useState(true);
    const [copied, setCopied] = useState(false);
    const [isEditingName, setIsEditingName] = useState(false);
    const [tempName, setTempName] = useState(userName);

    // Sync dark mode with document class
    useEffect(() => {
        if (isDarkMode) {
            document.documentElement.classList.add('dark');
            document.documentElement.classList.remove('light');
        } else {
            document.documentElement.classList.add('light');
            document.documentElement.classList.remove('dark');
        }
    }, [isDarkMode]);

    const copyAddress = () => {
        if (address) {
            navigator.clipboard.writeText(address);
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
        }
    };

    const avatarUrl = address
        ? `https://api.dicebear.com/7.x/notionists/svg?seed=${address}&backgroundColor=b6e3f4,c0aede,d1d4f9`
        : `https://api.dicebear.com/7.x/notionists/svg?seed=guest&backgroundColor=b6e3f4`;

    const handleSaveName = () => {
        if (tempName.trim()) {
            setUserName(tempName);
            setIsEditingName(false);
        }
    };

    const handleLogOut = () => {
        disconnect();
        navigate('/');
    };

    const SettingItem = ({ icon, label, sublabel, rightElement, onClick, iconColor = "text-primary", bgColor = "bg-primary/10" }) => (
        <div
            onClick={onClick}
            className="flex items-center justify-between p-4 glass-effect dark:bg-surface-dark/60 rounded-3xl active:scale-[0.98] transition-all cursor-pointer border border-white dark:border-white/5"
        >
            <div className="flex items-center gap-4">
                <div className={`w-11 h-11 ${bgColor} rounded-2xl flex items-center justify-center border border-white/10 dark:border-white/5`}>
                    <span className={`material-icons ${iconColor} text-xl`}>{icon}</span>
                </div>
                <div>
                    <p className="text-[15px] font-bold text-slate-900 dark:text-white leading-tight">{label}</p>
                    {sublabel && <p className="text-[11px] font-bold text-slate-400 dark:text-text-muted uppercase tracking-tight mt-0.5">{sublabel}</p>}
                </div>
            </div>
            {rightElement ? rightElement : <span className="material-icons text-slate-300 dark:text-text-muted">chevron_right</span>}
        </div>
    );

    const SectionHeader = ({ title }) => (
        <p className="text-[11px] font-black text-slate-400 dark:text-text-muted uppercase tracking-[0.15em] mb-4 ml-2">{title}</p>
    );

    return (
        <div className="flex flex-col h-full w-full max-w-full bg-background-light dark:bg-background-dark overflow-hidden fixed inset-0">
            {/* Background Orbs */}
            <div className="bg-orb w-80 h-80 bg-primary/20 -top-20 -right-20 animate-pulse"></div>
            <div className="bg-orb w-64 h-64 bg-indigo-500/10 bottom-1/4 -left-32 animate-bounce-slow"></div>

            <StatusBar dark={false} notch={true} />

            {/* Compact Header */}
            <header className="flex items-center justify-between px-6 py-4 bg-transparent z-20 shrink-0">
                <button onClick={() => navigate(-1)} className="w-11 h-11 flex items-center justify-center rounded-2xl bg-white/80 dark:bg-surface-dark/80 backdrop-blur-md text-slate-900 dark:text-white shadow-lg shadow-slate-200/50 dark:shadow-black/20 active:scale-90 transition-all border border-white dark:border-white/10 hover:bg-white dark:hover:bg-surface-dark">
                    <span className="material-icons text-2xl">chevron_left</span>
                </button>
                <div className="w-11"></div>
            </header>

            <main className="flex-1 overflow-y-auto px-6 pb-32">
                <div className="mb-6 pt-2 animate-fade-in-up">
                    <h1 className="text-4xl font-black text-slate-900 dark:text-white tracking-tight">Settings</h1>
                    <p className="text-sm font-bold text-slate-400 dark:text-text-muted mt-1 uppercase tracking-widest">Profile & Configuration</p>
                </div>

                <div className="space-y-6">
                    {/* Profile Card */}
                    <div className="glass-effect dark:bg-surface-dark/40 rounded-[2.5rem] p-6 shadow-2xl border border-white dark:border-white/10 flex items-center gap-5 animate-fade-in-up group relative overflow-hidden">
                        <div className="absolute top-0 right-0 w-32 h-32 bg-primary/5 blur-3xl rounded-full -mr-16 -mt-16 group-hover:bg-primary/10 transition-all duration-700"></div>
                        <div className="relative">
                            <div className="w-20 h-20 rounded-[2rem] overflow-hidden bg-slate-100 dark:bg-background-dark border-4 border-white dark:border-white/10 shadow-lg">
                                <img src={avatarUrl} alt="Avatar" className="w-full h-full object-cover" />
                            </div>
                            <div className="absolute -right-0 -bottom-0 w-6 h-6 bg-green-500 border-4 border-white dark:border-slate-900 rounded-full shadow-md"></div>
                        </div>
                        <div className="flex-1 min-w-0">
                            {isEditingName ? (
                                <div className="flex items-center gap-2 mb-1">
                                    <input
                                        type="text"
                                        value={tempName}
                                        onChange={(e) => setTempName(e.target.value)}
                                        className="bg-slate-100 dark:bg-background-dark/80 border-none rounded-xl px-3 py-1 text-sm font-black text-slate-900 dark:text-white w-full outline-none ring-2 ring-primary/20"
                                        autoFocus
                                        onBlur={handleSaveName}
                                        onKeyDown={(e) => e.key === 'Enter' && handleSaveName()}
                                    />
                                    <button onClick={handleSaveName} className="text-primary active:scale-90 transition-all">
                                        <span className="material-icons text-xl">check</span>
                                    </button>
                                </div>
                            ) : (
                                <div className="flex items-center gap-2 group cursor-pointer" onClick={() => setIsEditingName(true)}>
                                    <h2 className="text-xl font-black text-slate-900 dark:text-white truncate">{userName}</h2>
                                    <span className="material-icons text-slate-300 dark:text-text-muted group-hover:text-primary transition-colors text-sm">edit</span>
                                </div>
                            )}
                            <p className="text-xs font-bold text-slate-400 dark:text-text-muted mb-2">Premium Member</p>
                            <button
                                onClick={copyAddress}
                                className="flex items-center gap-2 px-3 py-1.5 bg-blue-50 dark:bg-blue-500/10 rounded-xl border border-blue-100 dark:border-blue-500/20 active:scale-95 transition-all"
                            >
                                <span className="text-[10px] font-bold text-blue-500 font-mono">
                                    {address ? `${address.slice(0, 6)}...${address.slice(-4)}` : 'Connect Wallet'}
                                </span>
                                <span className="material-icons text-[14px] text-blue-400">{copied ? 'done' : 'content_copy'}</span>
                            </button>
                        </div>
                    </div>

                    {/* Privacy & Security */}
                    <section className="animate-fade-in-up delay-100">
                        <SectionHeader title="Privacy & Security" />
                        <div className="space-y-3">
                            <SettingItem
                                icon="shield"
                                label="Security & Privacy"
                                iconColor="text-blue-500"
                                bgColor="bg-blue-50 dark:bg-blue-500/10"
                            />
                            <SettingItem
                                icon="notifications"
                                label="Notifications"
                                iconColor="text-indigo-500"
                                bgColor="bg-indigo-50 dark:bg-indigo-500/10"
                                rightElement={
                                    <button
                                        onClick={() => setNotifications(!notifications)}
                                        className={`w-12 h-6 rounded-full transition-all duration-300 relative shadow-inner ${notifications ? 'bg-blue-500' : 'bg-slate-200 dark:bg-background-dark'}`}
                                    >
                                        <div className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-all duration-300 shadow-sm ${notifications ? 'left-7' : 'left-1'}`}></div>
                                    </button>
                                }
                            />
                        </div>
                    </section>

                    {/* Web3 Configuration */}
                    <section className="animate-fade-in-up delay-200">
                        <SectionHeader title="Web3 Configuration" />
                        <div className="space-y-3">
                            <SettingItem
                                icon="wallet"
                                label="Wallet Management"
                                sublabel="2 Wallets Connected"
                                iconColor="text-orange-500"
                                bgColor="bg-orange-50 dark:bg-orange-500/10"
                            />
                            <SettingItem
                                icon="account_tree"
                                label="Network Selection"
                                iconColor="text-purple-500"
                                bgColor="bg-purple-50 dark:bg-purple-500/10"
                                rightElement={
                                    <div className="flex items-center gap-2 bg-slate-100 dark:bg-background-dark/80 px-3 py-1.5 rounded-xl border border-slate-200 dark:border-white/5 shadow-inner">
                                        <div className="w-4 h-4 rounded-full bg-emerald-400 shadow-[0_0_8px_rgba(52,211,153,0.55)]"></div>
                                        <span className="text-[10px] font-black text-slate-700 dark:text-text-secondary uppercase">Ethereum</span>
                                        <span className="material-icons text-slate-400 dark:text-text-muted text-sm rotate-90 sm:rotate-0">chevron_right</span>
                                    </div>
                                }
                            />
                        </div>
                    </section>

                    {/* Preferences */}
                    <section className="animate-fade-in-up delay-300">
                        <SectionHeader title="Preferences" />
                        <div className="space-y-3">
                            <SettingItem
                                icon="dark_mode"
                                label="Appearance"
                                iconColor="text-slate-700 dark:text-slate-300"
                                bgColor="bg-slate-100 dark:bg-background-dark/80"
                                rightElement={
                                    <div className="flex bg-slate-100 dark:bg-background-dark/40 p-1.5 rounded-2xl border border-slate-200 dark:border-white/5 shadow-inner">
                                        <button
                                            onClick={() => setIsDarkMode(false)}
                                            className={`px-5 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${!isDarkMode ? 'bg-white dark:bg-surface-dark text-slate-900 dark:text-white shadow-xl' : 'text-slate-400 dark:text-text-muted hover:text-slate-600 dark:hover:text-slate-300'}`}
                                        >
                                            Light
                                        </button>
                                        <button
                                            onClick={() => setIsDarkMode(true)}
                                            className={`px-5 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${isDarkMode ? 'bg-white dark:bg-surface-dark text-slate-900 dark:text-white shadow-xl' : 'text-slate-400 dark:text-text-muted hover:text-slate-600 dark:hover:text-slate-300'}`}
                                        >
                                            Dark
                                        </button>
                                    </div>
                                }
                            />
                            <SettingItem
                                icon="help_outline"
                                label="Help & Support"
                                iconColor="text-green-500"
                                bgColor="bg-green-50 dark:bg-green-500/10"
                            />
                        </div>
                    </section>

                    {/* Log Out */}
                    <div className="animate-fade-in-up delay-400">
                        <button
                            onClick={handleLogOut}
                            className="w-full h-16 bg-white dark:bg-surface-dark/20 rounded-[2rem] border border-red-100 dark:border-red-500/10 flex items-center justify-center active:scale-95 transition-all mt-4 mb-12 hover:bg-red-50 dark:hover:bg-red-500/5 group"
                        >
                            <span className="text-red-500 font-black text-xs uppercase tracking-[0.3em] group-hover:scale-105 transition-transform">Log Out</span>
                        </button>
                    </div>

                </div>
            </main>
        </div>
    );
};

export default SettingsPage;
