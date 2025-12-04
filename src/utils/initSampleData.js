// src/utils/initSampleData.js

export const initSampleData = () => {
  try {
    const data = localStorage.getItem('trading_app_shared_data')

    if (!data) {
      console.log('No data found, creating empty data structure...')

      const initialData = {
        users: [],
        verificationCodes: {},
        trades: [],
        dashboardSettings: {
          userId: null,
          theme: 'dark',
          notifications: true,
        },
      }

      localStorage.setItem(
        'trading_app_shared_data',
        JSON.stringify(initialData)
      )
      console.log('Empty data structure created')
      return initialData
    }

    // Data exists, check and repair if needed
    console.log('Existing data found, checking integrity...')
    const parsed = JSON.parse(data)

    // Ensure users array exists
    if (!parsed.users || !Array.isArray(parsed.users)) {
      console.log('No valid users array found, creating...')
      parsed.users = []
    }

    // Ensure trades array exists
    if (!parsed.trades || !Array.isArray(parsed.trades)) {
      console.log('No valid trades array found, creating...')
      parsed.trades = []
    }

    // Ensure verificationCodes object exists
    if (
      !parsed.verificationCodes ||
      typeof parsed.verificationCodes !== 'object'
    ) {
      console.log('No valid verificationCodes object found, creating...')
      parsed.verificationCodes = {}
    }

    // If no users, that's fine - users must register
    if (parsed.users.length === 0) {
      console.log('No users found - waiting for user registration')
    }

    // CLEANUP: Remove all demo user trades and data
    // Filter out demo user
    parsed.users = parsed.users.filter(
      (u) => u.email !== 'demo@trading.com' && u.id !== 'demo_user_123'
    )

    // Filter out all trades that belong to demo user
    parsed.trades = parsed.trades.filter((t) => t.userId !== 'demo_user_123')

    console.log('Cleaned up demo user data')

    // Ensure at least one test user exists for email/password login testing
    const testUserExists = parsed.users.some(
      (u) => u.email === 'test@example.com'
    )
    if (!testUserExists) {
      console.log('Creating test user for email/password login testing...')
      const testUser = {
        id: 'test_user_001',
        name: 'Test User',
        email: 'test@example.com',
        password: 'test123', // Test password for development
        isVerified: true,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        authProvider: 'email',
        settings: {
          theme: 'dark',
          notifications: true,
          defaultTimeframe: '1h',
          riskPerTrade: 1,
        },
      }
      parsed.users.push(testUser)
      console.log('Test user created: test@example.com / test123')
    } else {
      // Remove any test user's sample trades
      const testUserId = parsed.users.find(
        (u) => u.email === 'test@example.com'
      )?.id
      if (testUserId) {
        const beforeCount = parsed.trades.length
        parsed.trades = parsed.trades.filter((t) => t.userId !== testUserId)
        const removedCount = beforeCount - parsed.trades.length
        if (removedCount > 0) {
          console.log(`Removed ${removedCount} sample trades from test user`)
        }
      }
    }

    // Get the first user's ID
    const firstUserId = parsed.users[0]?.id

    // Ensure all trades have userId
    if (firstUserId && parsed.trades.length > 0) {
      let fixedTrades = 0
      parsed.trades.forEach((trade) => {
        if (!trade.userId) {
          trade.userId = firstUserId
          fixedTrades++
        }
      })
      if (fixedTrades > 0) {
        console.log(`Fixed ${fixedTrades} trades with missing userId`)
      }
    }

    // All users start with empty trade history
    // They must manually save their own trades

    // Save back to localStorage
    localStorage.setItem('trading_app_shared_data', JSON.stringify(parsed))

    console.log('Data integrity check complete:', {
      users: parsed.users.length,
      trades: parsed.trades.length,
      userId: firstUserId,
    })

    return parsed
  } catch (error) {
    console.error('Error initializing sample data:', error)

    // Create empty fallback data
    const fallbackData = {
      users: [],
      verificationCodes: {},
      trades: [],
      dashboardSettings: {
        userId: null,
        theme: 'dark',
        notifications: true,
      },
    }

    localStorage.setItem(
      'trading_app_shared_data',
      JSON.stringify(fallbackData)
    )
    console.log('Created empty fallback data due to error')
    return fallbackData
  }
}

// Function to ensure a specific user has trades
export const ensureUserHasTrades = (userId) => {
  try {
    if (!userId) {
      console.error('No userId provided to ensureUserHasTrades')
      return false
    }

    const data = localStorage.getItem('trading_app_shared_data')
    if (!data) {
      console.error('No data in localStorage')
      return false
    }

    const parsed = JSON.parse(data)

    // Check if user exists
    const user = parsed.users?.find((u) => u.id === userId)
    if (!user) {
      console.error('User not found:', userId)
      return false
    }

    // Count user's trades
    const userTrades = parsed.trades?.filter((t) => t.userId === userId) || []

    if (userTrades.length === 0) {
      console.log(`User ${userId} has no trades yet (this is expected)`)
    } else {
      console.log(`User ${userId} has ${userTrades.length} trades`)
    }
    return true
  } catch (error) {
    console.error('Error in ensureUserHasTrades:', error)
    return false
  }
}

// Function to clear all data (for testing)
export const clearAllData = () => {
  localStorage.removeItem('trading_app_shared_data')
  console.log('All data cleared from localStorage')
}

// Function to reset to sample data
export const resetToSampleData = () => {
  clearAllData()
  return initSampleData()
}

// Debug function to view current data
export const debugData = () => {
  try {
    const data = localStorage.getItem('trading_app_shared_data')
    if (!data) {
      console.log('No data in localStorage')
      return null
    }

    const parsed = JSON.parse(data)
    console.log('=== DEBUG DATA ===')
    console.log('Users:', parsed.users?.length || 0)
    parsed.users?.forEach((user, i) => {
      const trades =
        parsed.trades?.filter((t) => t.userId === user.id).length || 0
      console.log(
        `  User ${i + 1}: ${user.name} (${user.id}) - ${trades} trades`
      )
    })
    console.log('Total trades:', parsed.trades?.length || 0)
    console.log('===================')
    return parsed
  } catch (error) {
    console.error('Debug error:', error)
    return null
  }
}
