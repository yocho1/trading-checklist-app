
// src/pages/Dashboard.jsx
import React, { useState, useEffect } from 'react';
import { 
  TrendingUp, 
  TrendingDown, 
  Target, 
  PieChart, 
  BarChart3, 
  Trophy, 
  Wallet, 
  RefreshCw,
  Calendar,
  DollarSign,
  Percent,
  Clock,
  ArrowUpRight,
  ArrowDownRight,
  ChevronRight,
  Download,
  Filter,
  Activity,
  TrendingUp as TrendingUpIcon
} from 'lucide-react';
import { exportTradesJSON, exportTradesCSV } from '../utils/export';

const Dashboard = ({ data, loading, onRefresh, addNewTrade, getBaseline, setBaseline }) => {
  const [timeframe, setTimeframe] = useState('all');
  const [selectedMetric, setSelectedMetric] = useState('pnl');
  const [lastRefresh, setLastRefresh] = useState(new Date());
  const [baselineInput, setBaselineInput] = useState(getBaseline?.() || '');

  // Update last refresh time
  useEffect(() => {
    if (!loading) {
      setLastRefresh(new Date());
    }
  }, [loading]);

  // Format time since last refresh
  const formatTimeSince = (date) => {
    const seconds = Math.floor((new Date() - date) / 1000);
    
    if (seconds < 60) return 'Just now';
    if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`;
    if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`;
    return `${Math.floor(seconds / 86400)}d ago`;
  };

  // If data is loading, show skeleton
  if (loading || !data) {
    return (
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <div className="h-8 w-48 bg-slate-700 rounded-lg animate-pulse mb-2"></div>
            <div className="h-4 w-64 bg-slate-700 rounded-lg animate-pulse"></div>
          </div>
          <div className="flex gap-2">
            <div className="h-10 w-24 bg-slate-700 rounded-lg animate-pulse"></div>
            <div className="h-10 w-10 bg-slate-700 rounded-lg animate-pulse"></div>
          </div>
        </div>

        {/* Stats Grid Skeleton */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="bg-slate-800 rounded-xl p-6 border border-slate-700">
              <div className="h-6 w-32 bg-slate-700 rounded-lg animate-pulse mb-4"></div>
              <div className="h-10 w-24 bg-slate-700 rounded-lg animate-pulse mb-2"></div>
              <div className="h-4 w-40 bg-slate-700 rounded-lg animate-pulse"></div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  // Calculate derived metrics
  const calculateMetrics = () => {
    const overview = data.overview;
    
    return {
      netPnl: overview.netPnl || 0,
      totalTrades: overview.totalTrades || 0,
      winRate: overview.winRate || 0,
      profitFactor: overview.profitFactor || 0,
      averageConfluence: overview.averageConfluence || 55,
      totalProfit: overview.totalProfit || 0,
      totalLoss: overview.totalLoss || 0,
      roi: overview.roi || 0,
      avgWin: overview.avgWin || 0,
      avgLoss: overview.avgLoss || 0,
      largestWin: overview.largestWin || 0,
      largestLoss: overview.largestLoss || 0,
      bestStreak: overview.bestWinningStreak || 0,
      currentStreak: overview.currentStreak || 0,
      winningTrades: overview.winningTrades || 0,
      losingTrades: overview.losingTrades || 0
    };
  };

  const metrics = calculateMetrics();

  // Filter recent trades by timeframe
  const getFilteredTrades = () => {
    const recentTrades = data.recentTrades || [];
    
    if (timeframe === 'all') {
      return recentTrades;
    }

    const now = new Date();
    const filteredTrades = recentTrades.filter(trade => {
      const tradeDate = new Date(trade.date);
      
      switch (timeframe) {
        case 'today':
          return tradeDate.toDateString() === now.toDateString();
        case 'week':
          const weekAgo = new Date();
          weekAgo.setDate(weekAgo.getDate() - 7);
          return tradeDate > weekAgo;
        case 'month':
          const monthAgo = new Date();
          monthAgo.setMonth(monthAgo.getMonth() - 1);
          return tradeDate > monthAgo;
        default:
          return true;
      }
    });

    return filteredTrades;
  };

  const filteredTrades = getFilteredTrades();

  // Timeframe options
  const timeframeOptions = [
    { value: 'all', label: 'All Time' },
    { value: 'today', label: 'Today' },
    { value: 'week', label: 'This Week' },
    { value: 'month', label: 'This Month' }
  ];

  // Performance metrics
  const performanceMetrics = [
    { label: 'Total Profit', value: `$${metrics.totalProfit.toFixed(2)}`, icon: TrendingUpIcon, color: 'text-emerald-400' },
    { label: 'Total Loss', value: `$${metrics.totalLoss.toFixed(2)}`, icon: TrendingDown, color: 'text-red-400' },
    { label: 'Avg Win', value: `$${metrics.avgWin.toFixed(2)}`, icon: ArrowUpRight, color: 'text-emerald-400' },
    { label: 'Avg Loss', value: `$${metrics.avgLoss.toFixed(2)}`, icon: ArrowDownRight, color: 'text-red-400' },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold text-white">Trading Dashboard</h1>
          <p className="text-slate-400">
            Your trading performance at a glance
            {data.lastUpdated && (
              <span className="text-slate-500 text-sm ml-2">
                • Last updated: {formatTimeSince(new Date(data.lastUpdated))}
              </span>
            )}
            {data.dataSource && (
              <span className="ml-2 px-2 py-0.5 text-xs rounded-full border border-slate-700 bg-slate-800 text-slate-300">
                {data.dataSource === 'supabase' ? 'Supabase' : 'Local'}
              </span>
            )}
          </p>
        </div>
        <div className="flex items-center gap-4">
          {/* Timeframe Selector */}
          <div className="bg-slate-700 rounded-lg p-1 flex">
            {timeframeOptions.map((option) => (
              <button
                key={option.value}
                onClick={() => setTimeframe(option.value)}
                className={`px-3 py-1 rounded-md text-sm font-medium transition-colors ${
                  timeframe === option.value
                    ? 'bg-emerald-600 text-white'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                {option.label}
              </button>
            ))}
          </div>
          
          {/* Action Buttons */}
          <div className="flex items-center gap-2">
            <button
              onClick={onRefresh}
              disabled={loading}
              className="flex items-center gap-2 bg-slate-700 hover:bg-slate-600 disabled:bg-slate-800 text-slate-300 px-3 py-2 rounded-lg transition-colors"
            >
              <RefreshCw size={16} className={loading ? 'animate-spin' : ''} />
              {loading ? 'Refreshing...' : 'Refresh'}
            </button>
            
            <div className="relative group">
              <button className="flex items-center gap-2 bg-slate-700 hover:bg-slate-600 text-slate-300 px-3 py-2 rounded-lg transition-colors">
                <Download size={16} />
                Export
              </button>
              <div className="absolute right-0 mt-2 hidden group-hover:block bg-slate-800 border border-slate-700 rounded-lg shadow-lg">
                <button
                  onClick={() => exportTradesJSON(filteredTrades, 'trades.json')}
                  className="block w-full text-left px-4 py-2 text-slate-300 hover:bg-slate-700"
                >
                  Export JSON
                </button>
                <button
                  onClick={() => exportTradesCSV(filteredTrades, 'trades.csv')}
                  className="block w-full text-left px-4 py-2 text-slate-300 hover:bg-slate-700"
                >
                  Export CSV
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {/* Net P&L */}
        <div className="bg-slate-800 rounded-xl p-6 border border-slate-700 shadow-lg">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-white">Net P&L</h3>
            <Wallet className={`${metrics.netPnl >= 0 ? 'text-emerald-400' : 'text-red-400'}`} size={24} />
          </div>
          <div className="mb-2">
            <div className={`text-3xl font-bold ${metrics.netPnl >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
              ${metrics.netPnl.toFixed(2)}
            </div>
            <div className="flex items-center gap-2 mt-1">
              <span className={`text-sm ${metrics.roi >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                {metrics.roi >= 0 ? '+' : ''}{metrics.roi.toFixed(1)}% ROI
              </span>
              <span className="text-slate-400 text-sm">
                • {metrics.totalTrades} trades
              </span>
            </div>
          </div>
          <div className="text-slate-500 text-xs mt-2">
            {metrics.winningTrades} winning, {metrics.losingTrades} losing trades
          </div>
        </div>

        {/* ROI */}
        <div className="bg-slate-800 rounded-xl p-6 border border-slate-700 shadow-lg">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-white">ROI</h3>
            <Percent className={`${metrics.roi >= 0 ? 'text-emerald-400' : 'text-red-400'}`} size={24} />
          </div>
          <div className="mb-4">
            <div className={`text-3xl font-bold ${metrics.roi >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
              {data?.baseline ? `${metrics.roi >= 0 ? '+' : ''}${metrics.roi.toFixed(1)}%` : 'N/A'}
            </div>
            <div className="text-slate-400 text-sm mt-1">
              {data?.baseline ? `Base: $${data.baseline.toFixed(2)}` : 'Set baseline to compute'}
            </div>
          </div>
          {!data?.baseline && (
            <div className="flex gap-2">
              <input
                type="number"
                placeholder="Starting balance"
                value={baselineInput}
                onChange={(e) => setBaselineInput(e.target.value)}
                className="flex-1 px-2 py-1 bg-slate-700 text-slate-300 text-sm rounded border border-slate-600"
              />
              <button
                onClick={() => {
                  if (baselineInput) {
                    setBaseline?.(parseFloat(baselineInput))
                    setBaselineInput('')
                  }
                }}
                className="px-2 py-1 bg-emerald-600 hover:bg-emerald-500 text-white text-sm rounded"
              >
                Set
              </button>
            </div>
          )}
        </div>

        {/* Win Rate */}
        <div className="bg-slate-800 rounded-xl p-6 border border-slate-700 shadow-lg">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-white">Win Rate</h3>
            <Target className="text-blue-400" size={24} />
          </div>
          <div className="mb-2">
            <div className="text-3xl font-bold text-white">
              {metrics.winRate.toFixed(1)}%
            </div>
            <div className="text-slate-400 text-sm mt-1">
              {metrics.winningTrades}W / {metrics.losingTrades}L
            </div>
          </div>
          <div className="w-full bg-slate-700 rounded-full h-2 mt-3">
            <div 
              className="bg-emerald-400 rounded-full h-2 transition-all duration-500"
              style={{ width: `${Math.min(metrics.winRate, 100)}%` }}
            ></div>
          </div>
        </div>

        {/* Profit Factor */}
        <div className="bg-slate-800 rounded-xl p-6 border border-slate-700 shadow-lg">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-white">Profit Factor</h3>
            <TrendingUp className={`${
              metrics.profitFactor >= 2 ? 'text-emerald-400' : 
              metrics.profitFactor >= 1 ? 'text-yellow-400' : 
              'text-red-400'
            }`} size={24} />
          </div>
          <div className="mb-2">
            <div className={`text-3xl font-bold ${
              metrics.profitFactor >= 2 ? 'text-emerald-400' : 
              metrics.profitFactor >= 1 ? 'text-yellow-400' : 
              'text-red-400'
            }`}>
              {metrics.profitFactor.toFixed(2)}
            </div>
            <div className="text-slate-400 text-sm mt-1">
              ${metrics.totalProfit.toFixed(2)} / ${metrics.totalLoss.toFixed(2)}
            </div>
          </div>
        </div>

        {/* Average Confluence */}
        <div className="bg-slate-800 rounded-xl p-6 border border-slate-700 shadow-lg">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-white">Avg Confluence</h3>
            <PieChart className={`${metrics.averageConfluence >= 50 ? 'text-emerald-400' : 'text-red-400'}`} size={24} />
          </div>
          <div className="mb-2">
            <div className={`text-3xl font-bold ${metrics.averageConfluence >= 50 ? 'text-emerald-400' : 'text-red-400'}`}>
              {Number(metrics.averageConfluence).toFixed(1)}%
            </div>
            <div className="text-slate-400 text-sm mt-1">
              Setup quality indicator
            </div>
          </div>
          <div className="text-xs text-slate-500">
            Higher = better trade setups
          </div>
        </div>
      </div>

      {/* Detailed Stats */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Recent Trades */}
        <div className="lg:col-span-2 bg-slate-800 rounded-xl p-6 border border-slate-700 shadow-lg">
          <div className="flex justify-between items-center mb-6">
            <div>
              <h3 className="text-xl font-bold text-white">Recent Trades</h3>
              <p className="text-slate-400 text-sm">
                {timeframe === 'all' ? 'All trades' : `Trades from ${timeframeOptions.find(t => t.value === timeframe)?.label}`}
              </p>
            </div>
            <div className="flex items-center gap-2">
              <div className="text-slate-400 text-sm">
                Showing {filteredTrades.length} trades
              </div>
              <button className="flex items-center gap-1 text-slate-400 hover:text-white text-sm">
                <Filter size={14} />
                Filter
              </button>
            </div>
          </div>
          
          {filteredTrades.length > 0 ? (
            <div className="space-y-3">
              {filteredTrades.slice(0, 5).map((trade, index) => (
                <div 
                  key={trade.id || index} 
                  className="flex items-center justify-between p-4 bg-slate-700/50 rounded-lg hover:bg-slate-700/70 transition-colors group"
                >
                  <div className="flex items-center gap-4">
                    <div className={`p-2 rounded-lg ${trade.result >= 0 ? 'bg-emerald-500/20' : 'bg-red-500/20'}`}>
                      {trade.result >= 0 ? (
                        <ArrowUpRight className="text-emerald-400" size={20} />
                      ) : (
                        <ArrowDownRight className="text-red-400" size={20} />
                      )}
                    </div>
                    <div>
                      <div className="font-semibold text-white">{trade.symbol}</div>
                      <div className="text-slate-400 text-sm flex items-center gap-2">
                        <Calendar size={12} />
                        {trade.date}
                        <span className="text-slate-500">•</span>
                        <span className="text-slate-500">{trade.timeframe}</span>
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-6">
                    <div className="text-right">
                      <div className="text-slate-400 text-xs">Result</div>
                      <div className={`font-bold ${trade.result >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                        ${Math.abs(trade.result).toFixed(2)}
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-slate-400 text-xs">Confluence</div>
                      <div className={`font-bold ${trade.confluence >= 50 ? 'text-emerald-400' : 'text-red-400'}`}>
                        {trade.confluence}%
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-slate-400 text-xs">Type</div>
                      <div className={`font-bold ${
                        trade.type === 'Long' ? 'text-emerald-400' : 
                        trade.type === 'Short' ? 'text-red-400' : 
                        'text-slate-300'
                      }`}>
                        {trade.type}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
              
              {filteredTrades.length > 5 && (
                <button className="w-full py-3 text-slate-400 hover:text-white transition-colors flex items-center justify-center gap-2 border-t border-slate-700/50 mt-4 pt-4">
                  View All Trades ({filteredTrades.length})
                  <ChevronRight size={16} />
                </button>
              )}
            </div>
          ) : (
            <div className="text-center py-12">
              <div className="text-slate-400 mb-4">No trades found</div>
              <div className="text-slate-500 text-sm">
                {timeframe === 'all' ? 'Start trading to see your history here!' : 'No trades in this timeframe'}
              </div>
            </div>
          )}
        </div>

        {/* Performance Stats */}
        <div className="bg-slate-800 rounded-xl p-6 border border-slate-700 shadow-lg">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-xl font-bold text-white">Performance Stats</h3>
            <Activity className="text-blue-400" size={20} />
          </div>
          <div className="space-y-6">
            {/* Win/Loss Stats */}
            <div>
              <h4 className="text-slate-400 text-sm font-medium mb-3">Win/Loss Analysis</h4>
              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-slate-400">Long Trades Win Rate</span>
                  <span className={`font-semibold ${data.winRateByType?.long >= 50 ? 'text-emerald-400' : 'text-red-400'}`}>
                    {data.winRateByType?.long?.toFixed(1) || 0}%
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-slate-400">Short Trades Win Rate</span>
                  <span className={`font-semibold ${data.winRateByType?.short >= 50 ? 'text-emerald-400' : 'text-red-400'}`}>
                    {data.winRateByType?.short?.toFixed(1) || 0}%
                  </span>
                </div>
              </div>
            </div>

            {/* Largest Win/Loss */}
            <div>
              <h4 className="text-slate-400 text-sm font-medium mb-3">Extremes</h4>
              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-slate-400">Largest Win</span>
                  <span className="font-semibold text-emerald-400">${metrics.largestWin.toFixed(2)}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-slate-400">Largest Loss</span>
                  <span className="font-semibold text-red-400">${metrics.largestLoss.toFixed(2)}</span>
                </div>
              </div>
            </div>

            {/* Streaks */}
            <div>
              <h4 className="text-slate-400 text-sm font-medium mb-3">Streaks</h4>
              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-slate-400 flex items-center gap-2">
                    <Trophy size={14} />
                    Best Streak
                  </span>
                  <span className="font-semibold text-white">{metrics.bestStreak}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-slate-400">Current Streak</span>
                  <span className={`font-semibold ${metrics.currentStreak >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                    {metrics.currentStreak > 0 ? '+' : ''}{metrics.currentStreak}
                  </span>
                </div>
              </div>
            </div>

            {/* Top Pairs */}
            {data.topPairs && data.topPairs.length > 0 && (
              <div>
                <h4 className="text-slate-400 text-sm font-medium mb-3">Top Trading Pairs</h4>
                <div className="space-y-2">
                  {data.topPairs.slice(0, 3).map((pair, index) => (
                    <div key={index} className="flex justify-between items-center">
                      <span className="text-slate-300">{pair.pair}</span>
                      <span className={`text-sm ${pair.profit >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                        {pair.count} trades (${pair.profit})
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Performance by Timeframe */}
      <div className="bg-slate-800 rounded-xl p-6 border border-slate-700 shadow-lg">
        <div className="flex justify-between items-center mb-6">
          <div>
            <h3 className="text-xl font-bold text-white">Performance by Timeframe</h3>
            <p className="text-slate-400 text-sm">Cumulative P&L for each period</p>
          </div>
          <div className="flex items-center gap-2">
            <button 
              onClick={() => setSelectedMetric('pnl')}
              className={`px-3 py-1 rounded-md text-sm font-medium transition-colors ${
                selectedMetric === 'pnl'
                  ? 'bg-emerald-600 text-white'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              P&L
            </button>
            <button 
              onClick={() => setSelectedMetric('trades')}
              className={`px-3 py-1 rounded-md text-sm font-medium transition-colors ${
                selectedMetric === 'trades'
                  ? 'bg-emerald-600 text-white'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              Trades
            </button>
            <button 
              onClick={() => setSelectedMetric('winRate')}
              className={`px-3 py-1 rounded-md text-sm font-medium transition-colors ${
                selectedMetric === 'winRate'
                  ? 'bg-emerald-600 text-white'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              Win Rate
            </button>
          </div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {Object.entries(data.performance || {}).map(([timeframe, stats]) => {
            const isPositive = stats.pnl >= 0
            return (
              <div key={timeframe} className="bg-slate-700/30 rounded-lg p-4 hover:bg-slate-700/50 transition-colors">
                <div className="flex items-center justify-between mb-3">
                  <div className="text-slate-300 font-medium capitalize">{timeframe}</div>
                  {isPositive ? (
                    <ArrowUpRight className="text-emerald-400" size={18} />
                  ) : (
                    <ArrowDownRight className="text-red-400" size={18} />
                  )}
                </div>
                <div>
                  <div className={`text-2xl font-bold ${isPositive ? 'text-emerald-400' : 'text-red-400'}`}>
                    ${stats.pnl.toFixed(2)}
                  </div>
                  <div className="text-slate-400 text-sm mt-2">
                    {stats.trades} trades
                  </div>
                </div>
                <div className="flex items-end justify-center h-12 gap-1 mt-3">
                  <div
                    className={`w-full rounded-sm transition-all ${isPositive ? 'bg-emerald-400/50' : 'bg-red-400/50'}`}
                    style={{ height: `${Math.max(Math.min(Math.abs(stats.pnl) / 20, 48), 8)}px` }}
                  ></div>
                </div>
              </div>
            )
          })}
        </div>
      </div>

      {/* Quick Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {performanceMetrics.map((metric, index) => (
          <div key={index} className="bg-slate-800 rounded-xl p-4 border border-slate-700">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-slate-400 text-sm">{metric.label}</div>
                <div className={`text-xl font-bold mt-1 ${metric.color}`}>{metric.value}</div>
              </div>
              <metric.icon className={metric.color} size={20} />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default Dashboard;