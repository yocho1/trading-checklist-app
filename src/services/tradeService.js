// src/services/tradeService.js
import { supabase } from './supabaseClient'
import auth from '../utils/auth'
import { calculatePnl, calculateTradeParameters } from '../utils/calculations'

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

      // Derive risk parameters if possible
      const params = calculateTradeParameters({
        accountBalance: tradeData.accountBalance,
        riskPercentage: tradeData.riskPercentage,
        entryPrice: tradeData.entry_price || tradeData.entryPrice,
        stopLossPrice: tradeData.stop_loss || tradeData.stopLossPrice,
        currencyPair:
          tradeData.currency_pair || tradeData.currencyPair || tradeData.symbol,
      })

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
          parseFloat(
            tradeData.position_size || tradeData.lotSize || params.lotSize
          ) || null,
        risk_percentage:
          parseFloat(tradeData.risk_percentage || tradeData.riskPercentage) ||
          (tradeData.riskPercentage ? parseFloat(tradeData.riskPercentage) : 2),
        confluence_score:
          parseFloat(tradeData.confluence_score || tradeData.confluenceScore) ||
          0,
        status: tradeData.status || 'BEFORE',
        notes: tradeData.notes || '',
        account_balance: parseFloat(tradeData.accountBalance) || null,
        risk_amount:
          parseFloat(tradeData.riskAmount ?? params.riskAmount) || null,
        stop_loss_pips:
          parseFloat(tradeData.stopLossPips ?? params.stopLossPips) || null,
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

      // Fetch existing trade to compute simple P&L
      const { data: existing, error: fetchErr } = await supabase
        .from('trades')
        .select(
          'id, user_id, risk_amount, entry_price, take_profit, stop_loss, position_size, currency_pair, direction'
        )
        .eq('id', tradeId)
        .eq('user_id', user.id)
        .single()
      if (fetchErr) throw fetchErr

      let result = 0
      // Prefer price-based calculation if enough data exists
      const canPriceCalc =
        existing?.entry_price &&
        existing?.position_size &&
        (existing?.take_profit || existing?.stop_loss)
      if (canPriceCalc) {
        const exitPrice =
          status === 'WIN'
            ? existing.take_profit
            : status === 'LOSS'
            ? existing.stop_loss
            : existing.entry_price
        result = calculatePnl({
          entryPrice: existing.entry_price,
          exitPrice,
          direction: existing.direction || 'LONG',
          lotSize: existing.position_size,
          currencyPair: existing.currency_pair || '',
        })
      } else {
        // Fallback to risk-based
        const riskAmount = parseFloat(existing?.risk_amount || 0) || 0
        if (status === 'WIN') result = riskAmount
        else if (status === 'LOSS') result = -riskAmount
        else result = 0 // BREAKEVEN or other
      }

      const { data, error } = await supabase
        .from('trades')
        .update({
          status: status,
          result: result,
          pnl: result,
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

      // Compute profit/loss totals from result/pnl
      const totalProfit = trades.reduce((s, t) => {
        let r = t.result ?? t.pnl
        if (r == null) {
          // Fallback: use risk_amount by status if result not set
          const risk = parseFloat(t.risk_amount || 0) || 0
          if (t.status === 'WIN') r = risk
          else if (t.status === 'LOSS') r = -risk
          else r = 0
        }
        return r > 0 ? s + r : s
      }, 0)
      const totalLoss = trades.reduce((s, t) => {
        let r = t.result ?? t.pnl
        if (r == null) {
          const risk = parseFloat(t.risk_amount || 0) || 0
          if (t.status === 'WIN') r = risk
          else if (t.status === 'LOSS') r = -risk
          else r = 0
        }
        return r < 0 ? s + Math.abs(r) : s
      }, 0)

      // Pair breakdown: total profit and trade count per symbol
      const pairMap = {}
      trades.forEach((t) => {
        const symbol = t.symbol || t.currency_pair || 'Unknown'
        let r = t.result ?? t.pnl
        if (r == null) {
          const risk = parseFloat(t.risk_amount || 0) || 0
          if (t.status === 'WIN') r = risk
          else if (t.status === 'LOSS') r = -risk
          else r = 0
        }
        if (!pairMap[symbol])
          pairMap[symbol] = { pair: symbol, profit: 0, count: 0 }
        pairMap[symbol].profit += r
        pairMap[symbol].count += 1
      })
      const topPairs = Object.values(pairMap).sort(
        (a, b) => b.profit - a.profit
      )

      // Averages and extremes
      const winResults = trades
        .map(
          (t) =>
            t.result ??
            t.pnl ??
            (t.status === 'WIN' ? parseFloat(t.risk_amount || 0) || 0 : null)
        )
        .filter((v) => typeof v === 'number' && v > 0)
      const lossResults = trades
        .map(
          (t) =>
            t.result ??
            t.pnl ??
            (t.status === 'LOSS'
              ? -(parseFloat(t.risk_amount || 0) || 0)
              : null)
        )
        .filter((v) => typeof v === 'number' && v < 0)
      const avgWin = winResults.length
        ? winResults.reduce((a, b) => a + b, 0) / winResults.length
        : 0
      const avgLoss = lossResults.length
        ? Math.abs(lossResults.reduce((a, b) => a + b, 0) / lossResults.length)
        : 0
      const largestWin = winResults.length ? Math.max(...winResults) : 0
      const largestLoss = lossResults.length
        ? Math.abs(Math.min(...lossResults))
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
          totalProfit: parseFloat(totalProfit.toFixed(2)),
          totalLoss: parseFloat(totalLoss.toFixed(2)),
          avgWin: parseFloat(avgWin.toFixed(2)),
          avgLoss: parseFloat(avgLoss.toFixed(2)),
          largestWin: parseFloat(largestWin.toFixed(2)),
          largestLoss: parseFloat(largestLoss.toFixed(2)),
          topPairs,
        },
      }
    } catch (error) {
      console.error('Error getting trade statistics:', error)
      return { success: false, error: error.message }
    }
  },
}
