import React, { useState, useEffect, useRef } from 'react';

/* ─── Frequency Polygon SVG Chart ─────────────────────────────────── */
const FrequencyPolygonChart = ({ interviews }) => {
  const completed = interviews.filter(i => i.status === 'completed' && i.overall_score != null);

  // 10 bins: 0-10, 10-20, ..., 90-100
  const bins = Array.from({ length: 10 }, (_, i) => ({
    label: `${i * 10}–${(i + 1) * 10}`,
    min: i * 10, max: (i + 1) * 10, count: 0,
  }));
  bins[9].max = 101;
  completed.forEach(iv => {
    const b = bins.find(b => iv.overall_score >= b.min && iv.overall_score < b.max);
    if (b) b.count++;
  });

  const W = 560, H = 200, PL = 38, PR = 16, PT = 16, PB = 54;
  const cW = W - PL - PR, cH = H - PT - PB;
  const maxCount = Math.max(...bins.map(b => b.count), 1);

  const pts = bins.map((b, i) => ({
    x: PL + (i / (bins.length - 1)) * cW,
    y: PT + cH - (b.count / maxCount) * cH,
    ...b,
  }));

  const fillPath =
    pts.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x} ${p.y}`).join(' ') +
    ` L ${pts[pts.length - 1].x} ${PT + cH} L ${pts[0].x} ${PT + cH} Z`;

  const linePath = pts.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x} ${p.y}`).join(' ');

  const yLabels = [0, Math.ceil(maxCount / 2), maxCount].filter((v, i, arr) => arr.indexOf(v) === i);

  return (
    <svg viewBox={`0 0 ${W} ${H}`} style={{ width: '100%', height: 'auto' }}>
      <defs>
        <linearGradient id="polyLine" x1="0%" y1="0%" x2="100%" y2="0%">
          <stop offset="0%" stopColor="#6366f1" />
          <stop offset="100%" stopColor="#22d3ee" />
        </linearGradient>
        <linearGradient id="polyFill" x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stopColor="rgba(99,102,241,0.25)" />
          <stop offset="100%" stopColor="rgba(99,102,241,0)" />
        </linearGradient>
      </defs>

      {/* Grid lines */}
      {[0, 0.25, 0.5, 0.75, 1].map((f, i) => (
        <line key={i} x1={PL} x2={W - PR} y1={PT + cH * (1 - f)} y2={PT + cH * (1 - f)}
          stroke="rgba(99,102,241,0.08)" strokeWidth="1" />
      ))}

      {/* Fill */}
      <path d={fillPath} fill="url(#polyFill)" />

      {/* Polygon line */}
      <path d={linePath} fill="none" stroke="url(#polyLine)" strokeWidth="2.5"
        strokeLinecap="round" strokeLinejoin="round" />

      {/* Data points */}
      {pts.map((p, i) => (
        <circle key={i} cx={p.x} cy={p.y} r={p.count > 0 ? 5 : 3}
          fill={p.count > 0 ? '#6366f1' : 'rgba(99,102,241,0.25)'}
          stroke="var(--surface-color)" strokeWidth={p.count > 0 ? 2 : 1} />
      ))}

      {/* Count labels above points */}
      {pts.map((p, i) => p.count > 0 && (
        <text key={i} x={p.x} y={p.y - 9} textAnchor="middle" fontSize="10"
          fill="var(--accent-secondary)" fontWeight="700">
          {p.count}
        </text>
      ))}

      {/* Y-axis labels */}
      {yLabels.map((v, i) => (
        <text key={i} x={PL - 6} y={PT + cH - (v / maxCount) * cH + 4}
          textAnchor="end" fontSize="10" fill="rgba(136,146,176,0.8)">
          {v}
        </text>
      ))}

      {/* X-axis labels — alternating vertical offsets to prevent collision */}
      {pts.map((p, i) => (
        <g key={i}>
          <line x1={p.x} x2={p.x} y1={PT + cH} y2={PT + cH + 5}
            stroke="rgba(99,102,241,0.3)" strokeWidth="1" />
          <text x={p.x} y={PT + cH + (i % 2 === 0 ? 18 : 32)}
            textAnchor="middle" fontSize="9" fill="rgba(136,146,176,0.75)">
            {p.label}
          </text>
        </g>
      ))}

      {/* Axis lines */}
      <line x1={PL} x2={PL} y1={PT} y2={PT + cH} stroke="rgba(99,102,241,0.25)" strokeWidth="1" />
      <line x1={PL} x2={W - PR} y1={PT + cH} y2={PT + cH} stroke="rgba(99,102,241,0.25)" strokeWidth="1" />
    </svg>
  );
};

