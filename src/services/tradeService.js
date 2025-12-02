// src/services/tradeService.js
import { supabase } from './supabaseClient'
import auth from '../utils/auth'

export const tradeService = {
  // Get all trades for current user
  getTrades: async () => {
    try {
      // Ensure we have a valid Supabase session
      const sessionCheck = await auth.ensureSupabaseSession()
      if (!sessionCheck.success) {
        throw new Error(`Not authenticated: ${sessionCheck.error}`)
      }

      const user = auth.getCurrentUser()
      if (!user) throw new Error('Not authenticated')

      const { data, error } = await supabase
        .from('trades')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })

      if (error) throw error
      return { success: true, trades: data }
    } catch (error) {
      console.error('Error fetching trades:', error)
      return { success: false, error: error.message }
    }
  },

  uploadChartImage: async (base64Image, tradeId) => {
    try {
      // Ensure we have a valid Supabase session
      const sessionCheck = await auth.ensureSupabaseSession()
      if (!sessionCheck.success) {
        throw new Error(`Not authenticated: ${sessionCheck.error}`)
      }

      // Convert base64 to blob
      const response = await fetch(base64Image)
      const blob = await response.blob()

      // Upload to Supabase Storage
      const fileName = `chart_${tradeId}_${Date.now()}.jpg`
      const { data, error } = await supabase.storage
        .from('trade-charts')
        .upload(fileName, blob, {
          contentType: 'image/jpeg',
          upsert: false,
        })

      if (error) throw error

      // Get public URL
      const {
        data: { publicUrl },
      } = supabase.storage.from('trade-charts').getPublicUrl(fileName)

      return { success: true, url: publicUrl }
    } catch (error) {
      console.error('Error uploading chart image:', error)
      return { success: false, error: error.message }
    }
  },

  // Create a new trade (for when you save from checklist)
  createTrade: async (tradeData) => {
    try {
      // Ensure we have a valid Supabase session
      const sessionCheck = await auth.ensureSupabaseSession()
      if (!sessionCheck.success) {
        throw new Error(`Not authenticated: ${sessionCheck.error}`)
      }

      const user = auth.getCurrentUser()
      if (!user) throw new Error('Not authenticated')

      // Upload chart image if exists
      let chartImageUrl = null
      if (
        tradeData.chartImage &&
        tradeData.chartImage.startsWith('data:image')
      ) {
        const uploadResult = await tradeService.uploadChartImage(
          tradeData.chartImage,
          Date.now().toString()
        )
        if (uploadResult.success) {
          chartImageUrl = uploadResult.url
        }
      }

      // Transform trade data
      const trade = {
        user_id: user.id,
        symbol: tradeData.symbol || tradeData.currencyPair,
        currency_pair: tradeData.currencyPair,
        direction: tradeData.direction || 'LONG',
        entry_price:
          parseFloat(tradeData.entry_price || tradeData.entryPrice) || null,
        stop_loss:
          parseFloat(tradeData.stop_loss || tradeData.stopLossPrice) || null,
        take_profit:
          parseFloat(tradeData.take_profit || tradeData.takeProfitPrice) ||
          null,
        position_size:
          parseFloat(tradeData.position_size || tradeData.lotSize) || null,
        risk_percentage:
          parseFloat(tradeData.risk_percentage || tradeData.riskPercentage) ||
          2,
        confluence_score:
          parseFloat(tradeData.confluence_score || tradeData.confluenceScore) ||
          0,
        status: tradeData.status || 'BEFORE',
        notes: tradeData.notes || '',
        account_balance: parseFloat(tradeData.accountBalance) || null,
        risk_amount: parseFloat(tradeData.riskAmount) || null,
        stop_loss_pips: parseFloat(tradeData.stopLossPips) || null,
        chart_image_url: chartImageUrl,
        checklist_data: tradeData.checklist_data || {},
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      }

      const { data, error } = await supabase
        .from('trades')
        .insert([trade])
        .select()
        .single()

      if (error) throw error
      return { success: true, trade: data }
    } catch (error) {
      console.error('Error creating trade:', error)
      return { success: false, error: error.message }
    }
  },

  // Update trade status (WIN, LOSS, BREAKEVEN)
  updateTradeStatus: async (tradeId, status) => {
    try {
      // Ensure we have a valid Supabase session
      const sessionCheck = await auth.ensureSupabaseSession()
      if (!sessionCheck.success) {
        throw new Error(`Not authenticated: ${sessionCheck.error}`)
      }

      const user = auth.getCurrentUser()
      if (!user) throw new Error('Not authenticated')

      const { data, error } = await supabase
        .from('trades')
        .update({
          status: status,
          updated_at: new Date().toISOString(),
        })
        .eq('id', tradeId)
        .eq('user_id', user.id)
        .select()
        .single()

      if (error) throw error
      return { success: true, trade: data }
    } catch (error) {
      console.error('Error updating trade status:', error)
      return { success: false, error: error.message }
    }
  },

  // Delete a trade
  deleteTrade: async (tradeId) => {
    try {
      // Ensure we have a valid Supabase session
      const sessionCheck = await auth.ensureSupabaseSession()
      if (!sessionCheck.success) {
        throw new Error(`Not authenticated: ${sessionCheck.error}`)
      }

      const user = auth.getCurrentUser()
      if (!user) throw new Error('Not authenticated')

      const { error } = await supabase
        .from('trades')
        .delete()
        .eq('id', tradeId)
        .eq('user_id', user.id)

      if (error) throw error
      return { success: true }
    } catch (error) {
      console.error('Error deleting trade:', error)
      return { success: false, error: error.message }
    }
  },

  // Get trade statistics
  getTradeStatistics: async () => {
    try {
      // Ensure we have a valid Supabase session
      const sessionCheck = await auth.ensureSupabaseSession()
      if (!sessionCheck.success) {
        throw new Error(`Not authenticated: ${sessionCheck.error}`)
      }

      const user = auth.getCurrentUser()
      if (!user) throw new Error('Not authenticated')

      const { data: trades, error } = await supabase
        .from('trades')
        .select('*')
        .eq('user_id', user.id)

      if (error) throw error

      // Calculate statistics
      const beforeTrades = trades.filter((t) => t.status === 'BEFORE')
      const winTrades = trades.filter((t) => t.status === 'WIN')
      const lossTrades = trades.filter((t) => t.status === 'LOSS')
      const breakevenTrades = trades.filter((t) => t.status === 'BREAKEVEN')

      const closedTrades = [...winTrades, ...lossTrades, ...breakevenTrades]

      const winRate =
        closedTrades.length > 0
          ? (winTrades.length / closedTrades.length) * 100
          : 0

      return {
        success: true,
        statistics: {
          totalTrades: trades.length,
          beforeTrades: beforeTrades.length,
          winTrades: winTrades.length,
          lossTrades: lossTrades.length,
          breakevenTrades: breakevenTrades.length,
          closedTrades: closedTrades.length,
          winRate: parseFloat(winRate.toFixed(2)),
          averageConfluence:
            closedTrades.length > 0
              ? closedTrades.reduce(
                  (sum, t) => sum + (t.confluence_score || 0),
                  0
                ) / closedTrades.length
              : 0,
        },
      }
    } catch (error) {
      console.error('Error getting trade statistics:', error)
      return { success: false, error: error.message }
    }
  },
}
