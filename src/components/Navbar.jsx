import React from 'react';
import { Link } from 'react-router-dom';
import { supabase } from '../supabaseClient';

const Navbar = ({ theme, toggleTheme }) => {
  const handleSignOut = async () => {
    await supabase.auth.signOut();
  };

  return (
    <nav className="navbar glass-panel">
      <div className="container nav-content">
        <div className="logo-section">
          {/* Shield logo with gradient */}
          <svg className="logo-mark" viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg">
            <defs>
              <linearGradient id="shieldGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#6366f1"/>
                <stop offset="50%" stopColor="#22d3ee"/>
                <stop offset="100%" stopColor="#a78bfa"/>
              </linearGradient>
            </defs>
            <path d="M16 3L4 8v8c0 6.627 5.373 12 12 12s12-5.373 12-12V8L16 3z" fill="url(#shieldGrad)" opacity="0.9"/>
            <path d="M11 16l3.5 3.5L21 12" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
          <span className="logo-text">DRONA<span className="logo-ai"> AI</span></span>
        </div>

        <div className="nav-links">
          <Link to="/" className="nav-link">Dashboard</Link>
          <Link to="/account" className="nav-link">My Account</Link>
        </div>

        <div className="nav-actions">
          <button className="theme-toggle" onClick={handleSignOut} aria-label="Sign Out" style={{ marginRight: '0.5rem' }}>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"></path>
              <polyline points="16 17 21 12 16 7"></polyline>
              <line x1="21" y1="12" x2="9" y2="12"></line>
            </svg>
            <span className="toggle-text">Sign Out</span>
          </button>
          <button className="theme-toggle" onClick={toggleTheme} aria-label="Toggle Theme">
            {theme === 'dark' ? (
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="12" cy="12" r="5"></circle>
                <line x1="12" y1="1" x2="12" y2="3"></line>
                <line x1="12" y1="21" x2="12" y2="23"></line>
                <line x1="4.22" y1="4.22" x2="5.64" y2="5.64"></line>
                <line x1="18.36" y1="18.36" x2="19.78" y2="19.78"></line>
                <line x1="1" y1="12" x2="3" y2="12"></line>
                <line x1="21" y1="12" x2="23" y2="12"></line>
                <line x1="4.22" y1="19.78" x2="5.64" y2="18.36"></line>
                <line x1="18.36" y1="5.64" x2="19.78" y2="4.22"></line>
              </svg>
            ) : (
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"></path>
              </svg>
            )}
            <span className="toggle-text">{theme === 'dark' ? 'Light' : 'Dark'}</span>
          </button>
        </div>
      </div>

      <style>{`
        .navbar {
          position: fixed;
          top: 1rem;
          left: 50%;
          transform: translateX(-50%);
          width: calc(100% - 3rem);
          max-width: 1280px;
          z-index: 1000;
          padding: 0;
          border-radius: 9999px;
          border: 1px solid var(--glass-border);
          transition: all 0.3s ease;
        }

        .navbar:hover {
          transform: translateX(-50%) translateY(-1px);
          box-shadow: var(--shadow-lg), 0 0 0 1px rgba(99,102,241,0.15);
        }

        .nav-content {
          display: flex;
          align-items: center;
          justify-content: space-between;
          height: 4rem;
          padding: 0 1.5rem;
        }

        .logo-section {
          display: flex;
          align-items: center;
          gap: 0.65rem;
          font-weight: 700;
          font-size: 1.1rem;
          letter-spacing: 0.04em;
        }

        .logo-mark {
          width: 32px; height: 32px;
          flex-shrink: 0;
          filter: drop-shadow(0 0 8px rgba(99,102,241,0.4));
        }

        .logo-text {
          background: linear-gradient(135deg, var(--accent-primary), var(--accent-secondary));
          -webkit-background-clip: text;
          background-clip: text;
          color: transparent;
          letter-spacing: 0.05em;
        }

        .logo-ai {
          color: var(--accent-tertiary);
          background: linear-gradient(135deg, var(--accent-secondary), var(--accent-tertiary));
          -webkit-background-clip: text;
          background-clip: text;
        }

        .nav-links {
          display: flex;
          align-items: center;
          gap: 2rem;
        }

        .nav-link {
          font-size: 0.9rem;
          font-weight: 500;
          color: var(--text-secondary);
          text-decoration: none;
          transition: color 0.2s ease;
          position: relative;
        }

        .nav-link::after {
          content: '';
          position: absolute;
          bottom: -2px; left: 0;
          width: 0; height: 2px;
          background: linear-gradient(90deg, var(--accent-primary), var(--accent-secondary));
          border-radius: 9999px;
          transition: width 0.3s ease;
        }

        .nav-link:hover { color: var(--text-primary); }
        .nav-link:hover::after { width: 100%; }

        .nav-actions {
          display: flex;
          align-items: center;
          gap: 0.75rem;
        }

        .theme-toggle {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          background: transparent;
          border: 1px solid var(--border-color);
          color: var(--text-secondary);
          padding: 0.4rem 0.9rem;
          border-radius: 9999px;
          transition: all 0.25s ease;
          font-weight: 500;
          font-size: 0.82rem;
          font-family: inherit;
        }

        .theme-toggle svg { width: 16px; height: 16px; }

        .theme-toggle:hover {
          background: rgba(99,102,241,0.08);
          border-color: var(--accent-primary);
          color: var(--accent-primary);
          box-shadow: 0 0 16px rgba(99,102,241,0.2);
        }

        @media (max-width: 640px) {
          .nav-links { display: none; }
        }
      `}</style>
    </nav>
  );
};

export default Navbar;
