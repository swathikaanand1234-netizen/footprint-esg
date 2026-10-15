import React, { useState } from 'react';
import { X, Send, Leaf, FileSpreadsheet, Upload, AlertTriangle, CheckCircle2, Save } from 'lucide-react';
import { api } from '../services/api';

export const DataEntryModal = ({ facilities, onClose, onSubmit, onBatchImportComplete }) => {
  const [activeTab, setActiveTab] = useState('MANUAL');
  const [formData, setFormData] = useState({
    facilityId: facilities[0]?.facilityId || 'FAC-ATX-01',
    reportingPeriod: '2026-09',
    productionOutputTons: 15000,
    scope1EmissionsTons: 210.0,
    scope2EmissionsTons: 650.0,
    electricityConsumptionMWh: 2400.0,
    renewableElectricityMWh: 1800.0,
    naturalGasMMBtu: 4100,
    waterWithdrawalM3: 28000,
    waterRecycledM3: 19500,
    wasteGeneratedTons: 180.0,
    wasteDivertedTons: 165.0,
    submittedBy: 'Plant EHS Lead',
    status: 'SUBMITTED'
  });
  const [loading, setLoading] = useState(false);

  // CSV Import State
  const defaultCsvSample = `facilityId,reportingPeriod,productionOutputTons,scope1EmissionsTons,scope2EmissionsTons,electricityConsumptionMWh,renewableElectricityMWh,naturalGasMMBtu,waterWithdrawalM3,waterRecycledM3,wasteGeneratedTons,wasteDivertedTons
FAC-ATX-01,2026-09,15200,212.0,645.0,2450.0,1850.0,4120,28100,19800,182.0,167.0
FAC-STR-02,2026-09,11800,110.0,335.0,1850.0,1650.0,2150,17200,13800,134.0,128.0`;

  const [csvText, setCsvText] = useState(defaultCsvSample);
  const [importResult, setImportResult] = useState(null);
  const [importError, setImportError] = useState(null);

  const handleSubmit = async (e, asDraft = false) => {
    e.preventDefault();
    setLoading(true);
    await onSubmit({ ...formData, status: asDraft ? 'DRAFT' : 'SUBMITTED' });
    setLoading(false);
    onClose();
  };

  const handleCsvImport = async () => {
    setLoading(true);
    setImportResult(null);
    setImportError(null);
    try {
      const res = await api.importCsv(csvText, 'ALL_OR_NOTHING');
      if (res.success) {
        setImportResult(res);
        if (onBatchImportComplete) onBatchImportComplete();
      } else {
        setImportError(res);
      }
    } catch (err) {
      setImportError({ message: err.message || 'Import failed' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="modal-overlay">
      <div className="modal-content" style={{ maxWidth: 640 }}>
        <div className="modal-header">
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <Leaf size={18} style={{ color: 'var(--color-primary)' }} />
            <h3 style={{ fontSize: '1rem', fontWeight: 700 }}>Log Environmental Records & Utility Billing</h3>
          </div>
          <button className="btn btn-secondary btn-sm" onClick={onClose} style={{ padding: 4 }} aria-label="Close modal">
            <X size={16} />
          </button>
        </div>

        {/* Tab Selector */}
        <div style={{ display: 'flex', borderBottom: '1px solid var(--border-color)', background: '#f8fafc', padding: '0 16px' }}>
          <button
            type="button"
            className={`btn btn-sm ${activeTab === 'MANUAL' ? 'btn-primary' : ''}`}
            style={{ borderRadius: '6px 6px 0 0', margin: '8px 4px 0 0', borderBottom: 'none' }}
            onClick={() => setActiveTab('MANUAL')}
          >
            Single Facility Form
          </button>
          <button
            type="button"
            className={`btn btn-sm ${activeTab === 'CSV' ? 'btn-primary' : ''}`}
            style={{ borderRadius: '6px 6px 0 0', margin: '8px 4px 0 0', borderBottom: 'none' }}
            onClick={() => setActiveTab('CSV')}
          >
            <FileSpreadsheet size={13} />
            <span>CSV Batch Import (PR-09)</span>
          </button>
        </div>

        {activeTab === 'MANUAL' ? (
          <form onSubmit={e => handleSubmit(e, false)}>
            <div className="modal-body" style={{ maxHeight: '65vh', overflowY: 'auto' }}>
              <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: 12 }}>
                <div className="form-group">
                  <label>Manufacturing Facility</label>
                  <select 
                    className="form-input"
                    value={formData.facilityId}
                    onChange={e => setFormData({ ...formData, facilityId: e.target.value })}
                  >
                    {facilities.map((f, idx) => (
                      <option key={f.facilityId || f._id || idx} value={f.facilityId}>
                        {f.facilityId} - {f.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="form-group">
                  <label>Period (YYYY-MM)</label>
                  <input 
                    type="text" 
                    className="form-input mono"
                    value={formData.reportingPeriod}
                    onChange={e => setFormData({ ...formData, reportingPeriod: e.target.value })}
                    required
                  />
                </div>
              </div>

              <div className="form-group">
                <label>Monthly Production Output (Metric Tons)</label>
                <input 
                  type="number" 
                  className="form-input mono"
                  value={formData.productionOutputTons}
                  onChange={e => setFormData({ ...formData, productionOutputTons: Number(e.target.value) })}
                  required
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                <div className="form-group">
                  <label>Scope 1 Direct Emissions (tCO2e)</label>
                  <input 
                    type="number" 
                    step="0.1"
                    className="form-input mono"
                    value={formData.scope1EmissionsTons}
                    onChange={e => setFormData({ ...formData, scope1EmissionsTons: Number(e.target.value) })}
                    required
                  />
                </div>

                <div className="form-group">
                  <label>Scope 2 Market Emissions (tCO2e)</label>
                  <input 
                    type="number" 
                    step="0.1"
                    className="form-input mono"
                    value={formData.scope2EmissionsTons}
                    onChange={e => setFormData({ ...formData, scope2EmissionsTons: Number(e.target.value) })}
                    required
                  />
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                <div className="form-group">
                  <label>Total Electricity (MWh)</label>
                  <input 
                    type="number" 
                    className="form-input mono"
                    value={formData.electricityConsumptionMWh}
                    onChange={e => setFormData({ ...formData, electricityConsumptionMWh: Number(e.target.value) })}
                    required
                  />
                </div>

                <div className="form-group">
                  <label>Renewable Power (MWh)</label>
                  <input 
                    type="number" 
                    className="form-input mono"
                    value={formData.renewableElectricityMWh}
                    onChange={e => setFormData({ ...formData, renewableElectricityMWh: Number(e.target.value) })}
                    required
                  />
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                <div className="form-group">
                  <label>Water Intake (m³)</label>
                  <input 
                    type="number" 
                    className="form-input mono"
                    value={formData.waterWithdrawalM3}
                    onChange={e => setFormData({ ...formData, waterWithdrawalM3: Number(e.target.value) })}
                    required
                  />
                </div>

                <div className="form-group">
                  <label>Water Recycled (m³)</label>
                  <input 
                    type="number" 
                    className="form-input mono"
                    value={formData.waterRecycledM3}
                    onChange={e => setFormData({ ...formData, waterRecycledM3: Number(e.target.value) })}
                    required
                  />
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                <div className="form-group">
                  <label>Waste Generated (Tons)</label>
                  <input 
                    type="number" 
                    className="form-input mono"
                    value={formData.wasteGeneratedTons}
                    onChange={e => setFormData({ ...formData, wasteGeneratedTons: Number(e.target.value) })}
                    required
                  />
                </div>

                <div className="form-group">
                  <label>Waste Diverted (Tons)</label>
                  <input 
                    type="number" 
                    className="form-input mono"
                    value={formData.wasteDivertedTons}
                    onChange={e => setFormData({ ...formData, wasteDivertedTons: Number(e.target.value) })}
                    required
                  />
                </div>
              </div>

              <div className="form-group">
                <label>Reporting Lead Name</label>
                <input 
                  type="text" 
                  className="form-input"
                  value={formData.submittedBy}
                  onChange={e => setFormData({ ...formData, submittedBy: e.target.value })}
                  required
                />
              </div>
            </div>

            <div className="modal-footer">
              <button type="button" className="btn btn-secondary" onClick={onClose}>Cancel</button>
              <button 
                type="button" 
                className="btn btn-secondary" 
                onClick={e => handleSubmit(e, true)}
                disabled={loading}
              >
                <Save size={13} />
                <span>Save as Draft</span>
              </button>
              <button type="submit" className="btn btn-primary" disabled={loading}>
                <Send size={13} />
                <span>{loading ? 'Submitting...' : 'Submit to Review Queue'}</span>
              </button>
            </div>
          </form>
        ) : (
          <div className="modal-body" style={{ maxHeight: '65vh', overflowY: 'auto' }}>
            <p style={{ fontSize: '0.82rem', color: 'var(--text-muted)', marginBottom: 12 }}>
              Paste formatted monthly utility CSV data below. Enforces <strong>ALL_OR_NOTHING</strong> validation policy with row-level error feedback.
            </p>

            <textarea 
              className="form-input mono" 
              rows={8}
              value={csvText}
              onChange={e => setCsvText(e.target.value)}
              style={{ fontSize: '0.75rem', lineHeight: 1.4 }}
            />

            {importError && (
              <div style={{ marginTop: 12, padding: 12, background: '#fef2f2', border: '1px solid #fecaca', borderRadius: 6 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6, color: '#b91c1c', fontWeight: 600, fontSize: '0.84rem' }}>
                  <AlertTriangle size={15} />
                  <span>{importError.message || 'Validation Failed'}</span>
                </div>
                {importError.result?.errors && (
                  <ul style={{ marginTop: 6, fontSize: '0.78rem', color: '#991b1b', paddingLeft: 18 }}>
                    {importError.result.errors.map((err, i) => (
                      <li key={i}>
                        Line {err.lineNumber}: {err.errors.join('; ')}
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            )}

            {importResult && (
              <div style={{ marginTop: 12, padding: 12, background: '#f0fdf4', border: '1px solid #bbf7d0', borderRadius: 6 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6, color: '#15803d', fontWeight: 600, fontSize: '0.84rem' }}>
                  <CheckCircle2 size={15} />
                  <span>{importResult.message}</span>
                </div>
              </div>
            )}

            <div className="modal-footer" style={{ marginTop: 16 }}>
              <button type="button" className="btn btn-secondary" onClick={onClose}>Close</button>
              <button 
                type="button" 
                className="btn btn-primary" 
                onClick={handleCsvImport}
                disabled={loading || !csvText.trim()}
              >
                <Upload size={13} />
                <span>{loading ? 'Validating...' : 'Validate & Import Batch'}</span>
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
