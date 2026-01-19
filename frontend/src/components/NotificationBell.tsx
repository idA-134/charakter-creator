import { useEffect, useState } from 'react';
import { api } from '../services/api';

export default function NotificationBell() {
  const [unreadCount, setUnreadCount] = useState(0);
  const [showNotifications, setShowNotifications] = useState(false);
  const [notifications, setNotifications] = useState<any[]>([]);
  const user = JSON.parse(localStorage.getItem('user') || '{}');

  useEffect(() => {
    if (user.id) {
      loadUnreadCount();
      // Alle 30 Sekunden aktualisieren
      const interval = setInterval(loadUnreadCount, 30000);
      return () => clearInterval(interval);
    }
  }, [user.id]);

  const loadUnreadCount = async () => {
    try {
      const res = await api.get(`/notifications/user/${user.id}/unread`);
      setUnreadCount(res.data.count);
    } catch (error) {
      console.error('Fehler beim Laden der Notification-Anzahl:', error);
    }
  };

  const loadNotifications = async () => {
    try {
      const res = await api.get(`/notifications/user/${user.id}`);
      setNotifications(res.data);
    } catch (error) {
      console.error('Fehler beim Laden der Notifications:', error);
    }
  };

  const markAsRead = async (id: number) => {
    try {
      await api.put(`/notifications/${id}/read`);
      loadNotifications();
      loadUnreadCount();
    } catch (error) {
      console.error('Fehler beim Markieren:', error);
    }
  };

  const markAllAsRead = async () => {
    try {
      await api.put(`/notifications/user/${user.id}/read-all`);
      loadNotifications();
      loadUnreadCount();
    } catch (error) {
      console.error('Fehler beim Markieren:', error);
    }
  };

  const toggleNotifications = () => {
    if (!showNotifications) {
      loadNotifications();
    }
    setShowNotifications(!showNotifications);
  };

  return (
    <div className="relative">
      <button
        onClick={toggleNotifications}
        className="relative p-2 text-gray-600 hover:text-gray-900 transition-colors"
      >
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
        </svg>
        {unreadCount > 0 && (
          <span className="absolute top-0 right-0 inline-flex items-center justify-center px-2 py-1 text-xs font-bold leading-none text-white transform translate-x-1/2 -translate-y-1/2 bg-red-600 rounded-full">
            {unreadCount}
          </span>
        )}
      </button>

      {showNotifications && (
        <div className="absolute right-0 mt-2 w-96 bg-white rounded-lg shadow-2xl border border-gray-200 z-50">
          <div className="p-4 border-b border-gray-200 flex justify-between items-center">
            <h3 className="font-semibold text-gray-900">Benachrichtigungen</h3>
            {unreadCount > 0 && (
              <button
                onClick={markAllAsRead}
                className="text-sm text-blue-600 hover:text-blue-800"
              >
                Alle als gelesen markieren
              </button>
            )}
          </div>
          
          <div className="max-h-96 overflow-y-auto">
            {notifications.length === 0 ? (
              <div className="p-8 text-center text-gray-500">
                Keine Benachrichtigungen
              </div>
            ) : (
              notifications.map((notif) => (
                <div
                  key={notif.id}
                  className={`p-4 border-b border-gray-100 hover:bg-gray-50 cursor-pointer ${
                    !notif.is_read ? 'bg-blue-50' : ''
                  }`}
                  onClick={() => !notif.is_read && markAsRead(notif.id)}
                >
                  <div className="flex justify-between items-start">
                    <div className="flex-1">
                      <h4 className="font-semibold text-gray-900 text-sm">
                        {notif.type === 'quest_assigned' && '📋'}
                        {notif.type === 'submission_received' && '📬'}
                        {notif.type === 'quest_graded' && '✅'}
                        {' '}{notif.title}
                      </h4>
                      <p className="text-sm text-gray-600 mt-1">{notif.message}</p>
                      <p className="text-xs text-gray-400 mt-2">
                        {new Date(notif.created_at).toLocaleString('de-DE')}
                      </p>
                    </div>
                    {!notif.is_read && (
                      <span className="ml-2 w-2 h-2 bg-blue-600 rounded-full flex-shrink-0 mt-1"></span>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}
