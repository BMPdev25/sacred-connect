import React, { createContext, useState, useContext, useEffect, ReactNode } from 'react';
import { useSelector } from 'react-redux';
import { RootState } from '../redux/store';
import priestService from '../services/priestService';
import api from '../api';

interface Notification {
    id: string;
    message: string;
    read: boolean;
    type: string;
    data?: any;
}

interface NotificationContextType {
    notifications: Notification[];
    unreadCount: number;
    showNotifications: boolean;
    toggleNotifications: () => void;
    closeNotifications: () => void;
    markAsRead: (id: string) => void;
    refreshNotifications: () => Promise<void>;
}

const NotificationContext = createContext<NotificationContextType | undefined>(undefined);

export const NotificationProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
    const { userInfo } = useSelector((state: RootState) => state.auth);
    const [notifications, setNotifications] = useState<Notification[]>([]);
    const [showNotifications, setShowNotifications] = useState<boolean>(false);

    const refreshNotifications = async () => {
        if (!userInfo?._id) return;

        try {
            let allBookings: any[] = [];

            if ((userInfo as any).userType === 'priest') {
                // Priest: use priestService
                const bookings = await priestService.getBookings(userInfo._id);
                allBookings = Array.isArray(bookings) ? bookings : bookings?.data || [];
            } else {
                // Devotee: use devotee bookings endpoint
                try {
                    const response = await api.get('/api/devotee/bookings');
                    allBookings = Array.isArray(response.data) ? response.data : response.data?.data || [];
                } catch {
                    allBookings = [];
                }
            }

            const generatedNotifications: Notification[] = [];

            // 1. Pending Requests
            const pendingBookings = allBookings.filter((b: any) => b.status === "pending");
            pendingBookings.forEach((b: any) => {
                generatedNotifications.push({
                    id: `notif-${b._id || b.id}`,
                    message: (userInfo as any).userType === 'priest'
                        ? `New booking request from ${b.devoteeId?.name || b.devotee || "Devotee"}`
                        : `Your ${b.ceremonyType || 'booking'} is pending confirmation`,
                    read: false,
                    type: "booking",
                    data: b,
                });
            });

            // 2. Upcoming Events (Next 7 Days)
            const now = new Date();
            const nextWeek = new Date();
            nextWeek.setDate(now.getDate() + 7);

            const upcomingEvents = allBookings.filter((b: any) => {
                if (b.status !== "confirmed") return false;
                const bookingDate = new Date(b.date);
                return bookingDate >= now && bookingDate <= nextWeek;
            });

            upcomingEvents.forEach((b: any) => {
                const bDate = new Date(b.date);
                const isToday = bDate.getDate() === now.getDate() && bDate.getMonth() === now.getMonth() && bDate.getFullYear() === now.getFullYear();
                const isTomorrow = new Date(now.getTime() + 86400000).getDate() === bDate.getDate();

                let timeMsg = "";
                if (isToday) timeMsg = "today";
                else if (isTomorrow) timeMsg = "tomorrow";
                else timeMsg = "this week";

                generatedNotifications.push({
                    id: `notif-up-${b._id || b.id}`,
                    message: `Upcoming ${b.ceremonyType} ${timeMsg} at ${b.startTime}`,
                    read: false,
                    type: "booking",
                    data: b,
                });
            });

            setNotifications(generatedNotifications);
        } catch (err) {
            console.warn("Failed to refresh notifications", err);
        }
    };

    useEffect(() => {
        refreshNotifications();

        // Optional: Poll every minute or listen to socket
        const interval = setInterval(refreshNotifications, 60000);
        return () => clearInterval(interval);
    }, [userInfo?._id]);

    const toggleNotifications = () => setShowNotifications(prev => !prev);
    const closeNotifications = () => setShowNotifications(false);

    const markAsRead = (id: string) => {
        setNotifications(prev => prev.map(n => n.id === id ? { ...n, read: true } : n));
    };

    const unreadCount = notifications.filter(n => !n.read).length;

    return (
        <NotificationContext.Provider value={{
            notifications,
            unreadCount,
            showNotifications,
            toggleNotifications,
            closeNotifications,
            markAsRead,
            refreshNotifications
        }}>
            {children}
        </NotificationContext.Provider>
    );
};

export const useNotifications = () => {
    const context = useContext(NotificationContext);
    if (!context) {
        throw new Error('useNotifications must be used within a NotificationProvider');
    }
    return context;
};
