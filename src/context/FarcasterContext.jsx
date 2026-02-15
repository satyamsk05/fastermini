import React, { createContext, useContext, useEffect, useState } from 'react';
import sdk from '@farcaster/miniapp-sdk';
import { useConnect, useAccount, useDisconnect } from 'wagmi';

const FarcasterContext = createContext({
    context: undefined,
    isLoaded: false,
});

export const FarcasterProvider = ({ children }) => {
    const [context, setContext] = useState();
    const [isLoaded, setIsLoaded] = useState(false);
    const { connect, connectors } = useConnect();
    const { isConnected, connector: activeConnector } = useAccount();
    const { disconnect } = useDisconnect();

    useEffect(() => {
        const load = async () => {
            try {
                const frameContext = await sdk.context;
                setContext(frameContext);

                if (frameContext) {
                    const farcasterConnector = connectors.find(c => c.id === 'farcasterFrame');

                    if (farcasterConnector) {
                        // If not connected, connect to Farcaster
                        if (!isConnected) {
                            connect({ connector: farcasterConnector });
                        }
                        // If connected to something else, switch to Farcaster
                        else if (activeConnector && activeConnector.id !== 'farcasterFrame') {
                            console.log('Switching to Farcaster wallet...');
                            disconnect();
                            setTimeout(() => {
                                connect({ connector: farcasterConnector });
                            }, 500);
                        }
                    }
                }
            } catch (error) {
                console.error('Error loading Farcaster context:', error);
            } finally {
                setIsLoaded(true);
                // Signal to Farcaster that the frame is ready
                sdk.actions.ready();
            }
        };

        if (!isLoaded) {
            load();
        }
    }, [connect, connectors, isConnected, isLoaded, activeConnector, disconnect]);

    return (
        <FarcasterContext.Provider value={{ context, isLoaded }}>
            {children}
        </FarcasterContext.Provider>
    );
};

export const useFarcaster = () => useContext(FarcasterContext);
