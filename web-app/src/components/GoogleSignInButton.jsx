// Google Sign-In via Google Identity Services (same web client ID as the mobile app)
// NOTE: the site origin (e.g. http://localhost:5174) must be added to
// "Authorized JavaScript origins" for this client ID in Google Cloud Console.
import { useEffect, useRef } from 'react';
import toast from 'react-hot-toast';

const GOOGLE_WEB_CLIENT_ID =
  '783547595969-ffug97g5k2j2podl1lbike88eivp7pp1.apps.googleusercontent.com';

let gsiScriptPromise = null;
let gsiInitialized = false;
// Holds the callback of the currently mounted button (GSI only allows one initialize())
let activeCallback = null;

function loadGsiScript() {
  if (!gsiScriptPromise) {
    gsiScriptPromise = new Promise((resolve, reject) => {
      if (window.google?.accounts?.id) {
        resolve();
        return;
      }
      const script = document.createElement('script');
      script.src = 'https://accounts.google.com/gsi/client';
      script.async = true;
      script.onload = resolve;
      script.onerror = reject;
      document.head.appendChild(script);
    });
  }
  return gsiScriptPromise;
}

export default function GoogleSignInButton({ onIdToken }) {
  const buttonRef = useRef(null);
  const callbackRef = useRef(onIdToken);
  callbackRef.current = onIdToken;

  useEffect(() => {
    let cancelled = false;

    loadGsiScript()
      .then(() => {
        if (cancelled || !window.google?.accounts?.id || !buttonRef.current) return;

        // Initialize GSI exactly once for the whole app
        if (!gsiInitialized) {
          window.google.accounts.id.initialize({
            client_id: GOOGLE_WEB_CLIENT_ID,
            callback: (response) => {
              if (response.credential && activeCallback) {
                activeCallback(response.credential);
              }
            },
          });
          gsiInitialized = true;
        }

        // Route credentials to the currently mounted component
        activeCallback = (token) => callbackRef.current(token);

        // Render the button only if not already rendered (StrictMode double-mount)
        if (buttonRef.current.childElementCount === 0) {
          window.google.accounts.id.renderButton(buttonRef.current, {
            theme: 'outline',
            size: 'large',
            width: 320,
            text: 'continue_with',
          });
        }
      })
      .catch(() => {
        toast.error('Failed to load Google Sign-In');
      });

    return () => {
      cancelled = true;
    };
  }, []);

  return <div ref={buttonRef} style={{ display: 'flex', justifyContent: 'center' }} />;
}
