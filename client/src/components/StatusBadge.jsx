import React from 'react';

export const StatusBadge = ({ status }) => {
  const normalized = (status || '').toLowerCase().replace(/_/g, '-');
  let badgeClass = 'badge-info';

  if (['approved', 'verified-compliant', 'on-track'].includes(normalized)) {
    badgeClass = 'badge-approved';
  } else if (['submitted', 'requires-attention', 'in-progress'].includes(normalized)) {
    badgeClass = 'badge-submitted';
  } else if (['audit-locked', 'off-track'].includes(normalized)) {
    badgeClass = 'badge-audit-locked';
  } else if (['draft', 'limited-assurance'].includes(normalized)) {
    badgeClass = 'badge-draft';
  }

  return (
    <span className={`badge ${badgeClass}`}>
      {status}
    </span>
  );
};
