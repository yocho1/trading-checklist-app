// src/hooks/useAuth.js
import { useState, useEffect } from 'react'
import auth from '../utils/auth'

export const useAuth = () => {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    // Check if user is already logged in
    const currentUser = auth.getCurrentUser()
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
      if (result.success) {
        setUser(result.user)
      }
      return result
    } catch (error) {
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
      const result = await auth.verifyEmail(email, code)
      if (result.success) {
        setUser(result.user)
      }
      return result
    } catch (error) {
      throw error
    } finally {
      setLoading(false)
    }
  }

  const resendVerificationCode = async (email) => {
    try {
      setLoading(true)
      const result = await auth.resendVerificationCode(email)
      return result
    } catch (error) {
      throw error
    } finally {
      setLoading(false)
    }
  }

  const updateProfile = async (name, email) => {
    try {
      setLoading(true)
      const result = await auth.updateProfile(name, email)
      if (result.success) {
        setUser(result.user)
      }
      return result
    } catch (error) {
      throw error
    } finally {
      setLoading(false)
    }
  }

  const updatePassword = async (currentPassword, newPassword) => {
    try {
      setLoading(true)
      const result = await auth.updatePassword(currentPassword, newPassword)
      return result
    } catch (error) {
      throw error
    } finally {
      setLoading(false)
    }
  }

  const googleLogin = async (response) => {
    try {
      setLoading(true)
      const result = await auth.handleGoogleResponse(response)
      if (result.success) {
        setUser(result.user)
      }
      return result
    } catch (error) {
      throw error
    } finally {
      setLoading(false)
    }
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
    updateProfile,
    updatePassword,
    googleLogin,
    logout,
    loading,
  }
}
