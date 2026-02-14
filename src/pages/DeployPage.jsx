import React from 'react';
import { useNavigate } from 'react-router-dom';
import StatusBar from '../components/StatusBar';

const DeployPage = () => {
    const navigate = useNavigate();

    return (
        <div className="flex flex-col h-full w-full max-w-full bg-slate-50 dark:bg-slate-950 overflow-hidden fixed inset-0">
            <StatusBar dark={false} notch={true} />
            <header className="flex items-center justify-between px-6 py-4 bg-slate-50/80 dark:bg-slate-950/80 backdrop-blur-md z-20 shrink-0 border-b border-slate-200/50 dark:border-white/5">
                <button onClick={() => navigate(-1)} className="w-12 h-12 flex items-center justify-center rounded-full bg-white dark:bg-slate-900 text-slate-900 dark:text-white border border-slate-200 dark:border-white/10 shadow-sm active:scale-90 transition-all">
                    <span className="material-icons text-xl">chevron_left</span>
                </button>
                <h1 className="text-sm font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-widest">Deployer</h1>
                <div className="w-12"></div>
            </header>

            <main className="flex-1 overflow-y-auto w-full px-4 pt-6 pb-24">
                <div className="mb-6">
                    <span className="text-primary font-bold text-[10px] tracking-wide">BUILD ON BASE</span>
                    <h2 className="text-3xl font-black mt-1 leading-tight text-slate-900 dark:text-slate-100">Smart<br />Contract.</h2>
                    <p className="text-slate-500 dark:text-slate-400 mt-1 text-xs font-medium">Initialize your protocol on Base.</p>
                </div>

                <div className="space-y-6">
                    <div className="space-y-2">
                        <label className="text-[9px] font-black uppercase tracking-[0.2em] text-slate-400 ml-1">Contract Identity</label>
                        <div className="bg-white dark:bg-slate-900/60 border border-slate-200 dark:border-white/5 rounded-2xl p-4 ios-shadow">
                            <input
                                className="w-full bg-transparent border-none p-0 focus:ring-0 text-lg font-bold placeholder:text-slate-200 dark:placeholder:text-slate-800 text-slate-900 dark:text-white"
                                placeholder="e.g. MyBaseToken"
                                type="text"
                            />
                        </div>
                    </div>

                    <div className="space-y-2">
                        <label className="text-[9px] font-black uppercase tracking-[0.2em] text-slate-400 ml-1">Network & Standard</label>
                        <div className="grid grid-cols-2 gap-3">
                            <div className="glass-effect dark:bg-slate-900/40 p-4 rounded-3xl border border-primary/30 flex flex-col items-start gap-2 relative overflow-hidden">
                                <div className="absolute top-0 right-0 w-12 h-12 bg-primary/10 blur-lg"></div>
                                <div className="w-9 h-9 rounded-xl bg-primary/10 flex items-center justify-center border border-primary/20">
                                    <span className="material-icons text-primary text-lg">hub</span>
                                </div>
                                <div className="text-left">
                                    <p className="text-xs font-black text-slate-900 dark:text-white">Base Mainnet</p>
                                    <p className="text-[9px] font-bold text-primary uppercase tracking-tight">Active</p>
                                </div>
                            </div>

                            <div className="glass-effect dark:bg-slate-900/40 p-4 rounded-3xl border border-white/20 dark:border-white/5 flex flex-col items-start gap-2">
                                <div className="w-9 h-9 rounded-xl bg-slate-100 dark:bg-white/5 flex items-center justify-center border border-transparent">
                                    <span className="material-icons text-slate-400 text-lg">token</span>
                                </div>
                                <div className="text-left">
                                    <p className="text-xs font-black text-slate-900 dark:text-white">ERC-20</p>
                                    <p className="text-[9px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-tight">Standard</p>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="glass-effect dark:bg-primary/5 p-5 rounded-3xl border border-slate-200 dark:border-primary/20 flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
                                <span className="material-icons text-primary text-lg">local_gas_station</span>
                            </div>
                            <div>
                                <p className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest">Est. Gas Fee</p>
                                <p className="text-base font-black text-slate-900 dark:text-white">~$0.15</p>
                            </div>
                        </div>
                        <div className="text-right">
                            <p className="text-[9px] font-bold text-primary uppercase tracking-widest bg-primary/10 px-2.5 py-1 rounded-full">Fast</p>
                        </div>
                    </div>

                    <button className="glossy-button w-full h-14 rounded-2xl text-white font-black text-base shadow-xl shadow-primary/20 active:scale-95 transition-all flex items-center justify-center gap-2">
                        <span className="material-icons text-lg">rocket_launch</span>
                        Deploy Contract
                    </button>
                </div>
            </main>
        </div>
    );
};

export default DeployPage;
