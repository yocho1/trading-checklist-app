// src/pages/TradingHistory.jsx
import React, { useState, useEffect } from 'react';
import { Filter, Search, Edit, Trash2, Eye, ArrowLeft } from 'lucide-react';

const TradingHistory = () => {
  const [trades, setTrades] = useState([]);
  const [filter, setFilter] = useState('ALL');
  const [searchTerm, setSearchTerm] = useState('');

  // Load trades from localStorage on component mount
  useEffect(() => {
    const savedTrades = JSON.parse(localStorage.getItem('savedTrades') || '[]');
    setTrades(savedTrades);
  }, []);

  // Filter trades based on selected filter and search term
  const filteredTrades = trades.filter(trade => {
    const matchesFilter = filter === 'ALL' || trade.status === filter;
    const matchesSearch = trade.currencyPair.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         trade.confluenceScore.toString().includes(searchTerm);
    return matchesFilter && matchesSearch;
  });

  const deleteTrade = (id) => {
    const updatedTrades = trades.filter(trade => trade.id !== id);
    setTrades(updatedTrades);
    localStorage.setItem('savedTrades', JSON.stringify(updatedTrades));
  };

  const updateTradeStatus = (id, newStatus) => {
    const updatedTrades = trades.map(trade => 
      trade.id === id ? { ...trade, status: newStatus } : trade
    );
    setTrades(updatedTrades);
    localStorage.setItem('savedTrades', JSON.stringify(updatedTrades));
  };

  const goBackToChecklist = () => {
    window.location.reload(); // Simple navigation back
  };

  return (
    <div className="min-h-screen bg-slate-900 text-slate-200 p-6">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <button
            onClick={goBackToChecklist}
            className="flex items-center gap-2 text-slate-400 hover:text-white mb-4 transition-colors"
          >
            <ArrowLeft size={20} />
            Back to Checklist
          </button>
          <h1 className="text-3xl font-bold text-white mb-2">Trading History</h1>
          <p className="text-slate-400">View and manage your trading journal</p>
        </div>

        {/* Filters and Search */}
        <div className="bg-slate-800 rounded-xl p-6 mb-6 border border-slate-700">
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
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400" size={20} />
              <input
                type="text"
                placeholder="Search trades..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 pr-4 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
            </div>
          </div>
        </div>

        {/* Trades Grid */}
        {filteredTrades.length === 0 ? (
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
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

// Trade Card Component
const TradeCard = ({ trade, onDelete, onUpdateStatus }) => {
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

  return (
    <div className="bg-slate-800 rounded-xl border border-slate-700 p-6 hover:border-slate-600 transition-colors">
      {/* Header */}
      <div className="flex justify-between items-start mb-4">
        <div>
          <h3 className="text-xl font-bold text-white">{trade.currencyPair}</h3>
          <div className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium mt-1 ${getStatusColor(trade.status)}`}>
            {getStatusText(trade.status)}
          </div>
        </div>
        <div className="flex gap-2">
          <button className="p-2 text-slate-400 hover:text-white hover:bg-slate-700 rounded-lg transition-colors">
            <Eye size={16} />
          </button>
          <button className="p-2 text-slate-400 hover:text-white hover:bg-slate-700 rounded-lg transition-colors">
            <Edit size={16} />
          </button>
          <button 
            onClick={() => onDelete(trade.id)}
            className="p-2 text-slate-400 hover:text-red-400 hover:bg-slate-700 rounded-lg transition-colors"
          >
            <Trash2 size={16} />
          </button>
        </div>
      </div>

      {/* Trade Details */}
      <div className="space-y-3">
        <div className="flex justify-between">
          <span className="text-slate-400">Direction</span>
          <span className={`font-medium ${trade.direction === 'LONG' ? 'text-green-400' : 'text-red-400'}`}>
            {trade.direction}
          </span>
        </div>

        <div className="flex justify-between">
          <span className="text-slate-400">Confluence</span>
          <span className="font-medium text-white">{trade.confluenceScore}%</span>
        </div>

        <div className="flex justify-between">
          <span className="text-slate-400">Date</span>
          <span className="font-medium text-white">
            {new Date(trade.date).toLocaleDateString()}
          </span>
        </div>

        {trade.notes && (
          <div>
            <span className="text-slate-400">Notes</span>
            <p className="text-white mt-1 text-sm">{trade.notes}</p>
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