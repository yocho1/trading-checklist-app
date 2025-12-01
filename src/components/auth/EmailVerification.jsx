// src/components/auth/EmailVerification.jsx
import React, { useState, useEffect } from 'react';
import { Mail, ArrowLeft, RotateCcw, CheckCircle, AlertCircle, Send, Copy } from 'lucide-react';

const EmailVerification = ({ email, onVerify, onBack, onResendCode }) => {
  const [code, setCode] = useState(['', '', '', '', '', '']);
  const [loading, setLoading] = useState(false);
  const [resendLoading, setResendLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [timeLeft, setTimeLeft] = useState(30);
  const [verificationCode, setVerificationCode] = useState('');
  const [isVerified, setIsVerified] = useState(false);
  const [emailFailed, setEmailFailed] = useState(false);

  // Get the verification code from sessionStorage
  useEffect(() => {
    const pendingVerification = sessionStorage.getItem('pendingVerification');
    console.log('EmailVerification: pendingVerification from sessionStorage:', pendingVerification);
    if (pendingVerification) {
      const data = JSON.parse(pendingVerification);
      setVerificationCode(data.code);
      if (data.code && data.code.length === 6) {
        setCode(data.code.split(''));
      }
      setEmailFailed(data.emailFailed || false);
      console.log('EmailVerification: Loaded verification code:', data.code, 'emailFailed:', data.emailFailed);
    }
  }, []);

  // Countdown timer for resend button
  useEffect(() => {
    if (timeLeft > 0) {
      const timer = setTimeout(() => setTimeLeft(timeLeft - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [timeLeft]);

  const handleCodeChange = (index, value) => {
    if (value.length <= 1 && /^\d*$/.test(value)) {
      const newCode = [...code];
      newCode[index] = value;
      setCode(newCode);

      // Auto-focus next input
      if (value && index < 5) {
        const nextInput = document.getElementById(`code-${index + 1}`);
        if (nextInput) nextInput.focus();
      }
    }
  };

  const handleKeyDown = (index, e) => {
    if (e.key === 'Backspace' && !code[index] && index > 0) {
      const prevInput = document.getElementById(`code-${index - 1}`);
      if (prevInput) prevInput.focus();
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    const enteredCode = code.join('');
    
    // Check if code is complete
    if (enteredCode.length !== 6) {
      setError('Please enter the complete 6-digit verification code');
      setLoading(false);
      return;
    }

    console.log('EmailVerification: Submitting code:', enteredCode, 'for email:', email);
    
    try {
      const result = await onVerify(email, enteredCode);
      console.log('EmailVerification: Verification result:', result);
      
      if (result.success) {
        setSuccess('Email verified successfully! Redirecting...');
        setIsVerified(true);
        
        // Store user in localStorage
        if (result.user) {
          localStorage.setItem('currentUser', JSON.stringify(result.user));
          console.log('EmailVerification: User stored in localStorage:', result.user);
        }
        
        // Redirect to dashboard after a short delay
        setTimeout(() => {
          // Use window.location.href for full page navigation
          window.location.href = '/dashboard';
        }, 1500);
      } else {
        setError(result.error || 'Verification failed');
        // Clear inputs on error
        setCode(['', '', '', '', '', '']);
        // Focus first input
        const firstInput = document.getElementById('code-0');
        if (firstInput) firstInput.focus();
      }
    } catch (error) {
      console.error('EmailVerification: Error during verification:', error);
      setError('An error occurred during verification');
    } finally {
      setLoading(false);
    }
  };

  const handleResendCode = async () => {
    setResendLoading(true);
    setError('');
    setSuccess('');

    console.log('EmailVerification: Resending code to:', email);
    
    try {
      const result = await onResendCode(email);
      console.log('EmailVerification: Resend result:', result);
      
      if (result.success) {
        if (result.verificationCode) {
          // Email failed, show code on screen
          setVerificationCode(result.verificationCode);
          setEmailFailed(true);
          setSuccess('Email service unavailable. Use the code below: (copy it to paste into the field)');
        } else {
          // Email sent successfully
          setEmailFailed(false);
          setSuccess('Verification code sent to your email!');
        }
        setTimeLeft(30);
      } else {
        setError(result.error || 'Failed to resend code');
      }
    } catch (error) {
      console.error('EmailVerification: Error resending code:', error);
      setError('Failed to resend verification code');
    } finally {
      setResendLoading(false);
    }
  };

  const handlePasteAndVerify = async () => {
    if (!verificationCode) return;
    
    // Fill UI input fields with code
    const digits = verificationCode.split('')
    setCode(digits)
    
    // Try verification using onVerify
    setLoading(true)
    setError('')
    
    try {
      const result = await onVerify(email, verificationCode)
      if (result.success) {
        setSuccess('Email verified successfully! Redirecting...')
        setIsVerified(true)
        
        // Store user in localStorage
        if (result.user) {
          localStorage.setItem('currentUser', JSON.stringify(result.user));
          console.log('EmailVerification (paste): User stored in localStorage:', result.user);
        }
        
        // Redirect to dashboard
        setTimeout(() => {
          window.location.href = '/dashboard';
        }, 1500)
      } else {
        setError(result.error || 'Verification failed')
      }
    } catch (err) {
      console.error('EmailVerification: Paste and verify failed', err)
      setError('Verification failed')
    } finally {
      setLoading(false)
    }
  }

  // If already verified, show success message
  if (isVerified) {
    return (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center p-4">
        <div className="bg-slate-800 rounded-xl border border-slate-700 p-8 w-full max-w-md text-center">
          <div className="flex justify-center mb-4">
            <div className="bg-emerald-600 p-3 rounded-lg">
              <CheckCircle className="text-white" size={32} />
            </div>
          </div>
          <h1 className="text-2xl font-bold text-white mb-2">Email Verified!</h1>
          <p className="text-slate-400 mb-4">
            Your email <span className="text-emerald-400">{email}</span> has been successfully verified.
          </p>
          <p className="text-slate-500 text-sm">
            Redirecting to your dashboard...
          </p>
          <div className="mt-6">
            <div className="animate-spin rounded-full h-8 w-8 border-4 border-emerald-500 border-t-transparent mx-auto"></div>
          </div>
        </div>
      </div>
    );
  }

  const handleCopyCode = async () => {
    if (!verificationCode) return;
    try {
      await navigator.clipboard.writeText(verificationCode);
      setSuccess('Code copied to clipboard');
    } catch (error) {
      console.error('EmailVerification: Failed to copy code', error);
      setError('Could not copy code. Please highlight and copy manually.');
    }
  };

  return (
    <div className="min-h-screen bg-slate-900 flex items-center justify-center p-4">
      <div className="bg-slate-800 rounded-xl border border-slate-700 p-8 w-full max-w-md">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="flex justify-center mb-4">
            <div className="bg-emerald-600 p-3 rounded-lg">
              <Mail className="text-white" size={32} />
            </div>
          </div>
          <h1 className="text-2xl font-bold text-white mb-2">Verify Your Email</h1>
          <p className="text-slate-400 mb-2">
            We sent a verification code to <span className="text-emerald-400">{email}</span>
          </p>
          <p className="text-slate-500 text-sm">
            Enter the 6-digit code below to complete your registration
          </p>

          {/* Email Status */}
          {emailFailed ? (
            <div className="mt-4 p-3 bg-yellow-500/10 border border-yellow-500/20 rounded-lg">
              <div className="flex items-center gap-2 justify-center mb-2">
                <Send className="text-yellow-400" size={16} />
                <p className="text-yellow-400 text-sm font-medium">Email Service Unavailable</p>
              </div>
              <div className="text-sm text-center">
                <p className="text-yellow-400">Use this verification code shown below:</p>
                <div className="flex items-center justify-center gap-2 mt-2">
                  <strong className="bg-slate-700 text-white px-4 py-2 rounded-md">{verificationCode}</strong>
                  <div className="flex items-center gap-2">
                  <button
                    type="button"
                    className="text-yellow-300 hover:text-white ml-2 px-3 py-2 rounded-md border border-yellow-300"
                    onClick={handleCopyCode}
                  >
                    <Copy size={14} />
                    <span className="ml-2">Copy</span>
                  </button>
                  <button
                    type="button"
                    className="text-yellow-300 hover:text-white ml-2 px-3 py-2 rounded-md border border-yellow-300"
                    onClick={handlePasteAndVerify}
                  >
                    <span className="ml-2">Paste & Verify</span>
                  </button>
                  </div>
                </div>
              </div>
            </div>
          ) : verificationCode ? (
            <div className="mt-4 p-3 bg-blue-500/10 border border-blue-500/20 rounded-lg">
              <p className="text-blue-400 text-sm text-center">
                <strong>Development Mode:</strong> Code: {verificationCode}
                <span className="inline-flex items-center gap-2 ml-2">
                <button
                  type="button"
                  className="inline-flex items-center gap-2 text-blue-300 hover:text-white px-2 py-1 rounded-md border border-blue-300"
                  onClick={handleCopyCode}
                >
                  <Copy size={14} /> Copy
                </button>
                <button
                  type="button"
                  className="inline-flex items-center gap-2 text-blue-300 hover:text-white px-2 py-1 rounded-md border border-blue-300"
                  onClick={handlePasteAndVerify}
                >
                  Paste & Verify
                </button>
                </span>
              </p>
            </div>
          ) : (
            <div className="mt-4 p-3 bg-emerald-500/10 border border-emerald-500/20 rounded-lg">
                <div className="flex items-center gap-2 justify-center">
                <Send className="text-emerald-400" size={16} />
                <p className="text-emerald-400 text-sm">Verification code sent to your email</p>
              </div>
            </div>
          )}
        </div>

        {/* Error Message */}
        {error && (
          <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-4 mb-6 flex items-center gap-3">
            <AlertCircle className="text-red-400" size={20} />
            <span className="text-red-400 text-sm">{error}</span>
          </div>
        )}

        {/* Success Message */}
        {success && (
          <div className="bg-emerald-500/10 border border-emerald-500/20 rounded-lg p-4 mb-6 flex items-center gap-3">
            <CheckCircle className="text-emerald-400" size={20} />
            <span className="text-emerald-400 text-sm">{success}</span>
          </div>
        )}

        {/* Verification Form */}
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Code Inputs */}
          <div>
            <label className="block text-slate-400 text-sm font-medium mb-4 text-center">
              Enter verification code
            </label>
            <div className="flex justify-center gap-2">
              {code.map((digit, index) => (
                <input
                  key={index}
                  id={`code-${index}`}
                  type="text"
                  value={digit}
                  onChange={(e) => handleCodeChange(index, e.target.value)}
                  onKeyDown={(e) => handleKeyDown(index, e)}
                  className="w-12 h-12 bg-slate-700 border border-slate-600 rounded-lg text-white text-center text-xl font-semibold focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  maxLength={1}
                />
              ))}
            </div>
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            disabled={loading}
            className="w-full bg-emerald-600 hover:bg-emerald-500 disabled:bg-slate-600 text-white font-semibold py-3 px-4 rounded-lg transition-colors flex items-center justify-center gap-2"
          >
            {loading ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent"></div>
                Verifying...
              </>
            ) : (
              <>
                <CheckCircle size={20} />
                Verify Email
              </>
            )}
          </button>
        </form>

        {/* Resend Code */}
        <div className="text-center mt-6 space-y-4">
          <button
            onClick={handleResendCode}
            disabled={resendLoading || timeLeft > 0}
            className="text-emerald-400 hover:text-emerald-300 font-medium transition-colors flex items-center justify-center gap-2 mx-auto disabled:text-slate-500"
          >
            {resendLoading ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-2 border-emerald-400 border-t-transparent"></div>
                Sending...
              </>
            ) : (
              <>
                <RotateCcw size={16} />
                {timeLeft > 0 ? `Resend code in ${timeLeft}s` : 'Resend verification code'}
              </>
            )}
          </button>

          {/* Back to Register */}
          <div>
            <button
              onClick={onBack}
              className="text-slate-400 hover:text-slate-300 font-medium transition-colors flex items-center justify-center gap-2 mx-auto"
            >
              <ArrowLeft size={16} />
              Back to registration
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default EmailVerification;