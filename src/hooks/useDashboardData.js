// src/hooks/useDashboardData.js
import { useState, useEffect, useCallback } from 'react'
import {
  getDashboardSummary,
  getPerformanceChartData,
} from '../services/mockBackend'
import { tradeService } from '../services/tradeService'
import auth from '../utils/auth'

// Helper: get or initialize baseline balance for ROI
const getBaseline = () => {
  const stored = localStorage.getItem('trading_baseline_balance')
  return stored ? parseFloat(stored) : null
}

const setBaseline = (value) => {
  localStorage.setItem('trading_baseline_balance', value)
}

// Helper: compute timeframe P&L aggregates from trades
const computeTimeframeData = (trades) => {
  const now = new Date()
  const getStartOfDay = (d) =>
    new Date(d.getFullYear(), d.getMonth(), d.getDate())
  const getStartOfWeek = (d) => {
    const first = new Date(d)
    const day = first.getDay()
    const diff = first.getDate() - day
    return new Date(first.getFullYear(), first.getMonth(), diff)
  }
  const getStartOfMonth = (d) => new Date(d.getFullYear(), d.getMonth(), 1)
  const getStartOfYear = (d) => new Date(d.getFullYear(), 0, 1)

  const timeframes = {
    daily: { start: getStartOfDay(now), trades: [], pnl: 0 },
    weekly: { start: getStartOfWeek(now), trades: [], pnl: 0 },
    monthly: { start: getStartOfMonth(now), trades: [], pnl: 0 },
    yearly: { start: getStartOfYear(now), trades: [], pnl: 0 },
  }

  trades.forEach((t) => {
    const tradeDate = t.created_at
      ? new Date(t.created_at)
      : t.createdAt
      ? new Date(t.createdAt)
      : null
    if (!tradeDate) return

    let r = t.result ?? t.pnl ?? 0
    if (r == null) {
      const risk = parseFloat(t.risk_amount || 0) || 0
      if (t.status === 'WIN') r = risk
      else if (t.status === 'LOSS') r = -risk
      else r = 0
    }

    if (tradeDate >= timeframes.daily.start) {
      timeframes.daily.trades.push(t)
      timeframes.daily.pnl += r
    }
    if (tradeDate >= timeframes.weekly.start) {
      timeframes.weekly.trades.push(t)
      timeframes.weekly.pnl += r
    }
    if (tradeDate >= timeframes.monthly.start) {
      timeframes.monthly.trades.push(t)
      timeframes.monthly.pnl += r
    }
    if (tradeDate >= timeframes.yearly.start) {
      timeframes.yearly.trades.push(t)
      timeframes.yearly.pnl += r
    }
  })

  return {
    daily: {
      trades: timeframes.daily.trades.length,
      pnl: timeframes.daily.pnl,
      winRate: 0,
    },
    weekly: {
      trades: timeframes.weekly.trades.length,
      pnl: timeframes.weekly.pnl,
      winRate: 0,
    },
    monthly: {
      trades: timeframes.monthly.trades.length,
      pnl: timeframes.monthly.pnl,
      winRate: 0,
    },
    yearly: {
      trades: timeframes.yearly.trades.length,
      pnl: timeframes.yearly.pnl,
      winRate: 0,
    },
  }
}

