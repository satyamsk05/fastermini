import React, { createContext, useContext, useState, useEffect } from 'react';
import { useFarcaster } from './FarcasterContext';

const UserContext = createContext();

export const UserProvider = ({ children }) => {
    const { context } = useFarcaster();
    const [userName, setUserName] = useState(() => {
        return localStorage.getItem('userName') || 'Alex Sterling';
    });

    useEffect(() => {
        if (context?.user?.displayName) {
            setUserName(context.user.displayName);
        }
    }, [context]);

    useEffect(() => {
        localStorage.setItem('userName', userName);
    }, [userName]);

    return (
        <UserContext.Provider value={{ userName, setUserName }}>
            {children}
        </UserContext.Provider>
    );
};


export const useUser = () => {
    const context = useContext(UserContext);
    if (!context) {
        throw new Error('useUser must be used within a UserProvider');
    }
    return context;
};
