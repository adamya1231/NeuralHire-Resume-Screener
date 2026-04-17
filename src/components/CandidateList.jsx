import React, { useState } from 'react';

const getScoreColor = (score) => {
  if (score >= 80) return { color: '#10b981', glow: 'rgba(16,185,129,0.3)', label: 'Excellent' };
  if (score >= 65) return { color: '#06b6d4', glow: 'rgba(6,182,212,0.3)', label: 'Good' };
  if (score >= 50) return { color: '#f59e0b', glow: 'rgba(245,158,11,0.3)', label: 'Average' };
  return { color: '#f87171', glow: 'rgba(248,113,113,0.3)', label: 'Low' };
};

const CandidateList = ({ candidatesData, onClearAll, onDelete, isWorkspaceActive, activeWorkspace, session, onCandidateUpdate }) => {
  const [expandedId, setExpandedId]   = useState(null);
  const [activeTab, setActiveTab]      = useState('shortlisted');
  // Interview state
  const [interviewModal, setInterviewModal] = useState(null);
  const [sendingId, setSendingId]      = useState(null);
  const [sentIds, setSentIds]          = useState({});
  // Manual shortlist state
  const [shortlistingId, setShortlistingId] = useState(null);
  const [overrides, setOverrides]      = useState({}); // { candidateId: 'SHORTLIST' | 'REVIEW' }

  if (!candidatesData || candidatesData.length === 0) {
    return (
      <div className="empty-state animate-fade-in">
        <div className="empty-icon">
          <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="url(#emptyGrad)" strokeWidth="1" strokeLinecap="round" strokeLinejoin="round">
            <defs>
              <linearGradient id="emptyGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#6366f1"/>
                <stop offset="100%" stopColor="#22d3ee"/>
              </linearGradient>
            </defs>
            <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/>
            <circle cx="9" cy="7" r="4"/>
            <path d="M23 21v-2a4 4 0 0 0-3-3.87"/>
            <path d="M16 3.13a4 4 0 0 1 0 7.75"/>
          </svg>
        </div>
        <h3 style={{ color: 'var(--text-primary)', fontWeight: 600 }}>No candidates yet</h3>
        <p>Upload resumes to see intelligent AI matching results here.</p>
      </div>
    );
  }

  const toggleExpand = (id) => setExpandedId(prev => prev === id ? null : id);

  const shortlistCandidate = async (result) => {
    setShortlistingId(result.id);
    try {
      const res = await fetch(`${import.meta.env.VITE_API_URL}/api/candidates/${result.id}/recommendation`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${session?.access_token}` },
        body: JSON.stringify({ recommendation: 'SHORTLIST' }),
      });
      if (res.ok) {
        setOverrides(prev => ({ ...prev, [result.id]: 'SHORTLIST' }));
        if (onCandidateUpdate) onCandidateUpdate(result.id, 'SHORTLIST');
      }
    } catch (e) {
      alert('Could not update candidate.');
    } finally {
      setShortlistingId(null);
    }
  };


  const sendInterview = async (result) => {
    if (!activeWorkspace) return;
    setSendingId(result.id);
    try {
      const res = await fetch(`${import.meta.env.VITE_API_URL}/api/interviews/create`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session?.access_token}`,
        },
        body: JSON.stringify({
          workspace_id:    activeWorkspace.id,
          candidate_id:    result.id,
          candidate_email: result.email || '',
          candidate_name:  result.candidate?.name || 'Candidate',
          job_description: activeWorkspace.description || '',
          job_title:       activeWorkspace.title || 'the role',
        }),
      });
      const data = await res.json();
      if (data.success) {
        setSentIds(prev => ({ ...prev, [result.id]: { token: data.interview_token, link: data.interview_link, emailSent: data.email_sent } }));
        setInterviewModal({ link: data.interview_link, emailSent: data.email_sent, candidateEmail: data.candidate_email, candidateName: result.candidate?.name });
      } else {
        alert('Failed to create interview: ' + (data.error || 'Unknown error'));
      }
    } catch (e) {
      alert('Could not connect to backend.');
    } finally {
      setSendingId(null);
    }
  };



  const buildGrid = (list, sectionLabel) => (
    <div className="candidates-grid">
      {list.map((result, index) => {
        const isExpanded = expandedId === result.id;
        const sc = getScoreColor(result.overall_score);
        const expYears = result.experience_years?.toString().replace(/years?|yrs?/gi, '').trim() || '?';

        return (
          <div
            className={`candidate-card ${isExpanded ? 'expanded' : ''}`}
            key={result.id || index}
            style={{ animationDelay: `${0.1 + index * 0.08}s` }}
          >
            {/* Top score bar */}
            <div className="score-bar" style={{ background: `linear-gradient(90deg, ${sc.color}, transparent)`, boxShadow: `0 0 20px ${sc.glow}` }} />

            {/* ── Card Header ── */}
            <div className="card-header">
              <div className="avatar-ring" style={{ '--ring-color': sc.color }}>
                <div className="avatar">{result.candidate?.name?.charAt(0)?.toUpperCase() || 'U'}</div>
              </div>
              <div className="info">
                <div className="name-row">
                  <h3>{result.candidate?.name || 'Unknown Candidate'}</h3>
                  <button
                    onClick={() => onDelete(result.id)}
                    title="Delete Candidate"
                    className="delete-btn"
                  >
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/>
                    </svg>
                  </button>
                </div>
                <p className="candidate-meta">
                  {result.candidate?.role || 'Applicant'}
                  {expYears !== '?' && <span> • {expYears} yrs exp</span>}
                </p>
                <div className="rec-badge" style={{ background: `${sc.color}18`, color: sc.color, border: `1px solid ${sc.color}35` }}>
                  {result.recommendation || result.match_category || sectionLabel}
                </div>
              </div>
              <div className="score-circle" style={{ '--sc': sc.color, '--progress': `${result.overall_score * 3.6}deg` }}>
                <div className="score-inner">
                  <span className="score-num">{result.overall_score}</span>
                  <span className="score-sub">{sc.label}</span>
                </div>
              </div>
            </div>

            {/* ── Body ── */}
            <div className="card-body">
              <div className="metrics-row">
                <div className="metric-chip">
                  <span className="metric-lbl">Tech Fit</span>
                  <span className="metric-val">{result.match_details?.technical_fit || 'N/A'}</span>
                </div>
                <div className="metric-chip">
                  <span className="metric-lbl">Exp Fit</span>
                  <span className="metric-val">{result.match_details?.experience_fit || 'N/A'}</span>
                </div>
              </div>

              {/* Expanded drawer */}
              {isExpanded && (
                <div className="expanded-drawer animate-fade-in">
                  {result.top_strengths?.length > 0 && (
                    <div className="section-block">
                      <div className="section-title"><span className="section-dot success" />Top Strengths</div>
                      <ul className="findings-list">
                        {result.top_strengths.map((s, i) => <li key={i}>{s}</li>)}
                      </ul>
                    </div>
                  )}

                  {result.skill_gaps?.length > 0 && (
                    <div className="section-block">
                      <div className="section-title"><span className="section-dot warning" />Skill Gaps</div>
                      <ul className="findings-list warning-list">
                        {result.skill_gaps.map((g, i) => <li key={i}>{g}</li>)}
                      </ul>
                    </div>
                  )}

                  {result.suggested_interview_questions?.length > 0 && (
                    <div className="section-block">
                      <div className="section-title"><span className="section-dot accent" />Interview Questions</div>
                      <ul className="findings-list accent-list">
                        {result.suggested_interview_questions.map((q, i) => <li key={i}>{q}</li>)}
                      </ul>
                    </div>
                  )}

                  {result.red_flags?.length > 0 && (
                    <div className="section-block">
                      <div className="section-title danger-title">
                        <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/></svg>
                        Red Flags
                      </div>
                      <div className="red-flags-list">
                        {result.red_flags.map((flag, i) => (
                          <div className="red-flag-tag" key={i}>{flag}</div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* Bias chip */}
              <div className="bias-chip">
                <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                  <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/>
                  <polyline points="22 4 12 14.01 9 11.01"/>
                </svg>
                Bias-Free Evaluation Applied
              </div>
            </div>

            {/* ── Actions ── */}
            <div className="card-actions">
              <button
                className={`btn-primary view-btn ${isExpanded ? 'active-report' : ''}`}
                onClick={() => toggleExpand(result.id)}
              >
                {isExpanded ? (
                  <>
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><polyline points="18 15 12 9 6 15"/></svg>
                    Hide Report
                  </>
                ) : (
                  <>
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><polyline points="6 9 12 15 18 9"/></svg>
                    Full Report
                  </>
                )}
              </button>
              {/* Send AI Interview — for SHORTLIST or manually overridden */}
              {((overrides[result.id] || result.recommendation) === 'SHORTLIST' || result.match_category === 'High Match') && activeWorkspace && (
                sentIds[result.id] ? (
                  <span style={{ fontSize: '0.72rem', color: '#10b981', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '0.3rem' }}>✓ Interview Sent</span>
                ) : (
                  <button
                    className="btn-secondary"
                    disabled={sendingId === result.id}
                    onClick={() => sendInterview(result)}
                    style={{ fontSize: '0.78rem', gap: '0.35rem', opacity: sendingId && sendingId !== result.id ? 0.5 : 1 }}
                  >
                    {sendingId === result.id ? '⏳ Generating…' : '🤖 Send AI Interview'}
                  </button>
                )
              )}
              {/* Shortlist button for review/reject candidates */}
              {(overrides[result.id] || result.recommendation) !== 'SHORTLIST' && result.match_category !== 'High Match' && (
                <button
                  className='btn-secondary'
                  disabled={shortlistingId === result.id}
                  onClick={() => shortlistCandidate(result)}
                  style={{ fontSize: '0.78rem', gap: '0.35rem', background: 'rgba(16,185,129,0.08)', borderColor: 'rgba(16,185,129,0.3)', color: '#10b981' }}
                >
                  {shortlistingId === result.id ? '⏳ Saving...' : '✓ Shortlist'}
                </button>
              )}
            </div>

          </div>
        );
      })}
    </div>
  );

  const shortlisted = candidatesData.filter(c => (overrides[c.id] || c.recommendation) === 'SHORTLIST' || c.match_category === 'High Match');
  const others = candidatesData.filter(c => (overrides[c.id] || c.recommendation) !== 'SHORTLIST' && c.match_category !== 'High Match');

  // Demo Interview: fake profile for testing the AI interviewer
  const DemoInterviewTab = () => (
    <div style={{ padding: '2rem', display: 'flex', flexDirection: 'column', gap: '1.5rem' }} className="animate-fade-in">
      <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
        <div style={{ fontSize: '2.5rem' }}>🤖</div>
        <div>
          <h3 style={{ color: 'var(--text-primary)', margin: 0 }}>AI Interview Demo</h3>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', margin: 0 }}>Test the interview experience using any fictional profile — no real candidate needed.</p>
        </div>
      </div>
      {activeWorkspace ? (
        <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
          {[
            { name: 'Alex Chen', email: 'alex@demo.com', role: 'Senior Dev (Demo)' },
            { name: 'Priya Sharma', email: 'priya@demo.com', role: 'Product Manager (Demo)' },
            { name: 'Marcus K.', email: 'marcus@demo.com', role: 'Data Analyst (Demo)' },
          ].map((profile, i) => (
            <div key={i} style={{ flex: '1 1 200px', background: 'rgba(99,102,241,0.06)', border: '1px solid var(--border-color)', borderRadius: '0.9rem', padding: '1.25rem', display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                <div style={{ width: '40px', height: '40px', borderRadius: '50%', background: 'linear-gradient(135deg, var(--accent-primary), var(--accent-tertiary))', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', fontWeight: 700 }}>{profile.name[0]}</div>
                <div>
                  <div style={{ fontWeight: 700, color: 'var(--text-primary)', fontSize: '0.9rem' }}>{profile.name}</div>
                  <div style={{ fontSize: '0.72rem', color: 'var(--text-secondary)' }}>{profile.role}</div>
                </div>
              </div>
              <DemoSendButton profile={profile} />
            </div>
          ))}
        </div>
      ) : (
        <div style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-secondary)', background: 'rgba(245,158,11,0.06)', border: '1px solid rgba(245,158,11,0.2)', borderRadius: '0.75rem' }}>
          ⚠️ Select an active campaign first to generate interview questions.
        </div>
      )}
    </div>
  );

  const DemoSendButton = ({ profile }) => {
    const [loading, setLoading] = useState(false);
    const [link, setLink] = useState(null);
    const [copied, setCopied] = useState(false);
    const send = async () => {
      if (!activeWorkspace) return;
      setLoading(true);
      try {
        const res = await fetch(`${import.meta.env.VITE_API_URL}/api/interviews/create`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${session?.access_token}` },
          body: JSON.stringify({ workspace_id: activeWorkspace.id, candidate_id: -1, candidate_name: profile.name, candidate_email: profile.email, job_description: activeWorkspace.description || '', job_title: activeWorkspace.title || 'Role' }),
        });
        const data = await res.json();
        if (data.interview_link) setLink(data.interview_link);
      } catch { alert('Error creating demo interview'); }
      finally { setLoading(false); }
    };
    const copy = () => { navigator.clipboard.writeText(link); setCopied(true); setTimeout(() => setCopied(false), 2000); };
    if (link) return (
      <div style={{ display: 'flex', gap: '0.5rem' }}>
        <input readOnly value={link} style={{ flex: 1, padding: '0.45rem 0.6rem', background: 'rgba(99,102,241,0.06)', border: '1px solid var(--border-color)', borderRadius: '0.5rem', color: 'var(--text-primary)', fontSize: '0.72rem', fontFamily: 'monospace' }} />
        <button onClick={copy} style={{ background: copied ? 'rgba(16,185,129,0.15)' : 'var(--accent-primary)', color: copied ? '#10b981' : 'white', border: 'none', borderRadius: '0.5rem', padding: '0 0.75rem', cursor: 'pointer', fontWeight: 700, fontSize: '0.75rem' }}>{copied ? '✓' : 'Copy'}</button>
        <a href={link} target="_blank" rel="noreferrer" style={{ background: 'rgba(34,211,238,0.1)', border: '1px solid rgba(34,211,238,0.3)', color: 'var(--accent-secondary)', borderRadius: '0.5rem', padding: '0.4rem 0.7rem', textDecoration: 'none', fontSize: '0.75rem', fontWeight: 700 }}>Open →</a>
      </div>
    );
    return <button onClick={send} disabled={loading} className="btn-secondary" style={{ fontSize: '0.8rem', justifyContent: 'center' }}>{loading ? '⏳ Generating...' : '🚀 Generate Demo Interview'}</button>;
  };

  return (
    <div className="candidates-container animate-fade-in" style={{ animationDelay: '0.2s' }}>
      {/* Interview Modal */}
      {interviewModal && <InterviewModal modal={interviewModal} onClose={() => setInterviewModal(null)} />}

      {/* Section header */}
      <div className="candidates-header">
        <div>
          <h2 className="heading-2">AI Ranked Results</h2>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.875rem', marginTop: '0.25rem' }}>
            {candidatesData.length} candidates analysed • {shortlisted.length} shortlisted
          </p>
        </div>
        <div className="header-actions">
          {isWorkspaceActive && candidatesData.length > 0 && (
            <button className="btn-secondary clear-btn" onClick={onClearAll}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/></svg>
              Clear All
            </button>
          )}
          <button className="btn-secondary">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>
            Export
          </button>
        </div>
      </div>

      <div className="tabs-container">
        <button className={`tab-btn ${activeTab === 'shortlisted' ? 'active-tab' : ''}`} onClick={() => setActiveTab('shortlisted')}>
          Shortlisted ({shortlisted.length})
        </button>
        <button className={`tab-btn ${activeTab === 'review' ? 'active-tab' : ''}`} onClick={() => setActiveTab('review')}>
          For Review ({others.length})
        </button>
        <button className={`tab-btn ${activeTab === 'demo' ? 'active-tab' : ''}`} onClick={() => setActiveTab('demo')} style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
          🤖 AI Interview Demo
        </button>
      </div>

      {activeTab === 'shortlisted' && shortlisted.length > 0 && (
        <div className="result-section animate-fade-in">
          {buildGrid(shortlisted, 'SHORTLIST')}
        </div>
      )}
      
      {activeTab === 'shortlisted' && shortlisted.length === 0 && (
        <div className="empty-state">
           <p>No candidates met the threshold to be shortlisted.</p>
        </div>
      )}

      {activeTab === 'review' && others.length > 0 && (
        <div className="result-section animate-fade-in">
          {buildGrid(others, 'REVIEW')}
        </div>
      )}
      
      {activeTab === 'review' && others.length === 0 && (
        <div className="empty-state">
           <p>No candidates in the review queue.</p>
        </div>
      )}

      {activeTab === 'demo' && <DemoInterviewTab />}

      <style>{`
        .empty-state {
          text-align: center;
          padding: 4rem 2rem;
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 0.75rem;
          color: var(--text-secondary);
        }
        .empty-icon {
          width: 80px; height: 80px;
          background: rgba(99,102,241,0.06);
          border: 1px solid rgba(99,102,241,0.15);
          border-radius: 1.5rem;
          display: flex; align-items: center; justify-content: center;
          margin-bottom: 0.5rem;
        }

        .candidates-container { display: flex; flex-direction: column; gap: 2.5rem; }

        .candidates-header {
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
          padding-bottom: 1.25rem;
          border-bottom: 1px solid var(--border-color);
        }

        .header-actions { display: flex; gap: 0.75rem; align-items: center; }

        .tabs-container {
          display: flex;
          gap: 1rem;
          margin-bottom: -1rem;
        }

        .tab-btn {
          background: transparent;
          border: none;
          color: var(--text-secondary);
          font-size: 0.95rem;
          font-weight: 600;
          padding: 0.5rem 0.25rem;
          cursor: pointer;
          position: relative;
          transition: color 0.3s ease;
        }

        .tab-btn:hover { color: var(--text-primary); }

        .tab-btn.active-tab { color: var(--accent-primary); }

        .tab-btn.active-tab::after {
          content: '';
          position: absolute;
          bottom: -4px; left: 0; right: 0;
          height: 3px;
          background: linear-gradient(90deg, var(--accent-primary), var(--accent-secondary));
          border-radius: 9999px;
        }

        .clear-btn {
          border-color: rgba(248,113,113,0.35);
          color: #f87171;
          display: flex;
          align-items: center;
          gap: 0.4rem;
          padding: 0.5rem 1rem;
          font-size: 0.85rem;
        }
        .clear-btn:hover {
          background: rgba(248,113,113,0.08);
          border-color: #f87171;
          color: #f87171;
        }

        .result-section { display: flex; flex-direction: column; gap: 1rem; }

        .section-label {
          display: inline-flex;
          align-items: center;
          gap: 0.5rem;
          font-size: 0.78rem;
          font-weight: 700;
          letter-spacing: 0.06em;
          text-transform: uppercase;
          padding: 0.35rem 0.9rem;
          border-radius: 9999px;
          width: fit-content;
        }

        .shortlist-label {
          background: rgba(16,185,129,0.1);
          color: #10b981;
          border: 1px solid rgba(16,185,129,0.25);
        }

        .review-label {
          background: rgba(245,158,11,0.08);
          color: #f59e0b;
          border: 1px solid rgba(245,158,11,0.2);
        }

        .candidates-grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(330px, 1fr));
          gap: 1.5rem;
        }

        /* ── Card ── */
        .candidate-card {
          background: var(--glass-bg);
          backdrop-filter: var(--glass-blur);
          border: 1px solid var(--glass-border);
          border-radius: 1.25rem;
          padding: 0 0 1.25rem 0;
          display: flex;
          flex-direction: column;
          gap: 1.1rem;
          overflow: hidden;
          animation: slideUp 0.6s ease forwards;
          opacity: 0;
          transition: all 0.35s cubic-bezier(0.4,0,0.2,1);
          position: relative;
        }

        .candidate-card:hover {
          transform: translateY(-4px);
          box-shadow: var(--shadow-lg);
          border-color: rgba(99,102,241,0.3);
        }

        .candidate-card.expanded {
          border-color: rgba(99,102,241,0.35);
          box-shadow: 0 12px 40px rgba(99,102,241,0.12);
        }

        /* Score bar top strip */
        .score-bar {
          height: 3px;
          width: 100%;
          flex-shrink: 0;
        }

        /* Avatar with gradient ring */
        .card-header {
          display: flex;
          align-items: flex-start;
          gap: 0.9rem;
          padding: 1.25rem 1.25rem 0;
        }

        .avatar-ring {
          position: relative;
          width: 52px; height: 52px;
          flex-shrink: 0;
          padding: 2px;
          background: conic-gradient(var(--ring-color), rgba(99,102,241,0.3), var(--ring-color));
          border-radius: 50%;
          animation: spin 8s linear infinite;
        }

        .avatar {
          width: 100%; height: 100%;
          border-radius: 50%;
          background: linear-gradient(135deg, var(--accent-primary), var(--accent-tertiary));
          color: white;
          display: flex; align-items: center; justify-content: center;
          font-size: 1.15rem;
          font-weight: 700;
          position: relative;
          z-index: 1;
          background-clip: padding-box;
          /* stop inner from spinning */
          animation: spin 8s linear infinite reverse;
        }

        .info { flex: 1; min-width: 0; }

        .name-row {
          display: flex;
          align-items: flex-start;
          justify-content: space-between;
          gap: 0.5rem;
        }

        .name-row h3 {
          font-size: 1rem;
          font-weight: 700;
          color: var(--text-primary);
          line-height: 1.2;
          overflow: hidden;
          text-overflow: ellipsis;
          white-space: nowrap;
        }

        .candidate-meta {
          font-size: 0.8rem;
          color: var(--text-secondary);
          margin-top: 0.2rem;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }

        .rec-badge {
          display: inline-block;
          margin-top: 0.4rem;
          font-size: 0.67rem;
          font-weight: 700;
          letter-spacing: 0.06em;
          padding: 0.2rem 0.55rem;
          border-radius: 9999px;
          text-transform: uppercase;
        }

        .delete-btn {
          background: transparent;
          border: 1px solid transparent;
          color: var(--text-secondary);
          padding: 0.25rem;
          border-radius: 0.4rem;
          flex-shrink: 0;
          transition: all 0.2s ease;
          display: flex;
          align-items: center; justify-content: center;
        }

        .delete-btn:hover {
          color: #f87171;
          border-color: rgba(248,113,113,0.35);
          background: rgba(248,113,113,0.08);
        }

        /* Score circle */
        .score-circle {
          width: 60px; height: 60px;
          border-radius: 50%;
          background: conic-gradient(var(--sc) var(--progress), rgba(99,102,241,0.08) 0deg);
          display: flex; align-items: center; justify-content: center;
          flex-shrink: 0;
          position: relative;
        }

        .score-circle::before {
          content: '';
          position: absolute;
          inset: 5px;
          background: var(--surface-color);
          border-radius: 50%;
        }

        .score-inner {
          position: relative; z-index: 1;
          text-align: center;
          line-height: 1;
        }

        .score-num {
          display: block;
          font-size: 1rem;
          font-weight: 700;
          color: var(--sc);
        }

        .score-sub {
          font-size: 0.5rem;
          color: var(--text-secondary);
          font-weight: 500;
          letter-spacing: 0.03em;
          text-transform: uppercase;
        }

        /* Card body */
        .card-body {
          padding: 0 1.25rem;
          display: flex;
          flex-direction: column;
          gap: 0.85rem;
        }

        .metrics-row {
          display: flex;
          gap: 0.75rem;
        }

        .metric-chip {
          flex: 1;
          background: rgba(99,102,241,0.06);
          border: 1px solid rgba(99,102,241,0.12);
          border-radius: 0.65rem;
          padding: 0.5rem 0.75rem;
          display: flex;
          flex-direction: column;
          gap: 0.1rem;
        }

        .metric-lbl {
          font-size: 0.65rem;
          font-weight: 600;
          text-transform: uppercase;
          letter-spacing: 0.05em;
          color: var(--text-secondary);
        }

        .metric-val {
          font-size: 0.88rem;
          font-weight: 700;
          color: var(--accent-primary);
        }

        /* Expanded drawer */
        .expanded-drawer {
          display: flex;
          flex-direction: column;
          gap: 1rem;
          padding-top: 0.25rem;
          border-top: 1px solid var(--border-color);
          padding-top: 0.85rem;
        }

        .section-block { display: flex; flex-direction: column; gap: 0.4rem; }

        .section-title {
          display: flex;
          align-items: center;
          gap: 0.4rem;
          font-size: 0.73rem;
          font-weight: 700;
          text-transform: uppercase;
          letter-spacing: 0.06em;
          color: var(--text-secondary);
        }

        .section-dot {
          width: 7px; height: 7px;
          border-radius: 50%;
          flex-shrink: 0;
        }
        .section-dot.success { background: #10b981; box-shadow: 0 0 6px rgba(16,185,129,0.5); }
        .section-dot.warning { background: #f59e0b; box-shadow: 0 0 6px rgba(245,158,11,0.5); }
        .section-dot.accent  { background: var(--accent-secondary); box-shadow: 0 0 6px rgba(34,211,238,0.5); }

        .danger-title { color: #f87171; }

        .findings-list {
          margin: 0;
          padding-left: 1.1rem;
          color: var(--text-secondary);
          font-size: 0.82rem;
          line-height: 1.55;
        }

        .warning-list { color: #fbbf24; }
        .accent-list  { color: var(--accent-secondary); }

        .red-flags-list { display: flex; flex-direction: column; gap: 0.4rem; }

        .red-flag-tag {
          background: rgba(248,113,113,0.08);
          border: 1px solid rgba(248,113,113,0.2);
          color: #fca5a5;
          padding: 0.45rem 0.8rem;
          border-radius: 0.6rem;
          font-size: 0.78rem;
          line-height: 1.4;
        }

        /* Bias chip */
        .bias-chip {
          display: inline-flex;
          align-items: center;
          gap: 0.4rem;
          font-size: 0.7rem;
          font-weight: 600;
          color: var(--success-color);
          background: rgba(16,185,129,0.07);
          border: 1px solid rgba(16,185,129,0.18);
          padding: 0.3rem 0.6rem;
          border-radius: 9999px;
          width: fit-content;
        }

        /* Actions */
        .card-actions {
          padding: 0 1.25rem;
        }

        .view-btn {
          width: 100%;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 0.4rem;
          padding: 0.65rem;
          font-size: 0.88rem;
          border-radius: 0.75rem;
          transition: all 0.25s ease;
        }

        .view-btn.active-report {
          background: var(--surface-color);
          border: 1px solid var(--accent-primary);
          color: var(--accent-primary);
          box-shadow: 0 0 16px rgba(99,102,241,0.12);
        }
      `}</style>
    </div>
  );
};

export default CandidateList;
