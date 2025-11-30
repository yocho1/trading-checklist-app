// src/pages/Account.jsx
import React, { useState, useEffect } from 'react'
import { User, Mail, Lock, Check } from 'lucide-react'
import { useAuth } from '../hooks/useAuth'

const Account = ({ onBack }) => {
  const { user, logout, updateProfile, requestEmailChange, confirmEmailChange, resendEmailChangeCode, cancelEmailChangeRequest, updatePassword } = useAuth()
  const [formData, setFormData] = useState({ name: '', email: '' })
  const [pwData, setPwData] = useState({ current: '', password: '', confirm: '' })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [pendingEmailChange, setPendingEmailChange] = useState(null)
  const [emailCode, setEmailCode] = useState('')

  useEffect(() => {
    if (user) setFormData({ name: user.name || '', email: user.email || '' })
    try {
      const pending = JSON.parse(sessionStorage.getItem('pendingEmailChange') || 'null')
      if (pending && pending.userId === (user && user.id)) setPendingEmailChange(pending)
      else setPendingEmailChange(null)
    } catch (e) {
      setPendingEmailChange(null)
    }
  }, [user])

  const handleSaveProfile = async (e) => {
    e.preventDefault()
    setError('')
    setSuccess('')
    setLoading(true)
    try {
      const result = await updateProfile(formData.name, formData.email)
      if (result.success) {
        if (result.user) {
          setSuccess('Profile updated')
        } else if (result.emailSent || result.verificationCode) {
          setSuccess('Verification code sent to your current email to confirm ownership')
          setPendingEmailChange({ userId: user.id, newEmail: formData.email, emailFailed: !result.emailSent, verificationCode: result.verificationCode })
        } else {
          setSuccess('Profile update initiated')
        }
      } else {
        setError(result.error || 'Failed to update profile')
      }
    } catch (err) {
      setError('Failed to update profile')
    } finally {
      setLoading(false)
    }
  }

  const handleChangePassword = async (e) => {
    e.preventDefault()
    setError('')
    setSuccess('')
    if (!pwData.password || pwData.password.length < 6) {
      setError('Password must be at least 6 characters')
      return
    }
    if (pwData.password !== pwData.confirm) {
      setError('Passwords do not match')
      return
    }
    setLoading(true)
    try {
      const result = await updatePassword(pwData.current, pwData.password)
      if (result.success) {
        setSuccess('Password updated successfully')
        setPwData({ current: '', password: '', confirm: '' })
      } else {
        setError(result.error || 'Failed to update password')
      }
    } catch (err) {
      setError('Failed to update password')
    } finally {
      setLoading(false)
    }
  }

  const handleConfirmEmailChange = async (e) => {
    e.preventDefault()
    setError('')
    setSuccess('')
    if (!emailCode) {
      setError('Enter the verification code')
      return
    }
    setLoading(true)
    try {
      const result = await confirmEmailChange(emailCode)
      if (result.success) {
        setSuccess('Email updated')
        setPendingEmailChange(null)
        setFormData(prev => ({ ...prev, email: result.user.email }))
      } else {
        setError(result.error || 'Failed to confirm email change')
      }
    } catch (err) {
      setError('Failed to confirm email change')
    } finally {
      setLoading(false)
    }
  }

  const handleResendEmailChange = async () => {
    setError('')
    setSuccess('')
    setLoading(true)
    try {
      const result = await resendEmailChangeCode()
      if (result.success) {
        setSuccess('Verification code resent')
        if (result.verificationCode) {
          setPendingEmailChange(prev => ({ ...prev, verificationCode: result.verificationCode }))
        }
      } else {
        setError(result.error || 'Failed to resend code')
      }
    } catch (err) {
      setError('Failed to resend code')
    } finally {
      setLoading(false)
    }
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center p-4">
        <div className="bg-slate-800 rounded-xl border border-slate-700 p-8 w-full max-w-md text-center">
          <User className="mx-auto text-emerald-400 mb-4" size={36} />
          <h2 className="text-xl font-bold text-white mb-2">No account found</h2>
          <p className="text-slate-400 mb-6">Please login first</p>
          <button className="bg-emerald-600 px-4 py-2 rounded" onClick={onBack}>Back</button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-slate-900 p-6">
      <div className="max-w-5xl mx-auto">
        <div className="bg-slate-800 rounded-xl p-6 border border-slate-700 mb-6">
          <div className="flex items-center gap-4">
            <div className="bg-emerald-600 p-2 rounded-lg">
              <User className="text-white" size={20} />
            </div>
            <div>
              <h1 className="text-xl font-bold text-white">Account</h1>
              <p className="text-slate-400 text-sm">Manage your account details</p>
            </div>
          </div>
        </div>

        {/* Profile form */}
        <form onSubmit={handleSaveProfile} className="bg-slate-800 rounded-xl border border-slate-700 p-6 mb-6">
          <h3 className="text-lg font-bold text-white mb-4">Profile</h3>
          {error && <div className="bg-red-500/10 border border-red-500/20 p-3 rounded mb-4 text-red-400">{error}</div>}
          {success && <div className="bg-emerald-500/10 border border-emerald-500/20 p-3 rounded mb-4 text-emerald-400">{success}</div>}
          <label className="block text-slate-400 text-sm mb-1">Full Name</label>
          <input className="w-full mb-4 bg-slate-700 border border-slate-600 p-3 rounded text-white" value={formData.name} onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))} />
          <label className="block text-slate-400 text-sm mb-1">Email</label>
          <input className="w-full mb-4 bg-slate-700 border border-slate-600 p-3 rounded text-white" value={formData.email} onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))} />
          <div className="flex gap-2">
            <button type="submit" className="bg-emerald-600 px-4 py-2 rounded">Update Profile</button>
            <button type="button" onClick={() => setFormData({ name: user.name, email: user.email })} className="bg-slate-700 px-4 py-2 rounded">Reset</button>
          </div>
        </form>

        {/* Pending email change */}
        {pendingEmailChange && (
          <form onSubmit={handleConfirmEmailChange} className="bg-slate-800 rounded-xl border border-slate-700 p-6 mb-6">
            <h3 className="text-lg font-bold text-white mb-4">Confirm email change</h3>
            <div className="text-slate-400 mb-2">A verification code was sent to your current email <strong>{user.email}</strong> to verify account ownership. Once confirmed, your account will be updated to <strong>{pendingEmailChange.newEmail}</strong>.</div>
            {pendingEmailChange.emailFailed && pendingEmailChange.verificationCode && (
              <div className="bg-yellow-500/10 border border-yellow-500/20 p-3 rounded mb-4 text-yellow-400">Dev Only: Fallback code (sent to {user.email}): {pendingEmailChange.verificationCode}</div>
            )}
            <label className="block text-slate-400 text-sm mb-1">Verification Code</label>
            <input value={emailCode} onChange={(e) => setEmailCode(e.target.value)} className="w-full mb-4 bg-slate-700 border border-slate-600 p-3 rounded text-white" />
            <div className="flex gap-2">
              <button type="submit" className="bg-emerald-600 px-4 py-2 rounded">Confirm Email</button>
              <button type="button" onClick={handleResendEmailChange} className="bg-slate-700 px-4 py-2 rounded">Resend Code</button>
              <button type="button" onClick={async () => {
                setLoading(true)
                setError('')
                setSuccess('')
                try {
                  const res = await cancelEmailChangeRequest()
                  if (res.success) {
                    setPendingEmailChange(null)
                  } else {
                    setError(res.error || 'Failed to cancel')
                  }
                } catch (err) {
                  setError('Failed to cancel request')
                } finally {
                  setLoading(false)
                }
              }} className="bg-red-600 px-4 py-2 rounded">Cancel</button>
            </div>
          </form>
        )}

        {/* Password change */}
        <form onSubmit={handleChangePassword} className="bg-slate-800 rounded-xl border border-slate-700 p-6 mb-6">
          <h3 className="text-lg font-bold text-white mb-4">Change Password</h3>
          <label className="block text-slate-400 text-sm mb-1">Current Password</label>
          <input type="password" className="w-full mb-4 bg-slate-700 border border-slate-600 p-3 rounded text-white" value={pwData.current} onChange={(e) => setPwData(prev => ({ ...prev, current: e.target.value }))} />
          <label className="block text-slate-400 text-sm mb-1">New Password</label>
          <input type="password" className="w-full mb-4 bg-slate-700 border border-slate-600 p-3 rounded text-white" value={pwData.password} onChange={(e) => setPwData(prev => ({ ...prev, password: e.target.value }))} />
          <label className="block text-slate-400 text-sm mb-1">Confirm Password</label>
          <input type="password" className="w-full mb-4 bg-slate-700 border border-slate-600 p-3 rounded text-white" value={pwData.confirm} onChange={(e) => setPwData(prev => ({ ...prev, confirm: e.target.value }))} />
          <div className="flex gap-2">
            <button type="submit" className="bg-emerald-600 px-4 py-2 rounded">Change Password</button>
            <button type="button" onClick={() => setPwData({ current: '', password: '', confirm: '' })} className="bg-slate-700 px-4 py-2 rounded">Reset</button>
          </div>
        </form>

        <div className="flex items-center gap-2">
          <button onClick={logout} className="bg-red-600 px-4 py-2 rounded text-white">Logout</button>
          <button onClick={onBack} className="bg-slate-700 px-4 py-2 rounded">Back</button>
        </div>
      </div>
    </div>
  )
}

export default Account
