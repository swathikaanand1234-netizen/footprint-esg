import React, { useState, useEffect } from 'react';
import { Factory, Award, Zap, ShieldCheck } from 'lucide-react';
import { api } from '../services/api';

export const FacilityBenchmarking = () => {
  const [benchmarks, setBenchmarks] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.getBenchmarks().then(res => {
      if (res.success) setBenchmarks(res.data);
      setLoading(false);
    });
  }, []);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      <div className="panel" style={{ padding: 16 }}>
        <div>
          <h2 style={{ fontSize: '1rem', fontWeight: 700 }}>Manufacturing Plant Performance & League Table</h2>
          <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
            Comparing energy efficiency and emissions across Austin, Stuttgart, Yokohama, and Monterrey plants.
          </p>
        </div>
      </div>

      <div className="panel">
        <div className="panel-header">
          <div className="panel-title">
            <Factory size={18} style={{ color: 'var(--color-primary)' }} />
            <span>Plant Energy & Emissions Comparison Table</span>
          </div>
        </div>

        <div className="table-responsive">
          <table className="data-table">
            <thead>
              <tr>
                <th>Plant Name & City</th>
                <th>Operation Type</th>
                <th>Direct Emissions (Gas/Fuel)</th>
                <th>Power Emissions (Grid)</th>
                <th>Total CO₂</th>
                <th>Emissions / Unit</th>
                <th>Clean Energy %</th>
                <th>ISO 14001 Audit</th>
              </tr>
            </thead>
            <tbody>
              {benchmarks.map((b, idx) => (
                <tr key={b.facilityId || b._id || idx}>
                  <td>
                    <div style={{ fontWeight: 600 }}>{b.name}</div>
                    <div style={{ fontSize: '0.74rem', color: 'var(--text-muted)' }}>{b.location}</div>
                  </td>
                  <td>
                    <span className="badge badge-info">{(b.facilityType || '').replace(/_/g, ' ')}</span>
                  </td>
                  <td className="mono">{b.totalScope1} t</td>
                  <td className="mono">{b.totalScope2} t</td>
                  <td className="mono" style={{ fontWeight: 700 }}>{b.totalEmissions} t</td>
                  <td className="mono" style={{ fontWeight: 700, color: 'var(--color-primary)' }}>
                    {b.emissionIntensity} t/unit
                  </td>
                  <td className="mono" style={{ fontWeight: 600, color: 'var(--color-success)' }}>
                    {b.renewableEnergyPercent}%
                  </td>
                  <td>
                    {b.iso14001 ? (
                      <span className="badge badge-approved">VERIFIED</span>
                    ) : (
                      <span className="badge badge-draft">PENDING</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
