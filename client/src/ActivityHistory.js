import React from 'react';

const activityLabels = {
  'account.registered': 'Created your account',
  'account.email_verified': 'Verified your email address',
  'account.verification_resent': 'Requested a new verification code',
  'auth.login': 'Signed in',
  'auth.logout': 'Signed out',
  'auth.login_denied': 'Sign-in attempt blocked',
  'account.profile_updated': 'Updated your profile',
  'account.password_changed': 'Changed your password',
  'account.password_reset_requested': 'Requested a password reset',
  'account.password_reset': 'Reset your password',
  'account.department_changed': 'Changed a user’s department',
  'account.deactivated': 'Deactivated a user account',
  'account.reactivated': 'Reactivated a user account',
  'auth.sessions_revoked': 'Signed out other sessions',
  'auth.login_failed': 'Unsuccessful sign-in attempt',
  'auth.login_denied': 'Sign-in attempt blocked',
  'account.self_deleted': 'Deleted your account',
  'ticket.created': 'Created a support ticket',
  'ticket.status_changed': 'Updated a ticket status',
  'ticket.closed_or_resolved': 'Resolved or closed a ticket',
  'ticket.comment_added': 'Added a ticket update',
  'ticket.deleted': 'Deleted a support ticket',
  'ticket.rerouted': 'Rerouted a support ticket',
  'ticket.priority_escalated': 'Escalated a ticket’s priority',
  'ticket.priority_auto_escalated': 'Ticket priority was escalated automatically',
  'ticket.eta_changed': 'Updated a ticket estimate',
};

const getActivityLabel = (action) => activityLabels[action]
  || String(action || 'Activity recorded')
    .split(/[._]/g)
    .filter(Boolean)
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');

const formatActivityDate = (value) => {
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? 'Date unavailable' : date.toLocaleString();
};

function ActivityHistoryList({ activity = [], loading = false, error = '', compact = false }) {
  if (loading) {
    return (
      <div className={`activity-history-list${compact ? ' is-compact' : ''}`} role="status" aria-label="Loading activity history" aria-busy="true">
        <span className="report-skeleton-announcement">Loading your activity history…</span>
        {[0, 1, 2, ...(compact ? [] : [3, 4])].map((row) => (
          <div className="activity-history-item activity-history-skeleton" key={row} aria-hidden="true">
            <span className="surface-skeleton-block activity-history-marker" />
            <span className="surface-skeleton-block activity-history-title" />
            <span className="surface-skeleton-block activity-history-date" />
          </div>
        ))}
      </div>
    );
  }

  if (error) return <p className="activity-history-message is-error" role="alert">{error}</p>;
  if (!activity.length) return <p className="activity-history-message">No account activity has been recorded yet.</p>;

  return (
    <ol className={`activity-history-list${compact ? ' is-compact' : ''}`} aria-label="Your account activity">
      {activity.map((entry) => (
        <li className="activity-history-item" key={entry.id}>
          <span className="activity-history-marker" aria-hidden="true">
            <svg viewBox="0 0 16 16"><circle cx="8" cy="8" r="3" /></svg>
          </span>
          <span className="activity-history-copy">
            <strong>{getActivityLabel(entry.action)}</strong>
            {entry.entity_type && entry.entity_type !== 'user' && (
              <small>{entry.entity_type.replace(/_/g, ' ')}{entry.entity_id ? ` #${entry.entity_id}` : ''}</small>
            )}
          </span>
          <time dateTime={entry.created_at}>{formatActivityDate(entry.created_at)}</time>
        </li>
      ))}
    </ol>
  );
}

export default ActivityHistoryList;