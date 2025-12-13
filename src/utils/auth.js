// src/utils/auth.js
import { jwtDecode } from 'jwt-decode'
import { emailService } from './emailService'
import databaseService from '../services/databaseService'
import { supabase } from '../services/supabaseClient'

// Shared storage key - same across all browsers
const SHARED_STORAGE_KEY = 'trading_app_shared_data'

// Helper functions for shared storage
const getSharedData = () => {
  try {
    return JSON.parse(localStorage.getItem(SHARED_STORAGE_KEY) || '{}')
  } catch (error) {
    return {}
  }
}

const saveSharedData = (data) => {
  localStorage.setItem(SHARED_STORAGE_KEY, JSON.stringify(data))
}

const getSharedUsers = () => {
  const data = getSharedData()
  return data.users || []
}

const saveSharedUsers = (users) => {
  const data = getSharedData()
  data.users = users
  saveSharedData(data)
}

const getSharedVerificationCodes = () => {
  const data = getSharedData()
  return data.verificationCodes || {}
}

const saveSharedVerificationCodes = (codes) => {
  const data = getSharedData()
  data.verificationCodes = codes
  saveSharedData(data)
}

const getSharedEmailChangeRequests = () => {
  const data = getSharedData()
  return data.emailChangeRequests || {}
}

const saveSharedEmailChangeRequests = (requests) => {
  const data = getSharedData()
  data.emailChangeRequests = requests
  saveSharedData(data)
}

// Generate verification code helper
const generateVerificationCode = () => {
  return Math.floor(100000 + Math.random() * 900000).toString() // 6-digit code
}

// Generate token helper
const generateToken = (userData) => {
  const tokenData = {
    ...userData,
    exp: Date.now() + 24 * 60 * 60 * 1000, // 24 hours
  }
  return btoa(JSON.stringify(tokenData))
}

