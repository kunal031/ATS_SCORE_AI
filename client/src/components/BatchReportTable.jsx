import React, { useState } from 'react';
import AnalysisReport from './AnalysisReport.jsx';
import { exportToCSV } from '../utils/exporter.js';

export default function BatchReportTable({ batchData, onNewAnalyze }) {
  const [selectedId, setSelectedId] = useState(() => {
    return localStorage.getItem('ats_batch_selected_id') || null;
  });
  const [showConfirm, setShowConfirm] = useState(false);

  const results = Array.isArray(batchData?.results) ? batchData.results : [];
  const selectedCandidate = results.find(c => c && ((c.resumeId && c.resumeId === selectedId) || (c.id && c.id === selectedId))) || null;

  const handleSelectCandidate = (candidate) => {
    if (!candidate) return;
    const targetId = candidate.resumeId || candidate.id || null;
    setSelectedId(targetId);
    if (targetId) {
      localStorage.setItem('ats_batch_selected_id', targetId);
    }
  };

  const handleBackToTable = () => {
    setSelectedId(null);
    localStorage.removeItem('ats_batch_selected_id');
  };

  const handleExportBatchCSV = () => {
    const headers = ['Resume ID', 'Candidate Name', 'ATS Score', 'GitHub Verified', 'Coding Platforms', 'Executive Takeaway'];
    const rows = results.map(c => [
      c.resumeId || c.id || '-',
      c.candidateName || 'Candidate',
      `${c.scoreSummary?.overallScore || 0}%`,
      c.githubVerification?.username ? `@${c.githubVerification.username}` : 'None',
      c.codingCompetency?.leetcode ? `@${c.codingCompetency.leetcode.username}` : 'None',
      `"${(c.aiFeedback?.overall_assessment || '').replace(/"/g, '""')}"`
    ]);

    const csvContent = "data:text/csv;charset=utf-8," + [headers.join(','), ...rows.map(e => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `Batch_ATS_Evaluation_Report_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // If user clicked on a candidate row or deep verify button, render deep verification result
  if (selectedCandidate) {
    return (
      <div>
        <div style={{ marginBottom: '20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'rgba(255,255,255,0.02)', padding: '12px 20px', borderRadius: '12px', border: '1px solid var(--border-glass)' }}>
          <button 
            onClick={handleBackToTable}
            className="btn-secondary"
            style={{ padding: '10px 18px', fontSize: '14px', display: 'flex', alignItems: 'center', gap: '8px', border: '1px solid rgba(56, 189, 248, 0.5)', color: '#38bdf8', fontWeight: '700' }}
          >
            ⬅️ Back to Batch Candidates Table
          </button>
          <span style={{ fontSize: '14px', color: 'var(--text-sub)' }}>
            Viewing deep verification for <strong style={{ color: '#f8fafc' }}>{selectedCandidate.candidateName}</strong> ({selectedCandidate.resumeId || selectedCandidate.id})
          </span>
        </div>
        <AnalysisReport report={selectedCandidate} onNewAnalyze={onNewAnalyze} />
      </div>
    );
  }

  return (
    <div>
      {showConfirm && (
        <div className="modal-overlay" style={{
          position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
          background: 'rgba(0, 0, 0, 0.75)', backdropFilter: 'blur(8px)',
          display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 9999
        }}>
          <div className="glass-card" style={{
            maxWidth: '480px', width: '90%', padding: '36px', textAlign: 'center',
            border: '1px solid rgba(244, 63, 94, 0.4)', boxShadow: '0 25px 60px rgba(0, 0, 0, 0.6)',
            animation: 'fadeIn 0.2s ease-out'
          }}>
            <div style={{ fontSize: '48px', marginBottom: '16px' }}>⚠️</div>
            <h3 style={{ fontSize: '24px', fontWeight: '800', color: '#f8fafc', marginBottom: '12px' }}>
              Evaluate Another Batch?
            </h3>
            <p style={{ fontSize: '15px', color: 'var(--text-sub)', lineHeight: '1.6', marginBottom: '24px' }}>
              Are you sure you want to start a new analysis?
              <br /><br />
              <span style={{ color: '#fb7185', fontWeight: '700', padding: '10px 14px', background: 'rgba(244, 63, 94, 0.12)', borderRadius: '8px', display: 'inline-block', border: '1px solid rgba(244, 63, 94, 0.25)' }}>
                🚨 Note: If you click yes then present data will be deleted.
              </span>
            </p>
            <div style={{ display: 'flex', gap: '14px', justifyContent: 'center', flexWrap: 'wrap' }}>
              <button
                className="btn-secondary"
                onClick={() => setShowConfirm(false)}
                style={{ padding: '12px 24px', fontSize: '15px', border: '1px solid var(--border-glass)' }}
              >
                ❌ Cancel
              </button>
              <button
                className="btn-primary"
                onClick={() => {
                  setShowConfirm(false);
                  onNewAnalyze();
                }}
                style={{ padding: '12px 24px', fontSize: '15px', background: 'linear-gradient(135deg, #f43f5e, #e11d48)' }}
              >
                ✅ Yes, Delete & Start New
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="responsive-header" style={{ marginBottom: '30px' }}>
        <div>
          <span style={{ fontSize: '13px', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '1px', fontWeight: '700' }}>
            BATCH EVALUATION DASHBOARD
          </span>
          <h2 style={{ fontSize: '32px', fontWeight: '800', marginTop: '4px' }}>Multi-Candidate ATS Rankings</h2>
        </div>
      </div>

      <div className="glass-card" style={{ padding: '28px', marginBottom: '30px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', flexWrap: 'wrap', gap: '12px' }}>
          <h3 style={{ fontSize: '20px', color: '#f8fafc', display: 'flex', alignItems: 'center', gap: '10px' }}>
            <span>👥 Candidate Comparison Table</span>
            <span style={{ fontSize: '13px', background: 'rgba(16, 185, 129, 0.15)', color: '#34d399', padding: '3px 10px', borderRadius: '12px', fontWeight: '600', border: '1px solid rgba(16, 185, 129, 0.3)' }}>
              {results.length} Candidates Scored
            </span>
          </h3>
          <span style={{ fontSize: '13px', color: 'var(--text-muted)' }}>
            💡 Click on any candidate row or Deep Verify button below to view detailed breakdown
          </span>
        </div>

        <div style={{ overflowX: 'auto' }}>
          <table className="batch-table" style={{ width: '100%', borderCollapse: 'separate', borderSpacing: '0 10px', textAlign: 'left' }}>
            <thead>
              <tr style={{ color: 'var(--text-muted)', fontSize: '13px', textTransform: 'uppercase', letterSpacing: '1px', borderBottom: '1px solid var(--border-glass)' }}>
                <th style={{ padding: '12px 20px' }}>Column 1: User ID</th>
                <th style={{ padding: '12px 20px' }}>Column 2: User Name (Extracted)</th>
                <th style={{ padding: '12px 20px', textAlign: 'right' }}>Column 3: ATS Score & Action</th>
              </tr>
            </thead>
            <tbody>
              {results.map((candidate, index) => {
                const score = candidate.scoreSummary?.overallScore || 0;
                const cid = candidate.resumeId || candidate.id || `RES-00${index + 1}`;
                let badgeStyle = { background: 'rgba(16, 185, 129, 0.15)', color: '#34d399', border: '1px solid rgba(16, 185, 129, 0.3)' };
                if (score < 65) {
                  badgeStyle = { background: 'rgba(244, 63, 94, 0.15)', color: '#fb7185', border: '1px solid rgba(244, 63, 94, 0.3)' };
                } else if (score < 80) {
                  badgeStyle = { background: 'rgba(245, 158, 11, 0.15)', color: '#f59e0b', border: '1px solid rgba(245, 158, 11, 0.3)' };
                }

                return (
                  <tr 
                    key={cid} 
                    className="batch-row" 
                    onClick={() => handleSelectCandidate(candidate)}
                    style={{ 
                      background: '#ffffff', 
                      cursor: 'pointer',
                      transition: 'all 0.2s ease',
                      borderRadius: '12px',
                      boxShadow: '0 1px 4px rgba(0,0,0,0.03)'
                    }}
                  >
                    <td style={{ padding: '18px 20px', borderTopLeftRadius: '12px', borderBottomLeftRadius: '12px', fontWeight: '700', color: '#c81e28', borderTop: '1px solid #e2e8f0', borderBottom: '1px solid #e2e8f0', borderLeft: '1px solid #e2e8f0' }}>
                      <span style={{ display: 'inline-block', padding: '4px 10px', background: 'rgba(200, 30, 40, 0.08)', borderRadius: '6px', border: '1px solid rgba(200, 30, 40, 0.2)' }}>
                        {cid}
                      </span>
                    </td>
                    <td style={{ padding: '18px 20px', fontSize: '16px', fontWeight: '700', color: '#0f172a', borderTop: '1px solid #e2e8f0', borderBottom: '1px solid #e2e8f0' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                        <span style={{ fontSize: '20px' }}>👤</span>
                        <div>
                          <div>{candidate.candidateName || 'Unnamed Candidate'}</div>
                          {candidate.filename && <div style={{ fontSize: '12px', color: 'var(--text-muted)', fontWeight: '500' }}>📄 {candidate.filename}</div>}
                        </div>
                      </div>
                    </td>
                    <td style={{ padding: '18px 20px', borderTopRightRadius: '12px', borderBottomRightRadius: '12px', textAlign: 'right', borderTop: '1px solid #e2e8f0', borderBottom: '1px solid #e2e8f0', borderRight: '1px solid #e2e8f0' }}>
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: '16px', flexWrap: 'wrap' }}>
                        <span style={{ 
                          fontSize: '18px', fontWeight: '800', padding: '6px 16px', borderRadius: '20px', 
                          ...badgeStyle 
                        }}>
                          {score}%
                        </span>
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleSelectCandidate(candidate);
                          }}
                          className="btn-secondary"
                          style={{
                            padding: '8px 16px',
                            fontSize: '13px',
                            fontWeight: '700',
                            color: '#c81e28',
                            border: '1px solid rgba(200, 30, 40, 0.3)',
                            background: 'rgba(200, 30, 40, 0.06)',
                            borderRadius: '8px',
                            cursor: 'pointer',
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '6px'
                          }}
                        >
                          ⚡ Deep Verify ↗
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      <div style={{ padding: '16px 20px', background: 'rgba(200, 30, 40, 0.04)', borderRadius: '12px', border: '1px solid rgba(200, 30, 40, 0.2)', color: '#334155', fontSize: '14px', fontWeight: '500' }}>
        ℹ️ <strong style={{ color: '#0f172a' }}>Recruiter Note:</strong> Candidates are automatically sorted descending by ATS overall score. Click on any row or hit the <strong style={{ color: '#c81e28' }}>⚡ Deep Verify ↗</strong> button to open the complete deep tech verification report, including real GitHub repositories checked and problem-solving benchmarks.
      </div>
    </div>
  );
}
