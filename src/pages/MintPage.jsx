import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import StatusBar from '../components/StatusBar';
import { useAccount, usePublicClient, useReadContract } from 'wagmi';
import { base } from 'viem/chains';
import { encodeFunctionData, parseEther, formatEther } from 'viem';
import {
  ConnectWallet,
  Wallet
} from '@coinbase/onchainkit/wallet';
import {
  Transaction,
  TransactionButton,
  TransactionStatus,
  TransactionStatusLabel
} from '@coinbase/onchainkit/transaction';
import { useActivity } from '../context/ActivityContext';

const MintPage = () => {
  const navigate = useNavigate();
  const { address, isConnected } = useAccount();
  const { addActivity } = useActivity();
  const publicClient = usePublicClient();

  // Using the contract address from HomePage which is likely the correct one for the current project context
  const NFT_CONTRACT = '0xa932a9960C83FcCc382bd8fd7CE6b6AeF4a2e2dE';
  const MINT_PRICE_ETH = '0.0002';

  const nftAbi = [
    {
      type: 'function',
      name: 'mint',
      stateMutability: 'payable',
      inputs: [],
      outputs: [],
    },
    {
      type: 'function',
      name: 'totalMinted',
      stateMutability: 'view',
      inputs: [],
      outputs: [{ type: 'uint256' }],
    },
    {
      type: 'function',
      name: 'MAX_SUPPLY',
      stateMutability: 'view',
      inputs: [],
      outputs: [{ type: 'uint256' }],
    },
    {
      type: 'function',
      name: 'hasUserMinted',
      stateMutability: 'view',
      inputs: [{ type: 'address' }],
      outputs: [{ type: 'bool' }],
    },
  ];

  const [txHash, setTxHash] = useState(null);
  const [gasFee, setGasFee] = useState(null);
  const [isRevealed, setIsRevealed] = useState(false);
  const [randomImage, setRandomImage] = useState('/images/hero.png');
  const [hasMinted, setHasMinted] = useState(false);

  // Contract Reads
  const { data: totalMintedData } = useReadContract({
    address: NFT_CONTRACT,
    abi: nftAbi,
    functionName: 'totalMinted',
    watch: true,
  });

  const { data: maxSupplyData } = useReadContract({
    address: NFT_CONTRACT,
    abi: nftAbi,
    functionName: 'MAX_SUPPLY',
  });

  const { data: hasUserMintedData } = useReadContract({
    address: NFT_CONTRACT,
    abi: nftAbi,
    functionName: 'hasUserMinted',
    args: [address],
    query: {
      enabled: !!address,
    }
  });

  const totalMinted = totalMintedData ? Number(totalMintedData) : 0;
  const maxSupply = maxSupplyData ? Number(maxSupplyData) : 5555;
  const progressPercent = Math.min((totalMinted / maxSupply) * 100, 100);

  // Curated high-quality anime & cyberpunk style portraits
  const nftImages = [
    'https://images.unsplash.com/photo-1635322966219-b75ed3a90122?w=800&h=800&fit=crop', // Cyberpunk Visor
    'https://images.unsplash.com/photo-1578632292335-df3abbb0d586?w=800&h=800&fit=crop', // Anime Girl Art
    'https://images.unsplash.com/photo-1620641788421-7a1c342ea42e?w=800&h=800&fit=crop', // Neon Portrait
    'https://images.unsplash.com/photo-1541560052-5e137f229371?w=800&h=800&fit=crop', // Cyberpunk Boy
    'https://images.unsplash.com/photo-1563089145-599997674d42?w=800&h=800&fit=crop', // Neon City Vibe
    'https://images.unsplash.com/photo-1618331835717-801e976710b2?w=800&h=800&fit=crop', // Abstract Digital
    'https://images.unsplash.com/photo-1607604276583-eef5d076aa5f?w=800&h=800&fit=crop', // Stylized Art
    'https://images.unsplash.com/photo-1565528994778-9e32231648a7?w=800&h=800&fit=crop', // Futuristic Fashion
    'https://images.unsplash.com/photo-1515630278258-407f66498911?w=800&h=800&fit=crop', // Neon Lights
    'https://images.unsplash.com/photo-1614851099175-e5b30eb6f696?w=800&h=800&fit=crop', // Cyber Texture
  ];

  useEffect(() => {
    // Sync local state with contract state
    if (hasUserMintedData) {
      setHasMinted(true);
    } else {
      // Fallback to local storage if contract read not ready or false (though contract is truth)
      const storedLegends = JSON.parse(localStorage.getItem('my_legends') || '[]');
      if (storedLegends.length > 0) {
        setHasMinted(true);
      }
    }

    // Pick a random image on mount (this will be the one revealed)
    setRandomImage(nftImages[Math.floor(Math.random() * nftImages.length)]);

    // Estimate gas if connected
    const estimateGas = async () => {
      if (!publicClient || !address) return;
      try {
        const gas = await publicClient.estimateGas({
          account: address,
          to: NFT_CONTRACT,
          data: encodeFunctionData({
            abi: nftAbi,
            functionName: 'mint',
            args: [],
          }),
          value: parseEther(MINT_PRICE_ETH),
        });
        const gasPrice = await publicClient.getGasPrice();
        const feeWei = gas * gasPrice;
        const feeEth = formatEther(feeWei);
        setGasFee(parseFloat(feeEth).toFixed(6));
      } catch (error) {
        console.error('Gas estimation failed:', error);
        // Fallback to a safe estimate if RPC fails
        setGasFee('0.000020');
      }
    };

    estimateGas();
  }, [publicClient, address, hasUserMintedData]);

  const handleSuccess = (response) => {
    const hash = response?.transactionHash || response;
    setTxHash(hash);
    setIsRevealed(true); // Trigger Reveal!
    setHasMinted(true); // Mark as minted immediately

    // Save to collection for Home Page display
    try {
      const currentCollection = JSON.parse(localStorage.getItem('my_legends') || '[]');
      const newNft = {
        id: Date.now(),
        image: randomImage,
        mintedAt: new Date().toISOString(),
        txHash: hash
      };
      localStorage.setItem('my_legends', JSON.stringify([newNft, ...currentCollection]));
    } catch (e) {
      console.error('Failed to save to collection:', e);
    }

    addActivity('Mint', {
      title: 'Minted Legend NFT',
      amount: `-${MINT_PRICE_ETH} ETH`,
      status: 'Confirmed',
      transactionHash: hash,
    });
  };

  const calls = useMemo(() => [
    {
      to: NFT_CONTRACT,
      data: encodeFunctionData({
        abi: nftAbi,
        functionName: 'mint',
        args: [],
      }),
      value: parseEther(MINT_PRICE_ETH),
    },
  ], [NFT_CONTRACT]);

  return (
    <div className="flex flex-col h-full w-full max-w-full bg-background-light dark:bg-background-dark overflow-hidden fixed inset-0">
      {/* Background Orbs */}
      <div className="bg-orb w-96 h-96 bg-primary/20 -top-20 -right-20 animate-pulse"></div>
      <div className="bg-orb w-80 h-80 bg-indigo-500/10 bottom-1/4 -left-40 animate-bounce-slow"></div>

      <StatusBar dark={false} notch={true} />

      {/* Header */}
      <header className="flex items-center justify-between px-6 py-4 bg-transparent z-20 shrink-0">
        <button onClick={() => navigate(-1)} className="w-11 h-11 flex items-center justify-center rounded-2xl bg-white/80 dark:bg-surface-dark/80 backdrop-blur-md text-slate-900 dark:text-white shadow-lg shadow-slate-200/50 dark:shadow-black/20 active:scale-90 transition-all border border-white dark:border-white/10 hover:bg-white dark:hover:bg-surface-dark">
          <span className="material-icons text-2xl">chevron_left</span>
        </button>
        <div className="w-11"></div>
      </header>

      <main className="flex-1 overflow-y-auto w-full px-6 pb-24 relative z-10 flex flex-col justify-center">
        <div className="animate-fade-in-up">
          <div className="glass-effect dark:bg-surface-dark/40 p-1.5 rounded-[3rem] relative overflow-hidden border border-white dark:border-white/10 shadow-[0_32px_64px_-16px_rgba(0,0,0,0.1)] group">

            <div className="relative z-10 flex flex-col">
              {/* Top Section: Full Width Image */}
              <div className="relative w-full aspect-square rounded-[2.5rem] overflow-hidden group/nft">
                {/* Live Badge */}
                <div className="absolute top-6 left-6 z-30 bg-white/90 dark:bg-black/60 backdrop-blur-md px-3 py-1.5 rounded-full flex items-center gap-2 border border-white/20 shadow-lg">
                  <span className="relative flex h-2.5 w-2.5">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-red-500"></span>
                  </span>
                  <span className="text-[10px] font-black uppercase tracking-widest text-slate-900 dark:text-white">Live Now</span>
                </div>

                <div className={`w-full h-full bg-slate-900 relative transition-all duration-700`}>
                  {!isRevealed && !hasMinted ? (
                    <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm flex flex-col items-center justify-center animate-pulse">
                      <img
                        src={randomImage}
                        alt="Preview"
                        className="w-full h-full object-cover opacity-50 blur-xl scale-110 absolute inset-0"
                        onError={(e) => { e.target.onerror = null; e.target.src = '/images/hero.png'; }}
                      />
                      <div className="relative z-10 flex flex-col items-center gap-4">
                        <div className="w-20 h-20 bg-white/10 backdrop-blur-md rounded-2xl flex items-center justify-center border border-white/20 shadow-2xl">
                          <span className="material-icons text-white/90 text-4xl drop-shadow-[0_0_15px_rgba(255,255,255,0.5)]">lock</span>
                        </div>
                        <div className="text-center">
                          <h1 className="text-3xl font-black leading-tight text-white tracking-tight drop-shadow-lg">OG Genesis Mint</h1>
                          <p className="text-blue-200 text-xs font-bold tracking-wide drop-shadow-md mt-1">Phase 1: The Awakening</p>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <img
                      src={randomImage}
                      alt="NFT Art"
                      className="w-full h-full object-cover animate-in zoom-in duration-1000"
                      onError={(e) => {
                        e.target.onerror = null;
                        e.target.src = '/images/hero.png';
                      }}
                    />
                  )}
                  {/* Gradient Overlay */}
                  <div className="absolute inset-0 bg-gradient-to-t from-background-dark via-transparent to-transparent opacity-90"></div>
                </div>
              </div>

              {/* Bottom Section: Details */}
              <div className="px-5 pb-6 -mt-12 relative z-20">
                <div className="bg-white dark:bg-surface-dark p-5 rounded-[2rem] border border-white/50 dark:border-white/5 shadow-xl backdrop-blur-xl">

                  {/* Progress Bar */}
                  <div className="mb-5">
                    <div className="flex justify-between items-end mb-2 px-1">
                      <span className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest">Progress</span>
                      <span className="text-xs font-black text-slate-900 dark:text-white"><span className="text-primary">{totalMinted.toLocaleString()}</span> / {maxSupply.toLocaleString()}</span>
                    </div>
                    <div className="w-full h-2 bg-slate-100 dark:bg-white/5 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-primary rounded-full shadow-[0_0_10px_rgba(var(--primary),0.5)] transition-all duration-1000"
                        style={{ width: `${progressPercent}%` }}
                      ></div>
                    </div>
                    <p className="text-[9px] text-slate-400 text-center mt-3 leading-relaxed px-2">
                      Join the first generation of explorers. Holders get exclusive access to the upcoming meta-verse drop.
                    </p>
                  </div>

                  {/* Action Area */}
                  <div className="flex items-center gap-4">
                    <div className="flex flex-col">
                      <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-0.5">Price</span>
                      <span className="text-xl font-black text-slate-900 dark:text-white">{MINT_PRICE_ETH} ETH</span>
                    </div>

                    <div className="flex-1 relative group/button">
                      {!hasMinted ? (
                        <Transaction
                          chainId={base.id}
                          calls={calls}
                          onSuccess={handleSuccess}
                        >
                          <TransactionButton
                            className="w-full h-14 rounded-2xl bg-primary hover:bg-primary-hover text-white font-black text-sm uppercase tracking-widest shadow-lg shadow-primary/25 active:scale-95 transition-all"
                            text={
                              <div className="flex items-center justify-center gap-2">
                                <span>Mint Now</span>
                                <span className="material-icons text-sm">rocket_launch</span>
                              </div>
                            }
                          />
                          <div className="mt-2 flex justify-center absolute w-full -bottom-6">
                            <TransactionStatus>
                              <TransactionStatusLabel className="text-slate-400 text-[9px] font-bold" />
                            </TransactionStatus>
                          </div>
                        </Transaction>
                      ) : (
                        <button className="w-full h-14 rounded-2xl bg-slate-100 dark:bg-white/5 text-slate-400 dark:text-slate-500 font-black text-sm uppercase tracking-widest cursor-not-allowed border border-slate-200 dark:border-white/5">
                          Already Minted
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default MintPage;
