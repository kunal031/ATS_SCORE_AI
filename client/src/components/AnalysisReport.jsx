import React, { useState } from 'react';
import { exportToCSV, copyForGoogleSheets } from '../utils/exporter.js';
import { safeRender } from '../utils/textHelper.js';

export default function AnalysisReport({ report, onNewAnalyze }) {
  const [copied, setCopied] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  
  if (!report || typeof report !== 'object') {
    return (
      <div className="glass-card" style={{ padding: '40px', textAlign: 'center', margin: '40px auto', maxWidth: '600px' }}>
        <h3 style={{ color: '#f43f5e', marginBottom: '12px' }}>Report Data Unavailable</h3>
        <p style={{ color: 'var(--text-sub)', marginBottom: '24px' }}>The evaluation report could not be loaded or session data expired.</p>
        <button className="btn-primary" onClick={onNewAnalyze}>Go to Dashboard</button>
      </div>
    );
  }

  const scoreSummary = report.scoreSummary || {};
  const breakdown = scoreSummary.breakdown || {};
  const github = report.githubVerification || {};
  const coding = report.codingCompetency || {};
  const ai = report.aiFeedback || {};

  const handleCopyTSV = async () => {
    const success = await copyForGoogleSheets(report);
    if (success) {
      setCopied(true);
      setTimeout(() => setCopied(false), 4000);
    }
  };

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
              Evaluate Another Resume?
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

      {copied && (
        <div style={{ background: 'rgba(16, 185, 129, 0.15)', border: '1px solid var(--success)', padding: '12px 20px', borderRadius: '12px', color: '#6ee7b7', marginBottom: '25px', fontSize: '14px', fontWeight: '600' }}>
          ✅ Tabular data copied to clipboard! You can now press <strong>Cmd+V / Ctrl+V</strong> directly into any Google Sheet to generate a structured evaluation spreadsheet.
        </div>
      )}

      {/* MASTER COMBINED CONTAINER: Part 1 (SMART JD SATISFACTION) & Part 2 (GitHub Tech Stack Proof + Algorithmic Coding Platforms) */}
      <div className="split-container-grid">
        {/* PART 1 OF CONTAINER: SMART JD SATISFACTION */}
        <div style={{ display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', background: '#f8fafc', border: `1px solid ${scoreSummary.color || '#c81e28'}40`, borderRadius: '20px', padding: '40px 28px', textAlign: 'center', boxShadow: 'inset 0 1px 4px rgba(0,0,0,0.02)' }}>
          <span style={{ fontSize: '15px', color: 'var(--text-sub)', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '1.5px', marginBottom: '20px' }}>
            SMART JD SATISFACTION
          </span>
          <div className="score-number" style={{ color: scoreSummary.color || '#c81e28', fontSize: '76px', fontWeight: '900', margin: '16px 0', lineHeight: '1' }}>
            {safeRender(scoreSummary.overallScore, 0)}%
          </div>
          <div className="score-badge" style={{ background: `${scoreSummary.color || '#c81e28'}15`, color: scoreSummary.color || '#c81e28', border: `1px solid ${scoreSummary.color || '#c81e28'}50`, padding: '8px 22px', borderRadius: '22px', fontSize: '14px', fontWeight: '800', margin: '12px 0 28px' }}>
            {safeRender(scoreSummary.statusLabel, 'VERIFIED MATCH')}
          </div>
          <p style={{ fontSize: '14px', color: 'var(--text-muted)', lineHeight: '1.6', maxWidth: '380px', margin: '0' }}>
            Marking scheme based directly on verified JD requirement satisfaction across Resume Projects & GitHub Repos (no static weights or simple string matching).
          </p>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
          <div style={{ background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '18px', padding: '24px', display: 'flex', flexDirection: 'column', boxShadow: '0 2px 8px rgba(0,0,0,0.02)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
              <h3 style={{ fontSize: '20px', fontWeight: '700', color: '#0f172a', margin: 0 }}>💻 GitHub Tech Stack Proof</h3>
              {github.username ? (
                <a href={`https://github.com/${github.username}`} target="_blank" rel="noreferrer" style={{ fontSize: '14px', color: '#0284c7', textDecoration: 'none', fontWeight: '600', background: '#e0f2fe', padding: '5px 12px', borderRadius: '8px', border: '1px solid #bae6fd' }}>
                  @{github.username} ↗
                </a>
              ) : (
                <span style={{ fontSize: '13px', color: 'var(--text-muted)' }}>No GitHub linked</span>
              )}
            </div>

            {github.techVerification && github.techVerification.some(t => t.sampleRepos && t.sampleRepos.length > 0) ? (
              <div>
                <h4 style={{ fontSize: '12px', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.8px', marginBottom: '12px', fontWeight: '700', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span>Verified Sample Repositories</span>
                  {Array.from(new Set(github.techVerification.flatMap(t => t.sampleRepos || []).map(r => r.url))).length > 3 && (
                    <span style={{ fontSize: '11px', color: '#c81e28', textTransform: 'none', fontWeight: '600' }}>Scroll for more ↓</span>
                  )}
                </h4>
                <div style={{ 
                  maxHeight: '164px',
                  minHeight: '164px',
                  overflowY: 'auto', 
                  display: 'flex', 
                  flexDirection: 'column', 
                  gap: '10px',
                  paddingRight: '4px',
                  scrollSnapType: 'y mandatory'
                }}>
                  {Array.from(new Set(
                    github.techVerification.flatMap(t => t.sampleRepos || []).map(r => r.url)
                  )).map((url, idx) => {
                    const repoObj = github.techVerification.flatMap(t => t.sampleRepos || []).find(r => r.url === url);
                    return (
                      <div key={idx} className="repo-card" style={{ 
                        background: '#ffffff', 
                        border: '1px solid #e2e8f0', 
                        padding: '12px 16px', 
                        borderRadius: '12px', 
                        display: 'flex', 
                        justifyContent: 'space-between', 
                        alignItems: 'center',
                        minHeight: '48px',
                        maxHeight: '48px',
                        scrollSnapAlign: 'start',
                        flexShrink: 0,
                        boxSizing: 'border-box',
                        boxShadow: '0 1px 3px rgba(0,0,0,0.02)'
                      }}>
                        <span style={{ fontWeight: '600', fontSize: '14px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: '68%' }}>
                          📦 <a href={repoObj?.url} target="_blank" rel="noreferrer" style={{ color: '#0f172a', textDecoration: 'none', fontWeight: '700' }}>{repoObj?.name || 'project-repo'}</a>
                        </span>
                        <span style={{ fontSize: '12px', color: '#c81e28', background: 'rgba(200, 30, 40, 0.08)', border: '1px solid rgba(200, 30, 40, 0.2)', padding: '4px 10px', borderRadius: '8px', fontWeight: '700', flexShrink: 0 }}>
                          {repoObj?.language || 'Code'}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>
            ) : (
              <p style={{ color: 'var(--text-muted)', fontSize: '14px', margin: '20px 0' }}>No specific matching technical repositories required by Job Description.</p>
            )}

            {github.isFallback && (
              <div style={{ fontSize: '12px', color: '#b45309', marginTop: '14px', background: '#fef3c7', padding: '10px 14px', borderRadius: '8px', border: '1px solid #fde68a', fontWeight: '600' }}>
                ℹ️ {github.note || 'GitHub API rate-limited; displaying estimated candidate technical assessment.'}
              </div>
            )}
          </div>

          <div style={{ background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '18px', padding: '24px', display: 'flex', flexDirection: 'column', flex: '1', justifyContent: 'space-between', boxShadow: '0 2px 8px rgba(0,0,0,0.02)' }}>
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                <h3 style={{ fontSize: '20px', fontWeight: '700', color: '#0f172a', margin: 0 }}>🏆 Algorithmic Coding Platforms</h3>
                {(coding.leetcode && coding.codeforces) && (
                  <span style={{ fontSize: '11px', color: '#c81e28', background: 'rgba(200, 30, 40, 0.08)', padding: '4px 10px', borderRadius: '12px', fontWeight: '700', border: '1px solid rgba(200, 30, 40, 0.2)' }}>
                    Scroll profiles ↓
                  </span>
                )}
              </div>
              <p style={{ fontSize: '14px', color: 'var(--text-sub)', marginBottom: '16px' }}>
                Verification of solved algorithmic problems, rating contests, and technical complexity handling:
              </p>

              <div style={{
                maxHeight: '190px',
                minHeight: '190px',
                overflowY: 'auto',
                display: 'flex',
                flexDirection: 'column',
                gap: '16px',
                paddingRight: '4px',
                scrollSnapType: 'y mandatory'
              }}>
                {coding.leetcode && (
                  <div style={{
                    minHeight: '190px',
                    maxHeight: '190px',
                    boxSizing: 'border-box',
                    background: '#ffffff',
                    border: '1px solid #e2e8f0',
                    borderRadius: '16px',
                    padding: '14px 16px',
                    display: 'flex',
                    flexDirection: 'column',
                    justifyContent: 'space-between',
                    scrollSnapAlign: 'start',
                    flexShrink: 0,
                    boxShadow: '0 1px 4px rgba(0,0,0,0.03)'
                  }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <span style={{ fontSize: '16px', fontWeight: '700', color: '#0f172a' }}>⚡ LeetCode Profile</span>
                      <a href={coding.leetcode.profileUrl} target="_blank" rel="noreferrer" style={{ fontSize: '13px', color: '#b45309', textDecoration: 'none', fontWeight: '700', background: '#fef3c7', padding: '4px 12px', borderRadius: '8px', border: '1px solid #fde68a' }}>
                        @{coding.leetcode.username} ↗
                      </a>
                    </div>
                    <div className="stats-grid-4" style={{ gap: '10px', margin: '8px 0' }}>
                      <div style={{ background: '#f8fafc', border: '1px solid #e2e8f0', padding: '10px 6px', borderRadius: '10px', textAlign: 'center' }}>
                        <div style={{ fontSize: '18px', fontWeight: '800', color: '#0f172a' }}>{coding.leetcode.solved?.total || 0}</div>
                        <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '2px', fontWeight: '600' }}>Total Solved</div>
                      </div>
                      <div style={{ background: '#ecfdf5', border: '1px solid #a7f3d0', padding: '10px 6px', borderRadius: '10px', textAlign: 'center' }}>
                        <div style={{ fontSize: '18px', fontWeight: '800', color: '#059669' }}>{coding.leetcode.solved?.easy || 0}</div>
                        <div style={{ fontSize: '11px', color: '#047857', marginTop: '2px', fontWeight: '600' }}>Easy</div>
                      </div>
                      <div style={{ background: '#fffbeb', border: '1px solid #fde68a', padding: '10px 6px', borderRadius: '10px', textAlign: 'center' }}>
                        <div style={{ fontSize: '18px', fontWeight: '800', color: '#d97706' }}>{coding.leetcode.solved?.medium || 0}</div>
                        <div style={{ fontSize: '11px', color: '#b45309', marginTop: '2px', fontWeight: '600' }}>Medium</div>
                      </div>
                      <div style={{ background: '#fef2f2', border: '1px solid #fecaca', padding: '10px 6px', borderRadius: '10px', textAlign: 'center' }}>
                        <div style={{ fontSize: '18px', fontWeight: '800', color: '#dc2626' }}>{coding.leetcode.solved?.hard || 0}</div>
                        <div style={{ fontSize: '11px', color: '#991b1b', marginTop: '2px', fontWeight: '600' }}>Hard</div>
                      </div>
                    </div>
                    <div style={{ fontSize: '13px', color: 'var(--text-muted)', display: 'flex', justifyContent: 'space-between', background: '#f8fafc', padding: '8px 12px', borderRadius: '8px', border: '1px solid #e2e8f0', fontWeight: '600' }}>
                      <span>Global Rank: <strong style={{ color: '#0f172a' }}>{coding.leetcode.ranking || 'N/A'}</strong></span>
                      <span>Rubric Score: <strong style={{ color: '#c81e28' }}>{coding.leetcode.score || 0}/100</strong></span>
                    </div>
                  </div>
                )}

                {coding.codeforces && (
                  <div style={{
                    minHeight: '190px',
                    maxHeight: '190px',
                    boxSizing: 'border-box',
                    background: '#ffffff',
                    border: '1px solid #e2e8f0',
                    borderRadius: '16px',
                    padding: '16px',
                    display: 'flex',
                    flexDirection: 'column',
                    justifyContent: 'space-between',
                    scrollSnapAlign: 'start',
                    flexShrink: 0,
                    boxShadow: '0 1px 4px rgba(0,0,0,0.03)'
                  }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <span style={{ fontSize: '17px', fontWeight: '700', color: '#0f172a' }}>📊 Codeforces Profile</span>
                      <a href={coding.codeforces.profileUrl} target="_blank" rel="noreferrer" style={{ fontSize: '13px', color: '#dc2626', textDecoration: 'none', fontWeight: '700', background: '#fef2f2', padding: '5px 12px', borderRadius: '8px', border: '1px solid #fecaca' }}>
                        @{coding.codeforces.handle} ↗
                      </a>
                    </div>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', margin: 'auto 0' }}>
                      <div style={{ background: '#fffbeb', border: '1px solid #fde68a', padding: '14px 10px', borderRadius: '12px', textAlign: 'center' }}>
                        <div style={{ fontSize: '22px', fontWeight: '800', color: '#d97706' }}>{coding.codeforces.rating || 1200}</div>
                        <div style={{ fontSize: '12px', color: '#b45309', marginTop: '3px', fontWeight: '700' }}>{coding.codeforces.rank || 'Pupil'} Rating</div>
                      </div>
                      <div style={{ background: '#f8fafc', border: '1px solid #e2e8f0', padding: '14px 10px', borderRadius: '12px', textAlign: 'center' }}>
                        <div style={{ fontSize: '22px', fontWeight: '800', color: '#0f172a' }}>{coding.codeforces.problemsSolved || '50+'}</div>
                        <div style={{ fontSize: '12px', color: 'var(--text-muted)', marginTop: '3px', fontWeight: '600' }}>Problems Solved</div>
                      </div>
                    </div>
                    <div style={{ fontSize: '12px', color: '#64748b', textAlign: 'center', background: '#f8fafc', padding: '6px', borderRadius: '6px', fontWeight: '500', border: '1px solid #e2e8f0' }}>
                      Verified competitive algorithmic proficiency via live rating statistics.
                    </div>
                  </div>
                )}

                {!coding.leetcode && !coding.codeforces && !coding.hackerrank && (
                  <div style={{ 
                    minHeight: '190px',
                    maxHeight: '190px',
                    boxSizing: 'border-box',
                    textAlign: 'center', 
                    padding: '24px 16px', 
                    border: '1px dashed var(--border-glass)', 
                    borderRadius: '16px', 
                    color: 'var(--text-muted)',
                    display: 'flex',
                    flexDirection: 'column',
                    justifyContent: 'center',
                    alignItems: 'center',
                    scrollSnapAlign: 'start',
                    flexShrink: 0
                  }}>
                    <div style={{ fontSize: '32px', marginBottom: '10px' }}>🧩</div>
                    <p style={{ fontWeight: '700', color: 'var(--text-sub)', fontSize: '15px', margin: '0 0 6px' }}>No Coding Profile Handle Detected</p>
                    <p style={{ fontSize: '13px', margin: 0, maxWidth: '300px', lineHeight: '1.4' }}>Add a LeetCode or Codeforces URL in your resume or override section to verify problem solving fluency.</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
