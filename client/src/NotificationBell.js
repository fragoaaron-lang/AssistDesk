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

  const loadNotifications = async () => {
    try {
      const res = await axios.get(`${API_BASE_URL}/api/dashboard/notifications`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setNotifications(res.data);
    } catch (err) {
      console.error('Unable to load notifications', err);
      setNotifications([]);
    }
  };

  const deleteNotification = async (notificationId) => {
    if (deletingId !== null) return;
    const previousNotifications = notifications;
    setDeletingId(notificationId);
    setNotifications((current) => current.filter((notification) => notification.id !== notificationId));
    try {
      await axios.delete(`${API_BASE_URL}/api/dashboard/notifications/${notificationId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
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
    if (!token) return;

    const socket = getSocket();
    if (!socket) return;

    loadNotifications();

    socket.on('ticketCreated', loadNotifications);
    socket.on('ticketStatusUpdated', loadNotifications);
    socket.on('announcementCreated', loadNotifications);

    return () => {
      socket.off('ticketCreated', loadNotifications);
      socket.off('ticketStatusUpdated', loadNotifications);
      socket.off('announcementCreated', loadNotifications);
    };
  }, [token]);

  return (
    <div style={{ position: 'relative' }}>
      <button
        className="notification-button"
        onClick={() => setOpen((prev) => !prev)}
        style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.75rem 1rem', borderRadius: '999px', background: '#1976d2', color: '#fff', border: 'none', cursor: 'pointer' }}
      >
        🔔 {notifications.length}
      </button>
      {open && (
        <div style={{ position: 'absolute', top: '3.5rem', right: 0, width: '320px', maxHeight: '360px', overflowY: 'auto', background: '#fff', border: '1px solid #ddd', borderRadius: '8px', boxShadow: '0 8px 20px rgba(0,0,0,0.1)', padding: '0.75rem', zIndex: 10 }}>
          <div style={{ marginBottom: '0.75rem', fontWeight: 'bold' }}>Recent Notifications</div>
          {notifications.length === 0 && <div style={{ color: '#666' }}>No notifications yet.</div>}
          {notifications.map((note) => (
            <div key={note.id} className="notification-bell-item">
              <div className="notification-bell-content">
                <div>{note.message}</div>
                <div style={{ fontSize: '0.85rem', color: '#888', marginTop: '0.25rem' }}>{new Date(note.created_at).toLocaleString()}</div>
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
          ))}
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
    </div>
  );
}

export default NotificationBell;
