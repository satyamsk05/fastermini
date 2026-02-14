import React, { createContext, useContext, useState, useEffect } from 'react';

const ActivityContext = createContext();

export const ActivityProvider = ({ children }) => {
    const [activities, setActivities] = useState(() => {
        const saved = localStorage.getItem('dapp_activities');
        return saved ? JSON.parse(saved) : [];
    });

    const [checkInData, setCheckInData] = useState(() => {
        const saved = localStorage.getItem('dapp_checkin_data');
        return saved ? JSON.parse(saved) : { streak: 0, lastCheckIn: null, history: [], pointsByDate: {}, totalPoints: 0 };
    });

    const [lastGMDate, setLastGMDate] = useState(() => {
        return localStorage.getItem('dapp_last_gm_date') || null;
    });

    useEffect(() => {
        localStorage.setItem('dapp_activities', JSON.stringify(activities));
    }, [activities]);

    useEffect(() => {
        localStorage.setItem('dapp_checkin_data', JSON.stringify(checkInData));
    }, [checkInData]);

    useEffect(() => {
        if (lastGMDate) {
            localStorage.setItem('dapp_last_gm_date', lastGMDate);
        }
    }, [lastGMDate]);

    const addActivity = (type, details) => {
        const now = new Date();
        const points = type === 'Check-in' ? Math.floor(Math.random() * (101 - 10 + 1)) + 10 : 0;
        
        const newActivity = {
            id: Date.now(),
            type,
            timestamp: now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
            date: now.toLocaleDateString(),
            status: 'Confirmed',
            points: points,
            ...details
        };
        setActivities(prev => [newActivity, ...prev]);

        if (type === 'GM') {
            setLastGMDate(new Date().toDateString());
        }

        if (type === 'Check-in') {
            const today = new Date().toDateString();
            setCheckInData(prev => {
                const isNewDay = prev.lastCheckIn !== today;
                const newStreak = isNewDay ? prev.streak + 1 : prev.streak;
                const newHistory = isNewDay ? [...prev.history, today] : prev.history;
                const prevPointsByDate = prev.pointsByDate || {};
                const newPointsByDate = { ...prevPointsByDate };
                if (isNewDay || !newPointsByDate[today]) {
                    newPointsByDate[today] = points;
                }
                const totalPoints = Object.values(newPointsByDate).reduce((sum, p) => sum + (typeof p === 'number' ? p : 0), 0);
                return {
                    streak: newStreak,
                    lastCheckIn: today,
                    history: newHistory,
                    pointsByDate: newPointsByDate,
                    totalPoints
                };
            });
        }
    };

    return (
        <ActivityContext.Provider value={{ activities, addActivity, checkInData, lastGMDate }}>
            {children}
        </ActivityContext.Provider>
    );
};

export const useActivity = () => useContext(ActivityContext);
