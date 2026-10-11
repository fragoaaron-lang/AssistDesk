import React, { useEffect, useState } from 'react';
import { getSocket } from './socket';
import axios from 'axios';
import { API_BASE_URL } from './config';
import { useAuth } from './AuthContext';

const base64UrlToBytes = (value) => {
  const padding = '='.repeat((4 - (value.length % 4)) % 4);
  const base64 = (value + padding).replace(/-/g, '+').replace(/_/g, '/');
  const rawData = window.atob(base64);
  return Uint8Array.from(rawData, (character) => character.charCodeAt(0));
};

function NotificationBell() {
  const { token } = useAuth();
  const [notifications, setNotifications] = useState([]);
  const [open, setOpen] = useState(false);
  const [deletingId, setDeletingId] = useState(null);
  const [pendingDelete, setPendingDelete] = useState(null);
  const [deleteMessage, setDeleteMessage] = useState('');
  const [pushEnabled, setPushEnabled] = useState(false);
  const [pushBusy, setPushBusy] = useState(false);
  const [pushStatus, setPushStatus] = useState('');
  const supportsPush = typeof window !== 'undefined'
    && 'Notification' in window
    && 'serviceWorker' in navigator
    && 'PushManager' in window;

  const loadNotifications = async () => {
    try {
      const res = await axios.get(`${API_BASE_URL}/api/dashboard/notifications`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setNotifications(res.data || []);
    } catch (err) {
      console.error('Unable to load notifications', err);
      setNotifications([]);
    }
  };

  const deleteNotification = async (notificationId) => {
    if (deletingId !== null || !token) return;
    const previousNotifications = notifications;
    setDeletingId(notificationId);
    setNotifications((current) => current.filter((notification) => notification.id !== notificationId));
    try {
      await axios.delete(`${API_BASE_URL}/api/dashboard/notifications/${notificationId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setDeleteMessage('Notification deleted successfully.');
      window.setTimeout(() => setDeleteMessage(''), 2400);
    } catch (err) {
      setNotifications(previousNotifications);
      console.error('Unable to delete notification', err);
    } finally {
      setDeletingId(null);
    }
  };

  const confirmDelete = () => {
    if (!pendingDelete) return;
    const notificationId = pendingDelete.id;
    setPendingDelete(null);
    deleteNotification(notificationId);
  };

  useEffect(() => {
    if (!token) {
      setNotifications([]);
      return;
    }

    loadNotifications();

    const socket = getSocket();
    if (!socket) return;

    const refreshNotifications = () => loadNotifications();

    socket.on('ticketCreated', refreshNotifications);
    socket.on('ticketStatusUpdated', refreshNotifications);
    socket.on('ticketEtaUpdated', refreshNotifications);
    socket.on('ticketEtaExpired', refreshNotifications);
    socket.on('announcementCreated', refreshNotifications);

    return () => {
      socket.off('ticketCreated', refreshNotifications);
      socket.off('ticketStatusUpdated', refreshNotifications);
      socket.off('ticketEtaUpdated', refreshNotifications);
      socket.off('ticketEtaExpired', refreshNotifications);
      socket.off('announcementCreated', refreshNotifications);
    };
  }, [token]);

  useEffect(() => {
    let cancelled = false;
    if (!token || !supportsPush) {
      setPushEnabled(false);
      return undefined;
    }

    navigator.serviceWorker.getRegistration()
      .then((registration) => registration?.pushManager.getSubscription())
      .then((subscription) => {
        if (!cancelled) setPushEnabled(Boolean(subscription));
      })
      .catch(() => {
        if (!cancelled) setPushEnabled(false);
      });

    return () => { cancelled = true; };
  }, [token, supportsPush]);

  const togglePhoneNotifications = async () => {
    if (pushBusy || !token) return;
    setPushBusy(true);
    setPushStatus('');

    try {
      if (pushEnabled) {
        const registration = await navigator.serviceWorker.getRegistration();
        const subscription = await registration?.pushManager.getSubscription();
        if (subscription) {
          await axios.delete(`${API_BASE_URL}/api/push/subscriptions`, {
            headers: { Authorization: `Bearer ${token}` },
            data: { endpoint: subscription.endpoint },
          });
          await subscription.unsubscribe();
        }
        setPushEnabled(false);
        setPushStatus('Phone notifications are off.');
        return;
      }

      if (!window.isSecureContext) {
        throw new Error('Phone notifications require a secure HTTPS connection.');
      }

      const permission = await window.Notification.requestPermission();
      if (permission !== 'granted') {
        throw new Error(permission === 'denied'
          ? 'Notifications are blocked. Allow them in your browser or device settings.'
          : 'Allow notifications to receive phone alerts.');
      }

      const registration = await navigator.serviceWorker.getRegistration()
        || await navigator.serviceWorker.register(`${process.env.PUBLIC_URL || ''}/service-worker.js`);
      const keyResponse = await axios.get(`${API_BASE_URL}/api/push/public-key`);
      const publicKey = keyResponse.data?.publicKey;
      if (!publicKey) throw new Error('Phone notifications are not configured on the server yet.');

      const subscription = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: base64UrlToBytes(publicKey),
      });

      try {
        await axios.post(`${API_BASE_URL}/api/push/subscriptions`, subscription.toJSON(), {
          headers: { Authorization: `Bearer ${token}` },
        });
      } catch (error) {
        await subscription.unsubscribe();
        throw error;
      }

      setPushEnabled(true);
      setPushStatus('Phone notifications are on for this device.');
    } catch (error) {
      setPushStatus(error.response?.data?.message || error.message || 'Unable to update phone notifications.');
    } finally {
      setPushBusy(false);
    }
  };

  const hasNotifications = notifications.length > 0;

  return (
    <div className="notification-bell-wrap">
      <button
        type="button"
        className={`notification-button ${hasNotifications ? 'has-notifications' : ''}`}
        onClick={() => setOpen((prev) => !prev)}
        aria-label="Notifications"
        title={hasNotifications ? `${notifications.length} unread notification(s)` : 'No notifications'}
      >
        <span className="notification-bell-icon" aria-hidden="true">🔔</span>
        {hasNotifications && <span className="notification-badge">{notifications.length}</span>}
      </button>

      {open && (
        <div className="notification-dropdown" role="menu" aria-label="Notification list">
          <div className="notification-dropdown-header">Recent Notifications</div>
          {supportsPush && (
            <div className="notification-push-settings">
              <button type="button" className="notification-push-toggle" onClick={togglePhoneNotifications} disabled={pushBusy}>
                {pushBusy ? 'Updating…' : pushEnabled ? 'Turn off phone alerts' : 'Enable phone alerts'}
              </button>
              <span>Receive updates on this device, even when AssistDesk is closed.</span>
              {pushStatus && <small role="status">{pushStatus}</small>}
            </div>
          )}
          {notifications.length === 0 ? (
            <div className="notification-empty">No notifications yet.</div>
          ) : (
            notifications.map((note) => (
              <div key={note.id} className="notification-bell-item">
                <div className="notification-bell-content">
                  <div>{note.message}</div>
                  <div className="notification-bell-time">{new Date(note.created_at).toLocaleString()}</div>
                </div>
                <button
                  type="button"
                  className="notification-delete-btn"
                  onClick={(event) => { event.stopPropagation(); setPendingDelete(note); }}
                  disabled={deletingId === note.id}
                  title="Delete notification"
                  aria-label="Delete notification"
                >
                  ×
                </button>
              </div>
            ))
          )}
        </div>
      )}

      {pendingDelete && (
        <div className="notification-confirm-backdrop" role="presentation">
          <div className="notification-confirm-dialog" role="dialog" aria-modal="true" aria-labelledby="notification-confirm-title">
            <strong id="notification-confirm-title">Delete notification?</strong>
            <p>{pendingDelete.message}</p>
            <div className="notification-confirm-actions">
              <button type="button" className="institutional-btn small secondary" onClick={() => setPendingDelete(null)}>Cancel</button>
              <button type="button" className="institutional-btn small notification-confirm-delete" onClick={confirmDelete}>Delete</button>
            </div>
          </div>
        </div>
      )}

      {deleteMessage && <div className="notification-success-popup" role="status">{deleteMessage}</div>}
    </div>
  );
}

export default NotificationBell;
