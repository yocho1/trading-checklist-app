import React, { useState, useEffect } from 'react';
import { Mail, ArrowLeft, RotateCcw, CheckCircle, AlertCircle } from 'lucide-react';

const EmailVerification = ({ email, onVerify, onBack, onResendCode }) => {
  const [code, setCode] = useState(['', '', '', '', '', '']);
  const [loading, setLoading] = useState(false);
  const [resendLoading, setResendLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [timeLeft, setTimeLeft] = useState(30);
  const [verificationCode, setVerificationCode] = useState('');
  const [isVerified, setIsVerified] = useState(false);

  // Get the verification code from sessionStorage for demo purposes
  useEffect(() => {
    const pendingVerification = sessionStorage.getItem('pendingVerification');
    if (pendingVerification) {
      const data = JSON.parse(pendingVerification);
      setVerificationCode(data.code);
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

    const verificationCode = code.join('');
    
    if (verificationCode.length !== 6) {
      setError('Please enter the 6-digit verification code');
      setLoading(false);
      return;
    }

    const result = await onVerify(email, verificationCode);
    
    if (result.success) {
      setSuccess('Email verified successfully! Redirecting...');
      setIsVerified(true);
      // Redirect after successful verification
      setTimeout(() => {
        window.location.reload(); // This will reload the app and show the main dashboard
      }, 2000);
    } else {
      setError(result.error);
    }
    
    setLoading(false);
  };

  const handleResendCode = async () => {
    setResendLoading(true);
    setError('');
    setSuccess('');

    const result = await onResendCode(email);
    
    if (result.success) {
      setSuccess('Verification code sent successfully!');
      setTimeLeft(30); // Reset cooldown
      setVerificationCode(result.verificationCode); // For demo
    } else {
      setError(result.error);
    }
    
    setResendLoading(false);
  };

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

          {/* Demo Only - Show verification code */}
          {verificationCode && (
            <div className="mt-4 p-3 bg-yellow-500/10 border border-yellow-500/20 rounded-lg">
              <p className="text-yellow-400 text-sm text-center">
                <strong>Demo Only:</strong> Verification code: {verificationCode}
              </p>
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
                  required
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