// Create auth object
const auth = {
  // Initialize email service and sync Supabase session
  init: async () => {
    emailService.init()

    // Try to restore Supabase session from localStorage
    try {
      const currentUser = localStorage.getItem('currentUser')
      if (currentUser) {
        const userData = JSON.parse(currentUser)

        // Check if we have a Supabase session
        const {
          data: { session },
        } = await supabase.auth.getSession()
        if (!session && userData.id) {
          console.log('No active Supabase session found, attempting to sync...')
          // We might need to sign in again or refresh
        }
      }
    } catch (error) {
      console.warn('Error initializing auth:', error)
    }
  },

  // Get active Supabase session
  getSupabaseSession: async () => {
    try {
      const {
        data: { session },
        error,
      } = await supabase.auth.getSession()
      if (error) throw error
      return session
    } catch (error) {
      console.error('Error getting Supabase session:', error)
      return null
    }
  },

  // Refresh Supabase session
  refreshSupabaseSession: async () => {
    try {
      const {
        data: { session },
        error,
      } = await supabase.auth.refreshSession()
      if (error) throw error
      return session
    } catch (error) {
      console.error('Error refreshing Supabase session:', error)
      return null
    }
  },

  // Register new user with email verification
  register: async (name, email, password) => {
    try {
      console.log('auth.register: Starting registration for:', email)

      // Use Supabase Auth to create user
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: { name },
          emailRedirectTo: `${window.location.origin}/auth/callback`,
        },
      })

      if (error) {
        console.error('Supabase auth error:', error)
        return { success: false, error: error.message }
      }

      const user = data.user
      if (!user) {
        return { success: false, error: 'Failed to create user' }
      }

      // Generate verification code
      const verificationCode = generateVerificationCode()
      const expiresAt = Date.now() + 15 * 60 * 1000 // 15 minutes

      // Store verification data in sessionStorage
      const verificationData = {
        email,
        code: verificationCode,
        user: {
          id: user.id,
          email: user.email,
          name: name,
          isVerified: false,
        },
        expiresAt: expiresAt,
      }

      sessionStorage.setItem(
        'pendingVerification',
        JSON.stringify(verificationData)
      )
      console.log(
        'auth.register: Stored verification data in sessionStorage:',
        verificationData
      )

      // Try to store in Supabase (optional - will work even if fails)
      if (
        process.env.REACT_APP_SUPABASE_URL &&
        process.env.REACT_APP_SUPABASE_ANON_KEY
      ) {
        try {
          await databaseService.createVerificationCode(
            user.id,
            email,
            verificationCode,
            new Date(expiresAt).toISOString()
          )
          console.log('auth.register: Verification code stored in Supabase')
        } catch (err) {
          console.warn('Failed to create verification code in Supabase:', err)
          // Continue anyway - we have sessionStorage fallback
        }
      }

      // Send verification email
      console.log(`Verification code for ${email}: ${verificationCode}`)

      const emailResult = await emailService.sendVerificationCode(
        email,
        verificationCode,
        name,
        expiresAt
      )

      if (!emailResult.success) {
        return {
          success: true,
          message: 'Registration successful. Please verify your email.',
          verificationCode: verificationCode,
          emailSent: false,
          emailError: emailResult.error,
          user: user,
        }
      }

      return {
        success: true,
        message:
          'Registration successful. Please check your email for verification code.',
        emailSent: true,
        user: user,
      }
    } catch (error) {
      console.error('Registration error:', error)
      return { success: false, error: 'Registration failed' }
    }
  },

  // Handle Google OAuth response
  handleGoogleResponse: async (response) => {
    try {
      console.log('Processing Google auth response...')

      if (!response.credential) {
        throw new Error('No credential received from Google')
      }

      const userData = jwtDecode(response.credential)
      console.log('Decoded Google user data:', userData)

      return await auth.processGoogleUser(userData)
    } catch (error) {
      console.error('Google auth processing failed:', error)
      return {
        success: false,
        error: error.message || 'Google authentication failed',
      }
    }
  },

  // Process Google user data
  processGoogleUser: async (googleData) => {
    try {
      const users = getSharedUsers()

      // Find existing user by email or Google ID
      let user = users.find(
        (u) => u.email === googleData.email || u.googleId === googleData.sub
      )

      if (!user) {
        // Create new user from Google data
        user = {
          id: Date.now().toString(),
          name: googleData.name,
          email: googleData.email,
          isVerified: true,
          googleId: googleData.sub,
          avatar: googleData.picture,
          createdAt: new Date().toISOString(),
          authProvider: 'google',
        }
        users.push(user)
        saveSharedUsers(users)
        console.log('New user created from Google:', user)
      } else {
        // Update existing user with Google data
        user.googleId = googleData.sub
        user.avatar = googleData.picture
        user.authProvider = 'google'
        user.isVerified = true
        saveSharedUsers(users)
        console.log('Existing user updated with Google data:', user)
      }

      // Generate app token and login
      const token = generateToken(user)
      localStorage.setItem('tradingToken', token)
      localStorage.setItem('currentUser', JSON.stringify(user))

      return { success: true, user }
    } catch (error) {
      console.error('Error processing Google user:', error)
      return { success: false, error: 'Failed to process user data' }
    }
  },

  // Verify email code - FIXED VERSION (handles empty tables)
  verifyEmail: async (email, code) => {
    try {
      console.log('auth.verifyEmail: called with', { email, code })

      // Get pending verification from sessionStorage
      const pendingVerification = sessionStorage.getItem('pendingVerification')
      if (!pendingVerification) {
        return {
          success: false,
          error: 'No pending verification found. Please register again.',
        }
      }

      const verificationData = JSON.parse(pendingVerification)
      console.log(
        'auth.verifyEmail: Verification data from session:',
        verificationData
      )

      // Check if email matches
      if (verificationData.email !== email) {
        return { success: false, error: 'Email mismatch' }
      }

      // Check if code matches
      if (verificationData.code !== code) {
        return { success: false, error: 'Invalid verification code' }
      }

      // Check if expired
      if (
        verificationData.expiresAt &&
        verificationData.expiresAt < Date.now()
      ) {
        sessionStorage.removeItem('pendingVerification')
        return { success: false, error: 'Verification code has expired' }
      }

      // Get user from verification data
      const userFromVerification = verificationData.user
      if (!userFromVerification) {
        return { success: false, error: 'User data not found in verification' }
      }

      // If Supabase is configured, try to update user profile (optional)
      if (
        process.env.REACT_APP_SUPABASE_URL &&
        process.env.REACT_APP_SUPABASE_ANON_KEY
      ) {
        try {
          // Try to create or update user profile in public.users
          const { data: existingProfile, error: fetchError } = await supabase
            .from('users')
            .select('*')
            .eq('id', userFromVerification.id)

          if (fetchError && fetchError.code !== 'PGRST116') {
            console.warn('Error fetching user profile:', fetchError)
          }

          if (!existingProfile || existingProfile.length === 0) {
            // Create new profile
            const { error: insertError } = await supabase.from('users').insert({
              id: userFromVerification.id,
              email: userFromVerification.email,
              name: userFromVerification.name,
              is_verified: true,
              email_verified: true,
            })

            if (insertError) {
              console.warn(
                'Could not create user profile (table might not exist):',
                insertError
              )
            } else {
              console.log('auth.verifyEmail: User profile created in Supabase')
            }
          } else {
            // Update existing profile
            const { error: updateError } = await supabase
              .from('users')
              .update({
                is_verified: true,
                email_verified: true,
              })
              .eq('id', userFromVerification.id)

            if (updateError) {
              console.warn('Could not update user profile:', updateError)
            } else {
              console.log('auth.verifyEmail: User profile updated in Supabase')
            }
          }
        } catch (supabaseError) {
          console.warn(
            'Supabase operations failed, continuing with local verification:',
            supabaseError
          )
          // Continue anyway - this is optional
        }
      }

      // Create app session token
      const userData = {
        id: userFromVerification.id,
        email: userFromVerification.email,
        name: userFromVerification.name,
        isVerified: true,
        emailVerified: true,
      }

      // Store tokens
      localStorage.setItem(
        'tradingToken',
        btoa(
          JSON.stringify({
            ...userData,
            exp: Date.now() + 24 * 60 * 60 * 1000, // 24 hours
          })
        )
      )

      localStorage.setItem('currentUser', JSON.stringify(userData))

      // Try to send welcome email (optional)
      try {
        await emailService.sendWelcomeEmail(email, userData.name)
      } catch (emailError) {
        console.warn('Could not send welcome email:', emailError)
      }

      // Clear pending verification
      sessionStorage.removeItem('pendingVerification')

      console.log(
        'auth.verifyEmail: Verification success for',
        email,
        'User:',
        userData
      )
      return {
        success: true,
        user: userData,
        message: 'Email verified successfully!',
      }
    } catch (error) {
      console.error('Verification error:', error)
      return { success: false, error: 'Verification failed' }
    }
  },

  // Login with email/password
  login: async (email, password) => {
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      })

      if (error) return { success: false, error: error.message }

      const user = data.user
      if (!user) return { success: false, error: 'Failed to sign in' }

      const userData = {
        id: user.id,
        email: user.email,
        name: user.user_metadata?.name || 'User',
        isVerified: true,
        emailVerified: true,
      }

      // Sync user profile in public.users table
      try {
        const { data: existingProfile } = await supabase
          .from('users')
          .select('*')
          .eq('auth_user_id', user.id)
          .single()

        if (!existingProfile) {
          // Create new profile
          await supabase.from('users').insert({
            auth_user_id: user.id,
            email: user.email,
            name: userData.name,
            is_verified: true,
          })
          console.log('auth.login: User profile created in Supabase')
        }
      } catch (supabaseError) {
        console.warn('Could not sync user profile:', supabaseError)
        // Continue anyway - Supabase session is still valid
      }

      localStorage.setItem(
        'tradingToken',
        btoa(
          JSON.stringify({
            ...userData,
            exp: Date.now() + 24 * 60 * 60 * 1000,
          })
        )
      )

      localStorage.setItem('currentUser', JSON.stringify(userData))

      return { success: true, user: userData }
    } catch (error) {
      console.error('Login error:', error)
      return { success: false, error: 'Login failed' }
    }
  },

  // Resend verification code
  resendVerificationCode: async (email) => {
    try {
      // Get pending verification from sessionStorage
      const pendingVerification = sessionStorage.getItem('pendingVerification')
      if (!pendingVerification) {
        return { success: false, error: 'No pending verification found' }
      }

      const verificationData = JSON.parse(pendingVerification)
      if (verificationData.email !== email) {
        return { success: false, error: 'Email mismatch' }
      }

      // Generate new verification code
      const verificationCode = generateVerificationCode()
      const expiresAt = Date.now() + 15 * 60 * 1000 // 15 minutes

      // Update verification data
      const newVerificationData = {
        ...verificationData,
        code: verificationCode,
        expiresAt: expiresAt,
      }

      sessionStorage.setItem(
        'pendingVerification',
        JSON.stringify(newVerificationData)
      )

      // Send verification email
      const emailResult = await emailService.sendVerificationCode(
        email,
        verificationCode,
        verificationData.user?.name || 'User',
        expiresAt
      )

      if (!emailResult.success) {
        return {
          success: true,
          message: 'Verification code generated',
          verificationCode: verificationCode,
          emailSent: false,
          emailError: emailResult.error,
        }
      }

      return {
        success: true,
        message: 'Verification code sent to your email',
        emailSent: true,
      }
    } catch (error) {
      console.error('Resend verification error:', error)
      return { success: false, error: 'Failed to resend verification code' }
    }
  },

  // Get current user from token
  getCurrentUser: () => {
    try {
      // First check localStorage currentUser (faster)
      const currentUser = localStorage.getItem('currentUser')
      if (currentUser) {
        const userData = JSON.parse(currentUser)

        // Check if token is still valid
        const token = localStorage.getItem('tradingToken')
        if (token) {
          try {
            const tokenData = JSON.parse(atob(token))
            if (tokenData.exp && tokenData.exp < Date.now()) {
              // Token expired
              localStorage.removeItem('tradingToken')
              localStorage.removeItem('currentUser')
              return null
            }
          } catch (tokenError) {
            console.warn('Token error:', tokenError)
          }
        }

        return userData
      }

      // Fall back to token
      const token = localStorage.getItem('tradingToken')
      if (!token) return null

      const tokenData = JSON.parse(atob(token))

      // Check if token is expired
      if (tokenData.exp && tokenData.exp < Date.now()) {
        localStorage.removeItem('tradingToken')
        localStorage.removeItem('currentUser')
        return null
      }

      return tokenData
    } catch (error) {
      console.error('Error getting current user:', error)
      localStorage.removeItem('tradingToken')
      localStorage.removeItem('currentUser')
      return null
    }
  },

  // Get user with Supabase session check
  getCurrentUserWithSession: async () => {
    try {
      const user = auth.getCurrentUser()
      if (!user) return null

      // Check if we have a valid Supabase session
      const session = await auth.getSupabaseSession()
      if (!session) {
        console.warn('No active Supabase session found for user:', user.email)
        // Try to refresh session
        const refreshedSession = await auth.refreshSupabaseSession()
        if (!refreshedSession) {
          console.warn('Could not refresh Supabase session')
        }
      }

      return user
    } catch (error) {
      console.error('Error getting user with session:', error)
      return null
    }
  },

  // Logout
  logout: () => {
    localStorage.removeItem('tradingToken')
    localStorage.removeItem('currentUser')
    sessionStorage.removeItem('pendingVerification')
    supabase.auth.signOut()
  },

  // Validate token
  validateToken: (token) => {
    try {
      const tokenData = JSON.parse(atob(token))
      return tokenData.exp && tokenData.exp > Date.now()
    } catch (error) {
      return false
    }
  },

  // Request email change
  requestEmailChange: async (newEmail) => {
    try {
      const tokenUser = auth.getCurrentUser()
      if (!tokenUser) return { success: false, error: 'Not authenticated' }

      // Generate verification code
      const code = generateVerificationCode()
      const expiresAt = Date.now() + 15 * 60 * 1000 // 15 minutes

      // Store in sessionStorage
      sessionStorage.setItem(
        'pendingEmailChange',
        JSON.stringify({
          userId: tokenUser.id,
          newEmail,
          code,
          expiresAt,
        })
      )

      // Send verification email
      const emailResult = await emailService.sendVerificationCode(
        tokenUser.email,
        code,
        tokenUser.name,
        expiresAt,
        { newEmail, new_email: newEmail }
      )

      if (!emailResult.success) {
        return {
          success: true,
          message: 'Verification code generated',
          emailSent: false,
          verificationCode: code,
        }
      }

      return {
        success: true,
        message:
          'Verification code sent to your current email to confirm ownership',
        emailSent: true,
      }
    } catch (error) {
      console.error('requestEmailChange error:', error)
      return { success: false, error: 'Failed to request email change' }
    }
  },

  // Confirm email change
  confirmEmailChange: async (code) => {
    try {
      const tokenUser = auth.getCurrentUser()
      if (!tokenUser) return { success: false, error: 'Not authenticated' }

      // Get pending email change from sessionStorage
      const pendingEmailChange = sessionStorage.getItem('pendingEmailChange')
      if (!pendingEmailChange) {
        return { success: false, error: 'No email change request found' }
      }

      const request = JSON.parse(pendingEmailChange)

      // Check if expired
      if (request.expiresAt && request.expiresAt < Date.now()) {
        sessionStorage.removeItem('pendingEmailChange')
        return { success: false, error: 'Verification code expired' }
      }

      // Check if code matches
      if (request.code !== code) {
        return { success: false, error: 'Invalid verification code' }
      }

      // Update user data
      const updatedUserData = {
        ...tokenUser,
        email: request.newEmail,
        emailVerified: true,
      }

      // Update tokens
      localStorage.setItem(
        'tradingToken',
        btoa(
          JSON.stringify({
            ...updatedUserData,
            exp: Date.now() + 24 * 60 * 60 * 1000,
          })
        )
      )

      localStorage.setItem('currentUser', JSON.stringify(updatedUserData))

      // Clear pending email change
      sessionStorage.removeItem('pendingEmailChange')

      return { success: true, user: updatedUserData, message: 'Email updated' }
    } catch (error) {
      console.error('confirmEmailChange error:', error)
      return { success: false, error: 'Failed to confirm email change' }
    }
  },

  // Resend email change verification code
  resendEmailChangeCode: async () => {
    try {
      const tokenUser = auth.getCurrentUser()
      if (!tokenUser) return { success: false, error: 'Not authenticated' }

      const pendingEmailChange = sessionStorage.getItem('pendingEmailChange')
      if (!pendingEmailChange) {
        return { success: false, error: 'No email change request found' }
      }

      const request = JSON.parse(pendingEmailChange)
      const code = generateVerificationCode()
      const expiresAt = Date.now() + 15 * 60 * 1000

      // Update session storage
      sessionStorage.setItem(
        'pendingEmailChange',
        JSON.stringify({
          ...request,
          code,
          expiresAt,
        })
      )

      // Send verification email
      const emailResult = await emailService.sendVerificationCode(
        tokenUser.email,
        code,
        tokenUser.name,
        expiresAt,
        { newEmail: request.newEmail, new_email: request.newEmail }
      )

      if (!emailResult.success) {
        return {
          success: true,
          message: 'Verification code generated',
          emailSent: false,
          verificationCode: code,
        }
      }

      return { success: true, message: 'Verification code resent' }
    } catch (error) {
      console.error('resendEmailChangeCode error:', error)
      return { success: false, error: 'Failed to resend verification email' }
    }
  },

  // Cancel pending email change request
  cancelEmailChangeRequest: async () => {
    try {
      sessionStorage.removeItem('pendingEmailChange')
      return { success: true, message: 'Email change request canceled' }
    } catch (error) {
      console.error('cancelEmailChangeRequest error:', error)
      return { success: false, error: 'Failed to cancel email change request' }
    }
  },

  // Ensure Supabase session is active
  ensureSupabaseSession: async () => {
    try {
      let session = await auth.getSupabaseSession()

      if (!session) {
        console.log('No Supabase session found, attempting to refresh...')
        session = await auth.refreshSupabaseSession()
      }

      if (!session) {
        console.log('Could not get Supabase session, checking localStorage...')
        const user = auth.getCurrentUser()
        if (user) {
          console.log('Found user in localStorage, but no Supabase session')
          return { success: false, error: 'No active Supabase session' }
        }
        return { success: false, error: 'No user found' }
      }

      return { success: true, session }
    } catch (error) {
      console.error('Error ensuring Supabase session:', error)
      return { success: false, error: error.message }
    }
  },
}

