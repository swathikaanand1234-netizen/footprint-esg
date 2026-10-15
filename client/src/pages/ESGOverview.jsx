import React from 'react';
import { 
  Leaf, 
  Zap, 
  Recycle, 
  Target, 
  FileCheck2, 
  Building2, 
  CheckCircle2,
  ArrowUpRight
} from 'lucide-react';
import { MetricCard } from '../components/MetricCard';
import { StatusBadge } from '../components/StatusBadge';

export const ESGOverview = ({ 
  overview, 
  facilities, 
  metrics, 
  onApproveMetric, 
  onOpenDataEntry 
}) => {
  const pendingLogs = metrics.filter(m => m.status === 'SUBMITTED');
  const target = overview?.primaryTarget;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
      {/* 1. Core Plant Metrics */}
      <div className="metrics-grid">
        <MetricCard 
          label="Total Plant Emissions" 
          value={overview?.totalEmissions ? overview.totalEmissions.toLocaleString() : '0'} 
          unit="tons CO₂"
          subtext={`Direct (Gas & Fuel): ${overview?.totalScope1 || 0}t | Grid Power: ${overview?.totalScope2 || 0}t`}
          icon={Leaf}
          badgeText="APPROVED ONLY"
          badgeType="info"
        />

        <MetricCard 
          label="Emissions per Ton Produced" 
          value={overview?.avgIntensity ?? 0} 
          unit="tCO₂ / ton product"
          subtext="Factory production efficiency"
          icon={Target}
          badgeText="ON TRACK"
          badgeType="approved"
        />

        <MetricCard 
          label="Clean Energy Share" 
          value={`${overview?.renewableShare ?? 0}%`} 
          subtext="On-site solar + green electricity supply"
          icon={Zap}
          badgeText="TARGET: 75%"
          badgeType="approved"
        />

        <MetricCard 
          label="Waste Kept from Landfill" 
          value={`${overview?.wasteDiversionRate ?? 0}%`} 
          subtext={`Water reused: ${overview?.waterRecycleRate || 0}%`}
          icon={Recycle}
          badgeText="RECYCLED / REUSED"
          badgeType="approved"
        />
      </div>

      {/* 2. 2030 Emission Reduction Goal */}
      {target && (
        <div className="panel">
          <div className="panel-header" style={{ background: '#f8fbf9', borderBottom: '1px solid var(--border-color)' }}>
            <div className="panel-title" style={{ color: 'var(--color-primary)' }}>
              <Target size={18} />
              <span>2030 Company Emission Reduction Target</span>
            </div>
            <StatusBadge status={target.trajectoryStatus} />
          </div>
          <div className="panel-body" style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem' }}>
              <span style={{ color: 'var(--text-muted)' }}>Progress toward cutting emissions by half (50% reduction by 2030):</span>
              <strong className="mono" style={{ color: 'var(--color-primary)', fontSize: '1rem' }}>
                {target.progressPercent}% Completed
              </strong>
            </div>
            <div style={{ width: '100%', height: 9, background: '#e5e3dc', borderRadius: 9999, overflow: 'hidden' }}>
              <div 
                style={{ 
                  height: '100%', 
                  width: `${target.progressPercent}%`, 
                  background: 'var(--color-primary)', 
                  borderRadius: 9999 
                }} 
              />
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.78rem', color: 'var(--text-dim)' }}>
              <span>Starting Baseline: {target.baselineEmissionsTons.toLocaleString()} tCO₂ ({target.baselineYear})</span>
              <span>Current Year: {target.currentEmissionsTons.toLocaleString()} tCO₂</span>
              <span>2030 Goal: {target.targetEmissionsTons.toLocaleString()} tCO₂</span>
            </div>
          </div>
        </div>
      )}

      {/* 3. Pending Submissions Awaiting Approval */}
      {pendingLogs.length > 0 && (
        <div className="panel" style={{ borderColor: '#fed7aa' }}>
          <div className="panel-header" style={{ background: '#fffbeb' }}>
            <div className="panel-title" style={{ color: '#9a3412' }}>
              <FileCheck2 size={18} />
              <span>Monthly Plant Reports Awaiting Review ({pendingLogs.length})</span>
            </div>
          </div>
          <div className="table-responsive">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Record ID</th>
                  <th>Plant</th>
                  <th>Month</th>
                  <th>Production</th>
                  <th>Total Emissions</th>
                  <th>Intensity</th>
                  <th>Submitted By</th>
                  <th>Action</th>
                </tr>
              </thead>
              <tbody>
                {pendingLogs.map((m, idx) => (
                  <tr key={m.metricId || m._id || idx}>
                    <td className="mono" style={{ fontWeight: 600 }}>{m.metricId}</td>
                    <td style={{ fontWeight: 600 }}>{m.facilityName}</td>
                    <td className="mono">{m.reportingPeriod}</td>
                    <td className="mono">{m.productionOutputTons.toLocaleString()} t</td>
                    <td className="mono" style={{ fontWeight: 600 }}>{m.totalEmissionsTons} tCO₂</td>
                    <td className="mono">{m.emissionIntensity}</td>
                    <td>{m.submittedBy}</td>
                    <td>
                      <button 
                        className="btn btn-primary btn-sm"
                        onClick={() => onApproveMetric(m.metricId)}
                        title="Approve this monthly report"
                      >
                        <CheckCircle2 size={13} />
                        <span>Approve</span>
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* 4. Manufacturing Plants Summary */}
      <div className="panel">
        <div className="panel-header">
          <div className="panel-title">
            <Building2 size={18} style={{ color: 'var(--color-primary)' }} />
            <span>Manufacturing Plants Summary</span>
          </div>
        </div>
        <div className="panel-body">
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: 16 }}>
            {facilities.map((f, idx) => (
              <div 
                key={f.facilityId || f._id || idx}
                style={{ 
                  border: '1px solid var(--border-color)', 
                  borderRadius: 'var(--radius-md)', 
                  padding: 16,
                  display: 'flex',
                  flexDirection: 'column',
                  gap: 12,
                  background: '#ffffff'
                }}
              >
                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span className="mono" style={{ fontSize: '0.78rem', color: 'var(--text-dim)', fontWeight: 600 }}>{f.facilityId}</span>
                    <span className="badge badge-approved">ISO 14001</span>
                  </div>
                  <h3 style={{ fontSize: '0.96rem', fontWeight: 700, marginTop: 4 }}>{f.name}</h3>
                  <div style={{ fontSize: '0.74rem', color: 'var(--text-muted)' }}>{f.location}</div>
                </div>

                <div style={{ 
                  background: '#f8fafc', 
                  padding: 10, 
                  borderRadius: 'var(--radius-sm)', 
                  display: 'grid', 
                  gridTemplateColumns: '1fr 1fr', 
                  gap: 8, 
                  fontSize: '0.78rem', 
                  border: '1px solid var(--border-color)' 
                }}>
                  <div>
                    <span style={{ color: 'var(--text-dim)' }}>Clean Energy:</span>
                    <div className="mono" style={{ fontWeight: 700, color: 'var(--color-primary)' }}>{f.renewableEnergySharePercent}%</div>
                  </div>
                  <div>
                    <span style={{ color: 'var(--text-dim)' }}>Zero-Emission Goal:</span>
                    <div className="mono" style={{ fontWeight: 700 }}>Year {f.targetNetZeroYear}</div>
                  </div>
                </div>

                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem', color: 'var(--text-dim)' }}>
                  <span>Grid Factor: {f.gridEmissionFactor} kg/kWh</span>
                  <span>{f.headcount} Workers</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
