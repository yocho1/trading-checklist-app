import React, { useState, useEffect } from 'react';
import { UserPlus, Mail, Lock, User, AlertCircle } from 'lucide-react';
import GoogleLoginButton from './GoogleLoginButton';
import { emailService } from '../../utils/emailService';
import EmailVerification from './EmailVerification';

const Register = ({ onRegister, onSwitchToLogin, onGoogleLogin, onVerify, onResendCode }) => {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: ''
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [showVerification, setShowVerification] = useState(false);
  const [pendingUser, setPendingUser] = useState(null);
  const [success, setSuccess] = useState('');

  const handleGoogleResponse = async (response) => {
    setLoading(true);
    setError('');
    
    const result = await onGoogleLogin(response);
    
    if (!result.success) {
      setError(result.error);
    }
    
    setLoading(false);
  };

  useEffect(() => {
    // Initialize Google OAuth
    if (window.google) {
      window.google.accounts.id.initialize({
        client_id: '673123551784-s1psrnhegc2lf6gurbg1r825i86fmvmq.apps.googleusercontent.com',
        callback: handleGoogleResponse,
        context: 'signin',
        ux_mode: 'popup'
      });
    }
  }, []);

  // If reload occurred after registration and pending verification exists, show verification screen
  useEffect(() => {
    const pending = sessionStorage.getItem('pendingVerification')
    if (pending) {
      try {
        const data = JSON.parse(pending)
        setShowVerification(true)
        setPendingUser({ email: data.email, name: formData.name || data.name || '' })
        setSuccess('Registration pending verification. Use the code sent to your email (or displayed on-screen if email failed).')
      } catch (err) {
        // ignore
      }
    }
  }, [])

  useEffect(() => {
    // Surface any persisted registration errors (e.g., duplicate email) after a reload
    const storedError = sessionStorage.getItem('registerError')
    if (storedError) {
      setError(storedError)
      sessionStorage.removeItem('registerError')
    }
  }, [])

  const handleSubmit = async (e) => {
    e.preventDefault(); // Prevent default form submission
    console.log('Register: Form submitted');
    
    setLoading(true);
    setError('');
    setSuccess('');

    // Check if passwords match
    if (formData.password !== formData.confirmPassword) {
      setError('Passwords do not match');
      setLoading(false);
      return;
    }

    // Validate password length
    if (formData.password.length < 6) {
      setError('Password must be at least 6 characters long');
      setLoading(false);
      return;
    }

    try {
      console.log('Register: Calling onRegister with:', { 
        name: formData.name, 
        email: formData.email 
      });
      
      const result = await onRegister(formData.name, formData.email, formData.password);
      console.log('Register: Registration result:', result);
      
      if (result.success) {
        // Registration successful, show verification screen
        console.log('Register: Showing verification screen');
        setShowVerification(true);
        setPendingUser({ 
          email: formData.email,
          name: formData.name 
        });
        setSuccess(result.message || 'Registration successful! Please verify your email.');
        
        // If email failed, show the code
        if (result.verificationCode) {
          console.log('Verification code:', result.verificationCode);
          // Store in sessionStorage for the verification component
          sessionStorage.setItem('pendingVerification', JSON.stringify({
            email: formData.email,
            code: result.verificationCode,
            emailFailed: true
          }));
        }
      } else {
        console.log('Register: Registration failed:', result.error);
        setError(result.error || 'Registration failed. Please try again.');
        sessionStorage.setItem('registerError', result.error || 'Registration failed. Please try again.')
        // Clear any old verification codes from sessionStorage
        sessionStorage.removeItem('pendingVerification');
        // Make sure we're not showing the verification screen
        setShowVerification(false);
        if (result.emailError || result.details) {
          console.warn('Register: email error/details:', result.emailError, result.details)
          setError(prev => prev + (result.emailError ? ' - ' + result.emailError : '') + (result.details ? ' - ' + result.details : ''))
        }
      }
    } catch (error) {
      console.error('Register: Unexpected error:', error);
      setError('An unexpected error occurred. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // Dev-only: send test email to verify EmailJS settings
  const handleSendTestEmail = async () => {
    if (!formData.email) {
      setError('Enter an email to send a test')
      return
    }
    setLoading(true)
    setError('')
    try {
      // include a test code value to preview in the template (if template uses a `code` or `verification_code` variable)
      const testCode = Math.floor(100000 + Math.random() * 900000).toString()
      const result = await emailService.sendTestEmail(
        formData.email,
        formData.name || 'Dev Test',
        testCode
      )
      if (result.success) {
        setSuccess('Test email sent. Check your inbox or spam.')
      } else {
        setError(result.error || 'Failed to send test email')
        if (result.details) {
          console.warn('EmailJS test details:', result.details)
          setError(prev => prev + (result.details ? ' - ' + result.details : ''))
        }
      }
    } catch (err) {
      console.error('Send test email failed', err)
      setError('Failed to send test email')
    } finally {
      setLoading(false)
    }
  }

  // Show verification component if needed (but NOT if there's an error)
  if (showVerification && pendingUser && !error) {
    return (
      <EmailVerification
        email={pendingUser.email}
        onVerify={onVerify}
        onBack={() => {
          setShowVerification(false);
          setPendingUser(null);
          setSuccess('');
        }}
        onResendCode={onResendCode}
      />
    );
  }

  console.log('Register: Rendering form. Error:', error, 'Loading:', loading, 'ShowVerification:', showVerification);

  return (
    <div className="min-h-screen bg-slate-900 flex items-center justify-center p-4">
      <div className="bg-slate-800 rounded-xl border border-slate-700 p-8 w-full max-w-md">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="flex justify-center mb-4">
            <div className="bg-emerald-600 p-3 rounded-lg">
              <UserPlus className="text-white" size={32} />
            </div>
          </div>
          <h1 className="text-2xl font-bold text-white mb-2">Create Account</h1>
          <p className="text-slate-400">Start your trading journal</p>
        </div>

        {/* Error Message */}
        {error && (
          <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-4 mb-6 flex items-center gap-3">
            <AlertCircle className="text-red-400" size={20} />
            <span className="text-red-400 text-sm">{error}</span>
          </div>
        )}

        {/* Success Message */}
        {success && !showVerification && (
          <div className="bg-emerald-500/10 border border-emerald-500/20 rounded-lg p-4 mb-6 flex items-center gap-3">
            <AlertCircle className="text-emerald-400" size={20} />
            <span className="text-emerald-400 text-sm">{success}</span>
          </div>
        )}

        {/* Google Sign In Button */}
        {onGoogleLogin && (
          <>
            <GoogleLoginButton
              onSuccess={handleGoogleResponse}
              onError={(error) => {
                setError(error || 'Google login failed');
              }}
            />

            <div className="relative mb-6">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-slate-600"></div>
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="px-2 bg-slate-800 text-slate-400">Or continue with email</span>
              </div>
            </div>
          </>
        )}

        {/* Register Form */}
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Name */}
          <div>
            <label className="block text-slate-400 text-sm font-medium mb-2">
              Full Name
            </label>
            <div className="relative">
              <User className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400" size={20} />
              <input
                type="text"
                value={formData.name}
                onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                placeholder="Enter your full name"
                className="w-full bg-slate-700 border border-slate-600 rounded-lg pl-10 pr-4 py-3 text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                required
              />
            </div>
          </div>

          {/* Email */}
          <div>
            <label className="block text-slate-400 text-sm font-medium mb-2">
              Email Address
            </label>
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400" size={20} />
              <input
                type="email"
                value={formData.email}
                onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
                placeholder="Enter your email"
                className="w-full bg-slate-700 border border-slate-600 rounded-lg pl-10 pr-4 py-3 text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                required
              />
            </div>
            {/* Dev-only send test email button */}
            {process.env.REACT_APP_ENABLE_TEST_EMAIL === 'true' && (
              <div className="mt-2 flex justify-end">
                <button
                  type="button"
                  onClick={handleSendTestEmail}
                  className="text-sm text-emerald-400 hover:text-emerald-300"
                >
                  Send test email
                </button>
              </div>
            )}
          </div>

          {/* Password */}
          <div>
            <label className="block text-slate-400 text-sm font-medium mb-2">
              Password
            </label>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400" size={20} />
              <input
                type="password"
                value={formData.password}
                onChange={(e) => setFormData(prev => ({ ...prev, password: e.target.value }))}
                placeholder="Enter your password (min 6 characters)"
                className="w-full bg-slate-700 border border-slate-600 rounded-lg pl-10 pr-4 py-3 text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                required
                minLength="6"
              />
            </div>
          </div>

          {/* Confirm Password */}
          <div>
            <label className="block text-slate-400 text-sm font-medium mb-2">
              Confirm Password
            </label>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400" size={20} />
              <input
                type="password"
                value={formData.confirmPassword}
                onChange={(e) => setFormData(prev => ({ ...prev, confirmPassword: e.target.value }))}
                placeholder="Confirm your password"
                className="w-full bg-slate-700 border border-slate-600 rounded-lg pl-10 pr-4 py-3 text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                required
                minLength="6"
              />
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
                Creating Account...
              </>
            ) : (
              <>
                <UserPlus size={20} />
                Create Account
              </>
            )}
          </button>
        </form>

        {/* Switch to Login */}
        <div className="text-center mt-6">
          <p className="text-slate-400">
            Already have an account?{' '}
            <button
              type="button" // Add type="button" to prevent form submission
              onClick={onSwitchToLogin}
              className="text-emerald-400 hover:text-emerald-300 font-medium transition-colors"
            >
              Sign in
            </button>
          </p>
        </div>
      </div>
    </div>
  );
};

export default Register;