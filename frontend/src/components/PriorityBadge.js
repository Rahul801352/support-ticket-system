import React from 'react';

const PriorityBadge = ({ priority }) => {
  const p = priority ? priority.toLowerCase() : 'medium';
  return (
    <span className={`badge badge-${p}`}>
      ▲ {p}
    </span>
  );
};

export default PriorityBadge;
