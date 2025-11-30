// src/components/auth/GoogleLoginButton.jsx
import React, { useEffect, useRef } from 'react';

const GoogleLoginButton = ({ onSuccess, onError }) => {
  const buttonRef = useRef(null);

  useEffect(() => {
    const loadGoogleScript = () => {
      if (window.google) {
        initializeGoogle();
        return;
      }

      const script = document.createElement('script');
      script.src = 'https://accounts.google.com/gsi/client';
      script.async = true;
      script.defer = true;
      script.onload = initializeGoogle;
      script.onerror = () => {
        console.error('Failed to load Google Identity Services');
        onError?.('Failed to load Google authentication');
      };
      document.head.appendChild(script);
    };

    const initializeGoogle = () => {
      try {
        const clientId = process.env.REACT_APP_GOOGLE_CLIENT_ID;
        const appDomain = process.env.REACT_APP_APP_DOMAIN || window.location.origin;
        console.log('Google Client ID:', clientId);
        console.log('Expected app domain (REACT_APP_APP_DOMAIN):', appDomain);
        console.log('Current window origin:', window.location.origin);
        
        if (!clientId) {
          console.error('Google Client ID not found. Please set REACT_APP_GOOGLE_CLIENT_ID in your .env file');
          onError?.('Google authentication configuration missing');
          return;
        }

        // Check for app domain mismatch which frequently causes GSI origin 403.
        if (appDomain && window.location.origin && appDomain !== window.location.origin) {
          console.warn(
            'Google origin mismatch: REACT_APP_APP_DOMAIN does not match window.location.origin. This often causes "origin not allowed" errors in GSI. Expected:',
            appDomain,
            'Actual:',
            window.location.origin
          )
          // Provide a non-blocking error to the consumer
          onError?.('Google Identity origin mismatch. Check OAuth Authorized origins in your Google Cloud Console.');
        }

        window.google.accounts.id.initialize({
          client_id: clientId,
          callback: (response) => {
            console.log('Google auth response:', response);
            onSuccess(response);
          },
          auto_select: false,
          cancel_on_tap_outside: true,
          use_fedcm_for_prompt: false, // DISABLE FedCM
        });

        if (buttonRef.current) {
          window.google.accounts.id.renderButton(buttonRef.current, {
            theme: 'outline',
            size: 'large',
            text: 'continue_with',
            width: 400,
            type: 'standard'
          });

          // Don't show the One Tap prompt to avoid conflicts
          // window.google.accounts.id.prompt();
        }
      } catch (error) {
        console.error('Error initializing Google Auth:', error);
        onError?.('Google authentication initialization failed');
      }
    };

    loadGoogleScript();

    // Cleanup function
    return () => {
      if (window.google) {
        window.google.accounts.id.cancel();
      }
    };
  }, [onSuccess, onError]);

  return (
    <div className="w-full">
      <div ref={buttonRef} className="w-full flex justify-center"></div>
    </div>
  );
};

export default GoogleLoginButton;