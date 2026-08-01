import React, { useState, useEffect } from 'react';
import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:4000';

const SAMPLE_JD = `Senior Full Stack Engineer & System Architect
We are looking for a highly skilled Full Stack Engineer to lead technical design and feature deployment across our cloud architecture.

Key Technical Requirements:
- Deep expertise in JavaScript, TypeScript, and React.js for modern reactive web applications.
- Strong proven experience building REST APIs and backend microservices using Node.js and Express.
- Proficiency in NoSQL and database modeling with MongoDB or PostgreSQL.
- Understanding of cloud containerization using Docker and AWS deployments.
- Strong adherence to Git version control, CI/CD pipelines, and rigorous automated testing (Jest/Playwright).

Algorithmic & Coding Competency:
- Proven problem-solving ability on algorithmic coding platforms (LeetCode, Codeforces, HackerRank).
- Ability to optimize high-throughput code and minimize time complexity for real-time applications.`;

const SAMPLE_RESUME_TEXT = `Kunal Raj - Senior Software Engineer & Cloud Architect
Email: kunal.dev@example.com | GitHub: https://github.com/torvalds | LeetCode: https://leetcode.com/u/neetcode

SUMMARY:
Results-driven Full Stack Engineer with extensive hands-on experience designing reactive client-side interfaces and robust Node.js microservices. Demonstrated capability in database architecture and algorithmic optimization.

TECHNICAL SKILLS:
Languages & Frameworks: JavaScript, TypeScript, React.js, Node.js, Express, HTML5, CSS3, Python.
Databases & DevOps: MongoDB, Docker, AWS, Git, RESTful APIs, CI/CD Pipelines.

PROFESSIONAL EXPERIENCE:
Senior Frontend & Node Developer | TechSphere Sol (2022 - Present)
- Responsible for developing web apps and fixing bugs in production across distributed teams.
- Worked with database and APIs for client requirements and reduced latency on main user dashboard.
- Integrated automated Docker container workflows and deployed scalable AWS Lambda endpoints.
- Mentored junior devs in code reviews and algorithms.

EDUCATION:
Bachelor of Technology in Computer Science (2021)`;

