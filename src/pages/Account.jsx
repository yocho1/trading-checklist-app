// src/pages/Account.jsx
import React, { useState, useEffect } from 'react'
import { User, Mail, Lock, Check } from 'lucide-react'
import { useAuth } from '../hooks/useAuth'

const Account = ({ onBack }) => {
  const { user, logout, updateProfile, updatePassword } = useAuth()
  const [formData, setFormData] = useState({ name: '', email: '' })
  const [pwData, setPwData] = useState({ current: '', password: '', confirm: '' })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  useEffect(() => {
    if (user) setFormData({ name: user.name || '', email: user.email || '' })
  }, [user])

  const handleSaveProfile = async (e) => {
    e.preventDefault()
    setError('')
    setSuccess('')
    setLoading(true)
    try {
      const result = await updateProfile(formData.name, formData.email)
      if (result.success) {
        setSuccess('Profile updated')
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
