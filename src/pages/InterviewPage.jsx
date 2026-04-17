import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';

const DIFFICULTY_COLOR = {
  foundational: '#10b981',
  intermediate: '#f59e0b',
  advanced: '#f87171',
};

const REC_CONFIG = {
  HIRE:    { color: '#10b981', label: 'Recommended for Hire',    icon: '✅' },
  MAYBE:   { color: '#f59e0b', label: 'Further Review Needed',   icon: '🤔' },
  NO_HIRE: { color: '#f87171', label: 'Not Recommended',         icon: '❌' },
};

export default function InterviewPage() {
  const { token } = useParams();
  const [interview, setInterview] = useState(null);
  const [loading, setLoading] = useState(true);
  const [phase, setPhase] = useState('welcome'); // welcome | interview | submitting | results
  const [currentQ, setCurrentQ] = useState(0);
  const [answers, setAnswers] = useState([]);
  const [currentAnswer, setCurrentAnswer] = useState('');
  const [results, setResults] = useState(null);
  const [error, setError] = useState(null);
  const [animating, setAnimating] = useState(false);

  useEffect(() => {
    loadInterview();
  }, [token]);

  const loadInterview = async () => {
    try {
      const res = await fetch(`${import.meta.env.VITE_API_URL}/api/interviews/${token}`);
      if (!res.ok) { setError('Interview not found or this link has expired.'); setLoading(false); return; }
      const data = await res.json();
      if (data.status === 'completed') {
        setResults({ overall_score: data.overall_score, ai_feedback: data.ai_feedback, question_scores: data.question_scores });
        setPhase('results');
      }
      setInterview(data);
    } catch {
      setError('Failed to load interview. Please check your connection and try again.');
    } finally {
      setLoading(false);
    }
  };

  const startInterview = async () => {
    await fetch(`${import.meta.env.VITE_API_URL}/api/interviews/${token}/start`, { method: 'PUT' });
    setPhase('interview');
  };

  const saveAndNext = () => {
    if (!currentAnswer.trim()) return;
    const q = interview.questions[currentQ];
    const updated = [...answers.filter(a => a.question_id !== q.id), { question_id: q.id, answer: currentAnswer.trim() }];
    setAnswers(updated);
    setAnimating(true);
    setTimeout(() => {
      setAnimating(false);
      if (currentQ < interview.questions.length - 1) {
        setCurrentQ(currentQ + 1);
        setCurrentAnswer('');
      } else {
        submitInterview(updated);
      }
    }, 400);
  };

  const submitInterview = async (finalAnswers) => {
    setPhase('submitting');
    try {
      const res = await fetch(`${import.meta.env.VITE_API_URL}/api/interviews/${token}/submit`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ answers: finalAnswers }),
      });
      const data = await res.json();
      setResults(data);
      setPhase('results');
    } catch {
      setError('Failed to submit. Your answers may have been lost — please contact the recruiter.');
    }
  };

  const scoreColor = (s) => s >= 75 ? '#10b981' : s >= 50 ? '#f59e0b' : '#f87171';

  if (loading) return (
    <div style={styles.fullPage}>
      <div style={styles.loadingSpinner}>
        <div style={styles.spinOuter} /><div style={styles.spinInner} />
      </div>
      <p style={{ color: 'var(--accent-secondary)', marginTop: '1rem' }}>Loading your interview…</p>
    </div>
  );

  if (error) return (
    <div style={styles.fullPage}>
      <div style={styles.errorCard}>
        <div style={{ fontSize: '3rem' }}>❌</div>
        <h2 style={{ color: '#f87171', margin: '1rem 0 0.5rem' }}>Link Unavailable</h2>
        <p style={{ color: 'var(--text-secondary)' }}>{error}</p>
      </div>
    </div>
  );

  /* ─── WELCOME ─── */
  if (phase === 'welcome') return (
    <div style={styles.fullPage}>
      <div style={styles.card} className="animate-scale-in">
        <div style={styles.aiAvatar}>
          <div style={styles.avatarRing1} />
          <div style={styles.avatarRing2} />
          <span style={styles.avatarIcon}>🤖</span>
        </div>
        <div style={styles.badge}>NEURAL HIRE · AI INTERVIEW</div>
        <h1 style={styles.welcomeTitle}>Hello, {interview.candidate_name}!</h1>
        <p style={{ color: 'var(--text-secondary)', lineHeight: 1.7, margin: '0.5rem 0 1.5rem' }}>
          You're about to begin the <strong style={{ color: 'var(--accent-primary)' }}>Phase 2 AI Assessment</strong> for the <strong>{interview.job_title}</strong> position.
        </p>
        <div style={styles.infoGrid}>
          {[
            { icon: '📝', label: '5 Questions', sub: 'Concept-based' },
            { icon: '⏱️', label: '~20 Minutes', sub: 'At your own pace' },
            { icon: '🤖', label: 'AI Evaluated', sub: 'Instant scoring' },
          ].map((item, i) => (
            <div key={i} style={styles.infoChip}>
              <span style={{ fontSize: '1.5rem' }}>{item.icon}</span>
              <strong style={{ color: 'var(--text-primary)', fontSize: '0.85rem' }}>{item.label}</strong>
              <span style={{ color: 'var(--text-secondary)', fontSize: '0.72rem' }}>{item.sub}</span>
            </div>
          ))}
        </div>
        <div style={styles.tips}>
          <p style={styles.tip}>💡 Answer in your own words — we value depth of understanding over length.</p>
          <p style={styles.tip}>💡 Once started, complete all 5 questions in one session.</p>
        </div>
        <button className="btn-primary" style={{ width: '100%', padding: '1rem', fontSize: '1rem' }} onClick={startInterview}>
          Begin Interview →
        </button>
      </div>
      <style>{pageStyles}</style>
    </div>
  );

  /* ─── INTERVIEW ─── */
  if (phase === 'interview') {
    const q = interview.questions[currentQ];
    const progress = ((currentQ) / interview.questions.length) * 100;
    return (
      <div style={styles.fullPage}>
        <div style={{ ...styles.card, ...styles.interviewCard }} className={animating ? 'slide-out' : 'animate-scale-in'}>
          {/* Progress */}
          <div style={styles.progressRow}>
            <span style={{ color: 'var(--text-secondary)', fontSize: '0.8rem' }}>Question {currentQ + 1} of {interview.questions.length}</span>
            <span style={{ color: 'var(--text-secondary)', fontSize: '0.8rem' }}>{Math.round(progress)}% complete</span>
          </div>
          <div style={styles.progressBarBg}>
            <div style={{ ...styles.progressBarFill, width: `${progress}%` }} />
          </div>

          {/* Question */}
          <div style={styles.difficultyBadge}>
            <span style={{ color: DIFFICULTY_COLOR[q.difficulty] || '#6366f1' }}>●</span>
            &nbsp;{q.topic || q.difficulty}
          </div>
          <h2 style={styles.questionText}>{q.question}</h2>

          {/* Answer */}
          <textarea
            autoFocus
            style={styles.answerArea}
            placeholder="Type your answer here… Be specific and explain your reasoning."
            value={currentAnswer}
            onChange={e => setCurrentAnswer(e.target.value)}
            rows={6}
          />
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '0.5rem' }}>
            <span style={{ color: 'var(--text-secondary)', fontSize: '0.75rem' }}>{currentAnswer.length} characters</span>
            <button
              className="btn-primary"
              disabled={!currentAnswer.trim()}
              onClick={saveAndNext}
              style={{ padding: '0.75rem 2rem' }}
            >
              {currentQ < interview.questions.length - 1 ? 'Next Question →' : 'Submit Interview ✓'}
            </button>
          </div>
        </div>
        <style>{pageStyles}</style>
      </div>
    );
  }

  /* ─── SUBMITTING ─── */
  if (phase === 'submitting') return (
    <div style={styles.fullPage}>
      <div style={styles.card} className="animate-scale-in">
        <div style={{ textAlign: 'center' }}>
          <div style={styles.loadingSpinner}>
            <div style={styles.spinOuter} /><div style={styles.spinInner} />
          </div>
          <h2 style={{ marginTop: '1.5rem', color: 'var(--text-primary)' }}>Evaluating Your Answers…</h2>
          <p style={{ color: 'var(--text-secondary)', marginTop: '0.5rem' }}>Our AI is analyzing your responses. This takes ~10 seconds.</p>
          <div style={styles.evalSteps}>
            {['Parsing answers', 'Scoring concepts', 'Generating feedback'].map((s, i) => (
              <div key={i} style={styles.evalStep}><span style={{ color: 'var(--accent-secondary)' }}>◎</span> {s}</div>
            ))}
          </div>
        </div>
      </div>
      <style>{pageStyles}</style>
    </div>
  );

  /* ─── RESULTS ─── */
  if (phase === 'results' && results) {
    const score = results.overall_score || 0;
    const fb    = results.ai_feedback || {};
    const rec   = REC_CONFIG[fb.interview_recommendation] || REC_CONFIG.MAYBE;
    const color = scoreColor(score);
    return (
      <div style={styles.fullPage}>
        <div style={{ ...styles.card, maxWidth: '680px' }} className="animate-scale-in">
          <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
            <div style={{ ...styles.scoreCircle, background: `conic-gradient(${color} ${score * 3.6}deg, rgba(99,102,241,0.08) 0deg)` }}>
              <div style={styles.scoreInner}>
                <span style={{ fontSize: '2rem', fontWeight: 800, color }}>{score}</span>
                <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>/ 100</span>
              </div>
            </div>
            <h1 style={{ marginTop: '1.25rem', color: 'var(--text-primary)' }}>Interview Complete!</h1>
            <div style={{ ...styles.recBadge, background: `${rec.color}18`, color: rec.color, border: `1px solid ${rec.color}40` }}>
              {rec.icon} {rec.label}
            </div>
            <p style={{ color: 'var(--text-secondary)', lineHeight: 1.7, marginTop: '1rem' }}>{fb.overall_feedback}</p>
          </div>

          {/* Question breakdown */}
          {results.question_scores && results.question_scores.length > 0 && (
            <div style={{ marginBottom: '1.5rem' }}>
              <h3 style={{ color: 'var(--text-secondary)', fontSize: '0.7rem', letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: '0.75rem' }}>Question Breakdown</h3>
              {results.question_scores.map((qs, i) => (
                <div key={i} style={styles.qScoreRow}>
                  <span style={{ color: 'var(--text-secondary)', fontSize: '0.82rem', flex: 1 }}>Q{qs.question_id}</span>
                  <div style={styles.qScoreBar}>
                    <div style={{ height: '100%', width: `${qs.score}%`, background: `linear-gradient(90deg, ${scoreColor(qs.score)}, ${scoreColor(qs.score)}88)`, borderRadius: '3px', transition: 'width 1s ease' }} />
                  </div>
                  <span style={{ color: scoreColor(qs.score), fontWeight: 700, fontSize: '0.85rem', minWidth: '36px', textAlign: 'right' }}>{qs.score}</span>
                </div>
              ))}
            </div>
          )}

          {/* Strengths & Gaps */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
            {fb.key_strengths?.length > 0 && (
              <div style={styles.feedbackBox}>
                <div style={styles.feedbackTitle}><span style={{ color: '#10b981' }}>●</span> Key Strengths</div>
                <ul style={styles.feedbackList}>{fb.key_strengths.map((s, i) => <li key={i}>{s}</li>)}</ul>
              </div>
            )}
            {fb.knowledge_gaps?.length > 0 && (
              <div style={styles.feedbackBox}>
                <div style={styles.feedbackTitle}><span style={{ color: '#f59e0b' }}>●</span> Areas to Improve</div>
                <ul style={styles.feedbackList}>{fb.knowledge_gaps.map((g, i) => <li key={i}>{g}</li>)}</ul>
              </div>
            )}
          </div>

          <p style={{ textAlign: 'center', color: 'var(--text-secondary)', fontSize: '0.82rem', marginTop: '2rem' }}>
            Your results have been submitted to the recruiter. You'll be contacted with next steps.
          </p>
        </div>
        <style>{pageStyles}</style>
      </div>
    );
  }
  return null;
}

