import { useState, useEffect } from 'react'
import { auth } from '../utils/auth'

export const useAuth = () => {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const currentUser = auth.getCurrentUser()
    setUser(currentUser)
    setLoading(false)
  }, [])

  const login = async (email, password) => {
    const result = auth.login(email, password)
    if (result.success) {
      setUser(result.user)
    }
    return result
  }

  const register = async (userData) => {
    const result = auth.register(userData)
    if (result.success && !result.requiresVerification) {
      setUser(result.user)
    }
    return result
  }

  const verifyEmail = async (email, code) => {
    const result = auth.verifyEmail(email, code)
    if (result.success) {
      setUser(result.user)
    }
    return result
  }

  const resendVerificationCode = async (email) => {
    return auth.resendVerificationCode(email)
  }

  const googleLogin = async (googleResponse) => {
    console.log('Starting Google login process...')
    const result = await auth.handleGoogleResponse(googleResponse)
    if (result.success) {
      setUser(result.user)
    }
    return result
  }

  const logout = () => {
    auth.logout()
    setUser(null)
  }

  return {
    user,
    login,
    register,
    verifyEmail,
    resendVerificationCode,
    googleLogin,
    logout,
    loading,
    isAuthenticated: !!user,
  }
}
