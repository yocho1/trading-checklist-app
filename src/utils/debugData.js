// src/utils/debugData.js
export const debugStorageData = () => {
  try {
    const data = localStorage.getItem('trading_app_shared_data')
    if (!data) {
      console.log('No data in localStorage')
      return null
    }

    const parsed = JSON.parse(data)

    console.log('=== STORAGE DATA DEBUG ===')
    console.log('Users:', parsed.users?.length || 0)
    if (parsed.users) {
      parsed.users.forEach((user, index) => {
        console.log(`User ${index + 1}:`, {
          id: user.id,
          name: user.name,
          email: user.email,
          trades:
            parsed.trades?.filter((t) => t.userId === user.id).length || 0,
        })
      })
    }

    console.log('Total trades:', parsed.trades?.length || 0)
    if (parsed.trades && parsed.trades.length > 0) {
      console.log(
        'First 5 trades:',
        parsed.trades.slice(0, 5).map((t) => ({
          id: t.id,
          userId: t.userId,
          symbol: t.symbol,
          result: t.result,
        }))
      )
    }

    console.log('==========================')
    return parsed
  } catch (error) {
    console.error('Debug error:', error)
    return null
  }
}

export const fixUserTrades = () => {
  try {
    const data = localStorage.getItem('trading_app_shared_data')
    if (!data) return false

    const parsed = JSON.parse(data)

    // Ensure there's at least one user
    if (!parsed.users || parsed.users.length === 0) {
      console.log('No users found, creating demo user')
      parsed.users = [
        {
          id: 'demo_user_123',
          name: 'Demo User',
          email: 'demo@example.com',
          password: 'password123',
          isVerified: true,
          createdAt: new Date().toISOString(),
          authProvider: 'email',
        },
      ]
    }

    const firstUserId = parsed.users[0].id

    // Fix any trades without user IDs
    if (parsed.trades) {
      let fixedCount = 0
      parsed.trades.forEach((trade) => {
        if (!trade.userId) {
          trade.userId = firstUserId
          fixedCount++
        }
      })

      if (fixedCount > 0) {
        console.log(`Fixed ${fixedCount} trades with missing user IDs`)
      }
    }

    localStorage.setItem('trading_app_shared_data', JSON.stringify(parsed))
    return true
  } catch (error) {
    console.error('Error fixing user trades:', error)
    return false
  }
}
