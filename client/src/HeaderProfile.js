import React from 'react';

const getInitials = (name) => {
  const pieces = String(name || '').trim().split(/\s+/).filter(Boolean);
  if (!pieces.length) return 'U';
  return pieces.slice(0, 2).map((piece) => piece[0]?.toUpperCase() || '').join('') || 'U';
};

function HeaderProfile({ user }) {
  if (!user) return null;

  return (
    <div className="header-profile" title={user.role === 'student' && user.student_number ? `Student number: ${user.student_number}` : user.name}>
      <div className="header-profile-avatar">
        {user.profile_picture ? (
          <img src={user.profile_picture} alt="Profile" />
        ) : (
          <span>{getInitials(user.name)}</span>
        )}
      </div>
      <div className="header-profile-details">
        <strong>{user.name}</strong>
        {user.role === 'student' && user.student_number && <span>{user.student_number}</span>}
      </div>
    </div>
  );
}

export default HeaderProfile;
