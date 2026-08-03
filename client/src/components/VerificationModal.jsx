import React from 'react';

export default function VerificationModal({ modalData, onClose }) {
  if (!modalData) return null;

  const { candidate, rawReport, verificationReport } = modalData;
  const user_id = candidate?.user_id || rawReport?.user_id || "Candidate";
  const resume_link = candidate?.resume_link || rawReport?.resume_link || "#";

  // Extract sections from verification report or fallback to parsed report data
  const githubData = verificationReport?.github || rawReport?.verificationReport?.github || {};
  const codingData = verificationReport?.coding || rawReport?.verificationReport?.coding || {};
  const liveData = verificationReport?.liveLinks || rawReport?.verificationReport?.liveLinks || {};
  const parsedSkills = rawReport?.parsed_resume || {};

  const techStack = githubData.techCluster || parsedSkills.tech_stack || [];
  const softSkills = parsedSkills.soft_skills || [];
  const projects = parsedSkills.projects || [];
  const liveUrls = liveData.urls || parsedSkills.profile_links || [];

  const overlayStyle = {
    position: 'fixed',
    top: 0,
    left: 0,
    width: '100%',
    height: '100%',
    background: 'rgba(15, 23, 42, 0.75)',
    backdropFilter: 'blur(6px)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 9999,
    padding: '20px'
  };

  const modalStyle = {
    background: '#ffffff',
    borderRadius: '24px',
    maxWidth: '820px',
    width: '100%',
    maxHeight: '88vh',
    overflowY: 'auto',
    boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.3)',
    border: '1px solid #e2e8f0',
    padding: '36px',
    position: 'relative'
  };

  return (
    <div style={overlayStyle} onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}>
      <div style={modalStyle} className="verification-modal animate-fade-in">
        
        {/* HEADER */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', borderBottom: '2px solid #f1f5f9', paddingBottom: '22px', marginBottom: '28px' }}>
          <div>
            <span style={{ fontSize: '11px', fontWeight: '800', textTransform: 'uppercase', letterSpacing: '1px', color: '#11589a', background: '#eff6ff', padding: '4px 10px', borderRadius: '20px', display: 'inline-block', marginBottom: '10px' }}>
              4-Pillar Verification Audit
            </span>
            <h3 style={{ fontSize: '24px', fontWeight: '800', color: '#0f172a', margin: 0, lineHeight: '1.2' }}>
              Evaluation Report: {user_id}
            </h3>
            <a href={resume_link} target="_blank" rel="noopener noreferrer" style={{ fontSize: '13px', color: '#2563eb', textDecoration: 'none', display: 'inline-block', marginTop: '6px' }}>
              📄 View Original Document Link ↗
            </a>
          </div>

          <button 
            type="button" 
            onClick={onClose}
            style={{
              background: '#f1f5f9',
              border: 'none',
              borderRadius: '50%',
              width: '40px',
              height: '40px',
              fontSize: '18px',
              fontWeight: 'bold',
              color: '#475569',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              transition: 'background 0.2s'
            }}
            title="Close evaluation window"
          >
            ✕
          </button>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '28px' }}>
          
          {/* SECTION 1: GITHUB & TECH STACK CLUSTER */}
          <div style={{ background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '16px', padding: '24px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '16px' }}>
              <span style={{ fontSize: '22px' }}>💻</span>
              <h4 style={{ fontSize: '18px', fontWeight: '800', color: '#0f172a', margin: 0 }}>
                GitHub Repositories & Tech Stack Cluster
              </h4>
            </div>
            
            <p style={{ fontSize: '14px', color: '#475569', margin: '0 0 16px 0' }}>
              <strong>Repositories & Projects Detected:</strong> {projects.length > 0 ? projects.join(', ') : 'No individual projects listed in resume text.'}
            </p>

            <div>
              <span style={{ fontSize: '12px', fontWeight: '700', color: '#64748b', textTransform: 'uppercase', display: 'block', marginBottom: '8px' }}>
                Extracted Developer Technologies ({techStack.length})
              </span>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                {techStack.length > 0 ? (
                  techStack.map((tech, idx) => (
                    <span key={idx} style={{ background: '#dbeafe', color: '#1e40af', padding: '6px 12px', borderRadius: '12px', fontSize: '12px', fontWeight: '700' }}>
                      {tech}
                    </span>
                  ))
                ) : (
                  <span style={{ color: '#94a3b8', fontStyle: 'italic', fontSize: '13px' }}>No specific hard skills or programming languages matched.</span>
                )}
              </div>
            </div>
          </div>

          {/* SECTION 2: CODING PROFILE EVALUATION (DSA COMPETENCY) */}
          <div style={{ background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '16px', padding: '24px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '16px' }}>
              <span style={{ fontSize: '22px' }}>🏆</span>
              <h4 style={{ fontSize: '18px', fontWeight: '800', color: '#0f172a', margin: 0 }}>
                Coding Platform & DSA Competency Evaluation
              </h4>
            </div>

            {codingData.mediumHardTotal > 0 || (codingData.solved && codingData.solved.total > 0) ? (
              <div>
                <div style={{ display: 'flex', gap: '16px', marginBottom: '16px' }}>
                  <div style={{ flex: 1, background: '#ffffff', border: '1px solid #e2e8f0', padding: '16px', borderRadius: '12px', textAlign: 'center' }}>
                    <span style={{ fontSize: '24px', fontWeight: '800', color: '#11589a' }}>
                      {codingData.mediumHardTotal ?? codingData.solved?.total ?? 0}
                    </span>
                    <span style={{ display: 'block', fontSize: '12px', fontWeight: '600', color: '#64748b', marginTop: '4px' }}>
                      Medium + Hard Solved
                    </span>
                  </div>
                  <div style={{ flex: 1, background: '#f0fdf4', border: '1px solid #bbf7d0', padding: '16px', borderRadius: '12px', textAlign: 'center' }}>
                    <span style={{ fontSize: '24px', fontWeight: '800', color: '#15803d' }}>
                      {codingData.mediumHardTotal >= 100 ? '100%' : (codingData.mediumHardTotal >= 75 ? '75%' : `${codingData.mediumHardTotal || 0}%`)}
                    </span>
                    <span style={{ display: 'block', fontSize: '12px', fontWeight: '600', color: '#166534', marginTop: '4px' }}>
                      Rubric Score Award
                    </span>
                  </div>
                </div>
                <p style={{ fontSize: '13px', color: '#475569', margin: 0 }}>
                  ✓ Candidate meets algorithmic criteria based on extracted coding platform references.
                </p>
              </div>
            ) : (
              <div style={{ padding: '16px', background: '#fffbeb', border: '1px solid #fde68a', borderRadius: '12px' }}>
                <p style={{ fontSize: '14px', color: '#92400e', fontWeight: '600', margin: '0 0 6px 0' }}>
                  ⚠️ No Competitive Coding / DSA Profile Linked
                </p>
                <p style={{ fontSize: '13px', color: '#78350f', margin: 0, lineHeight: '1.4' }}>
                  No explicit LeetCode, Codeforces, or HackerRank handles with problem statistics were discovered in this resume text. If the Job Description explicitly mandates DSA problem-solving tests, the DSA weightage will award 0% for this pillar.
                </p>
              </div>
            )}
          </div>

          {/* SECTION 3: DEPLOYED LIVE LINKS */}
          <div style={{ background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '16px', padding: '24px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '16px' }}>
              <span style={{ fontSize: '22px' }}>🌐</span>
              <h4 style={{ fontSize: '18px', fontWeight: '800', color: '#0f172a', margin: 0 }}>
                All Links
              </h4>
            </div>

            {liveUrls && liveUrls.length > 0 ? (
              <ul style={{ margin: 0, paddingLeft: '20px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
                {liveUrls.map((url, i) => (
                  <li key={i} style={{ fontSize: '14px' }}>
                    <a href={url.startsWith('http') ? url : `https://${url}`} target="_blank" rel="noopener noreferrer" style={{ color: '#2563eb', textDecoration: 'underline', fontWeight: '600' }}>
                      {url}
                    </a>
                  </li>
                ))}
              </ul>
            ) : (
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '12px 16px', background: '#f1f5f9', border: '1px solid #cbd5e1', borderRadius: '12px', width: 'fit-content' }}>
                <span style={{ fontSize: '16px' }}>🚫</span>
                <span style={{ fontSize: '13px', fontWeight: '700', color: '#475569' }}>No live link present in candidate profile</span>
              </div>
            )}
          </div>

          {/* SECTION 4: EXTRA SOFT SKILLS OVERVIEW */}
          {softSkills.length > 0 && (
            <div style={{ background: '#ffffff', border: '1px dashed #cbd5e1', borderRadius: '16px', padding: '20px' }}>
              <span style={{ fontSize: '12px', fontWeight: '700', color: '#64748b', textTransform: 'uppercase', display: 'block', marginBottom: '8px' }}>
                Extracted Candidate Soft Skills
              </span>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                {softSkills.map((skill, i) => (
                  <span key={i} style={{ background: '#f1f5f9', color: '#334155', padding: '4px 10px', borderRadius: '8px', fontSize: '12px', fontWeight: '600' }}>
                    {skill}
                  </span>
                ))}
              </div>
            </div>
          )}

        </div>

        {/* MODAL FOOTER */}
        <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '32px', paddingTop: '20px', borderTop: '1px solid #e2e8f0' }}>
          <button
            type="button"
            onClick={onClose}
            className="btn-primary"
            style={{ padding: '10px 24px', fontSize: '14px', borderRadius: '12px' }}
          >
            Close Report
          </button>
        </div>

      </div>
    </div>
  );
}
