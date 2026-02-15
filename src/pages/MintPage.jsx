import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import StatusBar from '../components/StatusBar';
import { useAccount } from 'wagmi';
import { base } from 'viem/chains';
import { encodeFunctionData, parseEther } from 'viem';
import {
  Transaction,
  TransactionButton,
  TransactionStatus,
  TransactionStatusAction,
  TransactionStatusLabel
} from '@coinbase/onchainkit/transaction';
import { useActivity } from '../context/ActivityContext';
import { Avatar } from '@coinbase/onchainkit/identity';

const MintPage = () => {
  const navigate = useNavigate();
  const { address, isConnected } = useAccount();
  const { addActivity } = useActivity();

  const NFT_CONTRACT = '0xfeE8ae1F0E4f8C31dC95622C96e4179F7E6EBfDa';
  const MINT_PRICE_ETH = '0.00004';

  const nftAbi = [
    {
      type: 'function',
      name: 'mint',
      stateMutability: 'payable',
      inputs: [],
      outputs: [],
    },
  ];

  const [txHash, setTxHash] = useState(null);

  const handleSuccess = (response) => {
    const hash = response?.transactionHash || response;
    setTxHash(hash);
    addActivity('Mint', {
      title: 'Minted OG NFT',
      amount: `-${MINT_PRICE_ETH} ETH`,
      status: 'Confirmed',
      transactionHash: hash,
    });
  };

  const calls = [
    {
      to: NFT_CONTRACT,
      data: encodeFunctionData({
        abi: nftAbi,
        functionName: 'mint',
        args: [],
      }),
      value: parseEther(MINT_PRICE_ETH),
    },
  ];

  return (
    <div className="flex flex-col h-full w-full max-w-full bg-background-light dark:bg-background-dark overflow-hidden fixed inset-0">
      {/* Background Orbs */}
      <div className="bg-orb w-96 h-96 bg-primary/20 -top-20 -right-20 animate-pulse"></div>
      <div className="bg-orb w-80 h-80 bg-indigo-500/10 bottom-1/4 -left-40 animate-bounce-slow"></div>

      <StatusBar dark={false} notch={true} />

      {/* Compact Header */}
      <header className="flex items-center justify-between px-6 py-4 bg-transparent z-20 shrink-0">
        <button onClick={() => navigate(-1)} className="w-11 h-11 flex items-center justify-center rounded-2xl bg-white/80 dark:bg-surface-dark/80 backdrop-blur-md text-slate-900 dark:text-white shadow-lg shadow-slate-200/50 dark:shadow-black/20 active:scale-90 transition-all border border-white dark:border-white/10 hover:bg-white dark:hover:bg-surface-dark">
          <span className="material-icons text-2xl">chevron_left</span>
        </button>
        <div className="w-11"></div>
      </header>

      <main className="flex-1 overflow-y-auto w-full px-8 pt-4 pb-32 relative z-10">
        <div className="flex flex-col items-center mb-10 animate-fade-in-up">
          <div className="relative mb-6">
            <div className="absolute inset-0 bg-primary/20 blur-2xl rounded-full scale-150 animate-pulse"></div>
            <div className="w-24 h-24 rounded-[2.5rem] bg-gradient-to-br from-primary to-indigo-600 flex items-center justify-center shadow-2xl relative z-10 border-4 border-white dark:border-slate-900">
              <span className="material-icons text-white text-5xl animate-float">auto_awesome</span>
            </div>
            <div className="absolute -bottom-2 -right-2 bg-emerald-500 w-8 h-8 rounded-2xl flex items-center justify-center border-4 border-white dark:border-slate-900 shadow-lg">
              <span className="material-icons text-white text-[14px]">verified</span>
            </div>
          </div>
          <h1 className="text-4xl font-black leading-tight text-slate-900 dark:text-white text-center tracking-tight">The Legend</h1>
          <p className="text-slate-400 dark:text-slate-500 text-sm mt-2 font-bold uppercase tracking-[0.2em]">Deployer Receipt</p>
        </div>

        <div className="animate-fade-in-up delay-100">
          <div className="glass-effect dark:bg-surface-dark/40 p-8 rounded-[3rem] relative overflow-hidden border border-white dark:border-white/10 shadow-[0_32px_64px_-16px_rgba(0,0,0,0.1)] group">
            <div className="absolute top-0 right-0 w-64 h-64 bg-primary/5 blur-[80px] rounded-full -mr-32 -mt-32 group-hover:bg-primary/10 transition-colors duration-700"></div>
            <div className="relative z-10 space-y-8">
              <div className="flex flex-col gap-6">
                <div className="bg-slate-50 dark:bg-background-dark/60 p-5 rounded-3xl border border-slate-100 dark:border-white/5 shadow-inner">
                  <p className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-[0.25em] mb-4">Contract Details</p>
                  <div className="flex items-center justify-between mb-4">
                    <span className="text-[11px] font-bold text-slate-500 dark:text-slate-400">Mint Price</span>
                    <span className="text-xl font-black text-primary tracking-tight">{MINT_PRICE_ETH} ETH</span>
                  </div>
                  <div className="h-px bg-slate-200/50 dark:bg-white/5 mb-4"></div>
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] font-bold text-slate-500 dark:text-slate-400">Mint Network</span>
                    <div className="flex items-center gap-1.5">
                      <div className="w-2 h-2 rounded-full bg-blue-500"></div>
                      <span className="text-[11px] font-black text-slate-900 dark:text-white uppercase tracking-widest">Base</span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-3 px-4">
                  <div className="w-10 h-10 rounded-2xl overflow-hidden shadow-lg border-2 border-primary/20">
                    <Avatar className="w-full h-full" address={address} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest">Connected Miner</p>
                    <p className="text-xs font-black text-slate-900 dark:text-white truncate">
                      {address ? `${address.slice(0, 8)}...${address.slice(-6)}` : 'Wallet Disconnected'}
                    </p>
                  </div>
                </div>
              </div>

              <div className="relative">
                <Transaction
                  chainId={base.id}
                  calls={calls}
                  onSuccess={handleSuccess}
                >
                  <TransactionButton className="w-full h-18 rounded-[2rem] glossy-button font-black text-xs uppercase tracking-[0.3em] flex items-center justify-center gap-3 shadow-2xl shadow-primary/30 active:scale-95 transition-all" />
                  <div className="mt-6 flex justify-center">
                    <TransactionStatus>
                      <TransactionStatusLabel className="dark:text-white text-[11px] font-black uppercase tracking-widest text-center" />
                      <TransactionStatusAction className="text-primary font-black text-[11px] uppercase tracking-widest hover:underline ml-2" />
                    </TransactionStatus>
                  </div>
                </Transaction>
              </div>

              {txHash && (
                <div className="bg-emerald-500/5 dark:bg-emerald-500/10 p-6 rounded-[2rem] border border-emerald-500/20 animate-in fade-in zoom-in duration-500 relative overflow-hidden group/success">
                  <div className="absolute top-0 right-0 w-24 h-24 bg-emerald-500/10 blur-2xl rounded-full -mr-12 -mt-12"></div>
                  <div className="flex items-center gap-4 mb-3 relative z-10">
                    <div className="w-10 h-10 rounded-2xl bg-emerald-500/20 flex items-center justify-center text-emerald-500">
                      <span className="material-icons text-xl">check_circle</span>
                    </div>
                    <div>
                      <p className="text-[10px] font-black uppercase tracking-widest text-emerald-500">Identity Minted</p>
                      <p className="text-xs font-black text-slate-900 dark:text-white tracking-tight">Your onchain journey is secured.</p>
                    </div>
                  </div>
                  <a
                    href={`https://basescan.org/tx/${txHash}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center justify-center w-full h-12 bg-emerald-500 text-white rounded-2xl text-[10px] font-black uppercase tracking-[0.2em] shadow-lg shadow-emerald-500/20 active:scale-95 transition-all relative z-10"
                  >
                    View on BaseScan
                  </a>
                </div>
              )}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default MintPage;
