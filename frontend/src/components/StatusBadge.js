import React from 'react';

const StatusBadge = ({ status }) => {
  const formatted = status ? status.replace('_', ' ') : 'open';
  return (
    <span className={`badge badge-${status}`}>
      ● {formatted}
    </span>
  );
};

export default StatusBadge;
