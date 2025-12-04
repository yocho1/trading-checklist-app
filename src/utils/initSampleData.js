// src/utils/initSampleData.js
import { generateSampleTrades } from '../services/mockBackend'

export const initSampleData = () => {
  try {
    const data = localStorage.getItem('trading_app_shared_data')

    if (!data) {
      console.log('No data found, creating fresh sample data...')

      // Create demo user with specific ID
      const demoUserId = 'demo_user_123'
      const demoUser = {
        id: demoUserId,
        name: 'Demo Trader',
        email: 'demo@trading.com',
        password: 'demo123',
        isVerified: true,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        authProvider: 'demo',
        settings: {
          theme: 'dark',
          notifications: true,
          defaultTimeframe: '1h',
          riskPerTrade: 1,
          defaultConfluenceThreshold: 50,
        },
      }

      // Generate sample trades for this user
      const sampleTrades = generateSampleTrades(demoUserId)

      const initialData = {
        users: [demoUser],
        verificationCodes: {},
        trades: sampleTrades,
        dashboardSettings: {
          userId: demoUserId,
          theme: 'dark',
          notifications: true,
        },
      }

      localStorage.setItem(
        'trading_app_shared_data',
        JSON.stringify(initialData)
      )
      console.log('Fresh sample data created with:', {
        userId: demoUserId,
        trades: sampleTrades.length,
      })
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

    // If no users, create demo user
    if (parsed.users.length === 0) {
      console.log('No users found, creating demo user...')
      const demoUserId = 'demo_user_123'
      parsed.users = [
        {
          id: demoUserId,
          name: 'Demo Trader',
          email: 'demo@trading.com',
          password: 'demo123',
          isVerified: true,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          authProvider: 'demo',
          settings: {
            theme: 'dark',
            notifications: true,
            defaultTimeframe: '1h',
            riskPerTrade: 1,
            defaultConfluenceThreshold: 50,
          },
        },
      ]

      // If no trades, generate some for the demo user
      if (parsed.trades.length === 0) {
        console.log('Generating sample trades for demo user...')
        parsed.trades = generateSampleTrades(demoUserId)
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

    // If still no trades, generate some
    if (parsed.trades.length === 0 && firstUserId) {
      console.log('Generating sample trades...')
      parsed.trades = generateSampleTrades(firstUserId)
    }

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

    // Create minimal fallback data
    const demoUserId = 'fallback_user_' + Date.now()
    const fallbackData = {
      users: [
        {
          id: demoUserId,
          name: 'Fallback User',
          email: 'fallback@example.com',
          password: 'password123',
          isVerified: true,
          createdAt: new Date().toISOString(),
          authProvider: 'fallback',
          settings: {
            theme: 'dark',
            notifications: true,
            defaultTimeframe: '1h',
            riskPerTrade: 1,
          },
        },
      ],
      verificationCodes: {},
      trades: [],
      dashboardSettings: {
        userId: demoUserId,
        theme: 'dark',
        notifications: true,
      },
    }

    localStorage.setItem(
      'trading_app_shared_data',
      JSON.stringify(fallbackData)
    )
    console.log('Created fallback data due to error')
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
    const userExists = parsed.users?.some((u) => u.id === userId)
    if (!userExists) {
      console.error('User not found:', userId)
      return false
    }

    // Count user's trades
    const userTrades = parsed.trades?.filter((t) => t.userId === userId) || []

    if (userTrades.length === 0) {
      console.log(
        `No trades found for user ${userId}, generating sample trades...`
      )

      // Generate sample trades
      const sampleTrades = generateSampleTrades(userId)

      // Add to existing trades
      parsed.trades = [...(parsed.trades || []), ...sampleTrades]

      // Save back
      localStorage.setItem('trading_app_shared_data', JSON.stringify(parsed))

      console.log(
        `Added ${sampleTrades.length} sample trades for user ${userId}`
      )
      return true
    }

    console.log(`User ${userId} already has ${userTrades.length} trades`)
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
