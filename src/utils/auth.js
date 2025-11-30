// src/utils/auth.js
import { jwtDecode } from 'jwt-decode'

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

export const auth = {
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
      const token = auth.generateToken(user)
      localStorage.setItem('tradingToken', token)

      return { success: true, user }
    } catch (error) {
      console.error('Error processing Google user:', error)
      return { success: false, error: 'Failed to process user data' }
    }
  },

  // Register new user with email verification
  register: (userData) => {
    try {
      const users = getSharedUsers()
      const verificationCodes = getSharedVerificationCodes()

      // Check if user already exists
      const existingUser = users.find((u) => u.email === userData.email)
      if (existingUser) {
        return { success: false, error: 'User already exists with this email' }
      }

      // Create new user (not verified yet)
      const newUser = {
        id: Date.now().toString(),
        name: userData.name,
        email: userData.email,
        password: userData.password,
        isVerified: false,
        createdAt: new Date().toISOString(),
        authProvider: 'email',
      }

      // Generate and store verification code
      const verificationCode = auth.generateVerificationCode()
      verificationCodes[newUser.email] = {
        code: verificationCode,
        userId: newUser.id,
        expiresAt: Date.now() + 30 * 60 * 1000, // 30 minutes
      }

      // Store user and verification code
      users.push(newUser)
      saveSharedUsers(users)
      saveSharedVerificationCodes(verificationCodes)

      // For demo purposes, log the code
      console.log(`Verification code for ${newUser.email}: ${verificationCode}`)

      // Store the code in session storage for current browser
      sessionStorage.setItem(
        'pendingVerification',
        JSON.stringify({
          email: newUser.email,
          code: verificationCode,
        })
      )

      return {
        success: true,
        user: newUser,
        requiresVerification: true,
        verificationCode: verificationCode, // For demo purposes
      }
    } catch (error) {
      console.error('Registration error:', error)
      return { success: false, error: 'Registration failed' }
    }
  },

  // Verify email code
  verifyEmail: (email, code) => {
    try {
      console.log('=== VERIFICATION DEBUG ===')
      console.log('Email:', email)
      console.log('Code entered:', code)

      const verificationCodes = getSharedVerificationCodes()
      const users = getSharedUsers()

      console.log('All verification codes:', verificationCodes)
      console.log('All users:', users)

      const verificationData = verificationCodes[email]
      console.log('Verification data for email:', verificationData)

      if (!verificationData) {
        console.log('ERROR: No verification data found for this email')
        return {
          success: false,
          error: 'No verification request found for this email',
        }
      }

      if (verificationData.expiresAt < Date.now()) {
        console.log('ERROR: Code expired')
        delete verificationCodes[email]
        saveSharedVerificationCodes(verificationCodes)
        return { success: false, error: 'Verification code has expired' }
      }

      console.log('Expected code:', verificationData.code)
      console.log('Entered code:', code)

      if (verificationData.code !== code) {
        console.log('ERROR: Code mismatch')
        return { success: false, error: 'Invalid verification code' }
      }

      // Find and update user
      const userIndex = users.findIndex((u) => u.id === verificationData.userId)
      console.log('User index:', userIndex)

      if (userIndex === -1) {
        console.log('ERROR: User not found')
        return { success: false, error: 'User not found' }
      }

      // Mark user as verified
      users[userIndex].isVerified = true
      saveSharedUsers(users)

      // Remove used verification code
      delete verificationCodes[email]
      saveSharedVerificationCodes(verificationCodes)

      // Generate token and login
      const token = auth.generateToken(users[userIndex])
      localStorage.setItem('tradingToken', token)

      // Clear pending verification
      sessionStorage.removeItem('pendingVerification')

      console.log('SUCCESS: User verified successfully')
      return {
        success: true,
        user: users[userIndex],
      }
    } catch (error) {
      console.error('Verification error:', error)
      return { success: false, error: 'Verification failed' }
    }
  },

  // Login with email/password
  login: (email, password) => {
    try {
      const users = getSharedUsers()
      const user = users.find(
        (u) => u.email === email && u.password === password
      )

      if (!user) {
        return { success: false, error: 'Invalid email or password' }
      }

      if (!user.isVerified) {
        return {
          success: false,
          error: 'Please verify your email before logging in',
        }
      }

      const token = auth.generateToken(user)
      localStorage.setItem('tradingToken', token)

      return { success: true, user }
    } catch (error) {
      console.error('Login error:', error)
      return { success: false, error: 'Login failed' }
    }
  },

  // Generate token
  generateToken: (userData) => {
    const tokenData = {
      ...userData,
      exp: Date.now() + 24 * 60 * 60 * 1000, // 24 hours
    }
    return btoa(JSON.stringify(tokenData))
  },

  // Generate verification code
  generateVerificationCode: () => {
    return Math.floor(100000 + Math.random() * 900000).toString() // 6-digit code
  },

  // Resend verification code
  resendVerificationCode: (email) => {
    try {
      const users = getSharedUsers()
      const verificationCodes = getSharedVerificationCodes()

      const user = users.find((u) => u.email === email && !u.isVerified)
      if (!user) {
        return { success: false, error: 'User not found or already verified' }
      }

      // Generate new verification code
      const verificationCode = auth.generateVerificationCode()
      verificationCodes[email] = {
        code: verificationCode,
        userId: user.id,
        expiresAt: Date.now() + 30 * 60 * 1000, // 30 minutes
      }

      saveSharedVerificationCodes(verificationCodes)

      // In a real app, send email here
      console.log(`New verification code for ${email}: ${verificationCode}`)

      // Update session storage
      sessionStorage.setItem(
        'pendingVerification',
        JSON.stringify({
          email: email,
          code: verificationCode,
        })
      )

      return {
        success: true,
        message: 'Verification code sent successfully',
        verificationCode: verificationCode, // For demo purposes
      }
    } catch (error) {
      console.error('Resend verification error:', error)
      return { success: false, error: 'Failed to resend verification code' }
    }
  },

  // Get current user from token
  getCurrentUser: () => {
    try {
      const token = localStorage.getItem('tradingToken')
      if (!token) return null

      const tokenData = JSON.parse(atob(token))

      // Check if token is expired
      if (tokenData.exp && tokenData.exp < Date.now()) {
        localStorage.removeItem('tradingToken')
        return null
      }

      return tokenData
    } catch (error) {
      console.error('Error getting current user:', error)
      localStorage.removeItem('tradingToken')
      return null
    }
  },

  // Logout
  logout: () => {
    localStorage.removeItem('tradingToken')
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
}
