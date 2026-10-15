import React, { useState, useEffect } from 'react';
import { Sidebar } from './components/Sidebar';
import { Header } from './components/Header';
import { LoginPage } from './pages/LoginPage';
import { ESGOverview } from './pages/ESGOverview';
import { FacilityBenchmarking } from './pages/FacilityBenchmarking';
import { PlantMonitoring } from './pages/PlantMonitoring';
import { TargetTrajectory } from './pages/TargetTrajectory';
import { DataApprovalAudit } from './pages/DataApprovalAudit';
import { SustainabilityReport } from './pages/SustainabilityReport';
import { DataEntryModal } from './components/DataEntryModal';
import { api } from './services/api';

export default function App() {
  const urlParams = new URLSearchParams(window.location.search);
  const isMock = urlParams.get('mock') === 'true';
  const queryTab = urlParams.get('tab');

  const [currentUser, setCurrentUser] = useState(() => api.getCurrentUser());
  const [users, setUsers] = useState([]);
  const [currentTab, setCurrentTab] = useState(() => queryTab || 'dashboard');
  const [overview, setOverview] = useState(null);
  const [facilities, setFacilities] = useState([]);
  const [metrics, setMetrics] = useState([]);
  const [targets, setTargets] = useState([]);
  const [audits, setAudits] = useState([]);
  const [showDataEntryModal, setShowDataEntryModal] = useState(false);
  const [initialLoading, setInitialLoading] = useState(true);

  // Auto-authenticate if ?mock=true is passed for preview/screenshots
  useEffect(() => {
    if (isMock && !api.getCurrentUser()) {
      api.login('sarah.lin', 'FootprintESG2026!').then(res => {
        if (res.success) {
          setCurrentUser(res.data.user);
          loadData();
        }
      });
    }
  }, [isMock]);

  // Load user directory and check active session
  useEffect(() => {
    const init = async () => {
      try {
        const uRes = await api.getUsers();
        if (uRes.success && Array.isArray(uRes.data)) {
          setUsers(uRes.data);
        }
        if (currentUser) {
          await loadData();
        }
      } catch (err) {
        console.error('Initialization error:', err);
      } finally {
        setInitialLoading(false);
      }
    };
    init();
  }, [currentUser]);

  const loadData = async () => {
    try {
      const [ovRes, facRes, metRes, tgtRes, audRes] = await Promise.all([
        api.getOverview(),
        api.getFacilities(),
        api.getMetrics(),
        api.getTargets(),
        api.getAudits()
      ]);

      if (ovRes.success) setOverview(ovRes.data);
      if (facRes.success) setFacilities(facRes.data);
      if (metRes.success) setMetrics(metRes.data);
      if (tgtRes.success) setTargets(tgtRes.data);
      if (audRes.success) setAudits(audRes.data);
    } catch (err) {
      console.error('Error loading factory data:', err);
    }
  };

  const handleLogin = async (username, password) => {
    const res = await api.login(username, password);
    if (res.success && res.data?.user) {
      setCurrentUser(res.data.user);
      await loadData();
      return { success: true };
    }
    return { success: false, message: res.message || 'Login failed' };
  };

  const handleLogout = () => {
    api.setToken(null, null);
    setCurrentUser(null);
  };

  const handleSubmitMetric = async (formData) => {
    const res = await api.submitMetric(formData);
    if (res.success) {
      setMetrics(prev => [res.data, ...prev]);
      const ov = await api.getOverview();
      if (ov.success) setOverview(ov.data);
      return true;
    } else {
      alert(`Metric submission failed: ${res.message || 'An error occurred'}`);
      return false;
    }
  };

  const handleUpdateMetricStatus = async (metricId, status, reason = '') => {
    const res = await api.updateMetricStatus(metricId, status, reason);
    if (res.success) {
      setMetrics(prev => prev.map(m => m.metricId === metricId ? res.data : m));
      const ov = await api.getOverview();
      if (ov.success) setOverview(ov.data);
    } else {
      alert(`Action failed: ${res.message}`);
    }
  };

  // If not logged in or ?login=true, show the Login Page
  if ((!currentUser && !initialLoading) || urlParams.get('login') === 'true') {
    return <LoginPage onLogin={handleLogin} users={users} />;
  }

  const pendingApprovalsCount = metrics.filter(m => m.status === 'SUBMITTED').length;

  return (
    <div className="app-container">
      <Sidebar 
        currentTab={currentTab}
        setCurrentTab={setCurrentTab}
        pendingApprovals={pendingApprovalsCount}
        currentUser={currentUser}
        onLogout={handleLogout}
      />

      <div className="main-wrapper">
        <Header 
          title={
            currentTab === 'dashboard' ? 'Factory Sustainability Overview' :
            currentTab === 'facilities' ? 'Plant Comparisons & Rankings' :
            currentTab === 'monitoring' ? 'Live Utility & Substation Meters' :
            currentTab === 'targets' ? '2030 Emission Targets & Efficiency Projects' :
            currentTab === 'approvals' ? 'Data Review & Approvals' :
            'Annual Factory Environmental Report'
          }
          onOpenDataEntry={() => setShowDataEntryModal(true)}
        />

        <main className="content-body">
          {currentTab === 'dashboard' && (
            <ESGOverview 
              overview={overview}
              facilities={facilities}
              metrics={metrics}
              onApproveMetric={id => handleUpdateMetricStatus(id, 'APPROVED')}
              onOpenDataEntry={() => setShowDataEntryModal(true)}
            />
          )}

          {currentTab === 'facilities' && (
            <FacilityBenchmarking />
          )}

          {currentTab === 'monitoring' && (
            <PlantMonitoring 
              facilities={facilities}
              metrics={metrics}
            />
          )}

          {currentTab === 'targets' && (
            <TargetTrajectory targets={targets} />
          )}

          {currentTab === 'approvals' && (
            <DataApprovalAudit 
              metrics={metrics}
              audits={audits}
              onUpdateMetricStatus={handleUpdateMetricStatus}
            />
          )}

          {currentTab === 'reporting' && (
            <SustainabilityReport 
              overview={overview}
              facilities={facilities}
              metrics={metrics}
            />
          )}
        </main>
      </div>

      {showDataEntryModal && (
        <DataEntryModal 
          facilities={facilities}
          onClose={() => setShowDataEntryModal(false)}
          onSubmit={handleSubmitMetric}
          onBatchImportComplete={() => loadData()}
        />
      )}
    </div>
  );
}
