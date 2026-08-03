import React from 'react';

export default function Sidebar({ appMode, evalMode, onSelectMode, activeTab, onTabChange, batchCount = 0 }) {
  const isSelected = (mode, evalType) => {
    return activeTab === 'dashboard' && appMode === mode && evalMode === evalType;
  };

  const getItemStyle = (active) => ({
    width: '100%',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: '12px 14px',
    background: active ? '#fef2f2' : '#ffffff',
    border: active ? '1px solid #fca5a5' : '1px solid #e2e8f0',
    borderRadius: '12px',
    color: active ? '#c81e28' : '#334155',
    fontWeight: active ? '700' : '600',
    fontSize: '14px',
    cursor: 'pointer',
    transition: 'all 0.2s ease',
    textAlign: 'left',
    boxShadow: active ? '0 2px 8px rgba(200, 30, 40, 0.08)' : '0 1px 2px rgba(0, 0, 0, 0.02)',
    marginBottom: '8px'
  });

  return (
    <aside className="sidebar-container">
      {/* TOP-LEFT CORNER: Logo & Title (merges cleanly into Navbar across the top) */}
      <div 
        onClick={() => onTabChange('dashboard')} 
        style={{
          height: '76px',
          minHeight: '76px',
          padding: '0 24px',
          display: 'flex',
          alignItems: 'center',
          gap: '12px',
          borderBottom: '1px solid #e2e8f0',
          cursor: 'pointer',
          background: '#ffffff',
          userSelect: 'none'
        }}
      >
        <div style={{
          width: '40px',
          height: '40px',
          minWidth: '40px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          background: 'rgba(200, 30, 40, 0.08)',
          border: '1px solid rgba(200, 30, 40, 0.2)',
          borderRadius: '10px',
          color: '#c81e28',
          boxShadow: '0 2px 8px rgba(200, 30, 40, 0.1)'
        }}>
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M12 2a10 10 0 0 1 10 10c0 5.523-4.477 10-10 10a10 10 0 0 1-10-10 10 10 0 0 1 10-10z"/>
            <path d="M12 8v4l3 3"/>
            <circle cx="12" cy="12" r="3"/>
          </svg>
        </div>
        <div>
          <h1 style={{ 
            fontSize: '20px', 
            fontWeight: '800', 
            margin: 0, 
            lineHeight: '1.2',
            color: '#0f172a',
            letterSpacing: '-0.5px'
          }}>
            JD vs Resume Check
          </h1>
          <span style={{ fontSize: '11px', color: '#c81e28', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
            Enterprise AI
          </span>
        </div>
      </div>

      {/* SIDEBAR NAVIGATION & FEATURES CONTENT */}
      <div style={{
        flex: 1,
        overflowY: 'auto',
        padding: '24px 18px',
        display: 'flex',
        flexDirection: 'column',
        gap: '28px',
        borderRight: '1px solid #e2e8f0'
      }}>
        {/* LIVE WORKSPACE FEATURES */}
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '12px', paddingLeft: '4px' }}>
            <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#10b981', display: 'inline-block' }}></span>
            <span style={{ fontSize: '12px', fontWeight: '700', color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.8px' }}>
              Live Workspace
            </span>
          </div>

          <button
            type="button"
            onClick={() => onSelectMode('live', 'single')}
            style={getItemStyle(isSelected('live', 'single'))}
          >
            <span style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <span style={{ fontSize: '16px' }}>👤</span>
              <span>Single Candidate Mode</span>
            </span>
            {isSelected('live', 'single') && <span style={{ color: '#c81e28', fontWeight: '800' }}>●</span>}
          </button>

          <button
            type="button"
            onClick={() => onSelectMode('live', 'batch')}
            style={getItemStyle(isSelected('live', 'batch'))}
          >
            <span style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <span style={{ fontSize: '16px' }}>👥</span>
              <span>Batch Multi-Resume</span>
            </span>
            {isSelected('live', 'batch') && <span style={{ color: '#c81e28', fontWeight: '800' }}>●</span>}
          </button>
        </div>
      </div>
    </aside>
  );
}