/* ─── Interview Dashboard ─────────────────────────────────────────── */
const REC_CONFIG = {
  HIRE:    { color: '#10b981', label: 'Hire',      icon: '✅' },
  MAYBE:   { color: '#f59e0b', label: 'Maybe',     icon: '🤔' },
  NO_HIRE: { color: '#f87171', label: 'No Hire',   icon: '❌' },
};

const scoreColor = s => s >= 75 ? '#10b981' : s >= 50 ? '#f59e0b' : '#f87171';

const InterviewDashboard = ({ workspace, session }) => {
  const [interviews, setInterviews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [expanded, setExpanded] = useState(null);

  useEffect(() => {
    if (!workspace?.id) return;
    fetchInterviews();
  }, [workspace?.id]);

  const fetchInterviews = async () => {
    setLoading(true);
    try {
      const res = await fetch(`${import.meta.env.VITE_API_URL}/api/workspaces/${workspace.id}/interviews`, {
        headers: { Authorization: `Bearer ${session?.access_token}` },
      });
      const data = await res.json();
      setInterviews(data.interviews || []);
    } catch (e) {
      console.error('Failed to load interviews', e);
    } finally {
      setLoading(false);
    }
  };

  const completed    = interviews.filter(i => i.status === 'completed');
  const avgScore     = completed.length ? Math.round(completed.reduce((s, i) => s + i.overall_score, 0) / completed.length) : 0;
  const hireCount    = completed.filter(i => i.ai_feedback?.interview_recommendation === 'HIRE').length;
  const maybeCount   = completed.filter(i => i.ai_feedback?.interview_recommendation === 'MAYBE').length;
  const noHireCount  = completed.filter(i => i.ai_feedback?.interview_recommendation === 'NO_HIRE').length;

  if (loading) return (
    <div style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-secondary)' }}>
      <div style={{ width: '40px', height: '40px', margin: '0 auto 1rem', border: '3px solid rgba(99,102,241,0.15)', borderTopColor: 'var(--accent-primary)', borderRadius: '50%', animation: 'spin 0.9s linear infinite' }} />
      Loading interview analytics…
    </div>
  );

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }} className="animate-fade-in">
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h2 className="heading-2">Interview Analytics</h2>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.875rem', marginTop: '0.25rem' }}>
            Phase 2 AI Assessment results for <strong>{workspace.title}</strong>
          </p>
        </div>
        <button className="btn-secondary" onClick={fetchInterviews} style={{ fontSize: '0.85rem', padding: '0.5rem 1rem' }}>
          ↻ Refresh
        </button>
      </div>

      {/* Stats cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '1rem' }}>
        {[
          { label: 'Total Sent',   value: interviews.length,           color: 'var(--accent-primary)'   },
          { label: 'Completed',    value: `${completed.length} (${interviews.length ? Math.round(completed.length/interviews.length*100) : 0}%)`, color: 'var(--accent-secondary)' },
          { label: 'Avg Score',    value: completed.length ? avgScore : '—',  color: scoreColor(avgScore) },
          { label: 'Recommended',  value: hireCount,                   color: '#10b981'                 },
        ].map((stat, i) => (
          <div key={i} style={cardStyle}>
            <span style={{ fontSize: '1.6rem', fontWeight: 800, color: stat.color }}>{stat.value}</span>
            <span style={{ fontSize: '0.65rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.07em', color: 'var(--text-secondary)', marginTop: '0.2rem' }}>{stat.label}</span>
          </div>
        ))}
      </div>

      {/* Frequency Polygon Chart */}
      {completed.length > 0 && (
        <div style={sectionBox}>
          <div style={sectionHeader}>
            <span style={sectionTitle}>Score Density</span>
            <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>Frequency polygon — score distribution across {completed.length} completions</span>
          </div>
          <div style={{ padding: '0.5rem' }}>
            <FrequencyPolygonChart interviews={interviews} />
          </div>
          {/* Recommendation breakdown */}
          <div style={{ display: 'flex', gap: '1.5rem', marginTop: '1rem', paddingTop: '1rem', borderTop: '1px solid var(--border-color)' }}>
            {[
              { label: 'Hire',    count: hireCount,   color: '#10b981' },
              { label: 'Maybe',   count: maybeCount,  color: '#f59e0b' },
              { label: 'No Hire', count: noHireCount, color: '#f87171' },
            ].map((r, i) => (
              <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <div style={{ width: '10px', height: '10px', borderRadius: '50%', background: r.color }} />
                <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>{r.label}: <strong style={{ color: r.color }}>{r.count}</strong></span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Results list */}
      <div style={sectionBox}>
        <div style={sectionHeader}>
          <span style={sectionTitle}>Interview Results</span>
        </div>
        {interviews.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-secondary)' }}>
            <div style={{ fontSize: '2.5rem', marginBottom: '0.75rem' }}>📭</div>
            No interviews sent yet. Click "Send AI Interview" on a shortlisted candidate to begin.
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', marginTop: '1rem' }}>
            {interviews.map(iv => {
              const isOpen = expanded === iv.id;
              const rec = REC_CONFIG[iv.ai_feedback?.interview_recommendation] || null;
              return (
                <div key={iv.id} style={{ background: 'rgba(99,102,241,0.04)', border: '1px solid var(--border-color)', borderRadius: '0.9rem', overflow: 'hidden', transition: 'border-color 0.2s' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', padding: '0.9rem 1.1rem', cursor: 'pointer' }} onClick={() => setExpanded(isOpen ? null : iv.id)}>
                    {/* Avatar */}
                    <div style={{ width: '40px', height: '40px', borderRadius: '50%', background: 'linear-gradient(135deg, var(--accent-primary), var(--accent-tertiary))', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', fontWeight: 700, fontSize: '1rem', flexShrink: 0 }}>
                      {iv.candidate_name?.charAt(0)?.toUpperCase() || '?'}
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontWeight: 700, color: 'var(--text-primary)', fontSize: '0.92rem' }}>{iv.candidate_name || 'Candidate'}</div>
                      <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>{iv.candidate_email || 'No email on file'}</div>
                    </div>
                    {/* Status badge */}
                    {iv.status === 'completed' ? (
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                        {rec && <span style={{ background: `${rec.color}18`, color: rec.color, border: `1px solid ${rec.color}40`, borderRadius: '9999px', padding: '0.2rem 0.65rem', fontSize: '0.7rem', fontWeight: 700 }}>{rec.icon} {rec.label}</span>}
                        <div style={{ width: '52px', height: '52px', borderRadius: '50%', background: `conic-gradient(${scoreColor(iv.overall_score)} ${iv.overall_score * 3.6}deg, rgba(99,102,241,0.08) 0deg)`, display: 'flex', alignItems: 'center', justifyContent: 'center', position: 'relative', flexShrink: 0 }}>
                          <div style={{ position: 'absolute', inset: '5px', background: 'var(--surface-color)', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                            <span style={{ fontWeight: 800, fontSize: '0.85rem', color: scoreColor(iv.overall_score) }}>{iv.overall_score}</span>
                          </div>
                        </div>
                      </div>
                    ) : (
                      <span style={{ padding: '0.25rem 0.75rem', borderRadius: '9999px', fontSize: '0.72rem', fontWeight: 700, background: iv.status === 'in_progress' ? 'rgba(245,158,11,0.12)' : 'rgba(99,102,241,0.08)', color: iv.status === 'in_progress' ? '#f59e0b' : 'var(--text-secondary)', border: `1px solid ${iv.status === 'in_progress' ? 'rgba(245,158,11,0.3)' : 'var(--border-color)'}` }}>
                        {iv.status === 'in_progress' ? '⏳ In Progress' : '📨 Pending'}
                      </span>
                    )}
                    <span style={{ color: 'var(--text-secondary)', fontSize: '0.8rem' }}>{isOpen ? '▲' : '▼'}</span>
                  </div>

                  {/* Expanded details */}
                  {isOpen && iv.status === 'completed' && iv.ai_feedback && (
                    <div style={{ borderTop: '1px solid var(--border-color)', padding: '1.1rem', display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
                      <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', lineHeight: 1.6, margin: 0 }}>{iv.ai_feedback.overall_feedback}</p>
                      {iv.question_scores && (
                        <div>
                          <div style={{ fontSize: '0.68rem', fontWeight: 700, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '0.5rem' }}>Question Scores</div>
                          {iv.question_scores.map((qs, i) => (
                            <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.4rem' }}>
                              <span style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', minWidth: '28px' }}>Q{qs.question_id}</span>
                              <div style={{ flex: 1, height: '5px', background: 'rgba(99,102,241,0.08)', borderRadius: '3px', overflow: 'hidden' }}>
                                <div style={{ height: '100%', width: `${qs.score}%`, background: `linear-gradient(90deg, ${scoreColor(qs.score)}, ${scoreColor(qs.score)}88)`, borderRadius: '3px' }} />
                              </div>
                              <span style={{ fontSize: '0.8rem', fontWeight: 700, color: scoreColor(qs.score), minWidth: '28px', textAlign: 'right' }}>{qs.score}</span>
                            </div>
                          ))}
                        </div>
                      )}
                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
                        {iv.ai_feedback.key_strengths?.length > 0 && (
                          <div style={{ background: 'rgba(16,185,129,0.06)', border: '1px solid rgba(16,185,129,0.15)', borderRadius: '0.6rem', padding: '0.75rem' }}>
                            <div style={{ fontSize: '0.65rem', fontWeight: 800, textTransform: 'uppercase', color: '#10b981', marginBottom: '0.4rem' }}>Strengths</div>
                            <ul style={{ margin: 0, paddingLeft: '1rem', color: 'var(--text-secondary)', fontSize: '0.78rem', lineHeight: 1.6 }}>
                              {iv.ai_feedback.key_strengths.map((s, i) => <li key={i}>{s}</li>)}
                            </ul>
                          </div>
                        )}
                        {iv.ai_feedback.knowledge_gaps?.length > 0 && (
                          <div style={{ background: 'rgba(245,158,11,0.06)', border: '1px solid rgba(245,158,11,0.15)', borderRadius: '0.6rem', padding: '0.75rem' }}>
                            <div style={{ fontSize: '0.65rem', fontWeight: 800, textTransform: 'uppercase', color: '#f59e0b', marginBottom: '0.4rem' }}>Knowledge Gaps</div>
                            <ul style={{ margin: 0, paddingLeft: '1rem', color: 'var(--text-secondary)', fontSize: '0.78rem', lineHeight: 1.6 }}>
                              {iv.ai_feedback.knowledge_gaps.map((g, i) => <li key={i}>{g}</li>)}
                            </ul>
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};

const cardStyle = { background: 'var(--glass-bg)', backdropFilter: 'var(--glass-blur)', border: '1px solid var(--border-color)', borderRadius: '0.9rem', padding: '1rem 1.25rem', display: 'flex', flexDirection: 'column', gap: '0.1rem' };
const sectionBox = { background: 'rgba(99,102,241,0.03)', border: '1px solid var(--border-color)', borderRadius: '1rem', padding: '1.25rem' };
const sectionHeader = { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.25rem' };
const sectionTitle = { fontSize: '0.75rem', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.07em', color: 'var(--text-secondary)' };

export default InterviewDashboard;