export default function Dashboard({ onComplete }) {
  const [evalMode, setEvalMode] = useState(() => localStorage.getItem('ats_eval_mode') || 'single'); // 'single' | 'batch'
  const [inputMode, setInputMode] = useState(() => localStorage.getItem('ats_input_mode') || 'file'); // 'file' | 'link' | 'text'
  const [selectedFile, setSelectedFile] = useState(null);
  const [resumeUrl, setResumeUrl] = useState(() => localStorage.getItem('ats_resume_url') || '');
  const [resumeText, setResumeText] = useState(() => localStorage.getItem('ats_resume_text') || '');
  const [jobDescription, setJobDescription] = useState(() => {
    const saved = localStorage.getItem('ats_jd_text');
    return saved !== null ? saved : SAMPLE_JD;
  });
  
  // Optional profile overrides for single evaluation
  const [githubOverride, setGithubOverride] = useState(() => localStorage.getItem('ats_github_override') || '');
  const [leetcodeOverride, setLeetcodeOverride] = useState(() => localStorage.getItem('ats_leetcode_override') || '');

  // Batch evaluation candidate array with persistent restoration
  const [candidates, setCandidates] = useState(() => {
    const saved = localStorage.getItem('ats_batch_candidates');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) {
          return parsed.filter(Boolean).map((c, i) => ({
            id: c?.id || `RES-00${i + 1}`,
            mode: c?.mode || 'text',
            file: c?.file || null,
            url: c?.url || '',
            text: c?.text || '',
            github: c?.github || '',
            leetcode: c?.leetcode || '',
            nameHint: c?.nameHint || ''
          }));
        }
      } catch (e) { /* fallback to default */ }
    }
    return [
      { id: 'RES-001', mode: 'file', file: null, url: '', text: '', github: '', leetcode: '', nameHint: '' },
      { id: 'RES-002', mode: 'file', file: null, url: '', text: '', github: '', leetcode: '', nameHint: '' }
    ];
  });

  // Execution state
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [activeStep, setActiveStep] = useState(0);

  // Smart Bulk Paste state
  const [bulkPasteText, setBulkPasteText] = useState('');
  const [bulkStatus, setBulkStatus] = useState(null);

  // Synchronized count of entered entries
  const enteredCount = Array.isArray(candidates) ? candidates.length : 0;
  const countLabel = `${enteredCount} ${enteredCount === 1 ? 'Entry' : 'Entries'} Entered`;

  // Persist form inputs across accidental or intentional browser tab refreshes
  useEffect(() => {
    localStorage.setItem('ats_eval_mode', evalMode);
    localStorage.setItem('ats_input_mode', inputMode);
    localStorage.setItem('ats_resume_url', resumeUrl);
    localStorage.setItem('ats_resume_text', resumeText);
    localStorage.setItem('ats_jd_text', jobDescription);
    localStorage.setItem('ats_github_override', githubOverride);
    localStorage.setItem('ats_leetcode_override', leetcodeOverride);
    try {
      const serializable = (Array.isArray(candidates) ? candidates : []).map(c => {
        if (!c) return null;
        let fileMeta = null;
        if (c.file) {
          try {
            if (typeof File !== 'undefined' && c.file instanceof File) {
              fileMeta = { name: c.file.name, size: c.file.size, type: c.file.type };
            } else if (c.file.name) {
              fileMeta = c.file;
            }
          } catch (e) { fileMeta = null; }
        }
        return { ...c, file: fileMeta };
      }).filter(Boolean);
      localStorage.setItem('ats_batch_candidates', JSON.stringify(serializable));
    } catch (e) {
      console.warn("Unable to serialize candidates for persistence:", e);
    }
  }, [evalMode, inputMode, resumeUrl, resumeText, jobDescription, githubOverride, leetcodeOverride, candidates]);

  // Animated sequential step progression during loading
  useEffect(() => {
    let timer;
    if (loading) {
      if (activeStep < 4) {
        timer = setTimeout(() => setActiveStep(prev => prev + 1), 1600);
      }
    } else {
      setActiveStep(0);
    }
    return () => clearTimeout(timer);
  }, [loading, activeStep]);

  const handleFileChange = (e) => {
    if (e.target.files && e.target.files[0]) {
      setSelectedFile(e.target.files[0]);
      setError('');
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      setSelectedFile(e.dataTransfer.files[0]);
      setError('');
    }
  };

  const handleSwitchToSingleMode = () => {
    setEvalMode('single');
    // Instantly clear prior inputs for a clean empty state ready for fresh user input
    setJobDescription('');
    setSelectedFile(null);
    setResumeUrl('');
    setResumeText('');
    setGithubOverride('');
    setLeetcodeOverride('');
    setCandidates([{ id: 'RES-001', mode: 'file', file: null, url: '', text: '', github: '', leetcode: '', nameHint: '' }]);
    setError('');
    setBulkPasteText('');
    setBulkStatus(null);
  };

  const handleSwitchToBatchMode = () => {
    setEvalMode('batch');
    // Instantly clear prior inputs for a clean empty state ready for fresh user input
    setJobDescription('');
    setSelectedFile(null);
    setResumeUrl('');
    setResumeText('');
    setGithubOverride('');
    setLeetcodeOverride('');
    setCandidates([{ id: 'RES-001', mode: 'file', file: null, url: '', text: '', github: '', leetcode: '', nameHint: '' }]);
    setError('');
    setBulkPasteText('');
    setBulkStatus(null);
  };

  const handleFillSample = () => {
    setEvalMode('single');
    // Clear out any prior batch or alternate input state and auto-populate demo sample data
    setSelectedFile(null);
    setResumeUrl('');
    setCandidates([{ id: 'RES-001', mode: 'file', file: null, url: '', text: '', github: '', leetcode: '', nameHint: '' }]);
    setInputMode('text');
    setResumeText(SAMPLE_RESUME_TEXT);
    setJobDescription(SAMPLE_JD);
    setGithubOverride('torvalds');
    setLeetcodeOverride('neetcode');
    setError('');
  };

  const handleFillBatchSample = () => {
    setEvalMode('batch');
    // Clear out any prior single mode inputs and auto-populate batch sample data
    setSelectedFile(null);
    setResumeUrl('');
    setResumeText('');
    setGithubOverride('');
    setLeetcodeOverride('');
    setJobDescription(SAMPLE_JD);
    setCandidates([
      {
        id: 'RES-001',
        mode: 'text',
        file: null,
        url: '',
        text: SAMPLE_RESUME_TEXT,
        github: 'torvalds',
        leetcode: 'neetcode',
        nameHint: 'Kunal Raj'
      },
      {
        id: 'RES-002',
        mode: 'text',
        file: null,
        url: '',
        text: `Alice Smith - Senior Cloud Systems Engineer & Backend Lead\nEmail: alice.smith@example.com | GitHub: https://github.com/gaearon\n\nSUMMARY:\nExperienced Node.js and TypeScript system architect specializing in AWS microservices and Kubernetes deployments.\n\nTECHNICAL SKILLS:\nLanguages & Tools: TypeScript, JavaScript, Node.js, Express, PostgreSQL, Docker, AWS, Git.\n\nEXPERIENCE:\nLead Backend Developer | CloudScale (2020 - Present)\n- Designed fault-tolerant REST APIs and backend architectures in Node.js.\n- Engineered automated CI/CD pipelines and Docker container deployments on AWS ECS.\n\nEDUCATION:\nB.Sc in Computer Science (2019)`,
        github: 'gaearon',
        leetcode: '',
        nameHint: 'Alice Smith'
      },
      {
        id: 'RES-003',
        mode: 'text',
        file: null,
        url: '',
        text: `Robert Taylor - Frontend & Web Specialist\nEmail: robert.dev@example.com\n\nSUMMARY:\nCreative web developer focused on UI layouts and frontend styling using React and HTML/CSS.\n\nTECHNICAL SKILLS:\nLanguages: JavaScript, HTML5, CSS3, React.js.\n\nEXPERIENCE:\nUI Engineer | Designify (2021 - Present)\n- Developed responsive web interfaces and reusable CSS component libraries.\n- Collaborated with UX designers on frontend animations.`,
        github: '',
        leetcode: '',
        nameHint: 'Robert Taylor'
      }
    ]);
    setError('');
  };

  const handleAddCandidate = () => {
    const newIndex = candidates.length + 1;
    const nextId = `RES-00${newIndex}`;
    setCandidates([...candidates, { id: nextId, mode: 'file', file: null, url: '', text: '', github: '', leetcode: '', nameHint: '' }]);
  };

  const handleRemoveCandidate = (index) => {
    const updated = [...candidates];
    updated.splice(index, 1);
    const renumbered = updated.map((item, idx) => ({ ...item, id: `RES-00${idx + 1}` }));
    setCandidates(renumbered);
  };

  const handleCandidateChange = (index, field, value) => {
    const updated = [...candidates];
    if (updated[index]) {
      updated[index][field] = value;
      setCandidates(updated);
    }
  };

  const handleBulkParseAndPopulate = (e) => {
    e?.preventDefault();
    if (!bulkPasteText.trim()) {
      setBulkStatus({ type: 'error', message: '⚠️ Please paste text containing one or more resume URL links.' });
      return;
    }
    // Match http or https URLs cleanly, excluding common trailing punctuation or layout brackets
    const urlRegex = /(https?:\/\/[^\s,;<>)!"]+)/g;
    const matches = bulkPasteText.match(urlRegex) || [];
    const uniqueUrls = Array.from(new Set(matches.map(url => url.replace(/[.)"']$/, ''))));

    if (uniqueUrls.length === 0) {
      setBulkStatus({ type: 'error', message: '⚠️ No valid HTTP/HTTPS URLs were detected in the pasted text. Ensure links begin with http:// or https://' });
      return;
    }

    // Filter out existing empty placeholder entries if they haven't been used yet
    let baseCandidates = [...candidates];
    if (baseCandidates.length === 1 && !baseCandidates[0].file && !baseCandidates[0].url?.trim() && !baseCandidates[0].text?.trim() && !baseCandidates[0].github?.trim() && !baseCandidates[0].leetcode?.trim()) {
      baseCandidates = []; // Replace empty initial placeholder slot
    }

    const startIdx = baseCandidates.length;
    const newCandidateEntries = uniqueUrls.map((url, i) => ({
      id: `RES-00${startIdx + i + 1}`,
      mode: 'link',
      file: null,
      url: url,
      text: '',
      github: '',
      leetcode: '',
      nameHint: `Candidate Link #${startIdx + i + 1}`
    }));

    const combined = [...baseCandidates, ...newCandidateEntries].map((cand, idx) => ({
      ...cand,
      id: `RES-00${idx + 1}` // Re-index cleanly
    }));

    setCandidates(combined);
    setBulkPasteText('');
    setBulkStatus({
      type: 'success',
      message: `✨ Successfully parsed & populated ${uniqueUrls.length} resume URL${uniqueUrls.length > 1 ? 's' : ''} into the batch list below!`
    });

    // Auto clear success message after 6 seconds
    setTimeout(() => {
      setBulkStatus(null);
    }, 6000);
  };

  const handleAnalyze = async (e) => {
    e.preventDefault();
    if (!jobDescription.trim()) {
      setError('Please provide a target Job Description.');
      return;
    }

    if (evalMode === 'single') {
      if (inputMode === 'file' && !selectedFile) {
        setError('Please upload a PDF or DOCX resume file, or switch to link/text input.');
        return;
      }
      if (inputMode === 'link' && !resumeUrl.trim()) {
        setError('Please provide a valid resume URL link.');
        return;
      }
      if (inputMode === 'text' && !resumeText.trim()) {
        setError('Please provide candidate resume text.');
        return;
      }
    } else {
      if (candidates.length === 0) {
        setError('No candidates entered in batch. Please click "+ Add Another Candidate Resume Entry" or load the Demo!');
        return;
      }
      const hasContent = candidates.some(c => (c.mode === 'file' && c.file) || (c.mode === 'link' && c.url && c.url.trim()) || (c.mode === 'text' && c.text && c.text.trim()));
      if (!hasContent) {
        setError('Please provide resume file, text, or URL for at least one candidate entry in the batch.');
        return;
      }
    }

    setLoading(true);
    setError('');
    setActiveStep(1);

    try {
      if (evalMode === 'batch') {
        // Step 1: Process each candidate resume in the batch
        const processedResumes = await Promise.all(candidates.map(async (c, idx) => {
          let extractedText = c.text;
          let detectedProfiles = {};
          let filename = c.file ? c.file.name : (c.nameHint ? `${c.nameHint.replace(/\s+/g, '_')}_Resume.txt` : `Candidate_${idx + 1}.pdf`);

          if (c.mode === 'file' && c.file && c.file instanceof File) {
            const formData = new FormData();
            formData.append('resume', c.file);
            try {
              const uploadRes = await axios.post(`${API_BASE_URL}/resume/upload`, formData, {
                headers: { 'Content-Type': 'multipart/form-data' },
                timeout: 15000
              });
              extractedText = uploadRes.data.text;
              detectedProfiles = uploadRes.data.detectedProfiles || {};
            } catch (upErr) {
              console.warn("Upload file failed in batch for", c.id, upErr);
            }
          } else if (!extractedText && c.file && c.file.name) {
            extractedText = `Candidate Resume for ${c.file.name}`;
          }

          const customProfiles = {
            ...detectedProfiles,
            github: c.github || detectedProfiles.github,
            leetcode: c.leetcode || detectedProfiles.leetcode
          };

          return {
            id: c.id,
            resumeText: extractedText,
            resumeUrl: c.mode === 'link' ? c.url : undefined,
            filename,
            customProfiles
          };
        }));

        const analyzeRes = await axios.post(`${API_BASE_URL}/resume/analyze-batch`, {
          jobDescription,
          resumes: processedResumes
        }, { timeout: 45000 });

        if (analyzeRes.data && analyzeRes.data.success) {
          setTimeout(() => {
            setLoading(false);
            onComplete(analyzeRes.data);
          }, 800);
          return;
        } else {
          throw new Error('Batch analysis completed with errors or invalid response.');
        }
      }

      // Single Evaluation Mode
      let extractedText = resumeText;
      let detectedProfiles = {};
      let filename = selectedFile ? selectedFile.name : undefined;

      if (inputMode === 'file' && selectedFile && selectedFile instanceof File) {
        const formData = new FormData();
        formData.append('resume', selectedFile);

        const uploadRes = await axios.post(`${API_BASE_URL}/resume/upload`, formData, {
          headers: { 'Content-Type': 'multipart/form-data' },
          timeout: 15000
        });

        extractedText = uploadRes.data.text;
        detectedProfiles = uploadRes.data.detectedProfiles || {};
      }

      const customProfiles = {
        ...detectedProfiles,
        github: githubOverride || detectedProfiles.github,
        leetcode: leetcodeOverride || detectedProfiles.leetcode
      };

      const payload = {
        id: "RES-001",
        filename,
        resumeText: extractedText,
        jobDescription,
        resumeUrl: inputMode === 'link' ? resumeUrl : undefined,
        customProfiles
      };

      const analyzeRes = await axios.post(`${API_BASE_URL}/resume/analyze`, payload, {
        timeout: 25000
      });

      if (analyzeRes.data && analyzeRes.data.success) {
        setTimeout(() => {
          setLoading(false);
          onComplete(analyzeRes.data);
        }, 800);
      } else {
        throw new Error('Analysis completed with errors or invalid response.');
      }
    } catch (err) {
      console.error(err);
      setError(err.response?.data?.error || err.message || 'Failed to analyze resume. Make sure backend server is running on port 4000.');
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="glass-card progress-panel" style={{ maxWidth: '680px', margin: '40px auto' }}>
        <div className="pulse-spinner"></div>
        <h2 className="gradient-text" style={{ fontSize: '28px' }}>
          {evalMode === 'batch' ? `Evaluating & Deep Verifying ${enteredCount} Candidate Resumes` : 'Evaluating & Verifying Candidate'}
        </h2>
        <p style={{ color: 'var(--text-sub)', marginTop: '10px' }}>
          Our AI engines are scanning repositories and coding platforms in real time...
        </p>

        <div className="progress-steps">
          <div className={`step-item ${activeStep >= 1 ? (activeStep > 1 ? 'done' : 'active') : ''}`}>
            <span>{activeStep > 1 ? '✅' : '⚡'}</span>
            <div>
              <strong>1. Document Parsing & NLP Extraction</strong>
              <p style={{ fontSize: '13px', color: 'var(--text-muted)' }}>Extracting profile links, names, and candidate skills</p>
            </div>
          </div>

          <div className={`step-item ${activeStep >= 2 ? (activeStep > 2 ? 'done' : 'active') : ''}`}>
            <span>{activeStep > 2 ? '✅' : '🔍'}</span>
            <div>
              <strong>2. GitHub Repository Tech Stack Verification</strong>
              <p style={{ fontSize: '13px', color: 'var(--text-muted)' }}>Checking public repos for required JD programming languages</p>
            </div>
          </div>

          <div className={`step-item ${activeStep >= 3 ? (activeStep > 3 ? 'done' : 'active') : ''}`}>
            <span>{activeStep > 3 ? '✅' : '🏆'}</span>
            <div>
              <strong>3. Coding Platform Competency Assessment</strong>
              <p style={{ fontSize: '13px', color: 'var(--text-muted)' }}>Querying LeetCode & Codeforces problem solving metrics</p>
            </div>
          </div>

          <div className={`step-item ${activeStep >= 4 ? 'active' : ''}`}>
            <span>✨</span>
            <div>
              <strong>4. 100-Point Rubric & Executive Synthesis</strong>
              <p style={{ fontSize: '13px', color: 'var(--text-muted)' }}>Synthesizing weighted evaluation criteria and ranking summary</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div>
      <div style={{ textAlign: 'center', marginBottom: '25px', maxWidth: '850px', margin: '0 auto 30px' }}>
        <h1 style={{ fontSize: '44px', fontWeight: '800', letterSpacing: '-1px' }}>
          AI Resume ATS & <span className="gradient-text">Live Tech Verifier</span>
        </h1>
        <p style={{ color: 'var(--text-sub)', fontSize: '17px', marginTop: '12px' }}>
          Upload single or multiple resumes against a job description. Our AI verifies claimed tech stacks in <strong>GitHub repositories</strong> and benchmarks algorithmic fluency on <strong>LeetCode & Codeforces</strong>.
        </p>
        <div style={{ marginTop: '18px', display: 'flex', gap: '12px', justifyContent: 'center', flexWrap: 'wrap' }}>
          <button className="btn-secondary" type="button" onClick={handleFillSample} style={{ border: '1px solid rgba(139, 92, 246, 0.4)' }}>
            ⚡ Demo: Single Senior Engineer
          </button>
          <button className="btn-secondary" type="button" onClick={handleFillBatchSample} style={{ border: '1px solid rgba(16, 185, 129, 0.4)', color: '#34d399', fontWeight: '700' }}>
            👥 Demo: Batch Comparisons ({countLabel})
          </button>
        </div>
      </div>

      {/* Evaluation Mode Toggle Tabs with Synchronized Entry Count */}
      <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '32px' }}>
        <div className="tabs-container" style={{ background: 'rgba(255,255,255,0.03)', padding: '6px', borderRadius: '14px', border: '1px solid var(--border-glass)' }}>
          <button
            type="button"
            className={`tab-btn ${evalMode === 'single' ? 'active' : ''}`}
            onClick={handleSwitchToSingleMode}
            style={{ padding: '10px 26px', fontSize: '15px', fontWeight: '700', borderRadius: '10px', background: evalMode === 'single' ? 'var(--accent-gradient)' : 'transparent', color: evalMode === 'single' ? '#fff' : 'var(--text-sub)' }}
          >
            👤 Single Candidate Mode
          </button>
          <button
            type="button"
            className={`tab-btn ${evalMode === 'batch' ? 'active' : ''}`}
            onClick={handleSwitchToBatchMode}
            style={{ padding: '10px 26px', fontSize: '15px', fontWeight: '700', borderRadius: '10px', background: evalMode === 'batch' ? 'var(--accent-gradient)' : 'transparent', color: evalMode === 'batch' ? '#fff' : 'var(--text-sub)' }}
          >
            👥 Batch Multi-Resume ({countLabel})
          </button>
        </div>
      </div>

      {error && (
        <div style={{ background: 'rgba(244, 63, 94, 0.15)', border: '1px solid #f43f5e', padding: '16px 20px', borderRadius: '12px', color: '#fda4af', marginBottom: '25px', textAlign: 'center', fontWeight: '500' }}>
          ⚠️ {error}
        </div>
      )}

      <form onSubmit={handleAnalyze}>
        <div className="dashboard-grid">
          {/* Left Column: Candidate Resume(s) Input */}
          <div className="glass-card" style={{ display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
            {evalMode === 'single' ? (
              <div>
                <div className="responsive-header" style={{ marginBottom: '16px' }}>
                  <h3 style={{ fontSize: '22px' }}>📄 Candidate Resume</h3>
                  <div className="tabs-container" style={{ margin: 0, fontSize: '13px' }}>
                    <button type="button" className={`tab-btn ${inputMode === 'file' ? 'active' : ''}`} onClick={() => setInputMode('file')}>Upload File</button>
                    <button type="button" className={`tab-btn ${inputMode === 'link' ? 'active' : ''}`} onClick={() => setInputMode('link')}>URL Link</button>
                    <button type="button" className={`tab-btn ${inputMode === 'text' ? 'active' : ''}`} onClick={() => setInputMode('text')}>Text</button>
                  </div>
                </div>

                {inputMode === 'file' && (
                  <div className="dropzone" onDragOver={(e) => e.preventDefault()} onDrop={handleDrop} onClick={() => document.getElementById('file-upload').click()}>
                    <input id="file-upload" type="file" accept=".pdf,.doc,.docx,.txt" style={{ display: 'none' }} onChange={handleFileChange} />
                    <div style={{ fontSize: '38px', marginBottom: '10px' }}>📁</div>
                    {selectedFile ? (
                      <div>
                        <p style={{ color: 'var(--success)', fontWeight: '600', fontSize: '16px' }}>✓ Selected: {selectedFile.name}</p>
                        {selectedFile.size && <span style={{ fontSize: '13px', color: 'var(--text-muted)' }}>({(selectedFile.size / 1024).toFixed(1)} KB)</span>}
                      </div>
                    ) : (
                      <div>
                        <p style={{ color: 'var(--text-main)', fontWeight: '600' }}>Click to select or drop resume document here</p>
                        <p style={{ fontSize: '13px', color: 'var(--text-muted)' }}>Supports PDF, Word (DOCX), and Text formats (Max 15MB)</p>
                      </div>
                    )}
                  </div>
                )}

                {inputMode === 'link' && (
                  <div>
                    <label style={{ fontSize: '14px', color: 'var(--text-sub)' }}>Public Resume URL (e.g. Google Drive / GitHub / Portfolio Link)</label>
                    <input
                      type="url"
                      className="input-field"
                      placeholder="https://example.com/candidate_resume.pdf"
                      value={resumeUrl}
                      onChange={(e) => setResumeUrl(e.target.value)}
                      style={{ marginTop: '10px' }}
                    />
                  </div>
                )}

                {inputMode === 'text' && (
                  <div>
                    <label style={{ fontSize: '14px', color: 'var(--text-sub)' }}>Paste Resume Content</label>
                    <textarea
                      className="textarea-field"
                      placeholder="Paste complete candidate summary, skills, and experience here..."
                      value={resumeText}
                      onChange={(e) => setResumeText(e.target.value)}
                      style={{ minHeight: '230px', marginTop: '10px' }}
                    />
                  </div>
                )}

                <div style={{ marginTop: '24px', paddingTop: '20px', borderTop: '1px solid var(--border-glass)' }}>
                  <h4 style={{ fontSize: '15px', color: 'var(--text-sub)', marginBottom: '12px' }}>🛠️ Optional External Platform Overrides</h4>
                  <div className="grid-2-col">
                    <div>
                      <label style={{ fontSize: '12px', color: 'var(--text-muted)' }}>GitHub Username</label>
                      <input
                        type="text"
                        className="input-field"
                        placeholder="e.g. torvalds"
                        value={githubOverride}
                        onChange={(e) => setGithubOverride(e.target.value)}
                        style={{ padding: '10px 14px' }}
                      />
                    </div>
                    <div>
                      <label style={{ fontSize: '12px', color: 'var(--text-muted)' }}>LeetCode / Codeforces Handle</label>
                      <input
                        type="text"
                        className="input-field"
                        placeholder="e.g. neetcode"
                        value={leetcodeOverride}
                        onChange={(e) => setLeetcodeOverride(e.target.value)}
                        style={{ padding: '10px 14px' }}
                      />
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px', flexWrap: 'wrap', gap: '8px' }}>
                  <h3 style={{ fontSize: '22px' }}>👥 Multi-Candidate Resumes</h3>
                  <span style={{ fontSize: '13px', color: '#34d399', background: 'rgba(16,185,129,0.15)', padding: '4px 12px', borderRadius: '12px', fontWeight: '700', border: '1px solid rgba(16,185,129,0.3)' }}>
                    {countLabel}
                  </span>
                </div>
                <p style={{ fontSize: '13px', color: 'var(--text-sub)', marginBottom: '16px' }}>
                  Upload candidate resumes and enter their corresponding additional links. Add or delete entries below; counts stay automatically synchronized!
                </p>

                {/* Smart Bulk Paste URL Feature */}
                <div style={{ background: 'rgba(139, 92, 246, 0.08)', border: '1px solid rgba(139, 92, 246, 0.3)', borderRadius: '14px', padding: '16px', marginBottom: '20px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px', flexWrap: 'wrap', gap: '8px' }}>
                    <span style={{ fontSize: '15px', fontWeight: '700', color: '#f8fafc', display: 'flex', alignItems: 'center', gap: '6px' }}>
                      ⚡ Smart Bulk Paste Links
                    </span>
                    <span style={{ fontSize: '12px', color: '#c084fc' }}>
                      Auto-parse multiple resume URLs from any text block
                    </span>
                  </div>
                  <div style={{ display: 'flex', gap: '10px', flexDirection: 'column' }}>
                    <textarea
                      className="textarea-field"
                      placeholder="Paste an email, spreadsheet dump, or text block containing multiple links (e.g. https://drive.google.com/... https://github.com/...)..."
                      value={bulkPasteText}
                      onChange={(e) => {
                        setBulkPasteText(e.target.value);
                        if (bulkStatus?.type === 'error') setBulkStatus(null);
                      }}
                      style={{ minHeight: '68px', padding: '12px 14px', fontSize: '13px', background: 'rgba(15, 23, 42, 0.7)', border: '1px solid rgba(255,255,255,0.1)' }}
                    />
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '10px' }}>
                      {bulkStatus ? (
                        <span style={{ fontSize: '13px', fontWeight: '600', color: bulkStatus.type === 'success' ? '#34d399' : '#fb7185' }}>
                          {bulkStatus.message}
                        </span>
                      ) : (
                        <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
                          💡 Automatically extracts valid links and appends them to your candidate entries below
                        </span>
                      )}
                      <button
                        type="button"
                        className="btn-primary"
                        onClick={handleBulkParseAndPopulate}
                        style={{ padding: '8px 20px', fontSize: '13px', background: 'linear-gradient(135deg, #3b82f6 0%, #8b5cf6 100%)', boxShadow: '0 4px 15px rgba(59, 130, 246, 0.3)' }}
                      >
                        ✨ Extract & Populate
                      </button>
                    </div>
                  </div>
                </div>

                {candidates.length === 0 ? (
                  <div style={{ padding: '40px 20px', textAlign: 'center', background: 'rgba(255,255,255,0.015)', borderRadius: '14px', border: '1px dashed var(--border-glass)', color: 'var(--text-muted)', marginBottom: '20px' }}>
                    <div style={{ fontSize: '36px', marginBottom: '12px' }}>📭</div>
                    <p style={{ fontSize: '15px', fontWeight: '600', color: '#cbd5e1' }}>0 Resume Entries Entered</p>
                    <p style={{ fontSize: '13px', marginTop: '6px' }}>You have deleted all candidate entries. Click the button below to add an entry or click "Demo: Batch Comparisons" above!</p>
                  </div>
                ) : (
                  <div style={{ maxHeight: '600px', overflowY: 'auto', paddingRight: '6px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
                    {candidates.map((cand, index) => (
                      <div key={cand.id} style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid var(--border-glass)', borderRadius: '14px', padding: '16px', position: 'relative', boxShadow: '0 4px 15px rgba(0,0,0,0.1)' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px', borderBottom: '1px solid rgba(255,255,255,0.06)', paddingBottom: '10px' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                            <span style={{ fontWeight: '800', color: '#38bdf8', fontSize: '14px', background: 'rgba(56, 189, 248, 0.1)', padding: '2px 8px', borderRadius: '6px' }}>{cand.id}</span>
                            <span style={{ fontSize: '14px', color: '#f8fafc', fontWeight: '700' }}>Candidate #{index + 1} {cand.nameHint && `— ${cand.nameHint}` || (cand.file && `— ${cand.file.name}`)}</span>
                          </div>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <div className="tabs-container" style={{ margin: 0, fontSize: '11px', padding: '2px' }}>
                              <button type="button" className={`tab-btn ${cand.mode === 'file' ? 'active' : ''}`} onClick={() => handleCandidateChange(index, 'mode', 'file')} style={{ padding: '4px 8px', fontSize: '11px' }}>File</button>
                              <button type="button" className={`tab-btn ${cand.mode === 'link' ? 'active' : ''}`} onClick={() => handleCandidateChange(index, 'mode', 'link')} style={{ padding: '4px 8px', fontSize: '11px' }}>URL</button>
                              <button type="button" className={`tab-btn ${cand.mode === 'text' ? 'active' : ''}`} onClick={() => handleCandidateChange(index, 'mode', 'text')} style={{ padding: '4px 8px', fontSize: '11px' }}>Text</button>
                            </div>
                            <button type="button" onClick={() => handleRemoveCandidate(index)} style={{ background: 'rgba(244, 63, 94, 0.15)', color: '#fb7185', border: '1px solid rgba(244, 63, 94, 0.3)', borderRadius: '6px', padding: '4px 8px', cursor: 'pointer', fontSize: '12px', fontWeight: '700' }} title="Delete Candidate Entry">
                              🗑️
                            </button>
                          </div>
                        </div>

                        {cand.mode === 'file' && (
                          <div className="dropzone" style={{ padding: '16px', minHeight: '80px', cursor: 'pointer' }} onClick={() => document.getElementById(`file-upload-${index}`).click()}>
                            <input id={`file-upload-${index}`} type="file" accept=".pdf,.doc,.docx,.txt" style={{ display: 'none' }} onChange={(e) => {
                              if (e.target.files && e.target.files[0]) {
                                handleCandidateChange(index, 'file', e.target.files[0]);
                              }
                            }} />
                            {cand.file ? (
                              <p style={{ color: 'var(--success)', fontWeight: '600', margin: 0 }}>✓ File: {cand.file.name} {cand.file.size && `(${(cand.file.size/1024).toFixed(1)} KB)`}</p>
                            ) : (
                              <p style={{ color: 'var(--text-main)', margin: 0, fontSize: '13px' }}>📁 Click to select candidate PDF or Word resume file</p>
                            )}
                          </div>
                        )}

                        {cand.mode === 'link' && (
                          <input
                            type="url"
                            className="input-field"
                            placeholder="https://example.com/candidate_resume.pdf"
                            value={cand.url || ''}
                            onChange={(e) => handleCandidateChange(index, 'url', e.target.value)}
                            style={{ fontSize: '13px', padding: '10px 12px' }}
                          />
                        )}

                        {cand.mode === 'text' && (
                          <textarea
                            className="textarea-field"
                            placeholder="Paste complete candidate resume text..."
                            value={cand.text || ''}
                            onChange={(e) => handleCandidateChange(index, 'text', e.target.value)}
                            style={{ minHeight: '90px', fontSize: '13px', padding: '10px 12px' }}
                          />
                        )}

                        <div style={{ marginTop: '12px', paddingTop: '10px', borderTop: '1px dashed rgba(255,255,255,0.08)' }}>
                          <span style={{ fontSize: '12px', color: 'var(--text-muted)', display: 'block', marginBottom: '6px' }}>🔗 Corresponding Additional Profile Links:</span>
                          <div className="grid-2-col" style={{ gap: '8px' }}>
                            <input
                              type="text"
                              className="input-field"
                              placeholder="GitHub Username"
                              value={cand.github || ''}
                              onChange={(e) => handleCandidateChange(index, 'github', e.target.value)}
                              style={{ padding: '8px 12px', fontSize: '12px' }}
                            />
                            <input
                              type="text"
                              className="input-field"
                              placeholder="LeetCode / Coding Platform Handle"
                              value={cand.leetcode || ''}
                              onChange={(e) => handleCandidateChange(index, 'leetcode', e.target.value)}
                              style={{ padding: '8px 12px', fontSize: '12px' }}
                            />
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                <div style={{ marginTop: '20px' }}>
                  <button type="button" className="btn-secondary" onClick={handleAddCandidate} style={{ width: '100%', padding: '12px', border: '1px dashed #38bdf8', color: '#38bdf8', fontWeight: '700', borderRadius: '10px' }}>
                    + Add Another Candidate Resume Entry
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Right Column: Target Job Description */}
          <div className="glass-card" style={{ display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
            <div>
              <h3 style={{ fontSize: '22px', marginBottom: '16px' }}>🎯 Target Job Description</h3>
              <p style={{ color: 'var(--text-muted)', fontSize: '14px', marginBottom: '12px' }}>
                Paste the target job description below. The AI will extract core competencies and check if candidate(s) have verified implementations and semantic skill alignment.
              </p>
              <textarea
                className="textarea-field"
                placeholder="Paste responsibilities, required programming languages, frameworks, and qualifications..."
                value={jobDescription}
                onChange={(e) => setJobDescription(e.target.value)}
                style={{ height: evalMode === 'batch' ? '540px' : '310px', transition: 'height 0.3s ease' }}
              />
            </div>

            <div style={{ marginTop: '26px', textAlign: 'right' }}>
              <button type="submit" className="btn-primary" style={{ width: '100%', padding: '16px', fontSize: '17px', background: evalMode === 'batch' ? 'linear-gradient(135deg, #10b981, #059669)' : undefined }}>
                {evalMode === 'batch' ? `⚡ Score & Deep Verify ${enteredCount} ${enteredCount === 1 ? 'Candidate Entry' : 'Candidate Entries'} in Table` : '⚡ Run Deep Verification & AI Scoring'}
              </button>
            </div>
          </div>
        </div>
      </form>
    </div>
  );
}
