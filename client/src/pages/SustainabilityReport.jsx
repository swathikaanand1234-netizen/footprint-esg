import React from 'react';
import { FileSpreadsheet, Printer, Download, Factory, ShieldCheck } from 'lucide-react';
import { api } from '../services/api';

export const SustainabilityReport = ({ overview, facilities, metrics }) => {
  const handlePrint = () => {
    window.print();
  };

  const handleExportCsv = async () => {
    try {
      const blob = await api.exportReport('csv');
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'Factory-Environmental-Report-2026.csv';
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.URL.revokeObjectURL(url);
    } catch (err) {
      console.error('Export error:', err);
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      <div className="panel no-print" style={{ padding: 16 }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12 }}>
          <div>
            <h2 style={{ fontSize: '1rem', fontWeight: 700 }}>Annual Factory Environmental & Emissions Report</h2>
            <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
              Summary of total factory emissions, electricity use, and water/waste efficiency across 4 manufacturing sites.
            </p>
          </div>
          <div style={{ display: 'flex', gap: 8 }}>
            <button className="btn btn-secondary btn-sm" onClick={handleExportCsv}>
              <Download size={14} />
              <span>Download CSV Report</span>
            </button>
            <button className="btn btn-secondary btn-sm" onClick={handlePrint}>
              <Printer size={14} />
              <span>Print Scorecard</span>
            </button>
          </div>
        </div>
      </div>

      {/* Official Factory Scorecard */}
      <div className="panel" style={{ padding: 28, background: '#ffffff' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', borderBottom: '2px solid var(--border-color)', paddingBottom: 18, marginBottom: 20 }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <Factory size={24} style={{ color: 'var(--color-primary)' }} />
              <h2 style={{ fontSize: '1.3rem', fontWeight: 800 }}>Factory Environmental Performance Summary</h2>
            </div>
            <div style={{ fontSize: '0.82rem', color: 'var(--text-muted)', marginTop: 4 }}>
              Reporting Period: FY 2026 • Coverage: All Active Production Sites (Austin, Stuttgart, Yokohama, Monterrey)
            </div>
          </div>
          <div style={{ textAlign: 'right' }}>
            <span className="badge badge-approved" style={{ fontSize: '0.8rem', padding: '4px 10px' }}>
              OFFICIALLY AUDITED
            </span>
            <div style={{ fontSize: '0.72rem', color: 'var(--text-dim)', marginTop: 4 }}>ISO 14064 Verified</div>
          </div>
        </div>

        {/* Core KPI Table */}
        <table className="data-table" style={{ marginBottom: 24 }}>
          <thead>
            <tr>
              <th>Environmental Indicator</th>
              <th>FY 2026 Value</th>
              <th>Unit</th>
              <th>Accounting Standard</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td><strong>Scope 1: Direct Boiler Natural Gas & Factory Fuels</strong></td>
              <td className="mono" style={{ fontWeight: 700 }}>{overview?.totalScope1 || 0}</td>
              <td>Metric Tons CO₂</td>
              <td style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>IPCC Emission Model</td>
            </tr>
            <tr>
              <td><strong>Scope 2: Purchased Factory Grid Electricity</strong></td>
              <td className="mono" style={{ fontWeight: 700 }}>{overview?.totalScope2 || 0}</td>
              <td>Metric Tons CO₂</td>
              <td style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Supplier Tariffs & Location Grid</td>
            </tr>
            <tr style={{ background: '#f8fbf9' }}>
              <td><strong>Total Direct + Purchased Emissions</strong></td>
              <td className="mono" style={{ fontWeight: 800, color: 'var(--color-primary)', fontSize: '1.05rem' }}>
                {overview?.totalEmissions || 0}
              </td>
              <td><strong>Metric Tons CO₂</strong></td>
              <td><strong>Approved Factory Total</strong></td>
            </tr>
            <tr>
              <td>Factory Emissions Intensity</td>
              <td className="mono" style={{ fontWeight: 700 }}>{overview?.avgIntensity || 0}</td>
              <td>tCO₂ / ton produced</td>
              <td style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Production Ratio</td>
            </tr>
            <tr>
              <td>Clean Renewable Electricity Fraction</td>
              <td className="mono" style={{ fontWeight: 700, color: 'var(--color-success)' }}>{overview?.renewableShare || 0}%</td>
              <td>Percentage of Total MWh</td>
              <td style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>On-site Solar + Contracts</td>
            </tr>
            <tr>
              <td>Factory Water Withdrawal Volume</td>
              <td className="mono" style={{ fontWeight: 700 }}>{(overview?.totalWaterWithdrawal || 0).toLocaleString()}</td>
              <td>Cubic Meters (m³)</td>
              <td style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Municipal & Groundwater Flow Meters</td>
            </tr>
            <tr>
              <td>Recycled & Reused Water Fraction</td>
              <td className="mono" style={{ fontWeight: 700, color: 'var(--color-success)' }}>{overview?.waterRecycleRate || 0}%</td>
              <td>Percentage Recycled</td>
              <td style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Closed-loop Treatment Audits</td>
            </tr>
            <tr>
              <td>Waste Kept from Landfills (Recycled/Reused)</td>
              <td className="mono" style={{ fontWeight: 700 }}>{overview?.wasteDiversionRate || 0}%</td>
              <td>Percentage Diverted</td>
              <td style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Factory Waste Hauler Audits</td>
            </tr>
          </tbody>
        </table>

        <div style={{ fontSize: '0.78rem', color: 'var(--text-dim)', borderTop: '1px solid var(--border-color)', paddingTop: 14 }}>
          Generated by FootprintESG. All numbers are calculated exclusively from verified utility invoices, calibrated flow meters, and plant manager approvals.
        </div>
      </div>
    </div>
  );
};
