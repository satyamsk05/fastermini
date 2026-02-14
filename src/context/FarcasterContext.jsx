import React, { createContext, useContext, useEffect, useState } from 'react';
import sdk, { type FrameContext } from '@farcaster/miniapp-sdk';

const FarcasterContext = createContext({
    context: undefined,
    isLoaded: false,
});

export const FarcasterProvider = ({ children }) => {
    const [context, setContext] = useState();
    const [isLoaded, setIsLoaded] = useState(false);

    useEffect(() => {
        const load = async () => {
            try {
                const frameContext = await sdk.context;
                setContext(frameContext);

                // Signal to Farcaster that the frame is ready
                sdk.actions.ready();
            } catch (error) {
                console.error('Error loading Farcaster context:', error);
            } finally {
                setIsLoaded(true);
            }
        };

        if (!isLoaded) {
            load();
        }
    }, [isLoaded]);

    return (
        <FarcasterContext.Provider value={{ context, isLoaded }}>
            {children}
        </FarcasterContext.Provider>
    );
};

export const useFarcaster = () => useContext(FarcasterContext);