const styles = {
  fullPage: { minHeight: '100vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '2rem', background: 'var(--bg-color)', position: 'relative' },
  card: { width: '100%', maxWidth: '560px', background: 'var(--glass-bg)', backdropFilter: 'var(--glass-blur)', WebkitBackdropFilter: 'var(--glass-blur)', border: '1px solid var(--glass-border)', borderRadius: '1.5rem', padding: '2.5rem', boxShadow: 'var(--shadow-lg)' },
  interviewCard: { maxWidth: '640px' },
  aiAvatar: { position: 'relative', width: '80px', height: '80px', margin: '0 auto 1.5rem' },
  avatarRing1: { position: 'absolute', inset: 0, borderRadius: '50%', border: '2px solid rgba(99,102,241,0.4)', animation: 'pulse-ring 2s ease-in-out infinite' },
  avatarRing2: { position: 'absolute', inset: '-8px', borderRadius: '50%', border: '2px solid rgba(34,211,238,0.25)', animation: 'pulse-ring 2s ease-in-out infinite 0.5s' },
  avatarIcon: { position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '2.5rem', background: 'linear-gradient(135deg, rgba(99,102,241,0.15), rgba(34,211,238,0.1))', borderRadius: '50%' },
  badge: { display: 'inline-block', padding: '0.3rem 0.9rem', background: 'rgba(99,102,241,0.12)', border: '1px solid rgba(99,102,241,0.25)', borderRadius: '9999px', color: 'var(--accent-primary)', fontSize: '0.68rem', fontWeight: 700, letterSpacing: '0.1em', marginBottom: '1rem' },
  welcomeTitle: { fontSize: '1.75rem', fontWeight: 700, color: 'var(--text-primary)', margin: '0 0 0.5rem' },
  infoGrid: { display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '0.75rem', margin: '1.5rem 0' },
  infoChip: { display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.25rem', padding: '0.9rem 0.5rem', background: 'rgba(99,102,241,0.06)', border: '1px solid rgba(99,102,241,0.12)', borderRadius: '0.75rem', textAlign: 'center' },
  tips: { background: 'rgba(99,102,241,0.05)', border: '1px solid rgba(99,102,241,0.1)', borderRadius: '0.75rem', padding: '1rem', marginBottom: '1.5rem' },
  tip: { color: 'var(--text-secondary)', fontSize: '0.82rem', margin: '0.25rem 0', lineHeight: 1.5 },
  loadingSpinner: { position: 'relative', width: '56px', height: '56px', margin: '0 auto' },
  spinOuter: { position: 'absolute', inset: 0, border: '3px solid rgba(99,102,241,0.15)', borderTopColor: 'var(--accent-primary)', borderRadius: '50%', animation: 'spin 0.9s linear infinite' },
  spinInner: { position: 'absolute', inset: '10px', border: '2px solid rgba(34,211,238,0.15)', borderTopColor: 'var(--accent-secondary)', borderRadius: '50%', animation: 'spin 0.6s linear infinite reverse' },
  errorCard: { textAlign: 'center', padding: '3rem', maxWidth: '420px', background: 'var(--glass-bg)', border: '1px solid rgba(248,113,113,0.3)', borderRadius: '1.25rem' },
  progressRow: { display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' },
  progressBarBg: { height: '4px', background: 'rgba(99,102,241,0.1)', borderRadius: '9999px', marginBottom: '1.75rem', overflow: 'hidden' },
  progressBarFill: { height: '100%', background: 'linear-gradient(90deg, var(--accent-primary), var(--accent-secondary))', borderRadius: '9999px', transition: 'width 0.4s ease' },
  difficultyBadge: { display: 'inline-flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.7rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em', color: 'var(--text-secondary)', marginBottom: '1rem' },
  questionText: { fontSize: '1.15rem', fontWeight: 600, color: 'var(--text-primary)', lineHeight: 1.55, marginBottom: '1.25rem' },
  answerArea: { width: '100%', padding: '1rem', background: 'rgba(15,23,42,0.4)', border: '1px solid var(--border-color)', borderRadius: '0.75rem', color: 'var(--text-primary)', fontSize: '0.95rem', lineHeight: 1.65, resize: 'vertical', fontFamily: 'inherit', transition: 'border-color 0.2s' },
  evalSteps: { marginTop: '1.5rem', display: 'flex', flexDirection: 'column', gap: '0.5rem' },
  evalStep: { color: 'var(--text-secondary)', fontSize: '0.88rem', display: 'flex', alignItems: 'center', gap: '0.5rem', justifyContent: 'center' },
  scoreCircle: { width: '120px', height: '120px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto', position: 'relative' },
  scoreInner: { position: 'absolute', inset: '8px', background: 'var(--surface-color)', borderRadius: '50%', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' },
  recBadge: { display: 'inline-block', padding: '0.4rem 1.2rem', borderRadius: '9999px', fontSize: '0.85rem', fontWeight: 700, marginTop: '0.75rem' },
  qScoreRow: { display: 'flex', alignItems: 'center', gap: '0.75rem', padding: '0.5rem 0' },
  qScoreBar: { flex: 1, height: '6px', background: 'rgba(99,102,241,0.1)', borderRadius: '3px', overflow: 'hidden' },
  feedbackBox: { background: 'rgba(99,102,241,0.05)', border: '1px solid rgba(99,102,241,0.12)', borderRadius: '0.75rem', padding: '1rem' },
  feedbackTitle: { fontSize: '0.7rem', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.06em', color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', gap: '0.4rem', marginBottom: '0.6rem' },
  feedbackList: { margin: 0, paddingLeft: '1.1rem', color: 'var(--text-secondary)', fontSize: '0.82rem', lineHeight: 1.6 },
};

const pageStyles = `
  @keyframes pulse-ring {
    0%, 100% { transform: scale(1); opacity: 1; }
    50% { transform: scale(1.08); opacity: 0.6; }
  }
  .slide-out { animation: slideOut 0.35s ease forwards; }
  @keyframes slideOut { to { opacity: 0; transform: translateX(-24px); } }
  textarea:focus { outline: none; border-color: var(--accent-primary) !important; box-shadow: 0 0 0 3px rgba(99,102,241,0.15); }
`;
