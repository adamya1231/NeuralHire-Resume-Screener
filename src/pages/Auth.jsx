import { useState } from 'react';
import { supabase } from '../supabaseClient';
import { useNavigate } from 'react-router-dom';

export default function Auth() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [companyName, setCompanyName] = useState('');
  const [isLogin, setIsLogin] = useState(true);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleAuth = async (e) => {
    e.preventDefault();
    setLoading(true);
    let error = null;

    if (isLogin) {
      const { error: signInError } = await supabase.auth.signInWithPassword({ email, password });
      error = signInError;
    } else {
      const { error: signUpError } = await supabase.auth.signUp({ 
        email, 
        password,
        options: {
          data: {
            full_name: fullName,
            company_name: companyName
          }
        }
      });
      error = signUpError;
      if (!error) alert("Check your email for the confirmation link!");
    }

    if (error) {
      alert(error.message);
    } else if (isLogin) {
      navigate('/');
    }
    setLoading(false);
  };

  return (
    <div className="auth-container">
      <div className="mesh-orb3" />
      <div className="glass-panel auth-panel animate-fade-in">
        <h2>{isLogin ? 'Recruiter Login' : 'Create Account'}</h2>
        <form onSubmit={handleAuth} style={{ display: 'flex', flexDirection: 'column', gap: '1rem', marginTop: '1.5rem' }}>
          {!isLogin && (
            <>
              <input
                type="text"
                placeholder="Full Name"
                className="input-field"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                required
              />
              <input
                type="text"
                placeholder="Company Name"
                className="input-field"
                value={companyName}
                onChange={(e) => setCompanyName(e.target.value)}
                required
              />
            </>
          )}
          <input
            type="email"
            placeholder="Email Address"
            className="input-field"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
          <input
            type="password"
            placeholder="Password"
            className="input-field"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />
          <button type="submit" className="btn-primary" disabled={loading}>
            {loading ? 'Processing...' : (isLogin ? 'Login' : 'Sign Up')}
          </button>
        </form>
        <p style={{ marginTop: '1rem', textAlign: 'center', color: 'var(--text-secondary)' }}>
          {isLogin ? "Don't have an account? " : "Already have an account? "}
          <button className="text-btn" onClick={() => setIsLogin(!isLogin)}>
            {isLogin ? 'Sign up' : 'Login'}
          </button>
        </p>
      </div>

      <style>{`
        .auth-container {
          min-height: 100vh;
          display: flex;
          align-items: center;
          justify-content: center;
          position: relative;
        }
        .auth-panel {
          width: 100%;
          max-width: 400px;
          padding: 2.5rem;
          position: relative;
          z-index: 10;
        }
        .input-field {
          width: 100%;
          padding: 0.875rem 1rem;
          background: rgba(15, 23, 42, 0.5);
          border: 1px solid var(--border-color);
          border-radius: 0.5rem;
          color: var(--text-primary);
          transition: all 0.2s;
        }
        .input-field:focus {
          outline: none;
          border-color: var(--accent-primary);
        }
        .text-btn {
          background: none;
          border: none;
          color: var(--accent-primary);
          cursor: pointer;
          font-weight: 600;
        }
      `}</style>
    </div>
  );
}
