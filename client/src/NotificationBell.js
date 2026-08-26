import React, { useEffect, useState } from 'react';
import { getSocket } from './socket';
import axios from 'axios';
import { API_BASE_URL } from './config';
import { useAuth } from './AuthContext';

function NotificationBell() {
  const { token } = useAuth();
  const [notifications, setNotifications] = useState([]);
  const [open, setOpen] = useState(false);

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
            <div key={note.id} style={{ borderBottom: '1px solid #eee', padding: '0.75rem 0' }}>
              {note.message}
              <div style={{ fontSize: '0.85rem', color: '#888', marginTop: '0.25rem' }}>{new Date(note.created_at).toLocaleString()}</div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default NotificationBell;
