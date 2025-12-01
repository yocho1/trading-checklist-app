// src/hooks/useAuth.js
import { useState, useEffect } from 'react'
import auth from '../utils/auth'

export const useAuth = () => {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    // Check if user is already logged in
    const currentUser = auth.getCurrentUser()
    console.log(
      'useAuth useEffect: Current user from auth.getCurrentUser():',
      currentUser
    )
    setUser(currentUser)
    // Initialize auth utilities (e.g., EmailJS via auth.init())
    // This ensures emailService.init() runs and the public key is set.
    if (auth.init) {
      try {
        auth.init()
        console.log('useAuth: auth.init() called to initialize services')
      } catch (err) {
        console.error('useAuth: Failed to initialize auth services', err)
      }
    }
    setLoading(false)
  }, [])

  const login = async (email, password) => {
    try {
      setLoading(true)
      const result = await auth.login(email, password)
      console.log('useAuth.login: Result:', result)
      if (result.success) {
        console.log('useAuth.login: Setting user state:', result.user)
        setUser(result.user)
        // Also store in localStorage for immediate access
        localStorage.setItem('currentUser', JSON.stringify(result.user))
      }
      return result
    } catch (error) {
      console.error('useAuth.login: Error:', error)
      throw error
    } finally {
      setLoading(false)
    }
  }

  const register = async (name, email, password) => {
    try {
      setLoading(true)
      console.log('useAuth.register: Calling auth.register with:', {
        name,
        email,
      })
      const result = await auth.register(name, email, password)
      console.log('useAuth.register: Result from auth.register:', result)
      if (result?.emailError || result?.details) {
        console.warn(
          'useAuth.register: Email send error details:',
          result?.emailError,
          result?.details
        )
      }

      if (result.success) {
        // Don't set user immediately - wait for email verification
        console.log('Registration successful, verification required')
        console.log('Verification code:', result.verificationCode)

        // Store verification data for debugging
        const pendingVerification = sessionStorage.getItem(
          'pendingVerification'
        )
        console.log('Stored pendingVerification:', pendingVerification)
      } else {
        console.log('Registration failed:', result.error)
      }
      return result
    } catch (error) {
      console.error('useAuth.register: Error:', error)
      throw error
    } finally {
      setLoading(false)
    }
  }

  const verifyEmail = async (email, code) => {
    try {
      setLoading(true)
      console.log('useAuth.verifyEmail: calling auth.verifyEmail with', {
        email,
        code,
      })
      const result = await auth.verifyEmail(email, code)
      console.log(
        'useAuth.verifyEmail: Full result from auth.verifyEmail:',
        result
      )

      if (result.success) {
        console.log('useAuth.verifyEmail: Setting user state:', result.user)
        setUser(result.user)
        // Also store in localStorage for immediate access
        localStorage.setItem('currentUser', JSON.stringify(result.user))
        console.log('useAuth.verifyEmail: User stored in localStorage')
      } else {
        console.log('useAuth.verifyEmail: Verification failed:', result.error)
      }
      return result
    } catch (error) {
      console.error('useAuth.verifyEmail: Error:', error)
      throw error
    } finally {
      setLoading(false)
    }
  }

  const resendVerificationCode = async (email) => {
    try {
      setLoading(true)
      console.log('useAuth.resendVerificationCode: calling for email:', email)
      const result = await auth.resendVerificationCode(email)
      console.log('useAuth.resendVerificationCode: Result:', result)
      return result
    } catch (error) {
      console.error('useAuth.resendVerificationCode: Error:', error)
      throw error
    } finally {
      setLoading(false)
    }
  }

  const updateProfile = async (name, email) => {
    try {
      setLoading(true)
      console.log('useAuth.updateProfile: calling with', { name, email })
      const result = await auth.updateProfile(name, email)
      console.log('useAuth.updateProfile: Result:', result)
      if (result.success) {
        // If a user object is returned, update local state
        if (result.user) {
          setUser(result.user)
          localStorage.setItem('currentUser', JSON.stringify(result.user))
        }
        // If email change was requested, do not update user email until confirmation
        if (result.emailSent || result.verificationCode) {
          console.log('Email change requested for:', email)
        }
      }
      return result
    } catch (error) {
      console.error('useAuth.updateProfile: Error:', error)
      throw error
    } finally {
      setLoading(false)
    }
  }

  const requestEmailChange = async (newEmail) => {
    try {
      setLoading(true)
      console.log(
        'useAuth.requestEmailChange: calling with newEmail:',
        newEmail
      )
      const result = await auth.requestEmailChange(newEmail)
      console.log('useAuth.requestEmailChange: Result:', result)
      return result
    } catch (error) {
      console.error('useAuth.requestEmailChange: Error:', error)
      throw error
    } finally {
      setLoading(false)
    }
  }

  const confirmEmailChange = async (code) => {
    try {
      setLoading(true)
      console.log('useAuth.confirmEmailChange: calling with code:', code)
      const result = await auth.confirmEmailChange(code)
      console.log('useAuth.confirmEmailChange: Result:', result)
      if (result.success && result.user) {
        setUser(result.user)
        localStorage.setItem('currentUser', JSON.stringify(result.user))
      }
      return result
    } catch (error) {
      console.error('useAuth.confirmEmailChange: Error:', error)
      throw error
    } finally {
      setLoading(false)
    }
  }

  const resendEmailChangeCode = async () => {
    try {
      setLoading(true)
      console.log('useAuth.resendEmailChangeCode: calling')
      const result = await auth.resendEmailChangeCode()
      console.log('useAuth.resendEmailChangeCode: Result:', result)
      return result
    } catch (error) {
      console.error('useAuth.resendEmailChangeCode: Error:', error)
      throw error
    } finally {
      setLoading(false)
    }
  }

  const cancelEmailChangeRequest = async () => {
    try {
      setLoading(true)
      console.log('useAuth.cancelEmailChangeRequest: calling')
      const result = await auth.cancelEmailChangeRequest()
      console.log('useAuth.cancelEmailChangeRequest: Result:', result)
      return result
    } catch (error) {
      console.error('useAuth.cancelEmailChangeRequest: Error:', error)
      throw error
    } finally {
      setLoading(false)
    }
  }

  const updatePassword = async (currentPassword, newPassword) => {
    try {
      setLoading(true)
      console.log('useAuth.updatePassword: calling')
      const result = await auth.updatePassword(currentPassword, newPassword)
      console.log('useAuth.updatePassword: Result:', result)
      return result
    } catch (error) {
      console.error('useAuth.updatePassword: Error:', error)
      throw error
    } finally {
      setLoading(false)
    }
  }

  const googleLogin = async (response) => {
    try {
      setLoading(true)
      console.log('useAuth.googleLogin: calling')
      const result = await auth.handleGoogleResponse(response)
      console.log('useAuth.googleLogin: Result:', result)
      if (result.success) {
        setUser(result.user)
        localStorage.setItem('currentUser', JSON.stringify(result.user))
      }
      return result
    } catch (error) {
      console.error('useAuth.googleLogin: Error:', error)
      throw error
    } finally {
      setLoading(false)
    }
  }

  const logout = () => {
    console.log('useAuth.logout: calling')
    auth.logout()
    setUser(null)
    localStorage.removeItem('currentUser')
  }

  return {
    user,
    login,
    register,
    verifyEmail,
    resendVerificationCode,
    updateProfile,
    updatePassword,
    googleLogin,
    requestEmailChange,
    confirmEmailChange,
    resendEmailChangeCode,
    cancelEmailChangeRequest,
    logout,
    loading,
  }
}
