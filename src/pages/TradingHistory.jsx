// src/pages/TradingHistory.jsx
import React, { useState, useEffect } from 'react';
import { Filter, Search, Edit, Trash2, Eye, ArrowLeft, BarChart3 } from 'lucide-react';
import { tradeService } from '../services/tradeService';

const TradingHistory = () => {
  const [trades, setTrades] = useState([]);
  const [filter, setFilter] = useState('ALL');
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(true);
  const [statistics, setStatistics] = useState(null);

  // Load trades from Supabase on component mount
  useEffect(() => {
    loadTrades();
    loadStatistics();
  }, []);

  const loadTrades = async () => {
    setLoading(true);
    try {
      const result = await tradeService.getTrades();
      if (result.success) {
        setTrades(result.trades || []);
      } else {
        // Fallback to localStorage if Supabase fails
        console.log('Supabase unavailable, loading trades from localStorage...');
        try {
          const data = localStorage.getItem('trading_app_shared_data');
          if (data) {
            const parsed = JSON.parse(data);
            const currentUser = JSON.parse(localStorage.getItem('currentUser') || '{}');
            
            console.log('Current user ID:', currentUser.id);
            console.log('Total trades in storage:', parsed.trades?.length || 0);
            console.log('All trades:', parsed.trades);
            
            // Get trades for current user
            const userTrades = (parsed.trades || []).filter(t => t.userId === currentUser.id);
            setTrades(userTrades);
            console.log(`Loaded ${userTrades.length} trades from localStorage for user ${currentUser.id}`);
          } else {
            console.error('Error loading trades:', result.error);
            setTrades([]);
          }
        } catch (localError) {
          console.error('Error loading trades from localStorage:', localError);
          setTrades([]);
        }
      }
    } catch (error) {
      console.error('Error loading trades:', error);
      setTrades([]);
    } finally {
      setLoading(false);
    }
  };

  const loadStatistics = async () => {
    try {
      const result = await tradeService.getTradeStatistics();
      if (result.success) {
        setStatistics(result.statistics);
      } else {
        // Fallback to calculate statistics from localStorage
        console.log('Supabase unavailable, calculating statistics from localStorage...');
        try {
          const data = localStorage.getItem('trading_app_shared_data');
          if (data) {
            const parsed = JSON.parse(data);
            const currentUser = JSON.parse(localStorage.getItem('currentUser') || '{}');
            
            // Get trades for current user
            const userTrades = (parsed.trades || []).filter(t => t.userId === currentUser.id);
            
            // Calculate basic statistics
            const stats = {
              totalTrades: userTrades.length,
              winTrades: userTrades.filter(t => t.status === 'WIN').length,
              lossTrades: userTrades.filter(t => t.status === 'LOSS').length,
              breakEvenTrades: userTrades.filter(t => t.status === 'BREAKEVEN').length,
              pendingTrades: userTrades.filter(t => t.status === 'BEFORE' || t.status === 'RUNNING').length,
            };
            
            setStatistics(stats);
          }
        } catch (localError) {
          console.error('Error calculating statistics from localStorage:', localError);
        }
      }
    } catch (error) {
      console.error('Error loading statistics:', error);
    }
  };

  // Filter trades based on selected filter and search term
  const filteredTrades = trades.filter(trade => {
    const matchesFilter = filter === 'ALL' || trade.status === filter;
    const matchesSearch = (trade.symbol || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
                         (trade.notes || '').toLowerCase().includes(searchTerm.toLowerCase());
    return matchesFilter && matchesSearch;
  });

  const deleteTrade = async (id) => {
    if (!window.confirm('Are you sure you want to delete this trade?')) return;
    
    try {
      const result = await tradeService.deleteTrade(id);
      if (result.success) {
        // Remove from local state
        setTrades(prev => prev.filter(trade => trade.id !== id));
        // Reload statistics
        loadStatistics();
      } else {
        // Fallback to delete from localStorage
        console.log('Supabase unavailable, deleting trade from localStorage...');
        try {
          const data = localStorage.getItem('trading_app_shared_data');
          if (data) {
            const parsed = JSON.parse(data);
            parsed.trades = (parsed.trades || []).filter(t => t.id !== id);
            localStorage.setItem('trading_app_shared_data', JSON.stringify(parsed));
            setTrades(prev => prev.filter(trade => trade.id !== id));
            loadStatistics();
          }
        } catch (localError) {
          console.error('Error deleting trade from localStorage:', localError);
        }
      }
    } catch (error) {
      console.error('Error deleting trade:', error);
    }
  };

  const updateTradeStatus = async (id, newStatus) => {
    try {
      const result = await tradeService.updateTradeStatus(id, newStatus);
      if (result.success) {
        // Update local state
        setTrades(prev => prev.map(trade => 
          trade.id === id ? result.trade : trade
        ));
        // Reload statistics
        loadStatistics();
      } else {
        // Fallback to update in localStorage
        console.log('Supabase unavailable, updating trade status in localStorage...');
        try {
          const data = localStorage.getItem('trading_app_shared_data');
          if (data) {
            const parsed = JSON.parse(data);
            const tradeIndex = (parsed.trades || []).findIndex(t => t.id === id);
            if (tradeIndex >= 0) {
              parsed.trades[tradeIndex].status = newStatus;
              parsed.trades[tradeIndex].updatedAt = new Date().toISOString();
              localStorage.setItem('trading_app_shared_data', JSON.stringify(parsed));
              setTrades(prev => prev.map(trade => 
                trade.id === id ? { ...trade, status: newStatus } : trade
              ));
              loadStatistics();
            }
          }
        } catch (localError) {
          console.error('Error updating trade status in localStorage:', localError);
        }
      }
    } catch (error) {
      console.error('Error updating trade status:', error);
    }
  };

  const goBackToChecklist = () => {
    // Use window.history or redirect based on your setup
    window.location.href = '/checklist';
  };

  // Function to calculate profit/loss
  const calculateProfitLoss = (trade) => {
    if (trade.status !== 'CLOSED' || !trade.entry_price || !trade.exit_price) return null;
    
    const entry = parseFloat(trade.entry_price);
    const exit = parseFloat(trade.exit_price);
    const positionSize = parseFloat(trade.position_size) || 1;
    
    if (trade.direction === 'LONG') {
      return (exit - entry) * positionSize;
    } else {
      return (entry - exit) * positionSize;
    }
  };

  return (
    <div className="min-h-screen bg-slate-900 text-slate-200 p-4 md:p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <button
            onClick={goBackToChecklist}
            className="flex items-center gap-2 text-slate-400 hover:text-white mb-4 transition-colors"
          >
            <ArrowLeft size={20} />
            Back to Checklist
          </button>
          <div className="flex justify-between items-start md:items-center mb-4">
            <div>
              <h1 className="text-3xl font-bold text-white mb-2">Trading History</h1>
              <p className="text-slate-400">View and manage your trading journal</p>
            </div>
            
            {/* Statistics Summary */}
            {statistics && (
              <div className="hidden md:flex items-center gap-4 bg-slate-800/50 rounded-lg p-4">
                <div className="text-center">
                  <div className="text-2xl font-bold text-white">{statistics.totalTrades}</div>
                  <div className="text-sm text-slate-400">Total</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-green-400">{statistics.winTrades}</div>
                  <div className="text-sm text-slate-400">Wins</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-red-400">{statistics.lossTrades}</div>
                  <div className="text-sm text-slate-400">Losses</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-yellow-400">{statistics.breakevenTrades}</div>
                  <div className="text-sm text-slate-400">Breakeven</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-blue-400">{statistics.winRate}%</div>
                  <div className="text-sm text-slate-400">Win Rate</div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Filters and Search */}
        <div className="bg-slate-800 rounded-xl p-4 md:p-6 mb-6 border border-slate-700">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
            {/* Filter Buttons */}
            <div className="flex flex-wrap gap-2">
              {['ALL', 'BEFORE', 'WIN', 'LOSS', 'BREAKEVEN'].map((filterType) => (
                <button
                  key={filterType}
                  onClick={() => setFilter(filterType)}
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                    filter === filterType
                      ? 'bg-emerald-600 text-white'
                      : 'bg-slate-700 text-slate-300 hover:bg-slate-600'
                  }`}
                >
                  {filterType}
                </button>
              ))}
            </div>

            {/* Search Bar */}
            <div className="relative w-full md:w-auto">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400" size={20} />
              <input
                type="text"
                placeholder="Search by symbol or notes..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full md:w-64 pl-10 pr-4 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
            </div>
          </div>
        </div>

        {/* Mobile Statistics */}
        {statistics && (
          <div className="md:hidden grid grid-cols-2 gap-4 mb-6">
            <div className="bg-slate-800 rounded-lg p-4">
              <div className="text-lg font-bold text-white">{statistics.totalTrades}</div>
              <div className="text-sm text-slate-400">Total Trades</div>
            </div>
            <div className="bg-slate-800 rounded-lg p-4">
              <div className="text-lg font-bold text-green-400">{statistics.winRate}%</div>
              <div className="text-sm text-slate-400">Win Rate</div>
            </div>
            <div className="bg-slate-800 rounded-lg p-4">
              <div className="text-lg font-bold text-green-400">{statistics.winTrades}</div>
              <div className="text-sm text-slate-400">Wins</div>
            </div>
            <div className="bg-slate-800 rounded-lg p-4">
              <div className="text-lg font-bold text-red-400">{statistics.lossTrades}</div>
              <div className="text-sm text-slate-400">Losses</div>
            </div>
          </div>
        )}

        {/* Loading State */}
        {loading ? (
          <div className="text-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-4 border-emerald-500 border-t-transparent mx-auto mb-4"></div>
            <p className="text-slate-400">Loading your trades...</p>
          </div>
        ) : filteredTrades.length === 0 ? (
          <div className="text-center py-12">
            <div className="text-slate-500 text-lg mb-4">
              {trades.length === 0 ? 'No trades saved yet' : 'No trades match your filters'}
            </div>
            <p className="text-slate-400">
              {trades.length === 0 
                ? 'Start by saving your first trade from the checklist page' 
                : 'Try changing your filters or search term'
              }
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredTrades.map((trade) => (
              <TradeCard 
                key={trade.id} 
                trade={trade} 
                onDelete={deleteTrade}
                onUpdateStatus={updateTradeStatus}
                calculateProfitLoss={calculateProfitLoss}
              />
            ))}
          </div>
        )}

        {/* Total Results */}
        {!loading && filteredTrades.length > 0 && (
          <div className="mt-8 text-center text-slate-400">
            Showing {filteredTrades.length} of {trades.length} trades
          </div>
        )}
      </div>
    </div>
  );
};

// Updated Trade Card Component
const TradeCard = ({ trade, onDelete, onUpdateStatus, calculateProfitLoss }) => {
  const getStatusColor = (status) => {
    switch (status) {
      case 'WIN': return 'bg-green-500';
      case 'LOSS': return 'bg-red-500';
      case 'BREAKEVEN': return 'bg-yellow-500';
      case 'BEFORE': return 'bg-blue-500';
      default: return 'bg-slate-500';
    }
  };

  const getStatusText = (status) => {
    switch (status) {
      case 'WIN': return 'Win';
      case 'LOSS': return 'Loss';
      case 'BREAKEVEN': return 'Breakeven';
      case 'BEFORE': return 'Before';
      default: return 'Unknown';
    }
  };

  const profitLoss = calculateProfitLoss(trade);

  return (
    <div className="bg-slate-800 rounded-xl border border-slate-700 p-5 hover:border-slate-600 transition-colors">
      {/* Header */}
      <div className="flex justify-between items-start mb-4">
        <div>
          <h3 className="text-xl font-bold text-white">{trade.symbol || 'Unknown Symbol'}</h3>
          <div className="flex items-center gap-2 mt-1">
            <div className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(trade.status)}`}>
              {getStatusText(trade.status)}
            </div>
            <div className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
              trade.direction === 'LONG' ? 'bg-green-500/20 text-green-300' : 'bg-red-500/20 text-red-300'
            }`}>
              {trade.direction || 'LONG'}
            </div>
          </div>
        </div>
        <div className="flex gap-1">
          <button 
            onClick={() => onDelete(trade.id)}
            className="p-2 text-slate-400 hover:text-red-400 hover:bg-slate-700 rounded-lg transition-colors"
            title="Delete trade"
          >
            <Trash2 size={16} />
          </button>
        </div>
      </div>

      {/* Trade Details */}
      <div className="space-y-3">
        {/* Confluence Score */}
        <div className="flex justify-between items-center">
          <span className="text-slate-400">Confluence</span>
          <div className="flex items-center gap-2">
            <div className="w-24 bg-slate-700 rounded-full h-2">
              <div 
                className="bg-emerald-500 h-2 rounded-full" 
                style={{ width: `${Math.min(trade.confluence_score || 0, 100)}%` }}
              />
            </div>
            <span className="font-medium text-white">{trade.confluence_score || 0}%</span>
          </div>
        </div>

        {/* Entry Price */}
        {trade.entry_price && (
          <div className="flex justify-between">
            <span className="text-slate-400">Entry Price</span>
            <span className="font-medium text-white">${parseFloat(trade.entry_price).toFixed(2)}</span>
          </div>
        )}

        {/* Exit Price */}
        {trade.exit_price && (
          <div className="flex justify-between">
            <span className="text-slate-400">Exit Price</span>
            <span className="font-medium text-white">${parseFloat(trade.exit_price).toFixed(2)}</span>
          </div>
        )}

        {/* Profit/Loss */}
        {profitLoss !== null && (
          <div className="flex justify-between">
            <span className="text-slate-400">P/L</span>
            <span className={`font-medium ${profitLoss >= 0 ? 'text-green-400' : 'text-red-400'}`}>
              ${profitLoss.toFixed(2)}
            </span>
          </div>
        )}

        {/* Date */}
        <div className="flex justify-between">
          <span className="text-slate-400">Date</span>
          <span className="font-medium text-white">
            {new Date(trade.created_at).toLocaleDateString()}
          </span>
        </div>

        {/* Notes */}
        {trade.notes && (
          <div>
            <span className="text-slate-400">Notes</span>
            <p className="text-white mt-1 text-sm line-clamp-2">{trade.notes}</p>
          </div>
        )}
      </div>

      {/* Status Update Buttons */}
      {trade.status === 'BEFORE' && (
        <div className="flex gap-2 mt-4 pt-4 border-t border-slate-700">
          {['WIN', 'LOSS', 'BREAKEVEN'].map((status) => (
            <button
              key={status}
              onClick={() => onUpdateStatus(trade.id, status)}
              className={`flex-1 py-2 text-xs font-medium rounded-lg transition-colors ${
                status === 'WIN' 
                  ? 'bg-green-600 hover:bg-green-500 text-white' 
                  : status === 'LOSS'
                  ? 'bg-red-600 hover:bg-red-500 text-white'
                  : 'bg-yellow-600 hover:bg-yellow-500 text-white'
              }`}
            >
              Mark as {status}
            </button>
          ))}
        </div>
      )}
    </div>
  );
};

export default TradingHistory;