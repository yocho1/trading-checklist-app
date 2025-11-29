// src/components/layout/Header.jsx
import React from 'react';
import { BarChart3, History } from 'lucide-react';

export const Header = () => {
  return (
    <header className="bg-slate-800 border-b border-slate-700">
      <div className="max-w-5xl mx-auto px-4 py-4 flex justify-between items-center">
        <div className="flex items-center space-x-3">
          <BarChart3 className="text-emerald-400" size={32} />
          <div>
            <h1 className="text-2xl font-bold text-white">Trading Checklist</h1>
            <p className="text-slate-400 text-sm">Professional Forex Trading Assistant</p>
          </div>
        </div>
        
        <button 
          onClick={() => window.location.reload()} // Simple navigation for demo
          className="flex items-center space-x-2 bg-slate-700 hover:bg-slate-600 text-white px-4 py-2 rounded-lg transition-colors"
        >
          <History size={18} />
          <span>View History</span>
        </button>
      </div>
    </header>
  );
};