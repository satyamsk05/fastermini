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
    const { sendTransaction: sendMintTransaction, isLoading: isMinting } = useSendTransaction();
    const { switchChain } = useSwitchChain();
    const [showReceiveModal, setShowReceiveModal] = useState(false);
    const [showSendModal, setShowSendModal] = useState(false);
    const [showMintModal, setShowMintModal] = useState(false);
    const [sendAddress, setSendAddress] = useState('');
    const [sendAmount, setSendAmount] = useState('');
    const [selectedChain, setSelectedChain] = useState('base');
    const [selectedTx, setSelectedTx] = useState(null);
    const [showTxModal, setShowTxModal] = useState(false);
    const [activityFilter, setActivityFilter] = useState('All');
    const [mintImageUrl, setMintImageUrl] = useState(`https://picsum.photos/seed/${Math.random().toString(36).slice(2)}/400/400`);
    const [txFee, setTxFee] = useState(null);
    const publicClient = usePublicClient();
    const [txReceipt, setTxReceipt] = useState(null);
    const [txExplorerUrl, setTxExplorerUrl] = useState(null);
    const [mintFee, setMintFee] = useState(null);

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
            // Optional: Switch chain if needed
            const targetChainId = selectedChain === 'base' ? base.id : mainnet.id;

            sendTransaction({
                to: sendAddress,
                value: parseEther(sendAmount),
            }, {
                onSuccess: (hash) => {
                    addActivity({
                        id: Date.now().toString(),
                        type: 'Transaction',
                        title: `Sent ETH`,
                        amount: `-${sendAmount} ETH`,
                        time: 'Just now',
                        status: 'Success',
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
    const [copied, setCopied] = useState(false);

    const copyToClipboardText = (text) => {
        if (!text || typeof text !== 'string') return;
        navigator.clipboard.writeText(text);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };
    const NFT_CONTRACT = '0x354F55a1DDfC9d2F62068eC1385e8c3124CABC78';
    const nftAbi = [
        {
            type: 'function',
            name: 'mint',
            stateMutability: 'payable',
            inputs: [],
            outputs: [],
        },
    ];
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
    const mintCalls = [
        {
            to: NFT_CONTRACT,
            data: encodeFunctionData({
                abi: nftAbi,
                functionName: 'mint',
                args: [],
            }),
            value: parseEther('0.00001'),
        },
    ];

    const handleMint = async () => {
        try {
            sendMintTransaction({
                to: NFT_CONTRACT,
                data: encodeFunctionData({
                    abi: nftAbi,
                    functionName: 'mint',
                    args: [],
                }),
                value: parseEther('0.00001'),
            }, {
                onSuccess: (hash) => {
                    addActivity({
                        id: Date.now().toString(),
                        type: 'Transaction',
                        title: 'Minted OG NFT',
                        amount: '-0.00001 ETH',
                        time: 'Just now',
                        status: 'Success',
                        icon: 'auto_awesome',
                        transactionHash: hash,
                    });
                    setShowMintModal(false);
                }
            });
        } catch (error) {
            // silent
        }
    };

    useEffect(() => {
        const estimateMint = async () => {
            try {
                if (!showMintModal || !publicClient || !address) return;
                const req = {
                    account: address,
                    to: NFT_CONTRACT,
                    data: encodeFunctionData({ abi: nftAbi, functionName: 'mint', args: [] }),
                    value: parseEther('0.00001'),
                };
                const gas = await publicClient.estimateGas(req);
                const gasPrice = await publicClient.getGasPrice();
                const feeWei = gas * gasPrice;
                const feeEth = Number(formatEther(feeWei));
                const gasPriceGwei = Number(gasPrice) / 1e9;
                setMintFee({ feeEth, gas: gas.toString(), gasPriceGwei });
            } catch {
                setMintFee(null);
            }
        };
        estimateMint();
    }, [showMintModal, publicClient, address]);

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

    // Filter activities to show only unique transactions
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
    };
    const visibleActivities = uniqueActivities.filter((a) => {
        if (activityFilter === 'All') return true;
        return a.type === activityFilter;
    });
    const { data: balance } = useBalance({
        address: address,
    });

    // Generate a random 3D-style avatar using DiceBear
    const avatarUrl = address
        ? `https://api.dicebear.com/7.x/notionists/svg?seed=${address}&backgroundColor=b6e3f4,c0aede,d1d4f9`
        : `https://api.dicebear.com/7.x/notionists/svg?seed=guest&backgroundColor=b6e3f4`;

    return (
        <div className="flex flex-col h-full w-full max-w-full bg-background-light dark:bg-background-dark overflow-hidden fixed inset-0">
            <div className="bg-orb bg-primary/30 -top-20 -right-20"></div>
            <div className="bg-orb bg-primary/20 top-1/2 -left-20"></div>

            <main className="flex-1 overflow-y-auto px-4 pb-24 w-full">
                <header className="flex justify-between items-center mb-6 pt-4">
                    <div className="flex flex-col">
                        <p className="text-[9px] font-black text-primary/80 dark:text-primary/70 uppercase tracking-[0.2em] mb-0.5">
                            {new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric' })}
                        </p>
                        <h1 className="text-xl font-extrabold tracking-tight text-slate-900 dark:text-white leading-tight">
                            {context?.user?.displayName ? `Hello, ${context.user.displayName}` : (isConnected ? `Hello, ${userName}` : 'Good morning')}
                        </h1>

                    </div>
                    <div className="flex items-center gap-2">
                        <Wallet>
                            <ConnectWallet className="bg-blue-500 hover:bg-blue-600 text-white rounded-full p-0 h-auto min-w-0 border-none">
                                <div className="flex items-center gap-2 pl-1.5 pr-3 py-1">
                                    <Avatar className="h-7 w-7" />
                                    <Name className="text-[10px] font-black text-white" />
                                </div>
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

                <section className="glass-effect dark:bg-slate-900/60 rounded-3xl p-5 mb-6 border border-white dark:border-white/5 relative overflow-hidden group">
                    <div className="absolute top-0 right-0 w-24 h-24 bg-primary/10 blur-2xl rounded-full -mr-10 -mt-10 group-hover:bg-primary/20 transition-colors"></div>

                    <div className="relative z-10">
                        <div className="flex justify-between items-start mb-4">
                            <div>
                                <p className="text-slate-500 dark:text-slate-400 text-[10px] font-bold uppercase tracking-[0.2em] mb-1">Total Balance</p>
                                <div className="flex items-baseline gap-1">
                                    <h3 className="text-3xl font-black text-slate-900 dark:text-white tracking-tight">{balance ? parseFloat(balance.formatted).toFixed(4) : '0.0000'}</h3>
                                    <span className="text-xs font-bold text-primary">ETH</span>
                                </div>
                            </div>
                            <div className="bg-green-500/10 text-green-600 dark:text-green-400 px-2 py-0.5 rounded-full text-[10px] font-bold border border-green-500/20">
                                +2.5%
                            </div>
                        </div>

                        <div className="flex gap-3">
                            <button
                                onClick={() => setShowReceiveModal(true)}
                                className="flex-1 glossy-button h-12 rounded-xl font-bold flex items-center justify-center gap-2 shadow-lg shadow-primary/25 text-sm"
                            >
                                <span className="material-icons text-lg">qr_code_2</span>
                                Receive
                            </button>
                            <button
                                onClick={() => setShowSendModal(true)}
                                className="flex-1 bg-slate-900 dark:bg-white text-white dark:text-slate-900 h-12 rounded-xl font-bold flex items-center justify-center gap-2 active:scale-95 transition-all shadow-lg dark:shadow-white/5 text-sm"
                            >
                                <span className="material-icons text-lg">north_east</span>
                                Send
                            </button>
                        </div>
                    </div>
                </section>

                <div className="mb-8">
                    <button
                        onClick={() => navigate('/mint')}
                        className="glossy-button w-full py-3.5 rounded-2xl text-white font-extrabold text-base flex items-center justify-center gap-2 transition-transform active:scale-95 shadow-lg shadow-primary/20"
                    >
                        <span className="material-icons text-lg">bolt</span>
                        Mint OG NFT
                    </button>
                </div>

                <section className="mb-16">
                    <div className="flex items-center justify-between mb-4">
                        <h3 className="font-black text-lg text-slate-900 dark:text-white">Recent Activity</h3>
                        {activities.length > 0 && <button className="text-primary text-[10px] font-bold uppercase tracking-widest">View All</button>}
                    </div>
                    {activities.length > 0 && (
                        <div className="flex gap-2 mb-3">
                            {['All', 'Transaction', 'GM', 'Check-in'].map((tab) => (
                                <button
                                    key={tab}
                                    onClick={() => setActivityFilter(tab)}
                                    className={`px-2.5 py-1.5 rounded-lg text-[9px] font-black uppercase tracking-widest border transition-all ${activityFilter === tab
                                        ? 'bg-primary/10 border-primary text-primary'
                                        : 'bg-slate-100 dark:bg-white/5 border-transparent text-slate-500 dark:text-slate-400'
                                        }`}
                                >
                                    {tab} <span className="ml-1 text-[8px] font-bold">({counts[tab] ?? 0})</span>
                                </button>
                            ))}
                        </div>
                    )}
                    <div className="space-y-3">
                        {!isConnected ? (
                            <div className="text-center py-8 glass-effect dark:bg-slate-900/40 rounded-3xl border-dashed border-2 border-slate-200 dark:border-white/5">
                                <div className="w-16 h-16 bg-slate-50 dark:bg-slate-800/50 rounded-full flex items-center justify-center mx-auto mb-3 border border-slate-100 dark:border-white/5">
                                    <span className="material-icons text-2xl text-slate-300 dark:text-slate-600">history</span>
                                </div>
                                <p className="text-slate-500 dark:text-slate-400 font-bold text-sm">Connect wallet to see activity</p>
                            </div>
                        ) : activities.length === 0 ? (
                            <div className="text-center py-8 glass-effect dark:bg-slate-900/40 rounded-3xl border-dashed border-2 border-slate-200 dark:border-white/5 shadow-sm">
                                <div className="w-16 h-16 bg-slate-50 dark:bg-slate-800/50 rounded-full flex items-center justify-center mx-auto mb-3 border border-slate-100 dark:border-white/5">
                                    <span className="material-icons text-2xl text-slate-300 dark:text-slate-600">auto_awesome</span>
                                </div>
                                <p className="text-slate-500 dark:text-slate-400 font-bold text-sm">No activity yet. Start by sending a GM!</p>
                            </div>
                        ) : (
                            visibleActivities.map((activity) => (
                                <div
                                    key={activity.id}
                                    onClick={() => handleTxClick(activity)}
                                    className="flex items-center justify-between p-4 rounded-2xl glass-effect dark:bg-slate-900/50 border border-slate-100 dark:border-white/5 hover:scale-[1.02] transition-all cursor-pointer group active:scale-95 relative overflow-hidden"
                                >
                                    {activity.type === 'Check-in' && activity.points > 0 && (
                                        <div className="absolute top-0 right-0 bg-primary/10 dark:bg-primary/20 text-primary text-[8px] font-black px-2 py-0.5 rounded-bl-xl flex items-center gap-1 border-l border-b border-primary/10">
                                            <span className="material-icons text-[8px]">add</span>
                                            {activity.points} PTS
                                        </div>
                                    )}
                                    <div className="flex items-center gap-3">
                                        <div className={`w-10 h-10 rounded-xl flex items-center justify-center shadow-inner ${activity.type === 'GM'
                                            ? 'bg-blue-50 dark:bg-blue-500/10 text-blue-500'
                                            : 'bg-orange-50 dark:bg-orange-500/10 text-orange-500'
                                            }`}>
                                            <span className="material-icons text-lg">{activity.type === 'GM' ? 'send' : 'local_fire_department'}</span>
                                        </div>
                                        <div>
                                            <h4 className="font-bold text-sm text-slate-900 dark:text-white group-hover:text-primary transition-colors">{activity.type === 'GM' ? `Sent GM: ${activity.text}` : 'Check-in'}</h4>
                                            <p className="text-[10px] font-semibold text-slate-500 dark:text-slate-400 mt-0.5">{activity.timestamp}</p>
                                        </div>
                                    </div>
                                    <div className="text-right">
                                        <p className="font-black text-sm text-slate-900 dark:text-white">{activity.amount}</p>
                                        {activity.transactionHash && (
                                            <a
                                                href={`https://basescan.org/tx/${activity.transactionHash}`}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                className="block text-[8px] font-bold text-primary uppercase tracking-tighter underline decoration-primary/30"
                                            >
                                                ...{activity.transactionHash.slice(-5)}
                                            </a>
                                        )}
                                        <p className="text-[8px] font-bold text-green-500 uppercase tracking-tighter">Success</p>
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                </section>

                <section className="mb-6">
                    <div className="flex items-center justify-between mb-3">
                        <h3 className="font-black text-lg text-slate-900 dark:text-white">Routines</h3>
                        <button className="text-primary text-[10px] font-bold uppercase tracking-widest">Manage</button>
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                        <button
                            onClick={() => navigate('/checkin')}
                            className="glass-effect dark:bg-slate-900/40 p-4 rounded-3xl border border-white/20 dark:border-white/5 flex flex-col items-start gap-2 hover:scale-[1.02] transition-all group relative overflow-hidden"
                        >
                            <div className="absolute top-0 right-0 bg-orange-500/10 text-orange-600 dark:text-orange-400 text-[9px] font-black px-2 py-0.5 rounded-bl-xl border-l border-b border-orange-200 dark:border-orange-500/20">
                                {checkInData?.streak ?? 0} Day
                            </div>
                            <div className="w-9 h-9 rounded-xl bg-orange-50 dark:bg-orange-500/10 flex items-center justify-center border border-orange-100 dark:border-orange-500/20 group-hover:bg-orange-100 dark:group-hover:bg-orange-500/20 transition-colors">
                                <span className="material-icons text-lg text-orange-500">local_fire_department</span>
                            </div>
                            <div className="text-left">
                                <p className="text-xs font-black text-slate-900 dark:text-white">Daily Check-in</p>
                                <p className="text-[9px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-tight">Earn Points</p>
                            </div>
                        </button>

                        <button
                            onClick={() => navigate('/deploy')}
                            className="glass-effect dark:bg-slate-900/40 p-4 rounded-3xl border border-white/20 dark:border-white/5 flex flex-col items-start gap-2 hover:scale-[1.02] transition-all group"
                        >
                            <div className="w-9 h-9 rounded-xl bg-purple-50 dark:bg-purple-500/10 flex items-center justify-center border border-purple-100 dark:border-purple-500/20 group-hover:bg-purple-100 dark:group-hover:bg-purple-500/20 transition-colors">
                                <span className="material-icons text-lg text-purple-500">rocket_launch</span>
                            </div>
                            <div className="text-left">
                                <p className="text-xs font-black text-slate-900 dark:text-white">Smart Deploy</p>
                                <p className="text-[9px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-tight">Base Mainnet</p>
                            </div>
                        </button>
                    </div>
                </section>

                {/* Receive Modal */}
                {showReceiveModal && (
                    <div className="fixed inset-0 z-[100] flex items-end justify-center px-4 pb-10 sm:items-center sm:pb-0">
                        <div
                            className="fixed inset-0 bg-slate-950/40 backdrop-blur-sm transition-opacity"
                            onClick={() => setShowReceiveModal(false)}
                        ></div>

                        <div className="relative w-full max-w-sm glass-effect dark:bg-slate-900/90 p-8 rounded-[3rem] border border-white/20 dark:border-white/10 shadow-2xl animate-in fade-in slide-in-from-bottom-10 duration-300 -translate-y-16 sm:-translate-y-20">
                            <div className="flex flex-col items-center text-center">
                                <div className="w-12 h-1.5 bg-slate-200 dark:bg-slate-800 rounded-full mb-8 sm:hidden"></div>

                                <h3 className="text-2xl font-black text-slate-900 dark:text-white mb-2">Receive Assets</h3>
                                <p className="text-slate-500 dark:text-slate-400 text-sm mb-8 font-medium">Scan QR code or copy address to receive funds on Base</p>

                                <div className="bg-white p-6 rounded-[2.5rem] shadow-inner mb-8 border-4 border-slate-50">
                                    {address ? (
                                        <QRCodeSVG
                                            value={address}
                                            size={200}
                                            level="H"
                                            includeMargin={false}
                                            className="rounded-lg"
                                        />
                                    ) : (
                                        <div className="w-[200px] h-[200px] flex items-center justify-center text-slate-300">
                                            <span className="material-icons text-6xl">account_balance_wallet</span>
                                        </div>
                                    )}
                                </div>

                                <div className="w-full bg-slate-100 dark:bg-white/5 p-4 rounded-2xl border border-slate-200 dark:border-white/5 mb-6">
                                    <p className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest mb-2 text-left px-1">Your EVM Address</p>
                                    <div className="flex items-center justify-between gap-3">
                                        <div className="flex items-center gap-3">
                                            <div className="w-9 h-9 rounded-full overflow-hidden ring-2 ring-blue-400/30">
                                                <Avatar className="w-9 h-9" address={address} />
                                            </div>
                                            <span className="text-xs font-black text-slate-900 dark:text-white">
                                                {address ? `${address.slice(0, 6)}...${address.slice(-4)}` : 'Connect wallet first'}
                                            </span>
                                        </div>
                                        <button
                                            onClick={() => copyToClipboardText(address)}
                                            className={`p-2 rounded-xl transition-all ${copied ? 'bg-green-500 text-white' : 'bg-primary/10 text-primary hover:bg-primary/20'}`}
                                        >
                                            <span className="material-icons text-sm">{copied ? 'done' : 'content_copy'}</span>
                                        </button>
                                    </div>
                                </div>

                                <button
                                    onClick={() => setShowReceiveModal(false)}
                                    className="w-full py-4 rounded-2xl bg-slate-900 dark:bg-white text-white dark:text-slate-900 font-black text-sm transition-all active:scale-95"
                                >
                                    Done
                                </button>
                            </div>
                        </div>
                    </div>
                )}

                {/* Send Modal */}
                {showSendModal && (
                    <div className="fixed inset-0 z-[100] flex items-end justify-center px-4 pb-10 sm:items-center sm:pb-0">
                        <div
                            className="fixed inset-0 bg-slate-950/40 backdrop-blur-sm transition-opacity"
                            onClick={() => setShowSendModal(false)}
                        ></div>

                        <div className="relative w-full max-w-sm glass-effect dark:bg-slate-900/90 p-8 rounded-[3rem] border border-white/20 dark:border-white/10 shadow-2xl animate-in fade-in slide-in-from-bottom-10 duration-300 -translate-y-8 sm:-translate-y-12">
                            <div className="flex justify-between items-center mb-6 px-1">
                                <h3 className="text-2xl font-black text-slate-900 dark:text-white">Send ETH</h3>
                                <button onClick={() => setShowSendModal(false)} className="w-10 h-10 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-500 dark:text-slate-400 active:scale-90 transition-all">
                                    <span className="material-icons">close</span>
                                </button>
                            </div>

                            <div className="space-y-6">
                                {/* Chain Selection */}
                                <div>
                                    <p className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest mb-3 ml-1">Select Network</p>
                                    <div className="flex gap-2">
                                        <button
                                            onClick={() => setSelectedChain('base')}
                                            className={`flex-1 h-12 rounded-xl font-bold text-[10px] uppercase tracking-wider flex items-center justify-center gap-2 transition-all border ${selectedChain === 'base'
                                                ? 'bg-primary/10 border-primary text-primary'
                                                : 'bg-slate-100 dark:bg-white/5 border-transparent text-slate-400'
                                                }`}
                                        >
                                            <div className={`w-2 h-2 rounded-full ${selectedChain === 'base' ? 'bg-primary animate-pulse' : 'bg-slate-400'}`}></div>
                                            Base
                                        </button>
                                        <button
                                            onClick={() => setSelectedChain('eth')}
                                            className={`flex-1 h-12 rounded-xl font-bold text-[10px] uppercase tracking-wider flex items-center justify-center gap-2 transition-all border ${selectedChain === 'eth'
                                                ? 'bg-primary/10 border-primary text-primary'
                                                : 'bg-slate-100 dark:bg-white/5 border-transparent text-slate-400'
                                                }`}
                                        >
                                            <div className={`w-2 h-2 rounded-full ${selectedChain === 'eth' ? 'bg-primary animate-pulse' : 'bg-slate-400'}`}></div>
                                            Ethereum
                                        </button>
                                    </div>
                                </div>

                                {/* Receiver Address */}
                                <div>
                                    <p className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest mb-3 ml-1">Receiver Address</p>
                                    <div className="relative">
                                        <input
                                            type="text"
                                            placeholder="0x... or ENS name"
                                            value={sendAddress}
                                            onChange={(e) => setSendAddress(e.target.value)}
                                            className="w-full h-14 bg-slate-100 dark:bg-white/5 rounded-2xl px-5 text-sm font-bold text-slate-900 dark:text-white border border-slate-200 dark:border-white/5 focus:ring-2 focus:ring-primary/20 outline-none transition-all placeholder:text-slate-300 dark:placeholder:text-slate-600"
                                        />
                                        <button className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400">
                                            <span className="material-icons text-xl">qr_code_scanner</span>
                                        </button>
                                    </div>
                                </div>

                                {/* Amount */}
                                <div>
                                    <div className="flex justify-between items-center mb-3 px-1">
                                        <p className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest">Amount (ETH)</p>
                                        <button
                                            onClick={handleMaxAmount}
                                            className="text-[10px] font-black text-primary uppercase tracking-widest bg-primary/10 px-3 py-1 rounded-full hover:bg-primary/20 transition-all"
                                        >
                                            Max: {balance ? parseFloat(balance.formatted).toFixed(6) : '0.000000'}
                                        </button>
                                    </div>
                                    <div className="relative">
                                        <input
                                            type="number"
                                            placeholder="0.00"
                                            value={sendAmount}
                                            onChange={(e) => setSendAmount(e.target.value)}
                                            step="0.000001"
                                            min="0.000001"
                                            inputMode="decimal"
                                            className="w-full h-16 bg-slate-100 dark:bg-white/5 rounded-2xl px-5 text-2xl font-black text-slate-900 dark:text-white border border-slate-200 dark:border-white/5 focus:ring-2 focus:ring-primary/20 outline-none transition-all"
                                        />
                                        <span className="absolute right-5 top-1/2 -translate-y-1/2 font-black text-slate-300 dark:text-slate-600">ETH</span>
                                    </div>
                                </div>

                                <button
                                    onClick={handleSend}
                                    className="w-full h-16 glossy-button rounded-2xl font-black text-lg flex items-center justify-center gap-3 shadow-xl shadow-primary/30 mt-4 disabled:opacity-50 disabled:active:scale-100 disabled:grayscale transition-all"
                                    disabled={!sendAddress || !sendAmount || isSending}
                                >
                                    {isSending ? (
                                        <div className="w-6 h-6 border-4 border-white/30 border-t-white rounded-full animate-spin"></div>
                                    ) : (
                                        <span className="material-icons">send</span>
                                    )}
                                    {isSending ? 'Sending...' : 'Send Now'}
                                </button>
                            </div>
                        </div>
                    </div>
                )}

                {/* Mint modal removed; navigation to dedicated MintPage */}

                {/* Transaction Detail Modal */}
                {showTxModal && selectedTx && (
                    <div className="fixed inset-0 z-[110] flex items-center justify-center p-4 bg-slate-950/40 backdrop-blur-sm animate-in fade-in duration-300">
                        <div
                            className="fixed inset-0"
                            onClick={() => setShowTxModal(false)}
                        ></div>
                        <div
                            className="relative w-full max-w-sm bg-white dark:bg-slate-900 rounded-[3rem] p-8 shadow-2xl animate-in slide-in-from-bottom-10 duration-500 overflow-hidden -translate-y-8 sm:-translate-y-12"
                            onClick={(e) => e.stopPropagation()}
                        >
                            {/* Header */}
                            <div className="flex items-center justify-between mb-8">
                                <h3 className="text-xl font-black text-slate-900 dark:text-white">Details</h3>
                                <button
                                    onClick={() => setShowTxModal(false)}
                                    className="w-10 h-10 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-500 hover:text-slate-900 dark:hover:text-white transition-colors active:scale-90"
                                >
                                    <span className="material-icons">close</span>
                                </button>
                            </div>

                            <div className="space-y-6">
                                {/* From Section */}
                                <div className="space-y-1">
                                    <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">From</p>
                                    <div className="flex items-center justify-between p-3 bg-slate-50 dark:bg-white/5 rounded-2xl border border-slate-100 dark:border-white/5">
                                        <code className="text-xs font-mono text-slate-600 dark:text-slate-300 break-all leading-relaxed flex-1">
                                            {address}
                                        </code>
                                        <button
                                            onClick={() => copyToClipboardText(address)}
                                            className="ml-3 p-2 text-slate-400 hover:text-primary transition-colors active:scale-90"
                                        >
                                            <span className="material-icons text-lg">content_copy</span>
                                        </button>
                                    </div>
                                </div>

                                {/* Interacted With Section */}
                                <div className="space-y-1">
                                    <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Interacted with</p>
                                    <div className="flex items-center justify-between p-3 bg-slate-50 dark:bg-white/5 rounded-2xl border border-slate-100 dark:border-white/5">
                                        <code className="text-xs font-mono text-slate-600 dark:text-slate-300 break-all leading-relaxed flex-1">
                                            {selectedTx.to || address}
                                        </code>
                                        <button
                                            onClick={() => copyToClipboardText(selectedTx.to || address)}
                                            className="ml-3 p-2 text-slate-400 hover:text-primary transition-colors active:scale-90"
                                        >
                                            <span className="material-icons text-lg">content_copy</span>
                                        </button>
                                    </div>
                                </div>

                                <div className="h-px bg-slate-100 dark:bg-white/5 my-2"></div>

                                {/* Details Grid */}
                                <div className="grid grid-cols-2 gap-y-6 gap-x-4">
                                    <div className="space-y-1">
                                        <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Time</p>
                                        <p className="text-xs font-black text-slate-900 dark:text-white">{selectedTx.timestamp || new Date().toLocaleString()}</p>
                                    </div>
                                    <div className="space-y-1">
                                        <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Type</p>
                                        <p className="text-xs font-black text-slate-900 dark:text-white">{selectedTx.type || 'Contract interaction'}</p>
                                    </div>
                                    {selectedTx.type === 'Check-in' && (
                                        <div className="space-y-1">
                                            <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Points Earned</p>
                                            <p className="text-xs font-black text-orange-500 flex items-center gap-1">
                                                <span className="material-icons text-xs">stars</span>
                                                +{selectedTx.points} Points
                                            </p>
                                        </div>
                                    )}
                                    <div className="space-y-1">
                                        <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Network fee</p>
                                        <p className="text-xs font-black text-slate-900 dark:text-white">{txFee ? `≈ ${txFee.feeEth.toFixed(6)} ETH` : 'Estimating...'}</p>
                                        {txFee && <p className="text-[10px] font-bold text-slate-400">Gas: {txFee.gas} • {txFee.gasPriceGwei.toFixed(2)} gwei</p>}
                                    </div>
                                    <div className="space-y-1">
                                        <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Network</p>
                                        <p className="text-xs font-black text-slate-900 dark:text-white">Base</p>
                                    </div>
                                </div>

                                <div className="h-px bg-slate-100 dark:bg-white/5 my-2"></div>

                                {/* Tx Hash & Block */}
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="space-y-1">
                                        <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Txhash</p>
                                        {selectedTx.transactionHash ? (
                                            <div className="flex items-center gap-2">
                                                <a
                                                    href={txExplorerUrl || `https://basescan.org/tx/${selectedTx.transactionHash}`}
                                                    target="_blank"
                                                    rel="noopener noreferrer"
                                                    className="text-xs font-black text-primary underline decoration-primary/30 truncate flex-1"
                                                >
                                                    {`${selectedTx.transactionHash.slice(0, 10)}...${selectedTx.transactionHash.slice(-5)}`}
                                                </a>
                                                <button
                                                    onClick={() => copyToClipboardText(selectedTx.transactionHash)}
                                                    className="text-slate-400 hover:text-primary transition-colors active:scale-90"
                                                >
                                                    <span className="material-icons text-sm">content_copy</span>
                                                </button>
                                            </div>
                                        ) : (
                                            <p className="text-xs font-black text-slate-400">No transaction hash</p>
                                        )}
                                    </div>
                                    <div className="space-y-1">
                                        <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Block confirmation</p>
                                        <p className="text-xs font-black text-slate-900 dark:text-white">
                                            {txReceipt
                                                ? (txReceipt.status === 'success' ? 'Success' : 'Failed')
                                                : 'Pending'}
                                        </p>
                                    </div>
                                </div>
                            </div>

                            {/* Toast Notification for Copy */}
                            {copied && (
                                <div className="absolute bottom-6 left-1/2 -translate-x-1/2 bg-slate-900 text-white px-4 py-2 rounded-full text-[10px] font-black animate-in fade-in slide-in-from-bottom-2 duration-300">
                                    Copied to clipboard!
                                </div>
                            )}
                        </div>
                    </div>
                )}
            </main>
        </div>
    );
};

export default HomePage;
