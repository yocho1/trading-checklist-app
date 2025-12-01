// src/services/databaseService.js
import supabase from './supabaseClient'

export const databaseService = {
  // Users
  createUser: async (email, password, name) => {
    try {
      const { data, error } = await supabase.auth.signUp(
        { email, password },
        { data: { name } }
      )
      if (error) throw error
      return { success: true, user: data.user }
    } catch (error) {
      console.error('createUser error:', error)
      return { success: false, error: error.message || 'Failed to create user' }
    }
  },

  getUserByEmail: async (email) => {
    try {
      const { data, error } = await supabase
        .from('users')
        .select('*')
        .eq('email', email)
        .limit(1)
        .single()
      if (error) throw error
      return { success: true, user: data }
    } catch (error) {
      if (error.code === 'PGRST116') return { success: true, user: null } // not found
      console.error('getUserByEmail error:', error)
      return { success: false, error: error.message || 'Failed to fetch user' }
    }
  },

  // Verification codes
  createVerificationCode: async (userId, email, code, expiresAt) => {
    try {
      const { data, error } = await supabase
        .from('verification_codes')
        .insert([{ user_id: userId, email, code, expires_at: expiresAt }])
      if (error) throw error
      return { success: true, data }
    } catch (error) {
      console.error('createVerificationCode error:', error)
      return {
        success: false,
        error: error.message || 'Failed to create verification code',
      }
    }
  },

  // Trades
  createTrade: async (userId, trade) => {
    try {
      const payload = { user_id: userId, ...trade }
      const { data, error } = await supabase.from('trades').insert([payload])
      if (error) throw error
      return { success: true, trade: data[0] }
    } catch (error) {
      console.error('createTrade error:', error)
      return {
        success: false,
        error: error.message || 'Failed to create trade',
      }
    }
  },

  getTradesByUser: async (userId) => {
    try {
      const { data, error } = await supabase
        .from('trades')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
      if (error) throw error
      return { success: true, trades: data }
    } catch (error) {
      console.error('getTradesByUser error:', error)
      return {
        success: false,
        error: error.message || 'Failed to fetch trades',
      }
    }
  },

  // Profile update
  updateUserProfile: async (userId, updateObj) => {
    try {
      const { data, error } = await supabase
        .from('users')
        .update(updateObj)
        .eq('id', userId)
        .select()
        .single()
      if (error) throw error
      return { success: true, user: data }
    } catch (error) {
      console.error('updateUserProfile error:', error)
      return {
        success: false,
        error: error.message || 'Failed to update profile',
      }
    }
  },

  // Admin / Utility
  migrateLocalStorageUsersToSupabase: async (localUsers) => {
    // Example migration function that you can adapt: runs in Node script with service keys
    try {
      // This method is a placeholder - migrations should be performed server-side or with admin keys
      const results = []
      for (const u of localUsers) {
        const { email, name, password } = u
        const res = await databaseService.createUser(email, password, name)
        results.push(res)
      }
      return { success: true, results }
    } catch (error) {
      console.error('migrateLocalStorageUsersToSupabase error:', error)
      return { success: false, error: error.message || 'Migration failed' }
    }
  },
}

export default databaseService
