// src/hooks/useDashboardData.js
import { useState, useEffect, useCallback } from 'react';
import { getDashboardSummary, getPerformanceChartData } from '../services/mockBackend';

export const useDashboardData = (userId) => {
  const [dashboardData, setDashboardData] = useState(null);
  const [chartData, setChartData] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [lastUpdated, setLastUpdated] = useState(null);

  const fetchDashboardData = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);

      // Use provided userId or get from localStorage
      const currentUserId = userId || getUserId();
      
      if (!currentUserId) {
        throw new Error('User ID not found. Please log in.');
      }
      
      // Fetch dashboard summary
      const summaryResponse = await getDashboardSummary(currentUserId);
      
      if (summaryResponse.success) {
        setDashboardData(summaryResponse.summary);
        setLastUpdated(summaryResponse.summary.lastUpdated);
      } else {
        throw new Error('Failed to load dashboard data');
      }

      // Fetch chart data
      const chartResponse = await getPerformanceChartData(currentUserId, 'month');
      if (chartResponse.success) {
        setChartData(chartResponse);
      }

    } catch (err) {
      console.error('Error fetching dashboard data:', err);
      setError(err.message || 'Failed to load dashboard data');
      
      // Set default data structure on error
      setDashboardData(getDefaultDashboardData());
    } finally {
      setIsLoading(false);
    }
  }, [userId]);

  // Helper function to get user ID from localStorage
  const getUserId = () => {
    try {
      const data = localStorage.getItem('trading_app_shared_data');
      if (data) {
        const parsed = JSON.parse(data);
        const user = parsed.users?.[0];
        return user?.id;
      }
    } catch (error) {
      console.error('Error getting user ID:', error);
    }
    return null;
  };

  // Default data structure
  const getDefaultDashboardData = () => ({
    overview: {
      netPnl: 0.00,
      totalTrades: 0,
      winRate: 0,
      profitFactor: 0.00,
      averageConfluence: 55,
      totalProfit: 0.00,
      totalLoss: 0.00,
      roi: 0,
      avgWin: 0.00,
      avgLoss: 0.00,
      largestWin: 0.00,
      largestLoss: 0.00,
      bestWinningStreak: 0,
      currentStreak: 0,
      winningTrades: 0,
      losingTrades: 0
    },
    performance: {
      daily: { trades: 0, winRate: 0, pnl: 0 },
      weekly: { trades: 0, winRate: 0, pnl: 0 },
      monthly: { trades: 0, winRate: 0, pnl: 0 },
      yearly: { trades: 0, winRate: 0, pnl: 0 }
    },
    recentTrades: [],
    topPairs: [],
    winRateByType: {
      long: 0,
      short: 0
    },
    totalTrades: 0,
    lastUpdated: new Date().toISOString()
  });

  // Initial data fetch
  useEffect(() => {
    fetchDashboardData();
  }, [fetchDashboardData]);

  // Auto-refresh every 30 seconds if user is active
  useEffect(() => {
    if (!dashboardData) return;

    const refreshInterval = setInterval(() => {
      fetchDashboardData();
    }, 30000); // 30 seconds

    return () => clearInterval(refreshInterval);
  }, [dashboardData, fetchDashboardData]);

  // Refresh function
  const refreshData = async () => {
    await fetchDashboardData();
  };

  // Function to update local data after a new trade is saved
  const addNewTrade = (newTrade) => {
    setDashboardData(prev => {
      if (!prev) return prev;

      const updatedRecentTrades = [
        {
          id: newTrade.id,
          symbol: newTrade.symbol,
          date: new Date(newTrade.createdAt).toLocaleDateString(),
          time: new Date(newTrade.createdAt).toLocaleTimeString(),
          result: newTrade.result || 0,
          confluence: newTrade.confluence || 50,
          type: newTrade.type || 'N/A',
          timeframe: newTrade.timeframe || 'N/A'
        },
        ...prev.recentTrades.slice(0, 9) // Keep only 10 most recent
      ];

      // Update overview stats
      const updatedOverview = { ...prev.overview };
      updatedOverview.totalTrades += 1;
      
      if (newTrade.result > 0) {
        updatedOverview.winningTrades += 1;
        updatedOverview.totalProfit += newTrade.result;
      } else if (newTrade.result < 0) {
        updatedOverview.losingTrades += 1;
        updatedOverview.totalLoss += Math.abs(newTrade.result);
      }
      
      updatedOverview.netPnl = updatedOverview.totalProfit - updatedOverview.totalLoss;
      updatedOverview.winRate = updatedOverview.totalTrades > 0 
        ? (updatedOverview.winningTrades / updatedOverview.totalTrades * 100)
        : 0;
      updatedOverview.profitFactor = updatedOverview.totalLoss > 0 
        ? updatedOverview.totalProfit / updatedOverview.totalLoss 
        : updatedOverview.totalProfit > 0 ? Infinity : 0;

      return {
        ...prev,
        overview: updatedOverview,
        recentTrades: updatedRecentTrades,
        totalTrades: updatedOverview.totalTrades,
        lastUpdated: new Date().toISOString()
      };
    });
  };

  return {
    dashboardData,
    chartData,
    isLoading,
    error,
    lastUpdated,
    refreshData,
    addNewTrade
  };
};