import React from 'react';

const TicketProgressBar = ({ status, canUpdate = false, onStatusChange, updatingStatus = '' }) => {
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
          {statuses.map((s, index) => {
            const isUpdating = updatingStatus === s;
            const stepClassName = `ticket-progress-step ${s === status ? 'active' : ''} ${index < currentIndex ? 'completed' : ''} ${canUpdate ? 'interactive' : ''}`;
            const stepLabel = isUpdating ? 'Updating...' : statusLabels[s];

            return canUpdate ? (
              <button
                key={s}
                type="button"
                className={stepClassName}
                title={`Set status to ${statusLabels[s]}`}
                aria-label={`Set ticket status to ${statusLabels[s]}`}
                aria-current={s === status ? 'step' : undefined}
                onClick={() => onStatusChange(s)}
                disabled={Boolean(updatingStatus)}
              >
                <span className="ticket-progress-dot" />
                <span className="ticket-progress-label">{stepLabel}</span>
              </button>
            ) : (
              <div
              key={s}
              className={`ticket-progress-step ${s === status ? 'active' : ''} ${index < currentIndex ? 'completed' : ''}`}
              title={statusLabels[s]}
            >
              <div className="ticket-progress-dot" />
              <span className="ticket-progress-label">{statusLabels[s]}</span>
              </div>
            );
          })}
        </div>
      </div>
      <div className="ticket-progress-status">
        <span className={`ticket-status-badge ${status}`}>{statusLabels[status]}</span>
        {canUpdate && <span className="ticket-progress-hint">Select a stage to update this ticket</span>}
      </div>
    </div>
  );
};

export default TicketProgressBar;