export default auth

// Update profile (name, email)
auth.updateProfile = async (name, email) => {
  try {
    const tokenUser = auth.getCurrentUser()
    if (!tokenUser) return { success: false, error: 'Not authenticated' }

    // If the email is changing, request a verification flow
    if (email && email !== tokenUser.email) {
      return await auth.requestEmailChange(email)
    }

    // Only name is being updated
    const updatedUserData = {
      ...tokenUser,
      name: name,
    }

    // Update tokens
    localStorage.setItem(
      'tradingToken',
      btoa(
        JSON.stringify({
          ...updatedUserData,
          exp: Date.now() + 24 * 60 * 60 * 1000,
        })
      )
    )

    localStorage.setItem('currentUser', JSON.stringify(updatedUserData))

    return { success: true, user: updatedUserData }
  } catch (error) {
    console.error('Error updating profile', error)
    return { success: false, error: 'Failed to update profile' }
  }
}

// Update password
auth.updatePassword = async (currentPassword, newPassword) => {
  try {
    const { error } = await supabase.auth.updateUser({
      password: newPassword,
    })

    if (error) {
      return { success: false, error: error.message }
    }

    return { success: true, message: 'Password updated' }
  } catch (error) {
    console.error('Error updating password', error)
    return { success: false, error: 'Failed to update password' }
  }
}
