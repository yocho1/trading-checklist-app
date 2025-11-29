import React, { useState } from 'react';
import { UserPlus, Mail, Lock, User, AlertCircle } from 'lucide-react';
import GoogleLoginButton from './GoogleLoginButton';
import EmailVerification from './EmailVerification';

// Update the component to accept onVerify and onResendCode props
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

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    // Validation
    if (formData.password !== formData.confirmPassword) {
      setError('Passwords do not match');
      setLoading(false);
      return;
    }

    if (formData.password.length < 6) {
      setError('Password must be at least 6 characters');
      setLoading(false);
      return;
    }

    const result = await onRegister({
      name: formData.name,
      email: formData.email,
      password: formData.password
    });

    if (result.success) {
      if (result.requiresVerification) {
        setPendingUser(result.user);
        setShowVerification(true);
      }
    } else {
      setError(result.error);
    }

    setLoading(false);
  };

  // Show verification component if needed
  if (showVerification && pendingUser) {
    return (
      <EmailVerification
        email={pendingUser.email}
        onVerify={onVerify} // Use the prop passed from App.jsx
        onBack={() => setShowVerification(false)}
        onResendCode={onResendCode} // Use the prop passed from App.jsx
      />
    );
  }

  // Your existing registration form JSX
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

        {/* Google Sign In Button */}
        {onGoogleLogin && (
          <>
            <GoogleLoginButton
              onSuccess={async (response) => {
                const result = await onGoogleLogin(response);
                if (!result.success) {
                  setError(result.error);
                }
              }}
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