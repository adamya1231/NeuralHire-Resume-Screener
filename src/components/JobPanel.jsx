import React, { useState } from 'react';

const ROLE_TAGS = ['React', 'Python', 'Node.js', 'ML', 'Docker', 'AWS', 'SQL', 'TypeScript'];

const JobPanel = ({ onWorkspaceCreated, session }) => {
  const [jobTitle, setJobTitle] = useState('');
  const [jobDesc, setJobDesc] = useState('');
  const [minScore, setMinScore] = useState(75);
  const [isCreating, setIsCreating] = useState(false);

  const handleCreate = async () => {
    if (!jobDesc || !jobTitle) {
      alert("Please enter a job title and description first.");
      return;
    }
    setIsCreating(true);
    try {
      const response = await fetch(`${import.meta.env.VITE_API_URL}/api/workspaces`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session?.access_token}`
        },
        body: JSON.stringify({ title: jobTitle.trim(), description: jobDesc, min_score: parseInt(minScore, 10) })
      });
      const data = await response.json();
      if (data.workspace_id) {
        onWorkspaceCreated({ id: data.workspace_id, public_token: data.public_token, title: data.title, description: data.description, min_score: data.min_score });
        setJobDesc('');
        setJobTitle('');
      }
    } catch (e) {
      alert("Failed to connect to backend Database.");
    } finally {
      setIsCreating(false);
    }
  };

  const addTag = (tag) => {
    if (!jobDesc.includes(tag)) setJobDesc(prev => prev + (prev ? ', ' : '') + tag);
  };

  const scoreColor = minScore >= 80 ? '#10b981' : minScore >= 65 ? '#06b6d4' : '#f59e0b';

  return (
    <div className="job-panel animate-slide-up">
      {/* Header with gradient icon */}
      <div className="jp-header">
        <div className="jp-icon">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="url(#jpGrad)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <defs>
              <linearGradient id="jpGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#6366f1"/>
                <stop offset="100%" stopColor="#22d3ee"/>
              </linearGradient>
            </defs>
            <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
            <polyline points="14 2 14 8 20 8"/>
            <line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/>
          </svg>
        </div>
        <div>
          <h2 className="jp-title">New Hiring Campaign</h2>
          <p className="jp-sub">Configure and launch an AI-powered screen</p>
        </div>
      </div>

      {/* Job Title */}
      <div className="input-group">
        <label className="field-label">Job Title</label>
        <input
          type="text"
          list="job-titles"
          placeholder="e.g. Senior ML Engineer..."
          value={jobTitle}
          onChange={(e) => setJobTitle(e.target.value)}
          className="styled-input"
        />
        <datalist id="job-titles">
          <option value="Senior Software Engineer - Frontend"/>
          <option value="Senior Backend Engineer"/>
          <option value="Junior ML Engineer"/>
          <option value="Senior ML Engineer"/>
          <option value="Full Stack Developer"/>
          <option value="DevOps Engineer"/>
          <option value="Data Scientist"/>
        </datalist>
      </div>

      {/* Quick tags */}
      <div className="quick-tags">
        {ROLE_TAGS.map(tag => (
          <button key={tag} className="quick-tag" onClick={() => addTag(tag)}>{tag}</button>
        ))}
      </div>

      {/* Job Description */}
      <div className="input-group">
        <label className="field-label">Job Description & Requirements</label>
        <textarea
          value={jobDesc}
          onChange={(e) => setJobDesc(e.target.value)}
          className="styled-input styled-textarea"
          rows="5"
          placeholder="Paste the full job description, skills required..."
        />
      </div>

      {/* Threshold slider */}
      <div className="input-group">
        <div className="threshold-header">
          <label className="field-label">Minimum Match Score</label>
          <span className="score-badge" style={{ color: scoreColor, borderColor: `${scoreColor}35`, background: `${scoreColor}12` }}>
            {minScore}
          </span>
        </div>
        <div className="slider-row">
          <input
            type="range" min="50" max="100" step="1"
            value={minScore}
            onChange={(e) => setMinScore(e.target.value)}
            className="styled-range"
            style={{ '--thumb-color': scoreColor, flex: 1 }}
          />
          <input
            type="number" min="50" max="100"
            value={minScore}
            onChange={(e) => setMinScore(Math.max(50, Math.min(100, Number(e.target.value))))}
            className="styled-input score-num-input"
            style={{ '--border-focus': scoreColor }}
          />
        </div>
        <p className="field-hint">Resumes scoring below this threshold are auto-rejected.</p>
      </div>

      <button className="btn-primary create-btn" onClick={handleCreate} disabled={isCreating}>
        {isCreating ? (
          <><div className="btn-spinner" />Launching Campaign...</>
        ) : (
          <>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M12 5v14M5 12l7 7 7-7"/></svg>
            Create Campaign Workspace
          </>
        )}
      </button>

      <style>{`
        .job-panel {
          display: flex;
          flex-direction: column;
          gap: 1.35rem;
          background: var(--glass-bg);
          backdrop-filter: var(--glass-blur);
          padding: 1.75rem;
          border-radius: 1.25rem;
          border: 1px solid var(--glass-border);
          box-shadow: var(--shadow-md);
          height: 100%;
        }

        .jp-header {
          display: flex;
          align-items: flex-start;
          gap: 0.85rem;
          padding-bottom: 1.1rem;
          border-bottom: 1px solid var(--border-color);
        }

        .jp-icon {
          width: 42px; height: 42px;
          background: linear-gradient(135deg, rgba(99,102,241,0.12), rgba(34,211,238,0.12));
          border: 1px solid rgba(99,102,241,0.2);
          border-radius: 0.75rem;
          display: flex; align-items: center; justify-content: center;
          flex-shrink: 0;
        }

        .jp-title {
          font-size: 1rem;
          font-weight: 700;
          color: var(--text-primary);
          line-height: 1;
          margin-bottom: 0.25rem;
        }

        .jp-sub {
          font-size: 0.75rem;
          color: var(--text-secondary);
        }

        .input-group {
          display: flex;
          flex-direction: column;
          gap: 0.5rem;
        }

        .field-label {
          font-size: 0.78rem;
          font-weight: 600;
          color: var(--text-secondary);
          text-transform: uppercase;
          letter-spacing: 0.05em;
        }

        .styled-input {
          background: rgba(99,102,241,0.04);
          border: 1px solid var(--border-color);
          color: var(--text-primary);
          padding: 0.7rem 1rem;
          border-radius: 0.65rem;
          font-family: inherit;
          font-size: 0.92rem;
          transition: border-color 0.2s, box-shadow 0.2s;
          width: 100%;
          box-sizing: border-box;
        }

        .styled-input:focus {
          outline: none;
          border-color: var(--accent-primary);
          box-shadow: 0 0 0 3px rgba(99,102,241,0.15);
          background: rgba(99,102,241,0.06);
        }

        .styled-textarea { resize: vertical; line-height: 1.6; min-height: 110px; }

        /* Quick tags */
        .quick-tags {
          display: flex;
          flex-wrap: wrap;
          gap: 0.4rem;
        }

        .quick-tag {
          font-size: 0.72rem;
          font-weight: 600;
          padding: 0.2rem 0.65rem;
          border-radius: 9999px;
          background: rgba(99,102,241,0.07);
          border: 1px solid rgba(99,102,241,0.18);
          color: var(--accent-primary);
          font-family: inherit;
          transition: all 0.2s ease;
        }

        .quick-tag:hover {
          background: rgba(99,102,241,0.15);
          border-color: var(--accent-primary);
        }

        /* Threshold */
        .threshold-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
        }

        .score-badge {
          font-size: 1rem;
          font-weight: 800;
          padding: 0.1rem 0.65rem;
          border-radius: 9999px;
          border: 1px solid;
          min-width: 44px;
          text-align: center;
        }

        .slider-row {
          display: flex;
          align-items: center;
          gap: 0.75rem;
        }

        .styled-range {
          -webkit-appearance: none;
          height: 5px;
          border-radius: 9999px;
          background: linear-gradient(90deg, var(--accent-primary, #6366f1) 0%, var(--accent-primary, #6366f1) calc(var(--val, 50) * 1%), rgba(99,102,241,0.12) calc(var(--val, 50) * 1%));
          accent-color: var(--thumb-color, var(--accent-primary));
          cursor: pointer;
        }

        .score-num-input {
          width: 68px;
          padding: 0.45rem 0.5rem;
          text-align: center;
          font-weight: 700;
          font-size: 0.92rem;
          flex-shrink: 0;
        }

        .field-hint {
          font-size: 0.72rem;
          color: var(--text-secondary);
          line-height: 1.4;
        }

        /* Create button */
        .create-btn {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 0.5rem;
          width: 100%;
          padding: 0.85rem;
          font-size: 0.95rem;
          margin-top: auto;
        }

        .create-btn:disabled { opacity: 0.65; cursor: not-allowed; }

        .btn-spinner {
          width: 16px; height: 16px;
          border: 2.5px solid rgba(255,255,255,0.2);
          border-top-color: white;
          border-radius: 50%;
          animation: spin 0.7s linear infinite;
        }
      `}</style>
    </div>
  );
};

export default JobPanel;
