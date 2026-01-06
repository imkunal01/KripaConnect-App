/**
 * OAuth Callback Page
 * Handles the redirect from Google OAuth and processes the authentication
 * This page is loaded when Google redirects back after authentication
 */

import { useEffect, useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth.js';
import { parseOAuthCallback, closeBrowser, isNativePlatform } from '../services/googleOAuthService.js';
import './FormStyles.css';

export default function OAuthCallback() {
  const { googleSignIn } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [status, setStatus] = useState('processing');
  const [error, setError] = useState(null);

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
          setError(result.error === 'state_mismatch' 
            ? 'Security validation failed. Please try again.' 
            : `Authentication failed: ${result.error}`
          );
          return;
        }

        if (result.accessToken) {
          setStatus('authenticating');
          
          // Send access token to backend for verification and login
          const payload = await googleSignIn(null, result.accessToken);
          
          // Close the browser on native platforms
          if (isNativePlatform()) {
            await closeBrowser();
          }

          // Navigate based on user state
          const hasAddress = Array.isArray(payload?.savedAddresses) && payload.savedAddresses.length > 0;
          const needsOnboarding = !!payload?.isNewUser || !hasAddress;
          
          setStatus('success');
          
          // Small delay to show success state before navigating
          setTimeout(() => {
            navigate(needsOnboarding ? '/onboarding' : '/', { replace: true });
          }, 500);
        }
      } catch (e) {
        console.error('OAuth callback error:', e);
        setStatus('error');
        setError(e.message || 'Authentication failed');
        
        // Close browser even on error
        if (isNativePlatform()) {
          await closeBrowser();
        }
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
          
          {status === 'success' && (
            <>
              <div style={{ fontSize: '48px' }}>✓</div>
              <h2 style={{ marginTop: '20px', color: '#22c55e' }}>Success!</h2>
              <p style={{ color: '#666' }}>Redirecting you now...</p>
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
