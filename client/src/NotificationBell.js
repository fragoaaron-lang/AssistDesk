import React, { useEffect, useState } from 'react';
import { getSocket } from './socket';
import axios from 'axios';
import { API_BASE_URL } from './config';
import { useAuth } from './AuthContext';

function NotificationBell() {
  const { token } = useAuth();
  const [notifications, setNotifications] = useState([]);
  const [open, setOpen] = useState(false);
  const [deletingId, setDeletingId] = useState(null);
  const [pendingDelete, setPendingDelete] = useState(null);
  const [deleteMessage, setDeleteMessage] = useState('');

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
