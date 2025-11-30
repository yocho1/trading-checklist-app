// src/utils/auth.js
import { jwtDecode } from 'jwt-decode'
import { emailService } from './emailService'

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
  // Initialize email service
  init: () => {
    emailService.init()
  },

  // Register new user with email verification - ADD THIS FUNCTION
  register: async (name, email, password) => {
    try {
      console.log('auth.register: Starting registration for:', email)
      const users = getSharedUsers()

      // Check if user already exists
      const existingUser = users.find((u) => u.email === email)
      if (existingUser) {
        console.log('auth.register: User already exists')
        return { success: false, error: 'User with this email already exists' }
      }

      // Create new user
      const newUser = {
        id: Date.now().toString(),
        name,
        email,
        password, // In a real app, this should be hashed
        isVerified: false,
        createdAt: new Date().toISOString(),
        authProvider: 'email',
      }

      users.push(newUser)
      saveSharedUsers(users)
      console.log('auth.register: User created:', newUser.id)

      // Generate verification code
      const verificationCode = generateVerificationCode()
      const verificationCodes = getSharedVerificationCodes()

      verificationCodes[email] = {
        code: verificationCode,
        userId: newUser.id,
        expiresAt: Date.now() + 30 * 60 * 1000, // 30 minutes
      }

      saveSharedVerificationCodes(verificationCodes)

      // Send verification email
      console.log(`Verification code for ${email}: ${verificationCode}`)

      const expiresAt = Date.now() + 30 * 60 * 1000 // 30 minutes
      const emailResult = await emailService.sendVerificationCode(
        email,
        verificationCode,
        name,
        expiresAt
      )

      if (!emailResult.success) {
        // If email fails, show code on screen as fallback
        sessionStorage.setItem(
          'pendingVerification',
          JSON.stringify({
            email: email,
            code: verificationCode,
            emailFailed: true,
          })
        )

        return {
          success: true,
          message: 'Registration successful. Please verify your email.',
          verificationCode: verificationCode, // Show on screen
          emailSent: false,
          emailError: emailResult.error,
          user: newUser,
        }
      }

      // Store pending verification for email verification component
      sessionStorage.setItem(
        'pendingVerification',
        JSON.stringify({
          email: email,
          code: verificationCode,
        })
      )

      return {
        success: true,
        message:
          'Registration successful. Please check your email for verification code.',
        emailSent: true,
        user: newUser,
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

      return { success: true, user }
    } catch (error) {
      console.error('Error processing Google user:', error)
      return { success: false, error: 'Failed to process user data' }
    }
  },

  // Verify email code
  verifyEmail: async (email, code) => {
    try {
      const verificationCodes = getSharedVerificationCodes()
      const users = getSharedUsers()

      const verificationData = verificationCodes[email]

      if (!verificationData) {
        return {
          success: false,
          error: 'No verification request found for this email',
        }
      }

      if (verificationData.expiresAt < Date.now()) {
        delete verificationCodes[email]
        saveSharedVerificationCodes(verificationCodes)
        return { success: false, error: 'Verification code has expired' }
      }

      if (verificationData.code !== code) {
        return { success: false, error: 'Invalid verification code' }
      }

      // Find and update user
      const userIndex = users.findIndex((u) => u.id === verificationData.userId)
      if (userIndex === -1) {
        return { success: false, error: 'User not found' }
      }

      // Mark user as verified
      users[userIndex].isVerified = true
      saveSharedUsers(users)

      // Remove used verification code
      delete verificationCodes[email]
      saveSharedVerificationCodes(verificationCodes)

      // Generate token and login
      const token = generateToken(users[userIndex])
      localStorage.setItem('tradingToken', token)

      // Send welcome email
      emailService.sendWelcomeEmail(email, users[userIndex].name)

      // Clear pending verification
      sessionStorage.removeItem('pendingVerification')

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

      const token = generateToken(user)
      localStorage.setItem('tradingToken', token)

      return { success: true, user }
    } catch (error) {
      console.error('Login error:', error)
      return { success: false, error: 'Login failed' }
    }
  },

  // Resend verification code
  resendVerificationCode: async (email) => {
    try {
      const users = getSharedUsers()
      const verificationCodes = getSharedVerificationCodes()

      const user = users.find((u) => u.email === email && !u.isVerified)
      if (!user) {
        return { success: false, error: 'User not found or already verified' }
      }

      // Generate new verification code
      const verificationCode = generateVerificationCode()
      verificationCodes[email] = {
        code: verificationCode,
        userId: user.id,
        expiresAt: Date.now() + 30 * 60 * 1000, // 30 minutes
      }

      saveSharedVerificationCodes(verificationCodes)

      // Send verification email
      console.log(
        `Resending verification code to ${email}: ${verificationCode}`
      )

      const expiresAt = Date.now() + 30 * 60 * 1000 // 30 minutes
      const emailResult = await emailService.sendVerificationCode(
        email,
        verificationCode,
        user.name,
        expiresAt
      )

      if (!emailResult.success) {
        // If email fails, show code on screen as fallback
        sessionStorage.setItem(
          'pendingVerification',
          JSON.stringify({
            email: email,
            code: verificationCode,
            emailFailed: true,
          })
        )

        return {
          success: true,
          message: 'Verification code generated',
          verificationCode: verificationCode, // Show on screen
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

  // Request email change - sends verification to newEmail, stores request under userId
  requestEmailChange: async (newEmail) => {
    try {
      const users = getSharedUsers()
      const tokenUser = auth.getCurrentUser()
      if (!tokenUser) return { success: false, error: 'Not authenticated' }

      // Check if newEmail is already used by another user
      const existing = users.find(
        (u) => u.email === newEmail && u.id !== tokenUser.id
      )
      if (existing) return { success: false, error: 'Email already in use' }

      const emailChangeRequests = getSharedEmailChangeRequests()
      const code = generateVerificationCode()
      const expiresAt = Date.now() + 30 * 60 * 1000 // 30 minutes

      emailChangeRequests[tokenUser.id] = {
        newEmail,
        code,
        expiresAt,
      }
      saveSharedEmailChangeRequests(emailChangeRequests)

      console.log(
        `Email change code for user ${tokenUser.id} (${newEmail}): ${code}`
      )
      // send verification code to newEmail
      const emailResult = await emailService.sendVerificationCode(
        newEmail,
        code,
        tokenUser.name,
        expiresAt
      )

      if (!emailResult.success) {
        sessionStorage.setItem(
          'pendingEmailChange',
          JSON.stringify({
            userId: tokenUser.id,
            newEmail,
            code,
            emailFailed: true,
          })
        )
        return {
          success: true,
          message: 'Verification code generated',
          emailSent: false,
          verificationCode: code,
        }
      }

      sessionStorage.setItem(
        'pendingEmailChange',
        JSON.stringify({ userId: tokenUser.id, newEmail })
      )
      return {
        success: true,
        message: 'Verification code sent to new email',
        emailSent: true,
      }
    } catch (error) {
      console.error('requestEmailChange error:', error)
      return { success: false, error: 'Failed to request email change' }
    }
  },

  // Confirm email change: validate code and update user's email once confirmed
  confirmEmailChange: async (code) => {
    try {
      const users = getSharedUsers()
      const tokenUser = auth.getCurrentUser()
      if (!tokenUser) return { success: false, error: 'Not authenticated' }

      const emailChangeRequests = getSharedEmailChangeRequests()
      const request = emailChangeRequests[tokenUser.id]
      if (!request)
        return { success: false, error: 'No email change request found' }

      if (request.expiresAt < Date.now()) {
        delete emailChangeRequests[tokenUser.id]
        saveSharedEmailChangeRequests(emailChangeRequests)
        return { success: false, error: 'Verification code expired' }
      }

      if (request.code !== code) {
        return { success: false, error: 'Invalid verification code' }
      }

      // find user and update email
      const userIndex = users.findIndex((u) => u.id === tokenUser.id)
      if (userIndex === -1) return { success: false, error: 'User not found' }

      users[userIndex].email = request.newEmail
      users[userIndex].isVerified = true
      saveSharedUsers(users)

      // Remove the email change request
      delete emailChangeRequests[tokenUser.id]
      saveSharedEmailChangeRequests(emailChangeRequests)

      // Update the auth token with new email
      const updatedToken = generateToken(users[userIndex])
      localStorage.setItem('tradingToken', updatedToken)

      // Clear any pending session state
      sessionStorage.removeItem('pendingEmailChange')
      return { success: true, user: users[userIndex], message: 'Email updated' }
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
      const users = getSharedUsers()
      const emailChangeRequests = getSharedEmailChangeRequests()
      const request = emailChangeRequests[tokenUser.id]
      if (!request)
        return { success: false, error: 'No email change request found' }

      const code = generateVerificationCode()
      const expiresAt = Date.now() + 30 * 60 * 1000
      emailChangeRequests[tokenUser.id] = {
        newEmail: request.newEmail,
        code,
        expiresAt,
      }
      saveSharedEmailChangeRequests(emailChangeRequests)
      const emailResult = await emailService.sendVerificationCode(
        request.newEmail,
        code,
        tokenUser.name,
        expiresAt
      )
      if (!emailResult.success) {
        sessionStorage.setItem(
          'pendingEmailChange',
          JSON.stringify({
            userId: tokenUser.id,
            newEmail: request.newEmail,
            code,
            emailFailed: true,
          })
        )
        return {
          success: true,
          message: 'Verification code generated',
          emailSent: false,
          verificationCode: code,
        }
      }

      sessionStorage.setItem(
        'pendingEmailChange',
        JSON.stringify({ userId: tokenUser.id, newEmail: request.newEmail })
      )
      return { success: true, message: 'Verification code resent' }
    } catch (error) {
      console.error('resendEmailChangeCode error:', error)
      return { success: false, error: 'Failed to resend verification email' }
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

export default auth

// Update profile (name, email)
auth.updateProfile = async (name, email) => {
  try {
    const users = getSharedUsers()
    const tokenUser = auth.getCurrentUser()
    if (!tokenUser) return { success: false, error: 'Not authenticated' }

    const userIndex = users.findIndex((u) => u.id === tokenUser.id)
    if (userIndex === -1) return { success: false, error: 'User not found' }

    // Check if email is used by someone else
    const existing = users.find(
      (u) => u.email === email && u.id !== tokenUser.id
    )
    if (existing) return { success: false, error: 'Email already in use' }

    // If the email is changing, request a verification flow instead of updating immediately
    if (email && email !== users[userIndex].email) {
      // Request email change that will require verification
      return await auth.requestEmailChange(email)
    }

    users[userIndex].name = name
    saveSharedUsers(users)

    // Update token with new data
    const updatedToken = generateToken(users[userIndex])
    localStorage.setItem('tradingToken', updatedToken)
    return { success: true, user: users[userIndex] }
  } catch (error) {
    console.error('Error updating profile', error)
    return { success: false, error: 'Failed to update profile' }
  }
}

// Update password
auth.updatePassword = async (currentPassword, newPassword) => {
  try {
    const users = getSharedUsers()
    const tokenUser = auth.getCurrentUser()
    if (!tokenUser) return { success: false, error: 'Not authenticated' }

    const userIndex = users.findIndex((u) => u.id === tokenUser.id)
    if (userIndex === -1) return { success: false, error: 'User not found' }

    if (users[userIndex].password !== currentPassword) {
      return { success: false, error: 'Current password is incorrect' }
    }

    users[userIndex].password = newPassword
    saveSharedUsers(users)
    return { success: true, message: 'Password updated' }
  } catch (error) {
    console.error('Error updating password', error)
    return { success: false, error: 'Failed to update password' }
  }
}
