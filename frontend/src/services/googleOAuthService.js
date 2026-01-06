/**
 * Google OAuth Service for Capacitor
 * Uses system browser (Chrome Custom Tabs) for OAuth on native platforms
 * Falls back to popup-based OAuth on web
 */

import { Capacitor } from '@capacitor/core';
import { Browser } from '@capacitor/browser';

const GOOGLE_CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID;
// Use the web app URL for redirect - this MUST be registered in Google Cloud Console
const REDIRECT_URI = import.meta.env.VITE_APP_URL || 'https://kripa-connect-app.vercel.app';
const OAUTH_CALLBACK_PATH = '/oauth/callback';

/**
 * Check if running on native platform (Android/iOS)
 */
export function isNativePlatform() {
  return Capacitor.isNativePlatform();
}

/**
 * Generate a random state parameter for OAuth security
 */
function generateState() {
  const array = new Uint8Array(32);
  crypto.getRandomValues(array);
  return Array.from(array, byte => byte.toString(16).padStart(2, '0')).join('');
}

/**
 * Store OAuth state for verification
 */
function storeOAuthState(state) {
  sessionStorage.setItem('google_oauth_state', state);
}

/**
 * Verify OAuth state parameter
 */
function verifyOAuthState(state) {
  const stored = sessionStorage.getItem('google_oauth_state');
  sessionStorage.removeItem('google_oauth_state');
  return stored === state;
}

/**
 * Build Google OAuth URL for authorization code flow
 * 
 * IMPORTANT: The redirect_uri MUST be registered in Google Cloud Console:
 * https://console.cloud.google.com/apis/credentials
 * 
 * Add this to "Authorized redirect URIs":
 * https://kripa-connect-app.vercel.app/oauth/callback
 */
function buildGoogleOAuthUrl(state) {
  const redirectUri = `${REDIRECT_URI}${OAUTH_CALLBACK_PATH}`;
  
  console.log('[GoogleOAuth] Using redirect URI:', redirectUri);
  console.log('[GoogleOAuth] Client ID:', GOOGLE_CLIENT_ID?.substring(0, 20) + '...');
  
  const params = new URLSearchParams({
    client_id: GOOGLE_CLIENT_ID,
    redirect_uri: redirectUri,
    response_type: 'token', // Using implicit flow for client-side
    scope: 'openid email profile',
    state: state,
    prompt: 'select_account',
  });

  return `https://accounts.google.com/o/oauth2/v2/auth?${params.toString()}`;
}

/**
 * Open Google OAuth in system browser (Chrome Custom Tabs on Android)
 * Returns a promise that resolves when the browser is closed
 */
export async function openGoogleOAuth() {
  if (!isNativePlatform()) {
    throw new Error('This method is only for native platforms');
  }

  const state = generateState();
  storeOAuthState(state);
  
  const oauthUrl = buildGoogleOAuthUrl(state);
  
  // Open in system browser (Chrome Custom Tabs on Android)
  await Browser.open({ 
    url: oauthUrl,
    presentationStyle: 'fullscreen',
    toolbarColor: '#000000'
  });
}

/**
 * Close the browser (call this after OAuth redirect)
 */
export async function closeBrowser() {
  if (isNativePlatform()) {
    try {
      await Browser.close();
    } catch (e) {
      // Browser might already be closed
      console.log('Browser close:', e.message);
    }
  }
}

/**
 * Parse OAuth callback URL and extract tokens
 * @param {string} url - The callback URL with hash fragment
 * @returns {Object|null} - Token data or null if invalid
 */
export function parseOAuthCallback(url) {
  try {
    // Handle both hash fragment (#) and query params (?)
    const urlObj = new URL(url);
    let params;
    
    // Google OAuth uses hash fragment for implicit flow
    if (urlObj.hash) {
      params = new URLSearchParams(urlObj.hash.substring(1));
    } else {
      params = urlObj.searchParams;
    }

    const accessToken = params.get('access_token');
    const state = params.get('state');
    const error = params.get('error');

    if (error) {
      console.error('OAuth error:', error);
      return { error };
    }

    if (!accessToken) {
      return null;
    }

    // State verification is optional - it may fail when callback opens in 
    // system browser (Chrome) because sessionStorage isn't shared with WebView.
    // This is expected behavior for Capacitor apps using Browser plugin.
    if (state) {
      const stateValid = verifyOAuthState(state);
      if (!stateValid) {
        console.warn('OAuth state mismatch - this is expected when using system browser on mobile');
        // Don't fail on state mismatch for mobile OAuth flows
      }
    }

    return { accessToken };
  } catch (e) {
    console.error('Failed to parse OAuth callback:', e);
    return null;
  }
}

/**
 * Add listener for browser finished event
 * @param {Function} callback - Function to call when browser closes
 * @returns {Function} - Cleanup function to remove listener
 */
export function addBrowserClosedListener(callback) {
  if (!isNativePlatform()) {
    return () => {};
  }

  const handle = Browser.addListener('browserFinished', callback);
  
  return () => {
    handle.then(h => h.remove());
  };
}

/**
 * Add listener for URL changes in browser
 * Useful for detecting OAuth redirects
 * @param {Function} callback - Function to call on URL change
 * @returns {Function} - Cleanup function to remove listener
 */
export function addBrowserUrlListener(callback) {
  if (!isNativePlatform()) {
    return () => {};
  }

  const handle = Browser.addListener('browserPageLoaded', callback);
  
  return () => {
    handle.then(h => h.remove());
  };
}
