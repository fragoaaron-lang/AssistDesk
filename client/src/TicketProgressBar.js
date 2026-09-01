import React from 'react';

const TicketProgressBar = ({ status }) => {
  const statuses = ['open', 'pending', 'in_progress', 'resolved', 'closed'];
  const statusLabels = {
    open: 'Submitted',
    pending: 'Pending',
    in_progress: 'In Progress',
    resolved: 'Resolved',
    closed: 'Closed',
  };

  const currentIndex = statuses.indexOf(status);
  const progressPercentage = ((currentIndex + 1) / statuses.length) * 100;

  return (
    <div className="ticket-progress-container">
      <div className="ticket-progress-bar">
        <div className="ticket-progress-fill" style={{ width: `${progressPercentage}%` }} />
        <div className="ticket-progress-steps">
          {statuses.map((s, index) => (
            <div
              key={s}
              className={`ticket-progress-step ${s === status ? 'active' : ''} ${index < currentIndex ? 'completed' : ''}`}
              title={statusLabels[s]}
            >
              <div className="ticket-progress-dot" />
              <span className="ticket-progress-label">{statusLabels[s]}</span>
            </div>
          ))}
        </div>
      </div>
      <div className="ticket-progress-status">
        <span className={`ticket-status-badge ${status}`}>{statusLabels[status]}</span>
      </div>
    </div>
  );
};

export default TicketProgressBar;
