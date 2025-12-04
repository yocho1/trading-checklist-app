// src/hooks/useAuth.js
import { useState, useEffect, useCallback } from 'react'
import {
  registerUser,
  loginUser,
  verifyEmail,
  resendVerificationCode,
  googleLogin,
  logoutUser,
  checkAuth,
  initializeUserSampleData,
} from '../services/mockBackend'

export const useAuth = () => {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  // Helper to get demo user from localStorage
  const getDemoUser = useCallback(() => {
    try {
      const data = localStorage.getItem('trading_app_shared_data')
      if (data) {
        const parsed = JSON.parse(data)
        // Look for demo user by email or take first user
        const demoUser = parsed.users?.find(
          (u) => u.email.includes('demo') || u.email.includes('example')
        )
        if (demoUser) {
          return {
            id: demoUser.id,
            name: demoUser.name,
            email: demoUser.email,
            isVerified: demoUser.isVerified,
            createdAt: demoUser.createdAt,
            settings: demoUser.settings || {
              theme: 'dark',
              notifications: true,
              defaultTimeframe: '1h',
              riskPerTrade: 1,
            },
          }
        }
        // If no demo user, use first user
        if (parsed.users?.[0]) {
          const firstUser = parsed.users[0]
          return {
            id: firstUser.id,
            name: firstUser.name,
            email: firstUser.email,
            isVerified: firstUser.isVerified,
            createdAt: firstUser.createdAt,
            settings: firstUser.settings || {
              theme: 'dark',
              notifications: true,
              defaultTimeframe: '1h',
              riskPerTrade: 1,
            },
          }
        }
      }
    } catch (error) {
      console.error('Error getting demo user:', error)
    }
    return null
  }, [])

  // Set user with a small delay to ensure localStorage is ready
  const setUserWithDelay = useCallback((userData) => {
    setTimeout(() => {
      setUser(userData)
      setLoading(false)
    }, 100)
  }, [])

  // Check if user is already logged in on mount
  useEffect(() => {
    const initializeAuth = async () => {
      try {
        console.log('Initializing authentication...')

        // First, try to get demo user from localStorage
        const demoUser = getDemoUser()

        if (demoUser) {
          console.log('Demo user found, auto-logging in:', demoUser.email)
          setUser(demoUser)

          // Initialize sample data for this user
          await initializeUserSampleData(demoUser.id)
        } else {
          // Fall back to regular auth check
          console.log('No demo user found, checking regular auth...')
          const authResult = await checkAuth()
          if (authResult.authenticated) {
            console.log('Regular auth successful:', authResult.user.email)
            setUser(authResult.user)

            // Initialize sample data for new users
            if (authResult.user) {
              await initializeUserSampleData(authResult.user.id)
            }
          } else {
            console.log('No user authenticated')
          }
        }
      } catch (error) {
        console.error('Auth initialization failed:', error)

        // Create a fallback demo user
        const fallbackUser = {
          id: 'fallback_user_' + Date.now(),
          name: 'Demo Trader',
          email: 'demo@fallback.com',
          isVerified: true,
          createdAt: new Date().toISOString(),
          settings: {
            theme: 'dark',
            notifications: true,
            defaultTimeframe: '1h',
            riskPerTrade: 1,
          },
        }

        setUser(fallbackUser)

        // Initialize data for fallback user
        setTimeout(async () => {
          try {
            await initializeUserSampleData(fallbackUser.id)
          } catch (e) {
            console.error('Failed to initialize fallback data:', e)
          }
        }, 500)
      } finally {
        // Ensure loading stops after a timeout
        setTimeout(() => {
          setLoading(false)
        }, 1500)
      }
    }

    initializeAuth()

    // Listen for custom events to set user (for demo login)
    const handleSetUser = (event) => {
      setUser(event.detail)
      setLoading(false)
    }

    window.addEventListener('setUser', handleSetUser)

    return () => {
      window.removeEventListener('setUser', handleSetUser)
    }
  }, [getDemoUser])

  const login = async (email, password) => {
    setLoading(true)
    setError(null)

    try {
      console.log('Attempting login for:', email)
      const result = await loginUser(email, password)
      console.log('Login successful:', result.user.email)

      setUser(result.user)

      // Initialize sample data if needed
      await initializeUserSampleData(result.user.id)

      return { success: true }
    } catch (error) {
      console.error('Login failed:', error.message)
      setError(error.message)
      return { success: false, error: error.message }
    } finally {
      setLoading(false)
    }
  }

  const register = async (userData) => {
    setLoading(true)
    setError(null)

    try {
      console.log('Registering new user:', userData.email)
      const result = await registerUser(userData)
      console.log('Registration successful, user ID:', result.userId)

      return {
        success: true,
        userId: result.userId,
        verificationCode: result.verificationCode,
        email: userData.email,
      }
    } catch (error) {
      console.error('Registration failed:', error.message)
      setError(error.message)
      return { success: false, error: error.message }
    } finally {
      setLoading(false)
    }
  }

  const verifyEmailCode = async (email, code) => {
    setLoading(true)
    setError(null)

    try {
      console.log('Verifying email for:', email)
      const result = await verifyEmail(email, code)
      console.log('Email verification successful')

      // Auto-login after verification
      const loginResult = await loginUser(email, 'password123') // Password from registration
      if (loginResult.success) {
        setUser(loginResult.user)
      }

      return { success: true, message: result.message }
    } catch (error) {
      console.error('Email verification failed:', error.message)
      setError(error.message)
      return { success: false, error: error.message }
    } finally {
      setLoading(false)
    }
  }

  const resendCode = async (email) => {
    setLoading(true)
    setError(null)

    try {
      console.log('Resending verification code to:', email)
      const result = await resendVerificationCode(email)
      console.log('Verification code resent')

      return {
        success: true,
        message: result.message,
        verificationCode: result.verificationCode,
      }
    } catch (error) {
      console.error('Resend code failed:', error.message)
      setError(error.message)
      return { success: false, error: error.message }
    } finally {
      setLoading(false)
    }
  }

  const googleSignIn = async () => {
    setLoading(true)
    setError(null)

    try {
      console.log('Google login attempt')
      const result = await googleLogin()
      console.log('Google login successful:', result.user.email)

      setUser(result.user)
      return { success: true }
    } catch (error) {
      console.error('Google login failed:', error.message)
      setError(error.message)
      return { success: false, error: error.message }
    } finally {
      setLoading(false)
    }
  }

  const logout = async () => {
    setLoading(true)

    try {
      console.log('Logging out user:', user?.email)
      await logoutUser()
      setUser(null)
      setError(null)
      console.log('Logout successful')
    } catch (error) {
      console.error('Logout error:', error)
    } finally {
      setLoading(false)
    }
  }

  const clearError = () => {
    setError(null)
  }

  // Quick login as demo user (alternative method)
  const quickDemoLogin = () => {
    setLoading(true)

    const demoUser = {
      id: 'quick_demo_' + Date.now(),
      name: 'Demo Trader',
      email: 'demo@quicklogin.com',
      isVerified: true,
      createdAt: new Date().toISOString(),
      settings: {
        theme: 'dark',
        notifications: true,
        defaultTimeframe: '1h',
        riskPerTrade: 1,
      },
    }

    // Dispatch event to set user
    const event = new CustomEvent('setUser', { detail: demoUser })
    window.dispatchEvent(event)

    // Initialize data
    setTimeout(async () => {
      try {
        await initializeUserSampleData(demoUser.id)
      } catch (e) {
        console.error('Failed to initialize demo data:', e)
      }
    }, 500)
  }

  return {
    user,
    loading,
    error,
    login,
    register,
    verifyEmail: verifyEmailCode,
    resendVerificationCode: resendCode,
    googleLogin: googleSignIn,
    logout,
    quickDemoLogin,
    clearError,
  }
}
