import React from 'react';
import { 
  Gauge, 
  Factory, 
  Zap, 
  Target, 
  CheckSquare, 
  FileText, 
  LogOut,
  Radio,
  Building2
} from 'lucide-react';

export const Sidebar = ({ 
  currentTab, 
  setCurrentTab, 
  pendingApprovals = 0,
  currentUser,
  onLogout
}) => {
  const menuItems = [
    { id: 'dashboard', label: 'Factory Overview', icon: Gauge },
    { id: 'facilities', label: 'Plant Comparisons', icon: Factory },
    { id: 'monitoring', label: 'Live Utility Meters', icon: Zap, isLive: true },
    { id: 'targets', label: 'Emission Targets', icon: Target },
    { id: 'approvals', label: 'Review & Approvals', icon: CheckSquare, badge: pendingApprovals },
    { id: 'reporting', label: 'Annual ESG Report', icon: FileText }
  ];

  const initials = currentUser?.name 
    ? currentUser.name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase()
    : 'FE';

  const roleTitle = 
    currentUser?.role === 'SUSTAINABILITY_MANAGER' ? 'Sustainability Lead' :
    currentUser?.role === 'PLANT_COORDINATOR' ? 'Plant Coordinator' :
    currentUser?.role === 'PLANT_MANAGER' ? 'Plant Director' :
    currentUser?.role === 'AUDITOR' ? 'Data Auditor' :
    currentUser?.role === 'EXECUTIVE' ? 'Executive' : 'System Admin';

  const scopeText = currentUser?.assignedFacilities?.length > 0
    ? `${currentUser.assignedFacilities.length} Plants Assigned`
    : 'All Global Plants';

  return (
    <aside className="sidebar robin-sidebar">
      {/* Brand Header */}
      <div className="sidebar-header">
        <div className="sidebar-brand-mark">
          <Factory size={18} />
        </div>
        <div>
          <div className="sidebar-brand-name">FootprintESG</div>
          <div className="sidebar-brand-tag">Plant Operations</div>
        </div>
      </div>

      {/* Nav Section Label */}
      <div className="sidebar-section-label">
        <span>Navigation</span>
      </div>

      {/* Navigation Links */}
      <nav className="nav-links">
        {menuItems.map((item) => {
          const Icon = item.icon;
          const isActive = currentTab === item.id;
          return (
            <button
              key={item.id}
              className={`nav-item ${isActive ? 'active' : ''}`}
              onClick={() => setCurrentTab(item.id)}
              aria-current={isActive ? 'page' : undefined}
            >
              <span className="nav-icon-wrap">
                <Icon size={17} />
              </span>
              <span className="nav-label">{item.label}</span>

              {item.isLive && (
                <span className="nav-live-dot" title="Live streaming" />
              )}

              {item.badge > 0 && (
                <span className="nav-badge-pill">
                  {item.badge}
                </span>
              )}
            </button>
          );
        })}
      </nav>

      {/* User Profile Card & Sign Out */}
      <div className="sidebar-user-card">
        <div className="user-profile-row">
          <div className="user-avatar-wrap">
            <div className="user-avatar" title={currentUser?.name}>
              {initials}
            </div>
            <span className="user-status-dot" title="Active session" />
          </div>

          <div className="user-text-info">
            <div className="user-name-line" title={currentUser?.name}>
              {currentUser?.name?.split(' (')[0] || 'Factory User'}
            </div>
            <span className="user-role-badge">
              {roleTitle}
            </span>
          </div>
        </div>

        <div className="user-footer-row">
          <div className="user-scope-pill" title={scopeText}>
            <Building2 size={12} className="scope-icon" />
            <span>{scopeText}</span>
          </div>

          <button 
            type="button"
            className="btn-signout"
            onClick={onLogout}
            title="Sign out of factory portal"
            aria-label="Sign out"
          >
            <LogOut size={13} />
            <span>Sign Out</span>
          </button>
        </div>
      </div>
    </aside>
  );
};
