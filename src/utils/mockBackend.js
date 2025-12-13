// src/utils/mockBackend.js
import { calculatePnl } from './calculations'

const MOCK_BACKEND_KEY = 'trading_app_shared_data'

export const mockBackend = {
  // Get all shared data
  getSharedData() {
    try {
      return JSON.parse(localStorage.getItem(MOCK_BACKEND_KEY) || '{}')
    } catch (error) {
      return {}
    }
  },

  // Save shared data
  saveSharedData(data) {
    try {
      localStorage.setItem(MOCK_BACKEND_KEY, JSON.stringify(data))
      return true
    } catch (err) {
      console.warn(
        'LocalStorage quota exceeded, attempting to prune data...',
        err
      )
      try {
        // Prune trades to last 100 entries to reduce size
        if (Array.isArray(data.trades)) {
          const MAX_TRADES = 100
          if (data.trades.length > MAX_TRADES) {
            data.trades = data.trades.slice(0, MAX_TRADES)
          }
        }

        // Remove expired verification codes if any
        if (
          data.verificationCodes &&
          typeof data.verificationCodes === 'object'
        ) {
          const pruned = {}
          const now = Date.now()
          for (const [email, v] of Object.entries(data.verificationCodes)) {
            const exp = v?.expiresAt ? new Date(v.expiresAt).getTime() : now
            if (exp > now) {
              pruned[email] = v
            }
          }
          data.verificationCodes = pruned
        }

        // Retry saving after pruning
        localStorage.setItem(MOCK_BACKEND_KEY, JSON.stringify(data))
        return true
      } catch (retryErr) {
        console.error(
          'Failed to save after pruning. Storing minimal state.',
          retryErr
        )
        try {
          // Preserve a compact slice of trades to avoid total loss
          let compactTrades = []
          if (Array.isArray(data.trades) && data.trades.length > 0) {
            const MAX_COMPACT = 50
            const slice = data.trades.slice(-MAX_COMPACT)
            compactTrades = slice.map((t) => ({
              id: t.id,
              userId: t.userId || t.user_id,
              symbol: t.symbol,
              currency_pair: t.currency_pair || t.currencyPair,
              direction: t.direction,
              entry_price: t.entry_price ?? t.entryPrice ?? null,
              stop_loss: t.stop_loss ?? t.stopLossPrice ?? null,
              take_profit: t.take_profit ?? t.takeProfitPrice ?? null,
              position_size: t.position_size ?? t.lotSize ?? null,
              risk_percentage: t.risk_percentage ?? t.riskPercentage ?? null,
              confluence_score: t.confluence_score ?? t.confluenceScore ?? null,
              status: t.status,
              notes: t.notes,
              createdAt: t.createdAt,
              updatedAt: t.updatedAt,
            }))
          }

          const minimal = {
            users: data.users || [],
            trades: compactTrades,
            verificationCodes: data.verificationCodes || {},
            dashboardSettings: data.dashboardSettings || {},
          }
          localStorage.setItem(MOCK_BACKEND_KEY, JSON.stringify(minimal))
          return false
        } catch (finalErr) {
          console.error('Completely failed to save shared data:', finalErr)
          return false
        }
      }
    }
  },

  // Get users
  getUsers() {
    const data = this.getSharedData()
    return data.users || []
  },

  // Save users
  saveUsers(users) {
    const data = this.getSharedData()
    data.users = users
    this.saveSharedData(data)
  },

  // Get verification codes
  getVerificationCodes() {
    const data = this.getSharedData()
    return data.verificationCodes || {}
  },

  // Save verification codes
  saveVerificationCodes(codes) {
    const data = this.getSharedData()
    data.verificationCodes = codes
    this.saveSharedData(data)
  },

  // Get trades
  getTrades() {
    const data = this.getSharedData()
    return data.trades || []
  },

  // Save trades
  saveTrades(trades) {
    const data = this.getSharedData()
    data.trades = trades
    this.saveSharedData(data)
  },

  // Update trade status and compute P&L
  updateTradeStatus(tradeId, status) {
    const data = this.getSharedData()
    const trades = data.trades || []
    const trade = trades.find((t) => t.id === tradeId)

    if (!trade) {
      console.warn('Trade not found:', tradeId)
      return false
    }

    console.log('Updating trade status:', tradeId, 'to', status)
    console.log('Trade before update:', trade)

    // Compute P&L based on available data
    let result = 0

    // Try price-based P&L first
    const canPriceCalc =
      trade.entry_price &&
      trade.position_size &&
      (trade.take_profit || trade.stop_loss)
    if (canPriceCalc) {
      const exitPrice =
        status === 'WIN'
          ? trade.take_profit
          : status === 'LOSS'
          ? trade.stop_loss
          : trade.entry_price
      result = calculatePnl({
        entryPrice: trade.entry_price,
        exitPrice,
        direction: trade.direction || 'LONG',
        lotSize: trade.position_size,
        currencyPair: trade.currency_pair || '',
      })
      console.log('Computed price-based P&L:', result)
    } else {
      // Fallback to risk-based P&L
      const riskAmount = parseFloat(trade.risk_amount || 0) || 0
      if (status === 'WIN') result = riskAmount
      else if (status === 'LOSS') result = -riskAmount
      else result = 0
      console.log(
        'Computed risk-based P&L:',
        result,
        'from risk_amount:',
        riskAmount
      )
    }

    // Update trade
    trade.status = status
    trade.result = result
    trade.pnl = result
    trade.updatedAt = new Date().toISOString()

    data.trades = trades
    this.saveSharedData(data)

    // Emit storage change event to notify Dashboard to refresh
    window.dispatchEvent(
      new StorageEvent('storage', {
        key: 'trading_app_shared_data',
        newValue: JSON.stringify(data),
        oldValue: null,
        storageArea: localStorage,
      })
    )

    return true
  },
}
