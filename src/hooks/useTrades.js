// src/hooks/useTrades.js
import { useState, useEffect } from 'react'
import { tradeService } from '../services/tradeService'

export const useTrades = () => {
  const [trades, setTrades] = useState([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const [statistics, setStatistics] = useState(null)

  // Fetch all trades
  const fetchTrades = async (status = null) => {
    setLoading(true)
    setError(null)
    try {
      const result = await tradeService.getTrades(status)
      if (result.success) {
        setTrades(result.trades || [])
      } else {
        setError(result.error)
      }
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  // Fetch trade statistics
  const fetchStatistics = async () => {
    try {
      const result = await tradeService.getTradeStatistics()
      if (result.success) {
        setStatistics(result.statistics)
      }
    } catch (err) {
      console.error('Error fetching statistics:', err)
    }
  }

  // Create a new trade
  const createTrade = async (tradeData) => {
    setLoading(true)
    setError(null)
    try {
      const result = await tradeService.createTrade(tradeData)
      if (result.success) {
        // Refresh the trades list
        await fetchTrades()
        await fetchStatistics()
        return { success: true, trade: result.trade }
      } else {
        setError(result.error)
        return { success: false, error: result.error }
      }
    } catch (err) {
      setError(err.message)
      return { success: false, error: err.message }
    } finally {
      setLoading(false)
    }
  }

  // Update a trade
  const updateTrade = async (tradeId, tradeData) => {
    setLoading(true)
    setError(null)
    try {
      const result = await tradeService.updateTrade(tradeId, tradeData)
      if (result.success) {
        // Update local state
        setTrades((prev) =>
          prev.map((trade) => (trade.id === tradeId ? result.trade : trade))
        )
        await fetchStatistics()
        return { success: true, trade: result.trade }
      } else {
        setError(result.error)
        return { success: false, error: result.error }
      }
    } catch (err) {
      setError(err.message)
      return { success: false, error: err.message }
    } finally {
      setLoading(false)
    }
  }

  // Delete a trade
  const deleteTrade = async (tradeId) => {
    setLoading(true)
    setError(null)
    try {
      const result = await tradeService.deleteTrade(tradeId)
      if (result.success) {
        // Remove from local state
        setTrades((prev) => prev.filter((trade) => trade.id !== tradeId))
        await fetchStatistics()
        return { success: true }
      } else {
        setError(result.error)
        return { success: false, error: result.error }
      }
    } catch (err) {
      setError(err.message)
      return { success: false, error: err.message }
    } finally {
      setLoading(false)
    }
  }

  // Export trades to CSV
  const exportToCSV = async () => {
    try {
      const result = await tradeService.exportTradesToCSV()
      if (result.success) {
        // Create download link
        const link = document.createElement('a')
        link.href = result.url
        link.download = result.filename
        document.body.appendChild(link)
        link.click()
        document.body.removeChild(link)

        // Clean up
        setTimeout(() => {
          window.URL.revokeObjectURL(result.url)
        }, 100)

        return { success: true }
      } else {
        return { success: false, error: result.error }
      }
    } catch (err) {
      return { success: false, error: err.message }
    }
  }

  // Load trades on mount
  useEffect(() => {
    fetchTrades()
    fetchStatistics()
  }, [])

  return {
    trades,
    loading,
    error,
    statistics,
    fetchTrades,
    createTrade,
    updateTrade,
    deleteTrade,
    exportToCSV,
    refreshStatistics: fetchStatistics,
  }
}
