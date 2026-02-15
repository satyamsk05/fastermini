import React from 'react';
import StatusBar from '../components/StatusBar';
import { useAccount } from 'wagmi';
import { useNavigate } from 'react-router-dom';
import {
    ConnectWallet,
    Wallet,
    WalletDropdown,
    WalletDropdownDisconnect,
    WalletDropdownLink
} from '@coinbase/onchainkit/wallet';
import { Avatar, Name, Address, Identity, EthBalance } from '@coinbase/onchainkit/identity';
import {
    Transaction,
    TransactionButton,
    TransactionStatus,
    TransactionStatusAction,
    TransactionStatusLabel
} from '@coinbase/onchainkit/transaction';
import { base } from 'viem/chains';
import { encodeFunctionData, parseEther } from 'viem';
import { useActivity } from '../context/ActivityContext';

const CheckInPage = () => {
    const { address, isConnected } = useAccount();
    const { addActivity, checkInData } = useActivity();
    const navigate = useNavigate();

    const today = new Date().toDateString();
    const hasCheckedInToday = checkInData.lastCheckIn === today;

    const handleSuccess = (response) => {
        addActivity('Check-in', {
            title: 'Daily Streak Maintained',
            status: 'Confirmed',
            transactionHash: response.transactionHash
        });
    };

    const GM_CONTRACT = '0x9A966BbE0E8f4954a32C16e76789D817C466C603';
    const gmAbi = [
        {
            type: 'function',
            name: 'gm',
            stateMutability: 'payable',
            inputs: [],
            outputs: [],
        },
    ];
    const calls = [
        {
            to: GM_CONTRACT,
            data: encodeFunctionData({
                abi: gmAbi,
                functionName: 'gm',
                args: [],
            }),
            value: parseEther('0.00001'),
        },
    ];

    return (
        <div className="flex flex-col h-full w-full max-w-full bg-background-light dark:bg-background-dark overflow-hidden fixed inset-0">
            {/* Background Orbs for Ambiance */}
            <div className="bg-orb w-64 h-64 bg-primary/20 top-[-10%] right-[-10%] animate-pulse"></div>
            <div className="bg-orb w-80 h-80 bg-blue-600/10 bottom-[-10%] left-[-10%] animate-bounce-slow"></div>

            {/* Floating Particles */}
            <div className="absolute top-1/4 left-1/4 w-2 h-2 bg-primary/40 rounded-full blur-sm floating-particle delay-100"></div>
            <div className="absolute top-1/2 right-1/3 w-3 h-3 bg-blue-400/30 rounded-full blur-sm floating-particle delay-300"></div>
            <div className="absolute bottom-1/4 left-1/2 w-1.5 h-1.5 bg-indigo-400/40 rounded-full blur-sm floating-particle delay-500"></div>

            <StatusBar dark={false} notch={true} />
            <header className="flex items-center justify-between px-6 py-4 bg-white/80 dark:bg-slate-900/40 backdrop-blur-2xl z-20 shrink-0 border-b border-slate-200/50 dark:border-white/5">
                <button onClick={() => navigate(-1)} className="w-11 h-11 flex items-center justify-center rounded-full bg-white dark:bg-slate-900 text-slate-900 dark:text-white border border-slate-200 dark:border-white/10 shadow-sm active:scale-90 transition-all">
                    <span className="material-icons text-xl">chevron_left</span>
                </button>
                <h1 className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-[0.2em]">Daily Ritual</h1>
                <div className="flex items-center">
                    <Wallet>
                        <ConnectWallet className="bg-transparent text-slate-900 dark:text-white p-0 h-auto min-w-0 border-none">
                            <Avatar className="h-9 w-9 border-2 border-white dark:border-slate-800" />
                        </ConnectWallet>
                        <WalletDropdown className="z-[100]">
                            <Identity className="px-4 pt-3 pb-2" hasCopyAddressOnClick>
                                <Avatar />
                                <Name />
                                <Address />
                                <EthBalance />
                            </Identity>
                            <WalletDropdownLink icon="settings" href="#" onClick={(e) => { e.preventDefault(); navigate('/settings'); }}>
                                Settings
                            </WalletDropdownLink>
                            <WalletDropdownDisconnect />
                        </WalletDropdown>
                    </Wallet>
                </div>
            </header>

            <main className="flex-1 overflow-y-auto w-full pb-28 pt-8 px-6 relative z-10">
                {/* Hero Section */}
                <div className="mb-10 text-center animate-fade-in-up">
                    <span className="text-primary font-bold text-[10px] tracking-[0.3em] uppercase">Keep The Fire Burning</span>
                    <h2 className="text-4xl font-black mt-2 tracking-tighter text-slate-900 dark:text-white leading-tight uppercase font-outfit">Daily<br />Check-In.</h2>
                </div>

                {/* Glass Weekly Streak Cards */}
                <div className="mb-12 animate-fade-in-up delay-100">
                    <div className="flex items-center justify-between mb-4 px-1">
                        <span className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest">Weekly Progress</span>
                        <div className="flex items-center gap-1.5 bg-primary/10 px-2.5 py-1 rounded-full border border-primary/20">
                            <span className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse"></span>
                            <span className="text-[10px] font-black text-primary uppercase">{checkInData.totalPoints || 0} PTS</span>
                        </div>
                    </div>

                    <div className="grid grid-cols-7 gap-2">
                        {['M', 'T', 'W', 'T', 'F', 'S', 'S'].map((day, idx) => {
                            const now = new Date();
                            const currentDayIdx = now.getDay();
                            const adjustedCurrentIdx = currentDayIdx === 0 ? 6 : currentDayIdx - 1;

                            const dayDate = new Date(now);
                            const daysDiff = idx - adjustedCurrentIdx;
                            dayDate.setDate(now.getDate() + daysDiff);
                            const dayDateString = dayDate.toDateString();

                            const isToday = idx === adjustedCurrentIdx;
                            const isFuture = idx > adjustedCurrentIdx;
                            const isPast = idx < adjustedCurrentIdx;
                            const wasCheckedIn = checkInData.history?.includes(dayDateString);
                            const isCompleted = isPast && wasCheckedIn;
                            const isMissed = isPast && !wasCheckedIn;
                            const isTodayCompleted = isToday && hasCheckedInToday;

                            return (
                                <div key={idx} className={`relative flex flex-col items-center justify-center p-3 rounded-2xl border transition-all duration-500 ${isToday
                                    ? 'bg-primary/10 border-primary/40 shadow-[0_0_15px_rgba(59,130,246,0.2)]'
                                    : 'bg-white/40 dark:bg-slate-900/40 border-slate-200 dark:border-white/5 backdrop-blur-md'
                                    }`}>
                                    <span className={`text-[9px] font-black mb-2 ${isToday ? 'text-primary' : 'text-slate-400 dark:text-slate-500'}`}>{day}</span>

                                    <div className={`w-6 h-6 rounded-lg flex items-center justify-center transition-all duration-300 ${isCompleted || isTodayCompleted
                                        ? 'bg-green-500/20 text-green-500'
                                        : isMissed
                                            ? 'bg-red-500/10 text-red-500'
                                            : isToday
                                                ? 'bg-primary text-white shadow-lg shadow-primary/30'
                                                : 'bg-slate-200/50 dark:bg-white/5 text-slate-400 dark:text-slate-600'
                                        }`}>
                                        <span className="material-icons text-sm">
                                            {isCompleted || isTodayCompleted ? 'check' : isMissed ? 'close' : isToday ? 'priority_high' : 'radio_button_unchecked'}
                                        </span>
                                    </div>

                                    {isToday && !hasCheckedInToday && (
                                        <div className="absolute -bottom-1 w-1 h-1 bg-primary rounded-full animate-ping"></div>
                                    )}
                                </div>
                            );
                        })}
                    </div>
                </div>

                {/* Overhauled Check-In Button Section */}
                <div className="flex flex-col items-center mb-12 animate-fade-in-up delay-200">
                    <div className="relative group">
                        {/* Halo Pulse Effect */}
                        {!hasCheckedInToday && isConnected && (
                            <div className="absolute inset-0 rounded-full bg-primary/20 animate-halo blur-2xl -z-10"></div>
                        )}

                        {/* Rotating Gradient Border */}
                        {!hasCheckedInToday && isConnected && (
                            <div className="absolute -inset-1 rounded-full bg-gradient-to-tr from-primary via-blue-400 to-indigo-500 animate-rotate-slow opacity-60 blur-sm"></div>
                        )}

                        <div className="relative">
                            {!isConnected ? (
                                <div className="w-56 h-56 rounded-full glass-effect dark:bg-slate-900/80 flex items-center justify-center shadow-2xl dark:shadow-primary/10 border border-slate-200 dark:border-white/10 p-4">
                                    <Wallet>
                                        <ConnectWallet className="!rounded-2xl !bg-primary !text-white !font-black !uppercase !tracking-widest !px-8 !py-4 !shadow-xl !transition-all active:!scale-95 !border-none !text-xs">
                                            Unlock Ritual
                                        </ConnectWallet>
                                    </Wallet>
                                </div>
                            ) : (
                                <Transaction
                                    chainId={base.id}
                                    calls={calls}
                                    onStatus={(status) => {
                                        if (status.statusName === 'success') {
                                            handleSuccess(status);
                                        }
                                    }}
                                >
                                    <TransactionButton
                                        disabled={hasCheckedInToday}
                                        className={`w-56 h-56 rounded-full flex flex-col items-center justify-center shadow-2xl dark:shadow-primary/20 border-8 border-white dark:border-slate-900 transition-all duration-500 relative overflow-hidden ${hasCheckedInToday
                                            ? 'bg-gradient-to-br from-green-500 to-emerald-700'
                                            : 'bg-gradient-to-br from-primary via-blue-600 to-indigo-700 hover:scale-105 active:scale-95'
                                            }`}
                                    >
                                        {/* Inner Glossy Glint */}
                                        <div className="absolute inset-0 bg-gradient-to-tr from-white/10 to-transparent pointer-events-none"></div>

                                        <span className={`material-icons text-white text-6xl mb-3 transition-transform duration-500 ${hasCheckedInToday ? 'scale-110' : 'group-hover:scale-110'}`}>
                                            {hasCheckedInToday ? 'verified' : 'fingerprint'}
                                        </span>
                                        <span className="text-white font-black text-xs uppercase tracking-[0.2em]">
                                            {hasCheckedInToday ? 'Verified' : 'Verify Identity'}
                                        </span>

                                        {hasCheckedInToday && (
                                            <div className="mt-2 px-3 py-1 bg-white/20 rounded-full">
                                                <span className="text-[8px] font-black text-white uppercase tracking-tighter">Done for Today</span>
                                            </div>
                                        )}

                                        {/* Sonar Pulse for Active State */}
                                        {!hasCheckedInToday && (
                                            <div className="absolute inset-0 rounded-full border-4 border-white transform animate-sonar opacity-0 pointer-events-none"></div>
                                        )}
                                    </TransactionButton>
                                    <TransactionStatus>
                                        <TransactionStatusLabel className="text-slate-400 text-[10px] font-bold uppercase mt-4" />
                                        <TransactionStatusAction />
                                    </TransactionStatus>
                                </Transaction>
                            )}
                        </div>
                    </div>
                </div>

                {/* Streak Analytics Card */}
                <div className="glass-effect dark:bg-surface-dark/40 p-6 rounded-[2.5rem] border border-slate-200/50 dark:border-white/10 ios-shadow mb-8 relative overflow-hidden animate-fade-in-up delay-300">
                    <div className="absolute top-0 right-0 w-32 h-32 bg-primary/10 blur-3xl -z-10"></div>

                    <div className="flex items-center justify-between mb-6">
                        <div className="flex items-center gap-3">
                            <div className="w-12 h-12 rounded-2xl bg-orange-500/10 flex items-center justify-center">
                                <span className="material-icons text-orange-500 text-2xl">local_fire_department</span>
                            </div>
                            <div>
                                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Active Streak</p>
                                <p className="text-2xl font-black text-slate-900 dark:text-white leading-none">{checkInData.streak} Days</p>
                            </div>
                        </div>
                        <div className="text-right">
                            <p className="text-[10px] font-black text-primary uppercase tracking-widest">Ritual Rank</p>
                            <p className="text-lg font-black text-slate-900 dark:text-white">Adept</p>
                        </div>
                    </div>

                    <div className="space-y-4">
                        <div className="flex items-center justify-between group">
                            <div className="flex items-center gap-3">
                                <span className="w-1.5 h-1.5 rounded-full bg-blue-500"></span>
                                <span className="text-xs font-bold text-slate-500 dark:text-slate-400">Next Milestone</span>
                            </div>
                            <span className="text-xs font-black text-slate-900 dark:text-white">
                                {7 - (checkInData.streak % 7)} Days
                            </span>
                        </div>

                        <div className="w-full h-2 bg-slate-100 dark:bg-white/5 rounded-full overflow-hidden">
                            <div
                                className="h-full bg-gradient-to-r from-primary to-blue-400 transition-all duration-1000 ease-out"
                                style={{ width: `${(checkInData.streak % 7) * (100 / 7)}%` }}
                            ></div>
                        </div>
                    </div>
                </div>

                {/* Reward Preview */}
                <div className="grid grid-cols-2 gap-4 animate-fade-in-up delay-400">
                    <div className="bg-white/40 dark:bg-white/5 p-4 rounded-3xl border border-slate-100 dark:border-white/5 backdrop-blur-md">
                        <p className="text-[9px] font-black text-slate-400 uppercase mb-1">Weekly Pool</p>
                        <p className="text-lg font-black text-slate-900 dark:text-white">10.5K <span className="text-[10px] text-primary">STREAK</span></p>
                    </div>
                    <div className="bg-white/40 dark:bg-white/5 p-4 rounded-3xl border border-slate-100 dark:border-white/5 backdrop-blur-md">
                        <p className="text-[9px] font-black text-slate-400 uppercase mb-1">Your Est.</p>
                        <p className="text-lg font-black text-slate-900 dark:text-white">420 <span className="text-[10px] text-green-500">STREAK</span></p>
                    </div>
                </div>
            </main>
        </div>
    );
};

export default CheckInPage;
