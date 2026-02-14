import React from 'react';
import StatusBar from '../components/StatusBar';
import { useAccount } from 'wagmi';
import { useNavigate } from 'react-router-dom';
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
        <div className="flex flex-col h-full w-full max-w-full bg-slate-50 dark:bg-slate-950 overflow-hidden fixed inset-0">
            <StatusBar dark={false} notch={true} />
            <header className="flex items-center justify-between px-6 py-4 bg-slate-50/80 dark:bg-slate-950/80 backdrop-blur-md z-20 shrink-0 border-b border-slate-200/50 dark:border-white/5">
                <button onClick={() => navigate(-1)} className="w-12 h-12 flex items-center justify-center rounded-full bg-white dark:bg-slate-900 text-slate-900 dark:text-white border border-slate-200 dark:border-white/10 shadow-sm active:scale-90 transition-all">
                    <span className="material-icons text-xl">chevron_left</span>
                </button>
                <h1 className="text-sm font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-widest">Daily Activity</h1>
                <div className="w-12"></div>
            </header>
            
            <main className="flex-1 overflow-y-auto w-full pb-32">
                <div className="mt-4 px-8 mb-8">
                    <h1 className="text-4xl font-bold mt-2 text-slate-900 dark:text-white">Check-in</h1>
                    <p className="text-slate-500 dark:text-slate-400 mt-1">Keep your streak alive on Base.</p>
                </div>

                <div className="px-6 mb-8">
                    <div className="glass-effect dark:bg-slate-900/60 p-8 rounded-[2.5rem] relative overflow-hidden group border border-white dark:border-white/5 shadow-2xl shadow-black/10">
                        <div className="absolute top-0 right-0 w-32 h-32 bg-primary/10 blur-3xl rounded-full -mr-16 -mt-16 group-hover:bg-primary/20 transition-all duration-700"></div>
                        
                        <div className="relative z-10">
                            <div className="flex items-center gap-4 mb-8">
                                <div className="w-16 h-16 rounded-3xl bg-primary/10 flex items-center justify-center border border-primary/20 shadow-inner">
                                    <span className="material-icons text-primary text-3xl">local_fire_department</span>
                                </div>
                                <div>
                                    <h3 className="text-2xl font-black text-slate-900 dark:text-white leading-tight">{checkInData.streak} Day Streak</h3>
                                    <p className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest mt-0.5">You're on fire, Alex!</p>
                                </div>
                            </div>

                            <div className="flex justify-between items-center bg-slate-50/50 dark:bg-slate-800/40 p-6 rounded-[2rem] border border-slate-100/50 dark:border-white/5 relative overflow-hidden px-2">
                        {['MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT', 'SUN'].map((day, idx) => {
                            const currentDayIdx = new Date().getDay(); // 0 is Sunday, 1 is Monday...
                            const adjustedIdx = currentDayIdx === 0 ? 6 : currentDayIdx - 1; // Map to M-S (0-6)
                            
                            const isToday = idx === adjustedIdx;
                            const isCompleted = idx < adjustedIdx || (idx === adjustedIdx && hasCheckedInToday);
                            const isFuture = idx > adjustedIdx;

                            return (
                                <div 
                                    key={idx} 
                                    className="flex flex-col items-center gap-4 z-10 animate-in fade-in slide-in-from-bottom-4 duration-500"
                                    style={{ animationDelay: `${idx * 100}ms` }}
                                >
                                    <span className={`text-[10px] font-black tracking-tight ${isToday ? 'text-primary' : 'text-slate-400 dark:text-slate-600'}`}>{day}</span>
                                    
                                    <div className="relative">
                                        {isToday && (
                                            <div className="absolute -inset-4 bg-primary/5 dark:bg-primary/10 rounded-full border border-primary/20 animate-pulse"></div>
                                        )}
                                        
                                        <div className={`w-10 h-10 rounded-full flex items-center justify-center transition-all duration-500 hover:scale-110 cursor-default ${
                                            isCompleted 
                                                ? 'bg-green-50 dark:bg-green-500/10 border border-green-100 dark:border-green-500/20 text-green-500' 
                                                : isToday 
                                                    ? 'bg-white dark:bg-slate-800 border-2 border-primary text-primary shadow-lg shadow-primary/20' 
                                                    : 'bg-slate-100 dark:bg-slate-800/50 border border-transparent text-slate-300 dark:text-slate-700'
                                        }`}>
                                            {isCompleted ? (
                                                <span className="material-icons text-sm font-bold animate-in zoom-in duration-300">check_circle</span>
                                            ) : isToday ? (
                                                <div className="w-2.5 h-2.5 rounded-full bg-primary animate-ping"></div>
                                            ) : idx === 6 ? (
                                                <span className="material-icons text-sm opacity-50">stars</span>
                                            ) : (
                                                <div className="w-2 h-2 rounded-full bg-current opacity-30"></div>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </div>
            </div>
        </div>

                <div className="px-6 mb-8">
                    <div className="grid grid-cols-1 gap-4">
                        <div className="flex items-center justify-between bg-slate-50/50 dark:bg-slate-800/40 p-6 rounded-[2rem] border border-slate-100/50 dark:border-white/5">
                            <div>
                                <p className="text-[10px] font-black text-slate-500 dark:text-slate-400 uppercase tracking-widest">Total Points</p>
                                <h4 className="text-2xl font-black text-slate-900 dark:text-white">{checkInData.totalPoints || 0}</h4>
                            </div>
                            <div className="px-4 py-2 rounded-full bg-primary/10 text-primary font-black text-sm">
                                +{checkInData.totalPoints || 0}
                            </div>
                        </div>
                        
                        <div className="bg-white/70 dark:bg-slate-800/40 p-6 rounded-[2rem] border border-slate-100/50 dark:border-white/5">
                            <p className="text-[10px] font-black text-slate-500 dark:text-slate-400 uppercase tracking-widest mb-3">Daily Points</p>
                            <div className="space-y-2">
                                {((checkInData.history || []).slice(-14).reverse()).map((date, idx) => {
                                    const points = (checkInData.pointsByDate && checkInData.pointsByDate[date]) || 0;
                                    return (
                                        <div key={idx} className="flex items-center justify-between p-3 rounded-xl bg-slate-50 dark:bg-white/5 border border-slate-100 dark:border-white/5">
                                            <span className="text-xs font-black text-slate-600 dark:text-slate-300">{date}</span>
                                            <span className="text-sm font-black text-primary">+{points}</span>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    </div>
                </div>

                <div className="flex-1 flex flex-col items-center justify-center px-8">
                    <div className="w-full glass-effect dark:bg-slate-900/60 p-8 rounded-[2.5rem] border border-white dark:border-white/5 shadow-2xl shadow-black/10 relative overflow-hidden group">
                        <div className="absolute -bottom-10 -left-10 w-40 h-40 bg-primary/10 blur-3xl rounded-full group-hover:bg-primary/20 transition-all duration-700"></div>
                        
                        <div className="relative z-10 text-center">
                            <div className="w-24 h-24 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-6 border border-primary/20 group-hover:scale-110 transition-transform duration-500">
                                <span className="material-icons text-primary text-5xl">task_alt</span>
                            </div>
                            <h2 className="text-2xl font-black text-slate-900 dark:text-white mb-2">Ready for Today?</h2>
                            <p className="text-slate-500 dark:text-slate-400 text-sm mb-8 leading-relaxed">Check in daily to build your streak and earn rewards on Base.</p>
                            
                            <Transaction
                                chainId={base.id}
                                calls={calls}
                                onSuccess={handleSuccess}
                            >
                                <TransactionButton 
                                    disabled={hasCheckedInToday}
                                    className={`w-full h-16 rounded-2xl font-bold text-lg flex items-center justify-center gap-3 transition-all active:scale-95 shadow-xl text-white ${
                                        hasCheckedInToday
                                        ? 'bg-slate-100 dark:bg-slate-800 text-slate-400 dark:text-slate-500 cursor-not-allowed border border-slate-200 dark:border-white/5'
                                        : 'bg-gradient-to-tr from-primary to-blue-500 shadow-primary/30'
                                    }`}
                                >
                                    <span className="material-icons">{hasCheckedInToday ? 'done_all' : 'fingerprint'}</span>
                                    {hasCheckedInToday ? 'Already Checked In' : 'Check In Now'}
                                </TransactionButton>
                                <div className="mt-4">
                                    <TransactionStatus>
                                        <TransactionStatusLabel className="dark:text-white font-medium" />
                                        <TransactionStatusAction className="text-primary font-bold hover:underline" />
                                    </TransactionStatus>
                                </div>
                            </Transaction>
                        </div>
                    </div>
                </div>
            </main>
        </div>
    );
};

export default CheckInPage;