export const useDashboardData = (userId) => {
  const [dashboardData, setDashboardData] = useState(null)
  const [chartData, setChartData] = useState(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState(null)
  const [lastUpdated, setLastUpdated] = useState(null)

  const fetchDashboardData = useCallback(async () => {
    try {
      setIsLoading(true)
      setError(null)

      // Use provided userId or get from localStorage
      const currentUserId = userId || getUserId()

      if (!currentUserId) {
        throw new Error('User ID not found. Please log in.')
      }

      // Prefer Supabase statistics when a session is available
      const supaSession = await auth.getSupabaseSession?.()
      if (supaSession) {
        const statsResp = await tradeService.getTradeStatistics()
        if (statsResp.success) {
          const stats = statsResp.statistics
          const summary = {
            overview: {
              netPnl: (stats.totalProfit || 0) - (stats.totalLoss || 0),
              totalTrades: stats.totalTrades,
              winRate: stats.winRate,
              profitFactor:
                stats.totalLoss > 0
                  ? (stats.totalProfit || 0) / (stats.totalLoss || 1)
                  : (stats.totalProfit || 0) > 0
                  ? Infinity
                  : 0,
              averageConfluence: stats.averageConfluence || 0,
              totalProfit: stats.totalProfit || 0.0,
              totalLoss: stats.totalLoss || 0.0,
              roi: 0,
              avgWin: stats.avgWin || 0.0,
              avgLoss: stats.avgLoss || 0.0,
              largestWin: stats.largestWin || 0.0,
              largestLoss: stats.largestLoss || 0.0,
              bestWinningStreak: 0,
              currentStreak: 0,
              winningTrades: stats.winTrades,
              losingTrades: stats.lossTrades,
            },
            performance: computeTimeframeData(statsResp.trades || []),
            recentTrades: [],
            topPairs: [],
            winRateByType: { long: 0, short: 0 },
            totalTrades: stats.totalTrades,
            lastUpdated: new Date().toISOString(),
          }
          const baseline = getBaseline()
          const roi =
            baseline && summary.overview.netPnl
              ? (summary.overview.netPnl / baseline) * 100
              : 0
          summary.overview.roi = parseFloat(roi.toFixed(2))
          summary.baseline = baseline
          setDashboardData({ ...summary, dataSource: 'supabase' })
          setLastUpdated(summary.lastUpdated)
        } else {
          // Fallback to mock summary
          const summaryResponse = await getDashboardSummary(currentUserId)
          if (summaryResponse.success) {
            setDashboardData({
              ...summaryResponse.summary,
              dataSource: 'local',
            })
            setLastUpdated(summaryResponse.summary.lastUpdated)
          } else {
            throw new Error('Failed to load dashboard data')
          }
        }
      } else {
        // No Supabase session: compute from localStorage trades
        const data = JSON.parse(
          localStorage.getItem('trading_app_shared_data') || '{}'
        )
        const trades = (data.trades || []).filter(
          (t) => (t.userId || t.user_id) === currentUserId
        )
        const closed = trades.filter((t) =>
          ['WIN', 'LOSS', 'BREAKEVEN'].includes(t.status)
        )
        const wins = closed.filter((t) => t.status === 'WIN')
        const losses = closed.filter((t) => t.status === 'LOSS')
        const winRate = closed.length ? (wins.length / closed.length) * 100 : 0
        const averageConfluence = closed.length
          ? closed.reduce(
              (s, t) => s + (t.confluence_score || t.confluence || 0),
              0
            ) / closed.length
          : 0

        // Compute local P&L metrics from available fields
        const totalProfit = closed.reduce((s, t) => {
          const res = t.result ?? t.pnl ?? 0
          return res > 0 ? s + res : s
        }, 0)
        const totalLoss = closed.reduce((s, t) => {
          const res = t.result ?? t.pnl ?? 0
          return res < 0 ? s + Math.abs(res) : s
        }, 0)
        const netPnl = totalProfit - totalLoss
        const profitFactor =
          totalLoss > 0
            ? totalProfit / totalLoss
            : totalProfit > 0
            ? Infinity
            : 0

        const summary = {
          overview: {
            netPnl,
            totalTrades: trades.length,
            winRate: parseFloat(winRate.toFixed(2)),
            profitFactor,
            averageConfluence,
            totalProfit,
            totalLoss,
            roi: 0,
            avgWin: 0.0,
            avgLoss: 0.0,
            largestWin: 0.0,
            largestLoss: 0.0,
            bestWinningStreak: 0,
            currentStreak: 0,
            winningTrades: wins.length,
            losingTrades: losses.length,
          },
          performance: computeTimeframeData(trades),
          recentTrades: trades
            .slice(-10)
            .reverse()
            .map((t) => ({
              id: t.id,
              symbol: t.symbol || t.currency_pair || t.currencyPair,
              date: t.created_at
                ? new Date(t.created_at).toLocaleDateString()
                : t.createdAt
                ? new Date(t.createdAt).toLocaleDateString()
                : '',
              time: t.created_at
                ? new Date(t.created_at).toLocaleTimeString()
                : t.createdAt
                ? new Date(t.createdAt).toLocaleTimeString()
                : '',
              result: t.result ?? t.pnl ?? 0,
              confluence: t.confluence_score || t.confluence || 0,
              type: t.direction || 'N/A',
              timeframe: 'N/A',
            })),
          topPairs: [],
          winRateByType: { long: 0, short: 0 },
          totalTrades: trades.length,
          lastUpdated: new Date().toISOString(),
        }
        const baseline = getBaseline()
        const roi = baseline && netPnl ? (netPnl / baseline) * 100 : 0
        summary.overview.roi = parseFloat(roi.toFixed(2))
        summary.baseline = baseline
        setDashboardData({ ...summary, dataSource: 'local' })
        setLastUpdated(summary.lastUpdated)
      }

      // Fetch chart data
      const chartResponse = await getPerformanceChartData(
        currentUserId,
        'month'
      )
      if (chartResponse.success) {
        setChartData(chartResponse)
      }
    } catch (err) {
      console.error('Error fetching dashboard data:', err)
      setError(err.message || 'Failed to load dashboard data')

      // Set default data structure on error
      setDashboardData(getDefaultDashboardData())
    } finally {
      setIsLoading(false)
    }
  }, [userId])

  // Helper function to get user ID from localStorage
  const getUserId = () => {
    try {
      const data = localStorage.getItem('trading_app_shared_data')
      if (data) {
        const parsed = JSON.parse(data)
        const user = parsed.users?.[0]
        return user?.id
      }
    } catch (error) {
      console.error('Error getting user ID:', error)
    }
    return null
  }

  // Default data structure
  const getDefaultDashboardData = () => ({
    overview: {
      netPnl: 0.0,
      totalTrades: 0,
      winRate: 0,
      profitFactor: 0.0,
      averageConfluence: 55,
      totalProfit: 0.0,
      totalLoss: 0.0,
      roi: 0,
      avgWin: 0.0,
      avgLoss: 0.0,
      largestWin: 0.0,
      largestLoss: 0.0,
      bestWinningStreak: 0,
      currentStreak: 0,
      winningTrades: 0,
      losingTrades: 0,
    },
    performance: {
      daily: { trades: 0, winRate: 0, pnl: 0 },
      weekly: { trades: 0, winRate: 0, pnl: 0 },
      monthly: { trades: 0, winRate: 0, pnl: 0 },
      yearly: { trades: 0, winRate: 0, pnl: 0 },
    },
    recentTrades: [],
    topPairs: [],
    winRateByType: {
      long: 0,
      short: 0,
    },
    totalTrades: 0,
    lastUpdated: new Date().toISOString(),
  })

  // Initial data fetch
  useEffect(() => {
    fetchDashboardData()
  }, [fetchDashboardData])

  // Auto-refresh every 30 seconds if user is active
  useEffect(() => {
    if (!dashboardData) return

    const refreshInterval = setInterval(() => {
      fetchDashboardData()
    }, 30000) // 30 seconds

    return () => clearInterval(refreshInterval)
  }, [dashboardData, fetchDashboardData])

  // Listen for localStorage changes (when trades are updated from TradingHistory)
  useEffect(() => {
    const handleStorageChange = (e) => {
      if (e.key === 'trading_app_shared_data') {
        console.log('Trades updated in localStorage, refreshing dashboard...')
        fetchDashboardData()
      }
    }

    window.addEventListener('storage', handleStorageChange)
    return () => window.removeEventListener('storage', handleStorageChange)
  }, [fetchDashboardData])

  // Refresh function
  const refreshData = async () => {
    await fetchDashboardData()
  }

  // Function to update local data after a new trade is saved
  const addNewTrade = (newTrade) => {
    setDashboardData((prev) => {
      if (!prev) return prev

      const updatedRecentTrades = [
        {
          id: newTrade.id,
          symbol: newTrade.symbol,
          date: new Date(newTrade.createdAt).toLocaleDateString(),
          time: new Date(newTrade.createdAt).toLocaleTimeString(),
          result: newTrade.result || 0,
          confluence: newTrade.confluence || 50,
          type: newTrade.type || 'N/A',
          timeframe: newTrade.timeframe || 'N/A',
        },
        ...prev.recentTrades.slice(0, 9), // Keep only 10 most recent
      ]

      // Update overview stats
      const updatedOverview = { ...prev.overview }
      updatedOverview.totalTrades += 1

      if (newTrade.result > 0) {
        updatedOverview.winningTrades += 1
        updatedOverview.totalProfit += newTrade.result
      } else if (newTrade.result < 0) {
        updatedOverview.losingTrades += 1
        updatedOverview.totalLoss += Math.abs(newTrade.result)
      }

      updatedOverview.netPnl =
        updatedOverview.totalProfit - updatedOverview.totalLoss
      updatedOverview.winRate =
        updatedOverview.totalTrades > 0
          ? (updatedOverview.winningTrades / updatedOverview.totalTrades) * 100
          : 0
      updatedOverview.profitFactor =
        updatedOverview.totalLoss > 0
          ? updatedOverview.totalProfit / updatedOverview.totalLoss
          : updatedOverview.totalProfit > 0
          ? Infinity
          : 0

      return {
        ...prev,
        overview: updatedOverview,
        recentTrades: updatedRecentTrades,
        totalTrades: updatedOverview.totalTrades,
        lastUpdated: new Date().toISOString(),
      }
    })
  }

  return {
    dashboardData,
    chartData,
    isLoading,
    error,
    lastUpdated,
    refreshData,
    addNewTrade,
    getBaseline,
    setBaseline,
  }
}
