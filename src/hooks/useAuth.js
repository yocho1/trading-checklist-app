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
} from '../services/mockBackend'
import { emailService } from '../utils/emailService'
import auth from '../utils/auth'
import { supabase } from '../services/supabaseClient'

export const useAuth = () => {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  // Helper to get last logged-in user from localStorage (NOT demo user)
  const getLastLoggedInUser = useCallback(() => {
    try {
      // Check if there's a saved current user (set during login)
      const currentUser = localStorage.getItem('currentUser')
      if (currentUser) {
        const parsed = JSON.parse(currentUser)
        // Only restore if it's NOT a demo user
        if (
          parsed &&
          parsed.id &&
          !parsed.email?.includes('demo') &&
          !parsed.email?.includes('example')
        ) {
          return {
            id: parsed.id,
            name: parsed.name,
            email: parsed.email,
            isVerified: parsed.isVerified,
            createdAt: parsed.createdAt,
            settings: parsed.settings || {
              theme: 'dark',
              notifications: true,
              defaultTimeframe: '1h',
              riskPerTrade: 1,
            },
          }
        }
      }
    } catch (error) {
      console.error('Error getting last logged-in user:', error)
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

        // Initialize EmailJS if configured (needed before sending)
        emailService.init()

        // First, check for Supabase session
        const {
          data: { session },
        } = await supabase.auth.getSession()

        if (session) {
          // User has a Supabase session
          console.log('Found Supabase session for:', session.user.email)
          const supabaseUser = {
            id: session.user.id,
            email: session.user.email,
            name: session.user.user_metadata?.name || 'User',
            isVerified: true,
            supabaseAuth: true,
          }
          setUser(supabaseUser)
          setLoading(false)
          return
        }

        // If no Supabase session, check for last logged-in user
        const lastUser = getLastLoggedInUser()

        if (lastUser) {
          console.log('Restoring last logged-in user:', lastUser.email)
          setUser(lastUser)
        } else {
          // No last logged-in user found
          console.log('No previously logged-in user found')
          console.log('User must manually log in')
        }
      } catch (error) {
        console.error('Auth initialization failed:', error)
        // Don't auto-login to demo user on error, just stay logged out
        console.log('Staying logged out until user manually logs in')
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
  }, [getLastLoggedInUser])

  const login = async (email, password) => {
    setLoading(true)
    setError(null)

    try {
      console.log('Attempting Supabase login for:', email)

      // Use Supabase auth to login
      const result = await auth.login(email, password)

      if (!result.success) {
        throw new Error(result.error || 'Login failed')
      }

      const user = result.user
      setUser(user)

      // Save as current user
      localStorage.setItem('currentUser', JSON.stringify(user))

      console.log('Supabase login successful:', user.email)
      return { success: true }
    } catch (error) {
      console.error('Login failed:', error.message)
      setError(error.message)
      return { success: false, error: error.message }
    } finally {
      setLoading(false)
    }
  }

  const register = async (name, email, password) => {
    setLoading(true)
    setError(null)

    try {
      console.log('Registering new user:', email)
      const userData = { name, email, password }
      const result = await registerUser(userData)
      console.log('Registration successful, user ID:', result.userId)

      // Attempt to send verification email when we have a code
      let emailSent = false
      let emailError = null
      if (result.verificationCode) {
        const expiresAt = Date.now() + 15 * 60 * 1000 // 15 minutes
        try {
          const sendResult = await emailService.sendVerificationCode(
            email,
            result.verificationCode,
            name,
            expiresAt
          )
          emailSent = !!sendResult.success
          emailError = sendResult.success
            ? null
            : sendResult.error || sendResult.details || 'Email failed'
          if (!emailSent) {
            console.warn('Verification email not sent:', emailError)
          }
        } catch (sendErr) {
          console.warn('Verification email send threw:', sendErr)
          emailSent = false
          emailError = sendErr?.message || 'Email failed'
        }
      }

      return {
        success: true,
        userId: result.userId,
        verificationCode: result.verificationCode,
        email: email,
        emailSent,
        emailError,
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

      // Auto-login after verification - use the verified user from result
      if (result.user) {
        setUser(result.user)

        // Save this user as the current logged-in user
        localStorage.setItem('currentUser', JSON.stringify(result.user))
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

  const googleSignIn = async (googleResponse) => {
    setLoading(true)
    setError(null)

    try {
      console.log(
        'Google login attempt',
        googleResponse ? 'with credential' : 'without credential'
      )
      const result = await googleLogin(googleResponse)
      console.log('Google login successful:', result.user.email)

      // Check if this is a new user (newly created from Google)
      const isNewUser = result.isNewUser || false

      setUser(result.user)

      // Save this user as the current logged-in user
      localStorage.setItem('currentUser', JSON.stringify(result.user))

      // Mark if this is a new Google user for welcome page
      if (isNewUser) {
        sessionStorage.setItem('isNewGoogleUser', 'true')
      }

      return { success: true, isNewUser }
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

      // Log out from Supabase if authenticated
      if (user?.supabaseAuth) {
        await supabase.auth.signOut()
        console.log('Supabase logout successful')
      }

      // Also clean up localStorage
      await logoutUser()
      setUser(null)

      // Clear the saved current user
      localStorage.removeItem('currentUser')

      // Clear pending verification data so register form is fresh
      sessionStorage.removeItem('pendingVerification')
      sessionStorage.removeItem('registerError')

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

    // Demo user created without sample data
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
