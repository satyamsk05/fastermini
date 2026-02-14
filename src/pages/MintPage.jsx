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
    <div className="flex flex-col h-full w-full max-w-full bg-slate-50 dark:bg-slate-950 overflow-hidden fixed inset-0">
      <StatusBar dark={false} notch={true} />
      <header className="flex items-center justify-between px-6 py-4 bg-slate-50/80 dark:bg-slate-950/80 backdrop-blur-md z-20 shrink-0 border-b border-slate-200/50 dark:border-white/5">
        <button onClick={() => navigate(-1)} className="w-12 h-12 flex items-center justify-center rounded-full bg-white dark:bg-slate-900 text-slate-900 dark:text-white border border-slate-200 dark:border-white/10 shadow-sm active:scale-90 transition-all">
          <span className="material-icons text-xl">chevron_left</span>
        </button>
        <h1 className="text-sm font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-widest">Mint OG NFT</h1>
        <div className="w-12"></div>
      </header>

      <main className="flex-1 overflow-y-auto w-full px-8 pt-12 pb-32">
        <div className="flex flex-col items-center mb-12">
          <div className="w-24 h-24 rounded-full bg-primary/10 border border-primary/20 flex items-center justify-center shadow-inner mb-3">
            <span className="material-icons text-primary text-4xl">auto_awesome</span>
          </div>
          <h2 className="text-3xl font-black leading-tight text-slate-900 dark:text-slate-100 text-center">Own the OG Badge</h2>
          <p className="text-slate-500 dark:text-slate-400 text-sm mt-2">Mint your onchain receipt for deployment.</p>
        </div>

        <div className="glass-effect dark:bg-slate-900/60 p-8 rounded-[3rem] relative overflow-hidden border border-white dark:border-white/5 shadow-2xl shadow-black/10">
          <div className="absolute top-0 right-0 w-40 h-40 bg-primary/10 blur-3xl rounded-full -mr-20 -mt-20"></div>
          <div className="relative z-10 space-y-8">
            <div className="flex items-center justify-between bg-slate-50/70 dark:bg-slate-800/40 p-6 rounded-2xl border border-slate-100 dark:border-white/5">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center">
                  <span className="material-icons text-[18px] text-primary">payments</span>
                </div>
                <div>
                  <p className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest">Mint Price</p>
                  <p className="text-lg font-black text-slate-900 dark:text-white">{MINT_PRICE_ETH} ETH</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-9 h-9 rounded-full overflow-hidden ring-2 ring-blue-400/30">
                  <Avatar className="w-9 h-9" address={address} />
                </div>
                <span className="text-xs font-black text-slate-900 dark:text-white">
                  {address ? `${address.slice(0, 6)}...${address.slice(-4)}` : 'Connect wallet'}
                </span>
              </div>
            </div>

            <Transaction
              chainId={base.id}
              calls={calls}
              onSuccess={handleSuccess}
            >
              <TransactionButton className="w-full h-16 rounded-2xl glossy-button font-bold text-lg flex items-center justify-center gap-3 shadow-xl shadow-primary/30" />
              <div className="mt-4">
                <TransactionStatus>
                  <TransactionStatusLabel className="dark:text-white font-medium" />
                  <TransactionStatusAction className="text-primary font-bold hover:underline" />
                </TransactionStatus>
              </div>
            </Transaction>

            {txHash && (
              <div className="bg-slate-50 dark:bg-white/5 p-4 rounded-2xl border border-slate-100 dark:border-white/5">
                <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-2">Success</p>
                <p className="text-sm font-black text-green-600 dark:text-green-400 mb-2">Deployment NFT received</p>
                <a 
                  href={`https://basescan.org/tx/${txHash}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-xs font-black text-primary underline decoration-primary/30"
                >
                  View on explorer
                </a>
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
};

export default MintPage;
