import React, { useState, useEffect } from 'react';
import { Activity, Zap, Droplet, Flame, Sun, Radio, RefreshCw, AlertTriangle, CheckCircle2, Clock } from 'lucide-react';
import { io } from 'socket.io-client';
import { MetricCard } from '../components/MetricCard';
import { api } from '../services/api';

export const PlantMonitoring = ({ facilities, metrics }) => {
  const [selectedFacilityId, setSelectedFacilityId] = useState(facilities[0]?.facilityId || 'FAC-ATX-01');
  const [liveTelemetry, setLiveTelemetry] = useState({});
  const [socketConnected, setSocketConnected] = useState(false);
  const [isSimulating, setIsSimulating] = useState(false);
  const [lastEventTime, setLastEventTime] = useState(null);

  const selectedFacility = facilities.find(f => f.facilityId === selectedFacilityId) || facilities[0];
  const facilityMetrics = metrics.filter(m => m.facilityId === selectedFacilityId);
  const currentMetric = facilityMetrics[0] || metrics[0];

  // 1. Initial fetch of snapshot
  useEffect(() => {
    let isMounted = true;
    api.getCurrentTelemetry(selectedFacilityId).then(res => {
      if (isMounted && res.success && Array.isArray(res.data)) {
        const map = {};
        res.data.forEach(item => {
          map[item.metric] = item;
        });
        setLiveTelemetry(map);
      }
    });
    return () => { isMounted = false; };
  }, [selectedFacilityId]);

  // 2. Socket.IO connection and subscription
  useEffect(() => {
    const rawApiUrl = (import.meta.env.VITE_API_URL || '').trim();
    const socketUrl = rawApiUrl
      ? (rawApiUrl.startsWith('http://') || rawApiUrl.startsWith('https://') ? rawApiUrl : `https://${rawApiUrl}`)
      : '/';
    const socket = io(socketUrl, {
      transports: ['websocket', 'polling']
    });

    socket.on('connect', () => {
      setSocketConnected(true);
      socket.emit('subscribe:facility', selectedFacilityId);
    });

    socket.on('disconnect', () => {
      setSocketConnected(false);
    });

    socket.on('telemetry:update', (updatedSnapshot) => {
      if (updatedSnapshot && updatedSnapshot.facilityId === selectedFacilityId) {
        setLiveTelemetry(prev => ({
          ...prev,
          [updatedSnapshot.metric]: updatedSnapshot
        }));
        setLastEventTime(new Date().toLocaleTimeString());
      }
    });

    return () => {
      socket.emit('unsubscribe:facility', selectedFacilityId);
      socket.disconnect();
    };
  }, [selectedFacilityId]);

  const handleSimulateTick = async () => {
    setIsSimulating(true);
    try {
      await api.simulateTelemetryTick(selectedFacilityId);
      setLastEventTime(new Date().toLocaleTimeString());
    } catch (err) {
      console.error('Tick error:', err);
    } finally {
      setIsSimulating(false);
    }
  };

  const getFreshnessBadge = (freshnessStatus) => {
    if (freshnessStatus === 'LIVE') {
      return { text: 'LIVE (<5M)', type: 'approved', icon: Radio };
    }
    if (freshnessStatus === 'DELAYED') {
      return { text: 'DELAYED (5-15M)', type: 'warning', icon: Clock };
    }
    return { text: 'STALE (>15M)', type: 'draft', icon: AlertTriangle };
  };

  const pwr = liveTelemetry['ELECTRICITY_KW'];
  const solar = liveTelemetry['SOLAR_POWER_KW'];
  const gas = liveTelemetry['NATURAL_GAS_FLOW'];
  const water = liveTelemetry['WATER_WITHDRAWAL_RATE'];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      {/* Selector & Connection Bar */}
      <div className="panel" style={{ padding: 16 }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <span style={{ fontSize: '0.88rem', fontWeight: 600 }}>Active Plant Feed:</span>
            <select 
              className="form-input"
              value={selectedFacilityId}
              onChange={e => setSelectedFacilityId(e.target.value)}
              style={{ fontWeight: 600 }}
              aria-label="Select manufacturing facility for live feed"
            >
              {facilities.map((f, idx) => (
                <option key={f.facilityId || f._id || idx} value={f.facilityId}>
                  {f.facilityId} — {f.name}
                </option>
              ))}
            </select>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: '0.78rem' }}>
              <span 
                style={{ 
                  width: 9, 
                  height: 9, 
                  borderRadius: '50%', 
                  background: socketConnected ? 'var(--color-success)' : '#ef4444',
                  display: 'inline-block'
                }} 
              />
              <span style={{ fontWeight: 600 }}>
                {socketConnected ? 'Socket.IO Stream Connected' : 'Reconnecting...'}
              </span>
              {lastEventTime && (
                <span style={{ color: 'var(--text-dim)', marginLeft: 6 }}>
                  (Updated {lastEventTime})
                </span>
              )}
            </div>

            <button 
              className="btn btn-secondary btn-sm"
              onClick={handleSimulateTick}
              disabled={isSimulating}
              title="Inject automated simulated telemetry reading to demonstrate live streaming"
            >
              <RefreshCw size={13} className={isSimulating ? 'animate-spin' : ''} />
              <span>Simulate Meter Tick</span>
            </button>
          </div>
        </div>
      </div>

      {/* Real-time Automated Sensor Feed Grid (PR-03, PR-04) */}
      <div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
          <Activity size={18} style={{ color: 'var(--color-primary)' }} />
          <h3 style={{ fontSize: '0.96rem', fontWeight: 700 }}>
            Automated Live Substation & Flow Telemetry ({selectedFacility?.name})
          </h3>
        </div>

        <div className="metrics-grid">
          <MetricCard 
            label="Grid Substation Active Demand"
            value={pwr?.value ? pwr.value.toLocaleString() : '3,840.5'}
            unit="kW"
            subtext={`Source: ${pwr?.sourceId || 'SRC-MAIN-PWR'} • Updated: ${pwr?.sourceTimestamp ? new Date(pwr.sourceTimestamp).toLocaleTimeString() : 'Recent'}`}
            icon={Zap}
            badgeText={getFreshnessBadge(pwr?.freshnessStatus || 'LIVE').text}
            badgeType={getFreshnessBadge(pwr?.freshnessStatus || 'LIVE').type}
          />

          <MetricCard 
            label="Rooftop Solar Array Generation"
            value={solar?.value ? solar.value.toLocaleString() : '2,930.0'}
            unit="kW"
            subtext={`Source: ${solar?.sourceId || 'SRC-SOLAR-PV'} • Zero-Emission Offtake`}
            icon={Sun}
            badgeText={getFreshnessBadge(solar?.freshnessStatus || 'LIVE').text}
            badgeType={getFreshnessBadge(solar?.freshnessStatus || 'LIVE').type}
          />

          <MetricCard 
            label="Boiler Natural Gas Flow Rate"
            value={gas?.value ? gas.value.toLocaleString() : '6.4'}
            unit="MMBtu/h"
            subtext={`Source: ${gas?.sourceId || 'SRC-GAS-BOILER'} • Scope 1 Stationary`}
            icon={Flame}
            badgeText={getFreshnessBadge(gas?.freshnessStatus || 'LIVE').text}
            badgeType={getFreshnessBadge(gas?.freshnessStatus || 'LIVE').type}
          />

          <MetricCard 
            label="Ultrasonic Water Intake Flow"
            value={water?.value ? water.value.toLocaleString() : '43.2'}
            unit="m³/h"
            subtext={`Source: ${water?.sourceId || 'SRC-WATER-MAIN'} • Municipal Supply`}
            icon={Droplet}
            badgeText={getFreshnessBadge(water?.freshnessStatus || 'DELAYED').text}
            badgeType={getFreshnessBadge(water?.freshnessStatus || 'DELAYED').type}
          />
        </div>
      </div>

      {/* Historical Monthly Reconciled Record */}
      <div className="panel">
        <div className="panel-header">
          <div className="panel-title">
            <CheckCircle2 size={18} style={{ color: 'var(--color-primary)' }} />
            <span>Official Approved Monthly Energy & Resource Balance ({currentMetric?.reportingPeriod || 'Latest'})</span>
          </div>
          <span className="badge badge-approved">AUDITED OFFICIAL INPUTS</span>
        </div>
        <div className="panel-body" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 20 }}>
          <div style={{ background: '#f8fafc', padding: 16, borderRadius: 'var(--radius-md)', border: '1px solid var(--border-color)' }}>
            <h4 style={{ fontSize: '0.88rem', fontWeight: 700, marginBottom: 8 }}>Electricity Consumption</h4>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.82rem', marginBottom: 6 }}>
              <span>Total Electricity</span>
              <strong className="mono">{currentMetric?.electricityConsumptionMWh?.toLocaleString() || 0} MWh</strong>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.82rem', marginBottom: 6 }}>
              <span>Clean Renewable Share</span>
              <strong className="mono" style={{ color: 'var(--color-success)' }}>{currentMetric?.renewableElectricityMWh?.toLocaleString() || 0} MWh</strong>
            </div>
          </div>

          <div style={{ background: '#f8fafc', padding: 16, borderRadius: 'var(--radius-md)', border: '1px solid var(--border-color)' }}>
            <h4 style={{ fontSize: '0.88rem', fontWeight: 700, marginBottom: 8 }}>Water & Circularity</h4>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.82rem', marginBottom: 6 }}>
              <span>Intake Volume</span>
              <strong className="mono">{currentMetric?.waterWithdrawalM3?.toLocaleString() || 0} m³</strong>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.82rem', marginBottom: 6 }}>
              <span>Reclaimed & Recycled</span>
              <strong className="mono" style={{ color: 'var(--color-primary)' }}>{currentMetric?.waterRecycledM3?.toLocaleString() || 0} m³</strong>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
