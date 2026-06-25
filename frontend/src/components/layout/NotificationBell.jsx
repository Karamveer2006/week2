import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useAuth } from '../../hooks/useAuth';
import { useNavigate } from 'react-router-dom';
import { Bell, Check } from 'lucide-react';

export default function NotificationBell() {
    const { token } = useAuth();
    const navigate = useNavigate();
    const [notifications, setNotifications] = useState([]);
    const [isOpen, setIsOpen] = useState(false);
    
    const unreadCount = notifications.filter(n => !n.is_read).length;

    const fetchNotifications = async () => {
        try {
            const res = await axios.get(`${import.meta.env.VITE_API_URL || "http://localhost:5000/api"}/notifications`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            setNotifications(res.data);
        } catch (err) {
            console.error('Failed to fetch notifications', err);
        }
    };

    const subscribeToPush = async () => {
        if (!('serviceWorker' in navigator) || !('PushManager' in window)) return;
        
        try {
            const permission = await Notification.requestPermission();
            if (permission !== 'granted') return;

            const registration = await navigator.serviceWorker.register('/service-worker.js');
            await navigator.serviceWorker.ready;
            
            // Note: In production you'd use your actual VAPID key instead of process.env which might fail on client
            const publicVapidKey = import.meta.env.VITE_VAPID_PUBLIC_KEY;
            
            if (!publicVapidKey) {
                console.error('VITE_VAPID_PUBLIC_KEY is missing from .env');
                return;
            }

            const subscription = await registration.pushManager.subscribe({
                userVisibleOnly: true,
                applicationServerKey: urlBase64ToUint8Array(publicVapidKey)
            });

            await axios.post(`${import.meta.env.VITE_API_URL || "http://localhost:5000/api"}/notifications/subscribe`, subscription, {
                headers: { Authorization: `Bearer ${token}` }
            });
        } catch (error) {
            console.error('Service worker subscription failed:', error);
        }
    };

    useEffect(() => {
        if (token) {
            fetchNotifications();
            subscribeToPush();
            
            // Poll for new notifications every 5 seconds for instant feel
            const interval = setInterval(fetchNotifications, 5000);
            return () => clearInterval(interval);
        }
    }, [token]);

    const handleMarkAsRead = async (id, e) => {
        e.stopPropagation();
        try {
            await axios.put(`${import.meta.env.VITE_API_URL || "http://localhost:5000/api"}/notifications/${id}/read`, {}, {
                headers: { Authorization: `Bearer ${token}` }
            });
            setNotifications(notifications.map(n => n.id === id ? { ...n, is_read: 1 } : n));
        } catch (err) {
            console.error(err);
        }
    };

    const handleMarkAllRead = async () => {
        try {
            await axios.put(`${import.meta.env.VITE_API_URL || "http://localhost:5000/api"}/notifications/mark-all-read`, {}, {
                headers: { Authorization: `Bearer ${token}` }
            });
            setNotifications(notifications.map(n => ({ ...n, is_read: 1 })));
        } catch (err) {
            console.error(err);
        }
    };

    const handleNotificationClick = (n) => {
        if (!n.is_read) handleMarkAsRead(n.id, { stopPropagation: () => {} });
        setIsOpen(false);

        if (n.type === 'assignment') {
            navigate('/student/assignments');
        } else if (n.type === 'form') {
            navigate(`/student/take-form/${n.related_id}`);
        }
    };

    return (
        <div className="relative">
            <button 
                onClick={() => setIsOpen(!isOpen)}
                className="relative p-2 text-gray-500 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white transition-colors"
            >
                <Bell className="h-6 w-6" />
                {unreadCount > 0 && (
                    <span className="absolute top-1 right-1 inline-flex items-center justify-center px-1.5 py-0.5 text-xs font-bold leading-none text-white transform translate-x-1/4 -translate-y-1/4 bg-red-600 rounded-full">
                        {unreadCount > 9 ? '9+' : unreadCount}
                    </span>
                )}
            </button>

            {isOpen && (
                <>
                    <div className="fixed inset-0 z-40" onClick={() => setIsOpen(false)}></div>
                    <div className="absolute right-0 mt-2 w-80 sm:w-96 bg-white dark:bg-gray-800 rounded-lg shadow-xl border border-gray-100 dark:border-gray-700 z-50 overflow-hidden">
                        <div className="flex justify-between items-center p-4 border-b border-gray-100 dark:border-gray-700">
                            <h3 className="font-semibold text-gray-900 dark:text-white">Notifications</h3>
                            {unreadCount > 0 && (
                                <button onClick={handleMarkAllRead} className="text-xs text-indigo-600 hover:text-indigo-800 dark:text-indigo-400 dark:hover:text-indigo-300">
                                    Mark all read
                                </button>
                            )}
                        </div>
                        <div className="max-h-96 overflow-y-auto">
                            {notifications.length === 0 ? (
                                <div className="p-4 text-center text-sm text-gray-500">No notifications yet.</div>
                            ) : (
                                notifications.map(n => (
                                    <div 
                                        key={n.id} 
                                        onClick={() => handleNotificationClick(n)}
                                        className={`p-4 border-b border-gray-50 dark:border-gray-700/50 cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors flex gap-3 ${!n.is_read ? 'bg-indigo-50/50 dark:bg-indigo-900/10' : ''}`}
                                    >
                                        <div className="flex-1">
                                            <p className={`text-sm ${!n.is_read ? 'font-bold text-gray-900 dark:text-white' : 'font-medium text-gray-700 dark:text-gray-300'}`}>
                                                {n.title}
                                            </p>
                                            <p className="text-xs text-gray-500 mt-1 line-clamp-2">{n.message}</p>
                                            <p className="text-[10px] text-gray-400 mt-2">{new Date(n.created_at).toLocaleString()}</p>
                                        </div>
                                        {!n.is_read && (
                                            <button 
                                                onClick={(e) => handleMarkAsRead(n.id, e)} 
                                                className="self-center p-1.5 text-indigo-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-full"
                                                title="Mark as read"
                                            >
                                                <Check className="h-4 w-4" />
                                            </button>
                                        )}
                                    </div>
                                ))
                            )}
                        </div>
                    </div>
                </>
            )}
        </div>
    );
}

// Helper to convert VAPID key
function urlBase64ToUint8Array(base64String) {
    const padding = '='.repeat((4 - base64String.length % 4) % 4);
    const base64 = (base64String + padding).replace(/\-/g, '+').replace(/_/g, '/');
    const rawData = window.atob(base64);
    const outputArray = new Uint8Array(rawData.length);
    for (let i = 0; i < rawData.length; ++i) {
        outputArray[i] = rawData.charCodeAt(i);
    }
    return outputArray;
}
