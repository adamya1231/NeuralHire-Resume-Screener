import React from 'react';

const TrustedBy = () => {
  return (
    <div className="floating-background">
      
      {/* Google */}
      <div className="floating-logo" style={{ top: '15%', left: '10%', animationDelay: '0s', animationDuration: '25s' }}>
        <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M22 12a10 10 0 1 0-2.8 7.1l-2.6-2.6A6.2 6.2 0 1 1 12 5.8a6.2 6.2 0 0 1 4.5 1.9l2.7-2.7A10 10 0 0 0 12 2"></path><path d="M12 12h10"></path></svg>
      </div>

      {/* Microsoft */}
      <div className="floating-logo" style={{ top: '65%', left: '8%', animationDelay: '-5s', animationDuration: '35s' }}>
        <svg width="56" height="56" viewBox="0 0 24 24" fill="currentColor"><rect x="3" y="3" width="8" height="8"></rect><rect x="13" y="3" width="8" height="8"></rect><rect x="3" y="13" width="8" height="8"></rect><rect x="13" y="13" width="8" height="8"></rect></svg>
      </div>

      {/* Meta */}
      <div className="floating-logo" style={{ top: '25%', left: '85%', animationDelay: '-12s', animationDuration: '28s' }}>
        <svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M12 12c-2.28 0-4.136 1.868-4.634 4.148A4.996 4.996 0 0 1 12 22a4.996 4.996 0 0 1 4.634-5.852C16.136 13.868 14.28 12 12 12Z"></path><path d="M12 12c2.28 0 4.136-1.868 4.634-4.148A4.996 4.996 0 0 0 12 2a4.996 4.996 0 0 0-4.634 5.852C7.864 10.132 9.72 12 12 12Z"></path></svg>
      </div>

      {/* OpenAI */}
      <div className="floating-logo" style={{ top: '75%', left: '88%', animationDelay: '-8s', animationDuration: '32s' }}>
        <svg width="50" height="50" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M12 22v-5"></path><path d="M9 8V2"></path><path d="M15 8V2"></path><path d="M18 8v5a4 4 0 0 1-4 4h-4a4 4 0 0 1-4-4V8Z"></path></svg>
      </div>

      {/* IBM */}
      <div className="floating-logo" style={{ top: '45%', left: '92%', animationDelay: '-18s', animationDuration: '40s' }}>
        <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><polygon points="12 2 2 7 12 12 22 7 12 2"></polygon><polyline points="2 17 12 22 22 17"></polyline><polyline points="2 12 12 17 22 12"></polyline></svg>
      </div>
      
      {/* Secondary Meta for background depth */}
      <div className="floating-logo" style={{ top: '85%', left: '45%', animationDelay: '-2s', animationDuration: '45s', opacity: 0.05, transform: 'scale(1.5)' }}>
        <svg width="100" height="100" viewBox="0 0 24 24" fill="currentColor"><rect x="3" y="3" width="8" height="8"></rect><rect x="13" y="3" width="8" height="8"></rect><rect x="3" y="13" width="8" height="8"></rect><rect x="13" y="13" width="8" height="8"></rect></svg>
      </div>

      <style>{`
        .floating-background {
          position: fixed;
          top: 0;
          left: 0;
          width: 100vw;
          height: 100vh;
          pointer-events: none;
          z-index: -1;
          overflow: hidden;
        }

        .floating-logo {
          position: absolute;
          color: var(--accent-primary);
          opacity: 0.07; /* Extremely subtle so it doesn't distract reading */
          animation-name: floatAround;
          animation-iteration-count: infinite;
          animation-timing-function: ease-in-out;
        }

        .dark .floating-logo {
          color: rgba(255, 255, 255, 0.8);
          opacity: 0.04;
        }

        @keyframes floatAround {
          0% {
            transform: translate(0px, 0px) rotate(0deg);
          }
          33% {
            transform: translate(30px, -50px) rotate(10deg);
          }
          66% {
            transform: translate(-20px, 20px) rotate(-5deg);
          }
          100% {
            transform: translate(0px, 0px) rotate(0deg);
          }
        }
      `}</style>
    </div>
  );
};

export default TrustedBy;
