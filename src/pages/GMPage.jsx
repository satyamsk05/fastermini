import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import StatusBar from '../components/StatusBar';
import { useAccount } from 'wagmi';
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

const GMPage = () => {
    const navigate = useNavigate();
    const [gmText, setGmText] = useState('GM');
    const { address, isConnected } = useAccount();
    const { addActivity, lastGMDate } = useActivity();
    const [timeLeft, setTimeLeft] = useState('');
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

    const today = new Date().toDateString();
    const isAlreadySent = lastGMDate === today;

    useEffect(() => {
        if (!isAlreadySent) return;

        const timer = setInterval(() => {
            const now = new Date();
            const tomorrow = new Date();
            tomorrow.setHours(24, 0, 0, 0);

            const diff = tomorrow - now;

            const hours = Math.floor(diff / (1000 * 60 * 60));
            const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
            const seconds = Math.floor((diff % (1000 * 60)) / 1000);

            setTimeLeft(`${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`);
        }, 1000);

        return () => clearInterval(timer);
    }, [isAlreadySent]);

    const handleSuccess = (response) => {
        addActivity('GM', {
            text: gmText,
            amount: '-0.00 ETH',
            status: 'Confirmed',
            transactionHash: response.transactionHash
        });
    };

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
            <StatusBar dark={false} notch={true} />
            <header className="flex items-center justify-between px-6 py-4 bg-slate-50/80 dark:bg-slate-950/80 backdrop-blur-md z-20 shrink-0 border-b border-slate-200/50 dark:border-white/5">
                <button onClick={() => navigate(-1)} className="w-12 h-12 flex items-center justify-center rounded-full bg-white dark:bg-slate-900 text-slate-900 dark:text-white border border-slate-200 dark:border-white/10 shadow-sm active:scale-90 transition-all">
                    <span className="material-icons text-xl">chevron_left</span>
                </button>
                <h1 className="text-sm font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-widest">New Transaction</h1>
                <div className="flex items-center">
                    <Wallet>
                        <ConnectWallet className="bg-transparent text-slate-900 dark:text-white p-0 h-auto min-w-0 border-none">
                            <Avatar className="h-9 w-9" />
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

            <main className="flex-1 overflow-y-auto w-full px-4 pt-8 pb-24">
                <div className="flex flex-col items-center mb-8">
                    <span className="text-primary font-bold text-[10px] tracking-wide">RISE AND SHINE</span>
                    <h2 className="text-3xl font-black mt-1 leading-tight text-slate-900 dark:text-slate-100 text-center">Good Morning,<br />Alex.</h2>
                </div>

                <div className="glass-effect dark:bg-slate-900/60 p-6 rounded-[2.5rem] relative overflow-hidden group border border-white dark:border-white/5 shadow-2xl shadow-black/10">
                    <div className="absolute top-0 right-0 w-32 h-32 bg-primary/10 blur-3xl rounded-full -mr-16 -mt-16 group-hover:bg-primary/20 transition-all duration-700"></div>
                    <div className="absolute -bottom-10 -left-10 w-24 h-24 bg-blue-500/5 blur-3xl rounded-full"></div>

                    <div className="relative z-10 flex flex-col items-center text-center">
                        <div className="w-24 h-24 bg-slate-50 dark:bg-slate-800/50 rounded-full flex items-center justify-center mb-6 border border-slate-100 dark:border-white/5 shadow-inner relative">
                            <span className="text-5xl animate-bounce-slow drop-shadow-lg">☀️</span>
                            <div className="absolute -inset-2 border-2 border-dashed border-primary/20 rounded-full animate-[spin_10s_linear_infinite]"></div>
                        </div>

                        <h3 className="text-xl font-black text-slate-900 dark:text-white mb-2 tracking-tight">
                            {isAlreadySent ? 'GM Sent for Today!' : 'Send a Daily GM'}
                        </h3>
                        <p className="text-slate-500 dark:text-slate-400 text-xs mb-8 leading-relaxed px-2">
                            {isAlreadySent
                                ? `You've already sent your GM today. Next GM available in ${timeLeft}`
                                : 'Start your day on Base by sending a message to the blockchain.'}
                        </p>

                        {!isAlreadySent ? (
                            <Transaction
                                chainId={base.id}
                                calls={calls}
                                onSuccess={handleSuccess}
                            >
                                <TransactionButton className="w-full h-12 rounded-xl glossy-button font-bold text-base flex items-center justify-center gap-2 shadow-xl shadow-primary/30" />
                                <div className="mt-3">
                                    <TransactionStatus>
                                        <TransactionStatusLabel className="dark:text-white font-medium text-xs" />
                                        <TransactionStatusAction className="text-primary font-bold hover:underline text-xs" />
                                    </TransactionStatus>
                                </div>
                            </Transaction>
                        ) : (
                            <div className="w-full">
                                <button disabled className="w-full h-12 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-400 dark:text-slate-500 font-bold text-sm flex flex-col items-center justify-center border border-dashed border-slate-200 dark:border-white/5">
                                    <div className="flex items-center gap-2">
                                        <span className="material-icons text-lg">schedule</span>
                                        <span>Next GM in {timeLeft}</span>
                                    </div>
                                </button>
                                <p className="mt-3 text-[9px] font-black uppercase tracking-widest text-slate-400">Come back at 00:00</p>
                            </div>
                        )}
                    </div>
                </div>
            </main>
        </div>
    );
};

export default GMPage;
