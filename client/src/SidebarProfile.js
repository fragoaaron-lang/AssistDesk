import React from 'react';

const getInitials = (name) => {
  const pieces = String(name || '').trim().split(/\s+/).filter(Boolean);
  if (!pieces.length) return 'U';
  return pieces.slice(0, 2).map((piece) => piece[0]?.toUpperCase() || '').join('') || 'U';
};

function SidebarProfile({ user }) {
  return (
    <div className="sidebar-profile-content">
      <div className="sidebar-profile-avatar">
        {user?.profile_picture ? (
          <img src={user.profile_picture} alt="Profile" />
        ) : (
          <span>{getInitials(user?.name)}</span>
        )}
      </div>
      <div>
        <div className="mobile-profile-name">{user?.name || 'User'}</div>
        <div className="mobile-profile-role">{user?.role || 'Member'}</div>
        {user?.role === 'student' && user?.student_number && (
          <div className="sidebar-profile-student-number">{user.student_number}</div>
        )}
      </div>
    </div>
  );
}

export default SidebarProfile;
