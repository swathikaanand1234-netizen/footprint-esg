import React, { useState, useEffect } from 'react';
import { FileCheck2, ShieldCheck, CheckCircle2, XCircle, Lock, History, AlertCircle } from 'lucide-react';
import { StatusBadge } from '../components/StatusBadge';
import { api } from '../services/api';

export const DataApprovalAudit = ({ metrics, audits, onUpdateMetricStatus }) => {
  const [activeTab, setActiveTab] = useState('METRICS');
  const [rejectingMetricId, setRejectingMetricId] = useState(null);
  const [rejectionReason, setRejectionReason] = useState('');
  const [auditLogs, setAuditLogs] = useState([]);
  const [loadingLogs, setLoadingLogs] = useState(false);

  useEffect(() => {
    if (activeTab === 'INTERNAL_AUDIT') {
      setLoadingLogs(true);
      api.getAuditLogs().then(res => {
        if (res.success) setAuditLogs(res.data);
        setLoadingLogs(false);
      });
    }
  }, [activeTab]);

  const handleConfirmReject = async () => {
    if (!rejectionReason.trim()) return;
    await onUpdateMetricStatus(rejectingMetricId, 'REJECTED', rejectionReason);
    setRejectingMetricId(null);
    setRejectionReason('');
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      <div className="panel" style={{ padding: 16 }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12 }}>
          <div>
            <h2 style={{ fontSize: '1rem', fontWeight: 700 }}>ESG Data Quality Governance & Audit Trails</h2>
            <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
              Four-eyes verification, controller approvals, rejection tracing, and audit-locked assertions.
            </p>
          </div>

          <div style={{ display: 'flex', gap: 8 }}>
            <button 
              className={`btn btn-sm ${activeTab === 'METRICS' ? 'btn-primary' : 'btn-secondary'}`}
              onClick={() => setActiveTab('METRICS')}
            >
              Facility Records Queue ({metrics.length})
            </button>
            <button 
              className={`btn btn-sm ${activeTab === 'INTERNAL_AUDIT' ? 'btn-primary' : 'btn-secondary'}`}
              onClick={() => setActiveTab('INTERNAL_AUDIT')}
            >
              <History size={13} />
              <span>Mutation Audit Trail</span>
            </button>
            <button 
              className={`btn btn-sm ${activeTab === 'AUDITS' ? 'btn-primary' : 'btn-secondary'}`}
              onClick={() => setActiveTab('AUDITS')}
            >
              Assurance Certifications ({audits.length})
            </button>
          </div>
        </div>
      </div>

      {activeTab === 'METRICS' && (
        <div className="panel">
          <div className="panel-header">
            <div className="panel-title">
              <FileCheck2 size={18} style={{ color: 'var(--color-primary)' }} />
              <span>Environmental Data Quality Records ({metrics.length})</span>
            </div>
          </div>

          <div className="table-responsive">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Record Identifier</th>
                  <th>Facility</th>
                  <th>Period</th>
                  <th>Total Emissions</th>
                  <th>Intensity</th>
                  <th>Reporting Lead</th>
                  <th>Status</th>
                  <th>Four-Eyes Sign-Off</th>
                </tr>
              </thead>
              <tbody>
                {metrics.map((m, idx) => (
                  <tr key={m.metricId || m._id || `m-${idx}`}>
                    <td className="mono" style={{ fontWeight: 700 }}>{m.metricId}</td>
                    <td style={{ fontWeight: 600 }}>{m.facilityName}</td>
                    <td className="mono">{m.reportingPeriod}</td>
                    <td className="mono" style={{ fontWeight: 600 }}>{m.totalEmissionsTons} tCO2e</td>
                    <td className="mono">{m.emissionIntensity}</td>
                    <td>{m.submittedBy || 'Plant EHS'}</td>
                    <td>
                      <StatusBadge status={m.status} />
                      {m.status === 'REJECTED' && m.rejectionReason && (
                        <div style={{ fontSize: '0.72rem', color: '#b91c1c', marginTop: 4 }}>
                          Reason: {m.rejectionReason}
                        </div>
                      )}
                    </td>
                    <td>
                      {m.status === 'SUBMITTED' && (
                        <div style={{ display: 'flex', gap: 6 }}>
                          <button 
                            className="btn btn-primary btn-sm"
                            onClick={() => onUpdateMetricStatus(m.metricId, 'APPROVED')}
                            title="Verify and Approve record"
                          >
                            <CheckCircle2 size={13} />
                            <span>Approve</span>
                          </button>
                          <button 
                            className="btn btn-secondary btn-sm"
                            onClick={() => setRejectingMetricId(m.metricId)}
                            style={{ color: '#b91c1c' }}
                            title="Reject record with reason"
                          >
                            <XCircle size={13} />
                            <span>Reject</span>
                          </button>
                        </div>
                      )}

                      {m.status === 'APPROVED' && (
                        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                          <span style={{ fontSize: '0.78rem', color: 'var(--color-success)', fontWeight: 600 }}>
                            Approved ({m.approvedBy ? m.approvedBy.split(' ')[0] : 'Controller'})
                          </span>
                          <button 
                            className="btn btn-secondary btn-sm"
                            onClick={() => onUpdateMetricStatus(m.metricId, 'AUDIT_LOCKED')}
                            title="Lock Record for Financial & Regulatory Filing"
                          >
                            <Lock size={12} />
                          </button>
                        </div>
                      )}

                      {m.status === 'AUDIT_LOCKED' && (
                        <span className="badge badge-audit-locked" style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}>
                          <Lock size={11} /> IMMUTABLE
                        </span>
                      )}

                      {m.status === 'DRAFT' && (
                        <button 
                          className="btn btn-secondary btn-sm"
                          onClick={() => onUpdateMetricStatus(m.metricId, 'SUBMITTED')}
                        >
                          <span>Submit</span>
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {activeTab === 'INTERNAL_AUDIT' && (
        <div className="panel">
          <div className="panel-header">
            <div className="panel-title">
              <History size={18} style={{ color: 'var(--color-primary)' }} />
              <span>Tamper-Proof Internal Mutation Audit Log (PR-13, FR-044)</span>
            </div>
          </div>
          <div className="table-responsive">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Timestamp</th>
                  <th>Action</th>
                  <th>Entity</th>
                  <th>Actor</th>
                  <th>Facility</th>
                  <th>Mutation Details</th>
                </tr>
              </thead>
              <tbody>
                {auditLogs.map((log, idx) => (
                  <tr key={log.logId || log._id || `log-${idx}`}>
                    <td className="mono" style={{ fontSize: '0.78rem' }}>
                      {new Date(log.timestamp).toLocaleString()}
                    </td>
                    <td>
                      <span className="badge badge-info">{log.action}</span>
                    </td>
                    <td className="mono">{log.entityId}</td>
                    <td>
                      <strong>{log.actor?.username}</strong>
                      <span style={{ fontSize: '0.74rem', color: 'var(--text-dim)', display: 'block' }}>
                        {log.actor?.role}
                      </span>
                    </td>
                    <td>{log.facilityId || 'Corporate'}</td>
                    <td style={{ fontSize: '0.78rem' }}>
                      {log.changes ? JSON.stringify(log.changes) : log.notes || '—'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {activeTab === 'AUDITS' && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(360px, 1fr))', gap: 18 }}>
          {audits.map((a, idx) => (
            <div key={a.auditId || a._id || `aud-${idx}`} className="panel">
              <div className="panel-header" style={{ alignItems: 'flex-start' }}>
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                    <span className="mono" style={{ fontSize: '0.78rem', fontWeight: 700, color: 'var(--color-primary)' }}>
                      {a.auditId}
                    </span>
                    <StatusBadge status={a.status} />
                  </div>
                  <h3 style={{ fontSize: '0.94rem', fontWeight: 700 }}>{a.standard}</h3>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{a.facilityName}</div>
                </div>
              </div>

              <div className="panel-body" style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                <div style={{ background: '#f8fafc', padding: 10, borderRadius: 6, fontSize: '0.78rem', border: '1px solid var(--border-color)' }}>
                  <div>Assurance Firm: <strong>{a.auditorOrg}</strong></div>
                  <div>Lead Verifier: <strong>{a.leadAuditor}</strong></div>
                  <div>Audit Period: <span className="mono">{a.auditPeriod}</span></div>
                </div>

                <div style={{ fontSize: '0.8rem', color: 'var(--text-main)', lineHeight: 1.5 }}>
                  "{a.statementSummary}"
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Rejection Reason Modal (FR-027) */}
      {rejectingMetricId && (
        <div className="modal-overlay">
          <div className="modal-content" style={{ maxWidth: 440 }}>
            <div className="modal-header">
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <AlertCircle size={18} style={{ color: '#b91c1c' }} />
                <h3 style={{ fontSize: '1rem', fontWeight: 700 }}>Reject Environmental Record</h3>
              </div>
            </div>
            <div className="modal-body">
              <p style={{ fontSize: '0.82rem', color: 'var(--text-muted)', marginBottom: 12 }}>
                Please specify an auditable reason for returning record <strong>{rejectingMetricId}</strong> back to draft.
              </p>
              <textarea 
                className="form-input" 
                rows={3}
                placeholder="e.g. Utility invoice mismatch with reported kWh electricity meter reading..."
                value={rejectionReason}
                onChange={e => setRejectionReason(e.target.value)}
                required
              />
            </div>
            <div className="modal-footer">
              <button className="btn btn-secondary" onClick={() => setRejectingMetricId(null)}>
                Cancel
              </button>
              <button 
                className="btn btn-primary" 
                style={{ background: '#b91c1c', borderColor: '#b91c1c' }}
                onClick={handleConfirmReject}
                disabled={!rejectionReason.trim()}
              >
                Confirm Rejection
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
