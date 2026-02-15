import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAccount, useBalance, useSendTransaction, useSwitchChain, usePublicClient } from 'wagmi';
import { useUser } from '../context/UserContext';
import { parseEther, encodeFunctionData, formatEther } from 'viem';
import { base, mainnet } from 'wagmi/chains';
import { QRCodeSVG } from 'qrcode.react';
import {
    ConnectWallet,
    Wallet,
    WalletDropdown,
    WalletDropdownDisconnect,
    WalletDropdownFundLink,
    WalletDropdownLink
} from '@coinbase/onchainkit/wallet';
import {
    Transaction,
    TransactionButton,
    TransactionStatus,
    TransactionStatusAction,
    TransactionStatusLabel
} from '@coinbase/onchainkit/transaction';
import { Avatar, Name, Address, Identity, EthBalance } from '@coinbase/onchainkit/identity';

import { useActivity } from '../context/ActivityContext';
import { useFarcaster } from '../context/FarcasterContext';

const HomePage = () => {
    const navigate = useNavigate();
    const { address, isConnected } = useAccount();
    const { userName } = useUser();
    const { context } = useFarcaster();

    const { activities, addActivity, checkInData } = useActivity();
    const { sendTransaction, isLoading: isSending } = useSendTransaction();
    const { switchChain } = useSwitchChain();

    const [showReceiveModal, setShowReceiveModal] = useState(false);
    const [showSendModal, setShowSendModal] = useState(false);
    const [sendAddress, setSendAddress] = useState('');
    const [sendAmount, setSendAmount] = useState('');
    const [selectedChain, setSelectedChain] = useState('base');
    const [selectedTx, setSelectedTx] = useState(null);
    const [showTxModal, setShowTxModal] = useState(false);
    const [activityFilter, setActivityFilter] = useState('All');
    const [legends, setLegends] = useState([]);
    const [txFee, setTxFee] = useState(null);
    const publicClient = usePublicClient();
    const [txReceipt, setTxReceipt] = useState(null);

    useEffect(() => {
        const storedLegends = JSON.parse(localStorage.getItem('my_legends') || '[]');
        setLegends(storedLegends);
    }, []);
    const [txExplorerUrl, setTxExplorerUrl] = useState(null);
    const [copied, setCopied] = useState(false);

    const handleMaxAmount = () => {
        if (balance) {
            const available = parseFloat(balance.formatted);
            const gasReserve = 0.00002;
            const max = Math.max(0, available - gasReserve);
            setSendAmount(max.toFixed(6));
        }
    };

    const handleSend = async () => {
        if (!sendAddress || !sendAmount) return;
        try {
            sendTransaction({
                to: sendAddress,
                value: parseEther(sendAmount),
            }, {
                onSuccess: (hash) => {
                    addActivity('Transaction', {
                        title: `Sent ETH`,
                        amount: `-${sendAmount} ETH`,
                        status: 'Confirmed',
                        icon: 'north_east',
                        transactionHash: hash
                    });
                    setShowSendModal(false);
                    setSendAddress('');
                    setSendAmount('');
                }
            });
        } catch (error) {
            console.error('Send error:', error);
        }
    };

    const copyToClipboardText = (text) => {
        if (!text || typeof text !== 'string') return;
        navigator.clipboard.writeText(text);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    const NFT_CONTRACT = '0x354F55a1DDfC9d2F62068eC1385e8c3124CABC78';
    const nftAbi = [{ type: 'function', name: 'mint', stateMutability: 'payable', inputs: [], outputs: [] }];
    const GM_CONTRACT = '0x9A966BbE0E8f4954a32C16e76789D817C466C603';
    const gmAbi = [{ type: 'function', name: 'gm', stateMutability: 'payable', inputs: [], outputs: [] }];

    const handleTxClick = async (activity) => {
        const inferredTo =
            activity.to ||
            (activity.type === 'GM' || activity.type === 'Check-in'
                ? GM_CONTRACT
                : (activity.title && activity.title.includes('Mint')) || activity.type === 'Mint'
                    ? NFT_CONTRACT
                    : undefined);
        const enriched = { ...activity, to: inferredTo };
        setSelectedTx(enriched);
        setShowTxModal(true);
        try {
            if (!publicClient || !address || !inferredTo) return;
            let request = { account: address, to: inferredTo, value: 0n };
            if (activity.type === 'GM' || activity.type === 'Check-in') {
                request = {
                    ...request,
                    data: encodeFunctionData({ abi: gmAbi, functionName: 'gm', args: [] }),
                    value: parseEther('0.00001'),
                };
            } else if ((activity.title && activity.title.includes('Mint')) || activity.type === 'Mint') {
                request = {
                    ...request,
                    data: encodeFunctionData({ abi: nftAbi, functionName: 'mint', args: [] }),
                };
            } else if (activity.type === 'Transaction' && activity.amount) {
                const amt = activity.amount.replace(/[^\d.]/g, '');
                if (amt) request = { ...request, value: parseEther(amt) };
            }
            const gas = await publicClient.estimateGas(request);
            const gasPrice = await publicClient.getGasPrice();
            const feeWei = gas * gasPrice;
            const feeEth = Number(formatEther(feeWei));
            const gasPriceGwei = Number(gasPrice) / 1e9;
            setTxFee({ feeEth, gas: gas.toString(), gasPriceGwei });
            if (activity.transactionHash) {
                const receipt = await publicClient.getTransactionReceipt({ hash: activity.transactionHash });
                setTxReceipt(receipt || null);
                setTxExplorerUrl(`https://basescan.org/tx/${activity.transactionHash}`);
            } else {
                setTxReceipt(null);
                setTxExplorerUrl(null);
            }
        } catch {
            setTxFee(null);
            setTxReceipt(null);
            setTxExplorerUrl(null);
        }
    };

    const uniqueActivities = activities.filter((activity, index, self) =>
        index === self.findIndex((t) => (
            (t.transactionHash && activity.transactionHash && t.transactionHash === activity.transactionHash) ||
            (t.type === activity.type && (t.text === activity.text || t.title === activity.title) && t.type !== 'Transaction')
        ))
    ).slice(0, 10);

    const counts = {
        All: uniqueActivities.length,
        Transaction: uniqueActivities.filter((a) => a.type === 'Transaction').length,
        GM: uniqueActivities.filter((a) => a.type === 'GM').length,
        'Check-in': uniqueActivities.filter((a) => a.type === 'Check-in').length,
        'Legends': legends.length,
    };

    const visibleActivities = uniqueActivities.filter((a) => {
        if (activityFilter === 'All') return true;
        return a.type === activityFilter;
    });

    const { data: balance } = useBalance({ address: address });

    return (
        <div className="flex flex-col h-full w-full max-w-full bg-background-light dark:bg-background-dark overflow-hidden fixed inset-0">
            {/* Background Orbs */}
            <div className="bg-orb w-80 h-80 bg-primary/20 -top-20 -right-20 animate-pulse"></div>
            <div className="bg-orb w-64 h-64 bg-indigo-500/10 bottom-1/4 -left-32 animate-bounce-slow"></div>

            <main className="flex-1 overflow-y-auto px-6 pb-28 w-full relative z-10">
                {/* Header Section */}
                <header className="flex justify-between items-center mb-8 pt-6 animate-fade-in-up">
                    <div className="flex flex-col">
                        <p className="text-[10px] font-black text-primary/80 dark:text-primary/70 uppercase tracking-[0.2em] mb-1">
                            {new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric' })}
                        </p>
                        <h1 className="text-2xl font-black tracking-tight text-slate-900 dark:text-white leading-tight">
                            {context?.user?.displayName ? `Hi, ${context.user.displayName}` : (isConnected ? `Hi, ${userName}` : 'GM, Friend')}
                        </h1>
                    </div>
                    <div className="flex items-center relative group/wallet">
                        <div className="absolute -inset-1 bg-gradient-to-r from-primary/20 to-indigo-500/20 rounded-full blur opacity-0 group-hover/wallet:opacity-100 transition-opacity duration-500"></div>
                        <Wallet>
                            <ConnectWallet />
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

                {/* Balance Card Section */}
                <section className="glass-effect dark:bg-slate-900/40 backdrop-blur-3xl rounded-[2.5rem] p-6 mb-8 relative overflow-hidden group border border-white dark:border-white/5 shadow-2xl hover:scale-[1.01] transition-all duration-500 animate-fade-in-up delay-100">
                    <div className="absolute top-0 right-0 w-32 h-32 bg-primary/10 blur-3xl rounded-full -mr-16 -mt-16 group-hover:bg-primary/20 transition-all duration-700"></div>

                    <div className="relative z-10">
                        <div className="flex justify-between items-start mb-6">
                            <div>
                                <p className="text-slate-400 dark:text-slate-500 text-[10px] font-black uppercase tracking-[0.25em] mb-2">Portfolio Value</p>
                                <div className="flex items-baseline gap-2">
                                    <h3 className="text-4xl font-black text-slate-900 dark:text-white tracking-tighter">
                                        {balance ? parseFloat(balance.formatted).toFixed(4) : '0.0000'}
                                    </h3>
                                    <span className="text-sm font-black text-primary uppercase tracking-widest">ETH</span>
                                </div>
                            </div>
                            <div className="bg-emerald-500/10 text-emerald-500 px-3 py-1 rounded-full text-[10px] font-black border border-emerald-500/20 flex items-center gap-1">
                                <span className="material-icons text-[10px]">trending_up</span>
                                LIVE
                            </div>
                        </div>

                        <div className="flex gap-4">
                            <button
                                onClick={() => setShowReceiveModal(true)}
                                className="flex-1 btn-premium h-14 rounded-2xl flex items-center justify-center gap-2"
                            >
                                <span className="material-icons text-xl">qr_code_2</span>
                                Receive
                            </button>
                            <button
                                onClick={() => setShowSendModal(true)}
                                className="flex-1 bg-white dark:bg-slate-900/60 text-slate-900 dark:text-white h-14 rounded-2xl font-black flex items-center justify-center gap-2 active:scale-[0.98] transition-all shadow-lg border border-slate-100 dark:border-white/5 hover:border-primary/30 text-[10px] uppercase tracking-[0.2em]"
                            >
                                <span className="material-icons text-xl">north_east</span>
                                Send
                            </button>
                        </div>
                    </div>
                </section>

                {/* Primary Action Button */}
                <div className="mb-10 animate-fade-in-up delay-200">
                    <button
                        onClick={() => navigate('/mint')}
                        className="glossy-button w-full h-18 rounded-3xl text-white font-black text-xs uppercase tracking-[0.3em] flex items-center justify-center gap-3 active:scale-[0.97] border border-white/20 relative overflow-hidden group"
                    >
                        <div className="absolute inset-0 bg-white/20 translate-y-full group-hover:translate-y-0 transition-transform duration-500"></div>
                        <div className="absolute -inset-1 bg-gradient-to-r from-primary via-indigo-500 to-indigo-600 blur-xl opacity-20 group-hover:opacity-60 transition-all duration-700 animate-pulse"></div>
                        <span className="material-icons text-xl group-hover:rotate-12 transition-transform relative z-10">auto_awesome</span>
                        <span className="relative z-10">Mint Legend NFT</span>
                        {/* Shimmer Effect */}
                        <div className="absolute top-0 left-0 w-1/2 h-full bg-gradient-to-r from-transparent via-white/30 to-transparent skew-x-[-15deg] pointer-events-none animate-shimmer scale-150"></div>
                    </button>
                </div>

                {/* Routines Grid */}
                <section className="mb-10 animate-fade-in-up delay-300">
                    <div className="flex items-center justify-between mb-5 px-1">
                        <h3 className="font-black text-lg tracking-tight text-slate-900 dark:text-white">Active Rituals</h3>
                        <button className="text-[10px] font-black uppercase tracking-widest text-slate-400">View All</button>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                        <button
                            onClick={() => navigate('/checkin')}
                            className="glass-effect dark:bg-slate-900/40 p-5 rounded-[2rem] border border-white/20 dark:border-white/5 flex flex-col items-start gap-3 hover:scale-[1.03] transition-all group relative active:scale-[0.97]"
                        >
                            <div className="absolute top-2 right-2 bg-orange-500 text-white text-[8px] font-black px-2 py-0.5 rounded-lg shadow-lg shadow-orange-500/20">
                                {checkInData?.streak ?? 0} DAYS
                            </div>
                            <div className="w-12 h-12 rounded-2xl bg-orange-500/10 flex items-center justify-center border border-orange-500/10 group-hover:bg-orange-500/20 transition-colors shadow-inner">
                                <span className="material-icons text-2xl text-orange-500">local_fire_department</span>
                            </div>
                            <div className="text-left">
                                <p className="text-sm font-black text-slate-900 dark:text-white leading-tight">Check-in</p>
                                <p className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest mt-0.5">Earn Points</p>
                            </div>
                        </button>

                        <button
                            onClick={() => navigate('/deploy')}
                            className="glass-effect dark:bg-slate-900/40 p-5 rounded-[2rem] border border-white/20 dark:border-white/5 flex flex-col items-start gap-3 hover:scale-[1.03] transition-all group active:scale-[0.97]"
                        >
                            <div className="w-12 h-12 rounded-2xl bg-indigo-500/10 flex items-center justify-center border border-indigo-500/10 group-hover:bg-indigo-500/20 transition-colors shadow-inner">
                                <span className="material-icons text-2xl text-indigo-500">rocket_launch</span>
                            </div>
                            <div className="text-left">
                                <p className="text-sm font-black text-slate-900 dark:text-white leading-tight">Smart Deploy</p>
                                <p className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest mt-0.5">Base Mainnet</p>
                            </div>
                        </button>
                    </div>
                </section>

                {/* Activity Section */}
                <section className="mb-12 animate-fade-in-up delay-400">
                    <div className="flex items-center justify-between mb-6">
                        <h3 className="font-black text-lg tracking-tight text-slate-900 dark:text-white px-1">
                            {activityFilter === 'Legends' ? 'My Legends' : 'Recent Activity'}
                        </h3>
                        {activities.length > 0 && (
                            <button className="text-[10px] font-black uppercase tracking-[0.15em] text-primary bg-primary/5 px-3 py-1.5 rounded-full">
                                History
                            </button>
                        )}
                    </div>

                    <div className="flex gap-2 mb-6 overflow-x-auto pb-2 scrollbar-hide">
                        {['All', 'Transaction', 'GM', 'Check-in', 'Legends'].map((tab) => (
                            <button
                                key={tab}
                                onClick={() => setActivityFilter(tab)}
                                className={`whitespace-nowrap px-4 py-2 rounded-xl text-[9px] font-black uppercase tracking-widest border transition-all ${activityFilter === tab
                                    ? 'bg-primary/10 border-primary/30 text-primary'
                                    : 'bg-white dark:bg-slate-900/40 border-slate-100 dark:border-white/5 text-slate-400 dark:text-slate-500'
                                    }`}
                            >
                                {tab} <span className="ml-1 opacity-50 tabular-nums">{counts[tab] ?? 0}</span>
                            </button>
                        ))}
                    </div>

                    <div className="space-y-4">
                        {activityFilter === 'Legends' ? (
                            legends.length === 0 ? (
                                <div className="text-center py-10 glass-effect rounded-[2rem] border-dashed border border-slate-200 dark:border-white/5">
                                    <span className="material-icons text-4xl text-slate-300 dark:text-slate-700 mb-3">auto_awesome</span>
                                    <p className="text-slate-500 font-bold text-sm tracking-tight px-6">Your collection is empty. Mint your first Legend!</p>
                                </div>
                            ) : (
                                <div className="grid grid-cols-2 gap-4">
                                    {legends.map((nft) => (
                                        <div key={nft.id} className="relative group/legend hover:scale-[1.05] transition-all duration-500">
                                            <div className="absolute inset-0 bg-primary/20 blur-xl rounded-[2rem] opacity-0 group-hover/legend:opacity-100 transition-opacity"></div>
                                            <div className="aspect-square rounded-[2rem] border-2 border-white dark:border-white/10 overflow-hidden relative shadow-2xl">
                                                <img
                                                    src={nft.image}
                                                    alt="Legend NFT"
                                                    className="w-full h-full object-cover"
                                                    onError={(e) => {
                                                        e.target.onerror = null;
                                                        e.target.src = '/images/hero.png';
                                                    }}
                                                />
                                                <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent flex items-end p-4">
                                                    <p className="text-[9px] font-black text-white uppercase tracking-widest">
                                                        {new Date(nft.mintedAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                                                    </p>
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )
                        ) : (
                            !isConnected ? (
                                <div className="text-center py-10 glass-effect rounded-[2rem] border-dashed border border-slate-200 dark:border-white/5">
                                    <span className="material-icons text-4xl text-slate-300 dark:text-slate-700 mb-3">lock</span>
                                    <p className="text-slate-500 font-bold text-sm tracking-tight px-6">Connect your wallet to track your onchain journey</p>
                                </div>
                            ) : activities.length === 0 ? (
                                <div className="text-center py-10 glass-effect rounded-[2rem] border-dashed border border-slate-200 dark:border-white/5">
                                    <span className="material-icons text-4xl text-slate-300 dark:text-slate-700 mb-3">waves</span>
                                    <p className="text-slate-500 font-bold text-sm tracking-tight px-6">Your activity feed is empty. Start with a GM!</p>
                                </div>
                            ) : (
                                visibleActivities.map((activity) => (
                                    <div
                                        key={activity.id}
                                        onClick={() => handleTxClick(activity)}
                                        className="flex items-center justify-between p-4 rounded-3xl glass-effect dark:bg-slate-900/20 border border-slate-100 dark:border-white/5 hover:border-primary/20 hover:bg-white dark:hover:bg-slate-900/40 transition-all cursor-pointer group active:scale-[0.98] relative overflow-hidden"
                                    >
                                        <div className="flex items-center gap-4">
                                            <div className={`w-12 h-12 rounded-2xl flex items-center justify-center shadow-inner ${activity.type === 'GM'
                                                ? 'bg-blue-500/10 text-blue-500'
                                                : activity.type === 'Check-in' ? 'bg-orange-500/10 text-orange-500' : 'bg-primary/10 text-primary'
                                                }`}>
                                                <span className="material-icons text-xl">{activity.icon || (activity.type === 'GM' ? 'send' : 'star')}</span>
                                            </div>
                                            <div>
                                                <h4 className="font-black text-sm text-slate-900 dark:text-white group-hover:text-primary transition-colors">{activity.title || activity.type}</h4>
                                                <p className="text-[10px] font-bold text-slate-400 dark:text-slate-500 mt-0.5 uppercase tracking-wider">{activity.timestamp || activity.time}</p>
                                            </div>
                                        </div>
                                        <div className="text-right">
                                            <p className="font-black text-sm text-slate-900 dark:text-white tracking-tighter">{activity.amount}</p>
                                            <div className="flex items-center justify-end gap-1 mt-1">
                                                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                                                <p className="text-[8px] font-black text-emerald-500 uppercase tracking-widest">Success</p>
                                            </div>
                                        </div>
                                    </div>
                                ))
                            )
                        )}
                    </div>
                </section>

                {/* Modals */}
                {showReceiveModal && (
                    <div className="fixed inset-0 z-[100] flex items-end justify-center px-4 pb-12 sm:items-center sm:pb-0">
                        <div className="fixed inset-0 bg-slate-950/40 backdrop-blur-md transition-opacity" onClick={() => setShowReceiveModal(false)}></div>
                        <div className="relative w-full max-w-sm glass-effect dark:bg-slate-900/95 p-8 rounded-[3.5rem] border border-white/20 dark:border-white/10 shadow-3xl animate-in fade-in slide-in-from-bottom-20 duration-500 backdrop-blur-[40px]">
                            <div className="flex flex-col items-center text-center">
                                <div className="absolute top-6 right-6">
                                    <button onClick={() => setShowReceiveModal(false)} className="w-10 h-10 rounded-full bg-white/5 hover:bg-white/10 flex items-center justify-center text-slate-400 transition-colors">
                                        <span className="material-icons text-xl">close</span>
                                    </button>
                                </div>
                                <div className="w-16 h-1 bg-slate-200 dark:bg-slate-800 rounded-full mb-10 opacity-50"></div>
                                <h3 className="text-3xl font-black text-slate-900 dark:text-white mb-2 tracking-tighter">Receive Assets</h3>
                                <p className="text-slate-500 dark:text-slate-400 text-xs mb-10 font-bold px-6 leading-relaxed">Scan your unique Base identity to receive assets instantly into your safe.</p>

                                <div className="relative mb-12">
                                    <div className="absolute inset-0 bg-primary/20 blur-3xl rounded-full scale-150 animate-pulse"></div>
                                    <div className="relative bg-white p-7 rounded-[3rem] shadow-2xl border-4 border-slate-50 ring-8 ring-primary/5">
                                        {address ? <QRCodeSVG value={address} size={180} level="H" /> : <div className="w-[180px] h-[180px] flex items-center justify-center"><span className="material-icons text-6xl text-slate-200">wallet</span></div>}
                                    </div>
                                </div>

                                <div className="w-full bg-slate-50 dark:bg-slate-800/50 p-6 rounded-3xl border border-slate-100 dark:border-white/5 mb-10 text-left shadow-inner relative overflow-hidden group">
                                    <div className="absolute inset-0 bg-primary/5 translate-y-full group-hover:translate-y-0 transition-transform duration-500"></div>
                                    <p className="relative text-[9px] font-black text-primary uppercase tracking-[0.25em] mb-4">Your Public Safe Address</p>
                                    <div className="relative flex items-center justify-between gap-4">
                                        <span className="text-[11px] font-black text-slate-900 dark:text-white font-mono break-all leading-tight opacity-80">{address || 'Connecting...'}</span>
                                        <button onClick={() => copyToClipboardText(address)} className={`h-11 w-11 flex-shrink-0 rounded-2xl transition-all shadow-lg ${copied ? 'bg-emerald-500 text-white' : 'bg-primary text-white hover:bg-indigo-600'}`}>
                                            <span className="material-icons text-xl">{copied ? 'check' : 'content_copy'}</span>
                                        </button>
                                    </div>
                                </div>
                                <button onClick={() => setShowReceiveModal(false)} className="w-full h-15 rounded-2xl bg-slate-900 dark:bg-white text-white dark:text-slate-900 font-black text-xs uppercase tracking-[0.25em] active:scale-[0.98] transition-all">Done</button>
                            </div>
                        </div>
                    </div>
                )}

                {showSendModal && (
                    <div className="fixed inset-0 z-[100] flex items-end justify-center px-4 pb-12 sm:items-center sm:pb-0">
                        <div className="fixed inset-0 bg-slate-950/40 backdrop-blur-md transition-opacity" onClick={() => setShowSendModal(false)}></div>
                        <div className="relative w-full max-w-sm glass-effect dark:bg-slate-900/95 p-8 rounded-[3.5rem] border border-white/20 dark:border-white/10 shadow-3xl animate-in fade-in slide-in-from-bottom-20 duration-500 backdrop-blur-[40px]">
                            <div className="flex justify-between items-center mb-12">
                                <h3 className="text-3xl font-black text-slate-900 dark:text-white tracking-tighter">Transfer</h3>
                                <button onClick={() => setShowSendModal(false)} className="w-10 h-10 rounded-full bg-white/5 hover:bg-white/10 flex items-center justify-center text-slate-400 transition-colors">
                                    <span className="material-icons">close</span>
                                </button>
                            </div>
                            <div className="space-y-8">
                                <div className="group">
                                    <div className="flex items-center gap-1.5 mb-4 ml-1">
                                        <span className="material-icons text-[12px] text-slate-400 uppercase">person</span>
                                        <p className="text-[9px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-[0.2em]">Recipient Address</p>
                                    </div>
                                    <div className="relative">
                                        <input
                                            type="text"
                                            placeholder="0x... or ENS name"
                                            value={sendAddress}
                                            onChange={(e) => setSendAddress(e.target.value)}
                                            className="w-full h-16 bg-slate-50 dark:bg-slate-800/80 rounded-2xl px-6 pr-12 text-sm font-black text-slate-900 dark:text-white border border-slate-100 dark:border-white/10 outline-none focus:ring-4 focus:ring-primary/10 focus:border-primary/30 transition-all shadow-inner"
                                        />
                                        <span className="absolute right-5 top-1/2 -translate-y-1/2 material-icons text-slate-300 dark:text-slate-600">contact_page</span>
                                    </div>
                                </div>
                                <div>
                                    <div className="flex justify-between items-center mb-4 px-1">
                                        <div className="flex items-center gap-1.5">
                                            <span className="material-icons text-[12px] text-slate-400">payments</span>
                                            <p className="text-[9px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-[0.2em]">Amount</p>
                                        </div>
                                        <button onClick={handleMaxAmount} className="text-[9px] font-black text-primary uppercase tracking-[0.15em] bg-primary/5 px-3 py-1.5 rounded-xl hover:bg-primary/10 transition-colors">
                                            Available: {balance ? parseFloat(balance.formatted).toFixed(4) : '0'}
                                        </button>
                                    </div>
                                    <div className="relative group">
                                        <input
                                            type="number"
                                            placeholder="0.00"
                                            value={sendAmount}
                                            onChange={(e) => setSendAmount(e.target.value)}
                                            className="w-full h-20 bg-slate-50 dark:bg-slate-800/80 rounded-3xl px-8 text-4xl font-black text-slate-900 dark:text-white border border-slate-100 dark:border-white/10 outline-none focus:ring-4 focus:ring-primary/10 transition-all shadow-inner"
                                        />
                                        <div className="absolute right-8 top-1/2 -translate-y-1/2 bg-white/5 px-4 py-2 rounded-2xl border border-white/5">
                                            <span className="font-black text-primary tracking-widest text-[11px]">ETH</span>
                                        </div>
                                    </div>
                                </div>
                                <button onClick={handleSend} disabled={!sendAddress || !sendAmount || isSending} className="w-full h-18 btn-premium rounded-2xl mt-8 shadow-2xl shadow-primary/20">
                                    {isSending ? <div className="w-6 h-6 border-3 border-white/30 border-t-white rounded-full animate-spin mx-auto"></div> : (
                                        <div className="flex items-center justify-center gap-3">
                                            <span className="material-icons text-xl">send</span>
                                            <span className="tracking-[0.2em]">Confirm Transfer</span>
                                        </div>
                                    )}
                                </button>
                            </div>
                        </div>
                    </div>
                )}

                {showTxModal && selectedTx && (
                    <div className="fixed inset-0 z-[110] flex items-center justify-center p-4 bg-slate-950/40 backdrop-blur-md animate-in fade-in duration-300">
                        <div className="fixed inset-0" onClick={() => setShowTxModal(false)}></div>
                        <div className="relative w-full max-w-sm glass-effect dark:bg-slate-900/95 rounded-[3.5rem] p-8 shadow-3xl animate-in slide-in-from-bottom-10 duration-500 backdrop-blur-[40px] border border-white/10">
                            <div className="flex items-center justify-between mb-10">
                                <h3 className="text-2xl font-black text-slate-900 dark:text-white uppercase tracking-tighter">Transaction</h3>
                                <button onClick={() => setShowTxModal(false)} className="w-10 h-10 rounded-full bg-white/5 hover:bg-white/10 flex items-center justify-center text-slate-500 transition-colors">
                                    <span className="material-icons">close</span>
                                </button>
                            </div>
                            <div className="space-y-8">
                                <div className="p-5 bg-slate-50 dark:bg-slate-800/60 rounded-3xl border border-slate-100 dark:border-white/5 shadow-inner">
                                    <p className="text-[9px] font-black text-slate-400 uppercase tracking-[0.25em] mb-3 opacity-60">Internal Reference</p>
                                    <code className="text-[11px] font-black text-slate-900 dark:text-white break-all leading-tight opacity-90">{selectedTx.transactionHash || selectedTx.id}</code>
                                </div>
                                <div className="grid grid-cols-2 gap-y-8 gap-x-4">
                                    <div>
                                        <p className="text-[9px] font-black text-slate-400 uppercase tracking-[0.25em] mb-2 opacity-60">Verification</p>
                                        <div className="flex items-center gap-2 font-black text-emerald-500 text-[11px] uppercase tracking-widest">
                                            <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></div> Confirmed
                                        </div>
                                    </div>
                                    <div>
                                        <p className="text-[9px] font-black text-slate-400 uppercase tracking-[0.25em] mb-2 opacity-60">Network</p>
                                        <p className="font-black text-[11px] text-slate-900 dark:text-white uppercase tracking-widest">Base Mainnet</p>
                                    </div>
                                    <div>
                                        <p className="text-[9px] font-black text-slate-400 uppercase tracking-[0.25em] mb-2 opacity-60">Method</p>
                                        <p className="font-black text-[11px] text-slate-900 dark:text-white uppercase tracking-widest">{selectedTx.type}</p>
                                    </div>
                                    <div>
                                        <p className="text-[9px] font-black text-slate-400 uppercase tracking-[0.25em] mb-2 opacity-60">Value</p>
                                        <p className="font-black text-sm text-primary tracking-tighter">{selectedTx.amount}</p>
                                    </div>
                                </div>
                                {txExplorerUrl && (
                                    <a href={txExplorerUrl} target="_blank" rel="noopener noreferrer" className="w-full h-16 bg-slate-100 dark:bg-white text-slate-900 dark:text-slate-900 rounded-2xl flex items-center justify-center gap-3 font-black text-[10px] uppercase tracking-[0.2em] active:scale-[0.98] transition-all shadow-xl shadow-slate-900/5">
                                        <span className="material-icons text-lg">public</span> Onchain View
                                    </a>
                                )}
                            </div>
                        </div>
                    </div>
                )}
            </main>
        </div>
    );
};

export default HomePage;
