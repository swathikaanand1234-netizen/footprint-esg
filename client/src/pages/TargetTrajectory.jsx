import React from 'react';
import { Target, CheckCircle, Clock, Zap } from 'lucide-react';
import { StatusBadge } from '../components/StatusBadge';

export const TargetTrajectory = ({ targets }) => {
  const target = targets[0];

  const netReductionPct = target && target.baselineEmissionsTons > 0
    ? (((target.currentEmissionsTons - target.baselineEmissionsTons) / target.baselineEmissionsTons) * 100).toFixed(1)
    : '0.0';
  const isCut = Number(netReductionPct) <= 0;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      <div className="panel" style={{ padding: 16 }}>
        <div>
          <h2 style={{ fontSize: '1rem', fontWeight: 700 }}>2030 Emission Targets & Efficiency Upgrades</h2>
          <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
            Tracking company-wide progress toward reducing industrial factory emissions by 50% by 2030.
          </p>
        </div>
      </div>

      {target && (
        <div className="panel">
          <div className="panel-header">
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                <span className="mono" style={{ fontSize: '0.78rem', fontWeight: 700, color: 'var(--color-primary)' }}>
                  {target.targetId}
                </span>
                <StatusBadge status={target.trajectoryStatus} />
              </div>
              <h3 style={{ fontSize: '1.05rem', fontWeight: 700 }}>{target.title}</h3>
              <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Scope: Factory Fuel Combustion & Purchased Grid Electricity</div>
            </div>
          </div>

          <div className="panel-body" style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            {/* Progress Metrics */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 14 }}>
              <div style={{ background: '#f8fafc', padding: 12, borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-color)' }}>
                <span style={{ fontSize: '0.75rem', color: 'var(--text-dim)', textTransform: 'uppercase' }}>Baseline Year ({target.baselineYear})</span>
                <div className="mono" style={{ fontSize: '1.2rem', fontWeight: 700 }}>{target.baselineEmissionsTons.toLocaleString()} tCO₂</div>
              </div>

              <div style={{ background: '#f8fafc', padding: 12, borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-color)' }}>
                <span style={{ fontSize: '0.75rem', color: 'var(--text-dim)', textTransform: 'uppercase' }}>Current 2026 Emissions</span>
                <div className="mono" style={{ fontSize: '1.2rem', fontWeight: 700, color: 'var(--color-primary)' }}>{target.currentEmissionsTons.toLocaleString()} tCO₂</div>
              </div>

              <div style={{ background: '#f8fafc', padding: 12, borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-color)' }}>
                <span style={{ fontSize: '0.75rem', color: 'var(--text-dim)', textTransform: 'uppercase' }}>2030 Target Cap</span>
                <div className="mono" style={{ fontSize: '1.2rem', fontWeight: 700, color: 'var(--color-success)' }}>{target.targetEmissionsTons.toLocaleString()} tCO₂</div>
              </div>

              <div style={{ background: '#f8fafc', padding: 12, borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-color)' }}>
                <span style={{ fontSize: '0.75rem', color: 'var(--text-dim)', textTransform: 'uppercase' }}>Net Reduction So Far</span>
                <div 
                  className="mono" 
                  style={{ 
                    fontSize: '1.2rem', 
                    fontWeight: 700, 
                    color: isCut ? 'var(--color-primary)' : 'var(--color-danger)' 
                  }}
                >
                  {isCut ? `${netReductionPct}% Cut` : `+${netReductionPct}% Surge`}
                </div>
              </div>
            </div>

            {/* Plant Projects */}
            <div>
              <h4 style={{ fontSize: '0.9rem', fontWeight: 700, marginBottom: 10 }}>Active Plant Efficiency & Decarbonization Projects</h4>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {target.initiatives?.map((item, idx) => (
                  <div 
                    key={idx}
                    style={{ 
                      padding: 12, 
                      borderRadius: 'var(--radius-sm)', 
                      border: '1px solid var(--border-color)',
                      background: item.completionStatus === 'COMPLETED' ? 'var(--color-primary-light)' : '#ffffff',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between'
                    }}
                  >
                    <div>
                      <div style={{ fontWeight: 600, fontSize: '0.86rem' }}>{item.name}</div>
                      <div style={{ fontSize: '0.74rem', color: 'var(--text-muted)' }}>
                        Expected Reduction: <strong>{item.reductionTons.toLocaleString()} tons CO₂ / year</strong>
                      </div>
                    </div>
                    <StatusBadge status={item.completionStatus} />
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
