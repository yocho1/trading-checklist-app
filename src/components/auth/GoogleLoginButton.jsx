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
        // Use process.env for Create React App
        const clientId = process.env.REACT_APP_GOOGLE_CLIENT_ID;
        
        console.log('Google Client ID:', clientId); // Add this for debugging
        
        if (!clientId) {
          console.error('Google Client ID not found. Please set REACT_APP_GOOGLE_CLIENT_ID in your .env file');
          onError?.('Google authentication configuration missing');
          return;
        }

        window.google.accounts.id.initialize({
          client_id: clientId,
          callback: (response) => {
            console.log('Google auth response:', response);
            onSuccess(response);
          },
          auto_select: false,
          cancel_on_tap_outside: true,
        });

        if (buttonRef.current) {
     window.google.accounts.id.renderButton(buttonRef.current, {
  theme: 'outline',
  size: 'large',
  text: 'continue_with',
  width: 400, // Change from '100%' to a number
  type: 'standard'
});

          // Optional: Also show the One Tap prompt
          window.google.accounts.id.prompt();
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
      <div ref={buttonRef} className="w-full"></div>
    </div>
  );
};

export default GoogleLoginButton;