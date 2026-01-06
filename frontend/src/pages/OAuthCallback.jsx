/**
 * OAuth Callback Page
 * Handles the redirect from Google OAuth and processes the authentication
 * This page is loaded when Google redirects back after authentication
 * 
 * On mobile (Capacitor): This page loads in Chrome Custom Tabs, authenticates,
 * then stores the result and instructs user to return to app.
 */

import { useEffect, useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth.js';
import { parseOAuthCallback } from '../services/googleOAuthService.js';
import './FormStyles.css';

// Key to store OAuth result for cross-context communication
const OAUTH_RESULT_KEY = 'google_oauth_result';

/**
 * Store OAuth result in localStorage (accessible across browser contexts)
 */
function storeOAuthResult(result) {
  try {
    localStorage.setItem(OAUTH_RESULT_KEY, JSON.stringify({
      ...result,
      timestamp: Date.now()
    }));
  } catch (e) {
    console.error('Failed to store OAuth result:', e);
  }
}

/**
 * Get and clear stored OAuth result
 */
export function getStoredOAuthResult() {
  try {
    const raw = localStorage.getItem(OAUTH_RESULT_KEY);
    if (!raw) return null;
    
    localStorage.removeItem(OAUTH_RESULT_KEY);
    const result = JSON.parse(raw);
    
    // Expire after 5 minutes
    if (Date.now() - result.timestamp > 5 * 60 * 1000) {
      return null;
    }
    
    return result;
  } catch (e) {
    return null;
  }
}

export default function OAuthCallback() {
  const { googleSignIn } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [status, setStatus] = useState('processing');
  const [error, setError] = useState(null);
  const [showReturnMessage, setShowReturnMessage] = useState(false);

  useEffect(() => {
    async function handleCallback() {
      try {
        // Parse the OAuth callback from current URL (includes hash fragment)
        const fullUrl = window.location.href;
        const result = parseOAuthCallback(fullUrl);

        if (!result) {
          setStatus('error');
          setError('No authentication data received');
          return;
        }

        if (result.error) {
          setStatus('error');
          setError(`Authentication failed: ${result.error}`);
          return;
        }

        if (result.accessToken) {
          setStatus('authenticating');
          
          // Send access token to backend for verification and login
          const payload = await googleSignIn(null, result.accessToken);
          
          // Navigate based on user state
          const hasAddress = Array.isArray(payload?.savedAddresses) && payload.savedAddresses.length > 0;
          const needsOnboarding = !!payload?.isNewUser || !hasAddress;
          const targetPath = needsOnboarding ? '/onboarding' : '/';
          
          setStatus('success');
          
          // Store result for the app to pick up (in case we're in system browser)
          storeOAuthResult({ 
            success: true, 
            targetPath,
            userId: payload?._id 
          });
          
          // Check if we're in a standalone browser (not WebView)
          // In Chrome Custom Tabs, we can't programmatically close, so show message
          const isStandaloneBrowser = !window.navigator.userAgent.includes('wv');
          
          if (isStandaloneBrowser && /Android|iPhone|iPad/i.test(navigator.userAgent)) {
            // We're in system browser on mobile - show return message
            setShowReturnMessage(true);
          } else {
            // We're in WebView or desktop - navigate normally
            setTimeout(() => {
              navigate(targetPath, { replace: true });
            }, 500);
          }
        }
      } catch (e) {
        console.error('OAuth callback error:', e);
        setStatus('error');
        setError(e.message || 'Authentication failed');
        storeOAuthResult({ success: false, error: e.message });
      }
    }

    handleCallback();
  }, [googleSignIn, navigate, location]);

  const handleRetry = () => {
    navigate('/login', { replace: true });
  };

  return (
    <div className="auth-wrapper">
      <div className="auth-left" style={{ justifyContent: 'center', alignItems: 'center' }}>
        <div style={{ textAlign: 'center', padding: '40px' }}>
          {status === 'processing' && (
            <>
              <div className="oauth-spinner" />
              <h2 style={{ marginTop: '20px', color: '#333' }}>Processing...</h2>
              <p style={{ color: '#666' }}>Please wait while we verify your Google account</p>
            </>
          )}
          
          {status === 'authenticating' && (
            <>
              <div className="oauth-spinner" />
              <h2 style={{ marginTop: '20px', color: '#333' }}>Signing you in...</h2>
              <p style={{ color: '#666' }}>Almost there!</p>
            </>
          )}
          
          {status === 'success' && !showReturnMessage && (
            <>
              <div style={{ fontSize: '48px' }}>✓</div>
              <h2 style={{ marginTop: '20px', color: '#22c55e' }}>Success!</h2>
              <p style={{ color: '#666' }}>Redirecting you now...</p>
            </>
          )}
          
          {status === 'success' && showReturnMessage && (
            <>
              <div style={{ fontSize: '48px' }}>✓</div>
              <h2 style={{ marginTop: '20px', color: '#22c55e' }}>Login Successful!</h2>
              <p style={{ color: '#666', marginBottom: '20px' }}>
                You can now close this browser and return to the app.
              </p>
              <p style={{ color: '#888', fontSize: '14px' }}>
                Tap the X button above or use the back gesture to return.
              </p>
            </>
          )}
          
          {status === 'error' && (
            <>
              <div style={{ fontSize: '48px' }}>✗</div>
              <h2 style={{ marginTop: '20px', color: '#ef4444' }}>Authentication Failed</h2>
              <p style={{ color: '#666', marginBottom: '20px' }}>{error}</p>
              <button className="btn-primary" onClick={handleRetry}>
                Back to Login
              </button>
            </>
          )}
        </div>
      </div>
      
      <style>{`
        .oauth-spinner {
          width: 48px;
          height: 48px;
          border: 4px solid #e5e7eb;
          border-top-color: #3b82f6;
          border-radius: 50%;
          animation: oauth-spin 1s linear infinite;
          margin: 0 auto;
        }
        
        @keyframes oauth-spin {
          to { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
}
