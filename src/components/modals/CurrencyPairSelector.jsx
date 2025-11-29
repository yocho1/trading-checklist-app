// src/components/modals/CurrencyPairSelector.jsx
import React, { useState } from 'react';
import { ChevronDown, Search } from 'lucide-react';
import { CURRENCY_CATEGORIES } from '../../utils/constants';

const CurrencyPairSelector = ({ value, onChange }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');

  const allPairs = [
    ...CURRENCY_CATEGORIES.major,
    ...CURRENCY_CATEGORIES.minor,
    ...CURRENCY_CATEGORIES.exotic,
    ...CURRENCY_CATEGORIES.metals,
  ];

  const filteredPairs = allPairs.filter(pair =>
    pair.symbol.toLowerCase().includes(searchTerm.toLowerCase()) ||
    pair.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const selectedPair = allPairs.find(pair => pair.symbol === value);

  return (
    <div className="relative">
      {/* Selected Value Display */}
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="w-full bg-slate-700 border border-slate-600 rounded-lg px-3 py-2 text-left text-white flex justify-between items-center hover:border-slate-500 transition-colors"
      >
        <span>{selectedPair ? selectedPair.symbol : 'Select currency pair'}</span>
        <ChevronDown size={20} className="text-slate-400" />
      </button>

      {/* Dropdown Menu */}
      {isOpen && (
        <div className="absolute top-full left-0 right-0 mt-1 bg-slate-800 border border-slate-600 rounded-lg shadow-lg z-10 max-h-80 overflow-hidden">
          {/* Search Input */}
          <div className="p-2 border-b border-slate-700">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400" size={16} />
              <input
                type="text"
                placeholder="Search currency pairs..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-9 pr-3 py-2 bg-slate-700 border border-slate-600 rounded text-white placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-emerald-500"
              />
            </div>
          </div>

          {/* Pairs List */}
          <div className="overflow-y-auto max-h-60">
            {filteredPairs.length === 0 ? (
              <div className="p-3 text-slate-400 text-center">No pairs found</div>
            ) : (
              filteredPairs.map((pair) => (
                <button
                  key={pair.symbol}
                  type="button"
                  onClick={() => {
                    onChange(pair.symbol);
                    setIsOpen(false);
                    setSearchTerm('');
                  }}
                  className={`w-full px-3 py-2 text-left hover:bg-slate-700 transition-colors ${
                    value === pair.symbol ? 'bg-emerald-600 text-white' : 'text-slate-300'
                  }`}
                >
                  <div className="font-medium">{pair.symbol}</div>
                  <div className="text-xs text-slate-400">{pair.name}</div>
                </button>
              ))
            )}
          </div>
        </div>
      )}

      {/* Close dropdown when clicking outside */}
      {isOpen && (
        <div
          className="fixed inset-0 z-0"
          onClick={() => setIsOpen(false)}
        />
      )}
    </div>
  );
};

// Fix: Export as default
export default CurrencyPairSelector;