import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAccount } from 'wagmi';
import { useUser } from '../context/UserContext';
import StatusBar from '../components/StatusBar';

const SettingsPage = () => {
    const navigate = useNavigate();
    const { address } = useAccount();
    const { userName, setUserName } = useUser();
    const [notifications, setNotifications] = useState(true);
    const [isDarkMode, setIsDarkMode] = useState(false);
    const [copied, setCopied] = useState(false);
    const [isEditingName, setIsEditingName] = useState(false);
    const [tempName, setTempName] = useState(userName);

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

    const SettingItem = ({ icon, label, sublabel, rightElement, onClick, iconColor = "text-primary", bgColor = "bg-primary/10" }) => (
        <div 
            onClick={onClick}
            className="flex items-center justify-between p-4 bg-white dark:bg-slate-900/40 rounded-3xl active:scale-[0.98] transition-all cursor-pointer"
        >
            <div className="flex items-center gap-4">
                <div className={`w-11 h-11 ${bgColor} rounded-2xl flex items-center justify-center`}>
                    <span className={`material-icons ${iconColor} text-xl`}>{icon}</span>
                </div>
                <div>
                    <p className="text-[15px] font-bold text-slate-900 dark:text-white leading-tight">{label}</p>
                    {sublabel && <p className="text-[11px] font-bold text-slate-400 uppercase tracking-tight mt-0.5">{sublabel}</p>}
                </div>
            </div>
            {rightElement ? rightElement : <span className="material-icons text-slate-300">chevron_right</span>}
        </div>
    );

    const SectionHeader = ({ title }) => (
        <p className="text-[11px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-[0.15em] mb-4 ml-2">{title}</p>
    );

    return (
        <div className="flex flex-col h-full w-full max-w-full bg-[#F8FAFC] dark:bg-slate-950 overflow-hidden fixed inset-0">
            <StatusBar dark={false} notch={true} />
            
            {/* Custom Header */}
            <header className="flex items-center justify-between px-6 py-6 bg-[#F8FAFC]/80 dark:bg-slate-950/80 backdrop-blur-md z-20 shrink-0">
                <button onClick={() => navigate(-1)} className="w-10 h-10 flex items-center justify-center rounded-2xl bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-sm active:scale-90 transition-all border border-slate-100 dark:border-white/5">
                    <span className="material-icons text-xl">chevron_left</span>
                </button>
                <h1 className="text-xl font-black text-slate-900 dark:text-white">Settings</h1>
                <div className="w-10"></div>
            </header>

            <main className="flex-1 overflow-y-auto px-6 pb-32">
                <div className="space-y-8">
                    
                    {/* Profile Card */}
                    <div className="bg-white dark:bg-slate-900 rounded-[2.5rem] p-6 shadow-xl shadow-slate-200/50 dark:shadow-none border border-slate-100 dark:border-white/5 flex items-center gap-5">
                        <div className="relative">
                            <div className="w-20 h-20 rounded-3xl overflow-hidden bg-slate-100 border-2 border-white dark:border-slate-800">
                                <img src={avatarUrl} alt="Avatar" className="w-full h-full object-cover" />
                            </div>
                            <div className="absolute -right-1 -bottom-1 w-5 h-5 bg-green-500 border-4 border-white dark:border-slate-900 rounded-full"></div>
                        </div>
                        <div className="flex-1 min-w-0">
                            {isEditingName ? (
                                <div className="flex items-center gap-2 mb-1">
                                    <input 
                                        type="text" 
                                        value={tempName}
                                        onChange={(e) => setTempName(e.target.value)}
                                        className="bg-slate-100 dark:bg-slate-800 border-none rounded-xl px-3 py-1 text-sm font-black text-slate-900 dark:text-white w-full outline-none ring-2 ring-primary/20"
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
                                    <span className="material-icons text-slate-300 group-hover:text-primary transition-colors text-sm">edit</span>
                                </div>
                            )}
                            <p className="text-xs font-bold text-slate-400 mb-2">Premium Member</p>
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
                    <section>
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
                                        className={`w-12 h-6 rounded-full transition-all duration-300 relative ${notifications ? 'bg-blue-500' : 'bg-slate-200 dark:bg-slate-800'}`}
                                    >
                                        <div className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-all duration-300 ${notifications ? 'left-7' : 'left-1'}`}></div>
                                    </button>
                                }
                            />
                        </div>
                    </section>

                    {/* Web3 Configuration */}
                    <section>
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
                                    <div className="flex items-center gap-2 bg-slate-100 dark:bg-slate-800 px-3 py-1.5 rounded-xl border border-slate-200 dark:border-white/5">
                                        <div className="w-4 h-4 rounded-full bg-teal-400"></div>
                                        <span className="text-[10px] font-black text-slate-700 dark:text-slate-300 uppercase">Ethereum</span>
                                        <span className="material-icons text-slate-400 text-sm">chevron_right</span>
                                    </div>
                                }
                            />
                        </div>
                    </section>

                    {/* Preferences */}
                    <section>
                        <SectionHeader title="Preferences" />
                        <div className="space-y-3">
                            <SettingItem 
                                icon="dark_mode" 
                                label="Appearance" 
                                iconColor="text-slate-700 dark:text-slate-300"
                                bgColor="bg-slate-100 dark:bg-slate-800"
                                rightElement={
                                    <div className="flex bg-slate-100 dark:bg-slate-800 p-1 rounded-xl">
                                        <button 
                                            onClick={() => setIsDarkMode(false)}
                                            className={`px-4 py-1.5 rounded-lg text-[10px] font-black uppercase transition-all ${!isDarkMode ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-400'}`}
                                        >
                                            Light
                                        </button>
                                        <button 
                                            onClick={() => setIsDarkMode(true)}
                                            className={`px-4 py-1.5 rounded-lg text-[10px] font-black uppercase transition-all ${isDarkMode ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-sm' : 'text-slate-400'}`}
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
                    <button className="w-full h-16 bg-white dark:bg-slate-900/40 rounded-3xl border border-red-50 dark:border-red-500/10 flex items-center justify-center active:scale-95 transition-all mt-4 mb-8">
                        <span className="text-red-500 font-black text-lg">Log Out</span>
                    </button>

                </div>
            </main>
        </div>
    );
};

export default SettingsPage;
