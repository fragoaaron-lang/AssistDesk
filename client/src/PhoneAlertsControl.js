import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { API_BASE_URL } from './config';
import { useAuth } from './AuthContext';

const base64UrlToBytes = (value) => {
  const padding = '='.repeat((4 - (value.length % 4)) % 4);
  const base64 = (value + padding).replace(/-/g, '+').replace(/_/g, '/');
  const rawData = window.atob(base64);
  return Uint8Array.from(rawData, (character) => character.charCodeAt(0));
};

function PhoneAlertsControl() {
  const { token } = useAuth();
  const [enabled, setEnabled] = useState(false);
  const [busy, setBusy] = useState(false);
  const [status, setStatus] = useState('');
  const supportsPush = typeof window !== 'undefined'
    && 'Notification' in window
    && 'serviceWorker' in navigator
    && 'PushManager' in window;

  useEffect(() => {
    let cancelled = false;
    if (!token || !supportsPush) {
      setEnabled(false);
      return undefined;
    }

    navigator.serviceWorker.getRegistration()
      .then((registration) => registration?.pushManager.getSubscription())
      .then((subscription) => {
        if (!cancelled) setEnabled(Boolean(subscription));
      })
      .catch(() => {
        if (!cancelled) setEnabled(false);
      });

    return () => { cancelled = true; };
  }, [token, supportsPush]);

  const togglePhoneAlerts = async () => {
    if (busy || !token || !supportsPush) return;
    setBusy(true);
    setStatus('');

    try {
      if (enabled) {
        const registration = await navigator.serviceWorker.getRegistration();
        const subscription = await registration?.pushManager.getSubscription();
        if (subscription) {
          await axios.delete(`${API_BASE_URL}/api/push/subscriptions`, {
            headers: { Authorization: `Bearer ${token}` },
            data: { endpoint: subscription.endpoint },
          });
          await subscription.unsubscribe();
        }
        setEnabled(false);
        setStatus('Phone alerts are off for this device.');
        return;
      }

      if (!window.isSecureContext) {
        throw new Error('Phone alerts require a secure HTTPS connection.');
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
      if (!publicKey) throw new Error('Phone alerts are not configured on the server yet.');

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

      setEnabled(true);
      setStatus('Phone alerts are on for this device.');
    } catch (error) {
      setStatus(error.response?.data?.message || error.message || 'Unable to update phone alerts.');
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="preference-row phone-alerts-row">
      <span className="phone-alerts-copy">
        <span>Enable phone alerts</span>
        <small>{supportsPush ? 'Receive updates on this device, even when AssistDesk is closed.' : 'Phone alerts are not supported by this browser.'}</small>
        {status && <small role="status">{status}</small>}
      </span>
      <button
        type="button"
        className={`preference-switch ${enabled ? 'on' : ''}`}
        role="switch"
        aria-label="Enable phone alerts"
        aria-checked={enabled}
        onClick={togglePhoneAlerts}
        disabled={!supportsPush || busy}
      >
        <span className="preference-switch-track" aria-hidden="true"><span className="preference-switch-thumb" /></span>
        <span className="preference-switch-label">{busy ? '…' : enabled ? 'ON' : 'OFF'}</span>
      </button>
    </div>
  );
}

export default PhoneAlertsControl;