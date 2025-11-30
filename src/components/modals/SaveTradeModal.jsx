// src/components/modals/SaveTradeModal.jsx
import React, { useState } from 'react';
import { X, Upload } from 'lucide-react';
import CurrencyPairSelector from './CurrencyPairSelector';
import { useTradeCalculations } from '../../hooks/useTradeCalculations';
import auth from '../../utils/auth'; // Add this import

const SaveTradeModal = ({ isOpen, onClose, confluenceScore }) => {
  const [formData, setFormData] = useState({
    currencyPair: '',
    direction: 'LONG',
    accountBalance: '',
    stopLossPrice: '',
    takeProfitPrice: '',
    entryPrice: '',
    riskPercentage: '2',
    notes: '',
    chartImage: null
  });

  const calculations = useTradeCalculations(formData);

  const handleSave = () => {
    if (!formData.currencyPair || !formData.accountBalance || 
        !formData.stopLossPrice || !formData.takeProfitPrice || 
        !formData.entryPrice) {
      alert('Please fill in all required fields');
      return;
    }

    // Get current user
    const user = auth.getCurrentUser();
    if (!user) {
      alert('Please log in to save trades');
      return;
    }

    const newTrade = {
      id: Date.now().toString(),
      userId: user.id, // Use user ID
      currencyPair: formData.currencyPair,
      direction: formData.direction,
      confluenceScore: confluenceScore,
      accountBalance: parseFloat(formData.accountBalance),
      stopLossPrice: parseFloat(formData.stopLossPrice),
      takeProfitPrice: parseFloat(formData.takeProfitPrice),
      entryPrice: parseFloat(formData.entryPrice),
      riskPercentage: parseFloat(formData.riskPercentage),
      lotSize: calculations.lotSize,
      stopLossPips: calculations.stopLossPips,
      riskAmount: calculations.riskAmount,
      date: new Date().toISOString(),
      status: 'BEFORE',
      notes: formData.notes,
      chartImage: formData.chartImage
    };

    // Save to user-specific localStorage
    const userTradesKey = `savedTrades_${user.id}`; // User-specific key
    const existingTrades = JSON.parse(localStorage.getItem(userTradesKey) || '[]');
    const updatedTrades = [...existingTrades, newTrade];
    localStorage.setItem(userTradesKey, JSON.stringify(updatedTrades)); // Fix: use userTradesKey

    // Reset form and close modal
    setFormData({
      currencyPair: '',
      direction: 'LONG',
      accountBalance: '',
      stopLossPrice: '',
      takeProfitPrice: '',
      entryPrice: '',
      riskPercentage: '2',
      notes: '',
      chartImage: null
    });
    onClose();
    
    alert('Trade saved successfully!');
  };

  const handleImageUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      if (file.size > 10 * 1024 * 1024) {
        alert('File size must be less than 10MB');
        return;
      }
      if (!['image/jpeg', 'image/jpg', 'image/png'].includes(file.type)) {
        alert('Only JPG and PNG files are allowed');
        return;
      }
      
      const reader = new FileReader();
      reader.onload = (e) => {
        setFormData(prev => ({ ...prev, chartImage: e.target.result }));
      };
      reader.readAsDataURL(file);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-slate-800 rounded-xl border border-slate-700 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex justify-between items-center p-6 border-b border-slate-700">
          <h2 className="text-xl font-bold text-white">Save Trade</h2>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-white transition-colors"
          >
            <X size={24} />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6">
          {/* Confluence Score */}
          <div className="bg-slate-700 rounded-lg p-4 text-center">
            <div className="text-slate-400 text-sm mb-1">Confluence Score</div>
            <div className={`text-3xl font-bold ${
              confluenceScore >= 50 ? 'text-emerald-400' : 'text-red-400'
            }`}>
              {confluenceScore}%
            </div>
          </div>

          {/* Currency Pair */}
          <div>
            <label className="block text-white text-sm font-medium mb-2">
              Currency Pair *
            </label>
            <CurrencyPairSelector
              value={formData.currencyPair}
              onChange={(pair) => setFormData(prev => ({ ...prev, currencyPair: pair }))}
            />
          </div>

          {/* Direction */}
          <div>
            <label className="block text-white text-sm font-medium mb-2">
              Direction *
            </label>
            <div className="flex gap-2">
              {['LONG', 'SHORT'].map((direction) => (
                <button
                  key={direction}
                  type="button"
                  onClick={() => setFormData(prev => ({ ...prev, direction }))}
                  className={`flex-1 py-3 px-4 rounded-lg font-medium transition-colors ${
                    formData.direction === direction
                      ? direction === 'LONG'
                        ? 'bg-green-600 text-white'
                        : 'bg-red-600 text-white'
                      : 'bg-slate-700 text-slate-300 hover:bg-slate-600'
                  }`}
                >
                  {direction}
                </button>
              ))}
            </div>
          </div>

          {/* Account Balance */}
          <div>
            <label className="block text-white text-sm font-medium mb-2">
              Account Balance *
            </label>
            <div className="text-slate-400 text-xs mb-2">Account Balance (USD) *</div>
            <input
              type="number"
              value={formData.accountBalance}
              onChange={(e) => setFormData(prev => ({ ...prev, accountBalance: e.target.value }))}
              placeholder="10,000"
              className="w-full bg-slate-700 border border-slate-600 rounded-lg px-3 py-3 text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500"
            />
          </div>

          {/* Trade Parameters Section */}
          <div className="bg-slate-700 rounded-lg p-4">
            <h3 className="text-white font-medium mb-4">Trade Parameters</h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Stop Loss Price */}
              <div>
                <label className="block text-white text-sm font-medium mb-2">
                  Stop Loss Price *
                </label>
                <input
                  type="number"
                  step="0.00001"
                  value={formData.stopLossPrice}
                  onChange={(e) => setFormData(prev => ({ ...prev, stopLossPrice: e.target.value }))}
                  placeholder="1.08000"
                  className="w-full bg-slate-600 border border-slate-500 rounded-lg px-3 py-2 text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              {/* Take Profit Price */}
              <div>
                <label className="block text-white text-sm font-medium mb-2">
                  Take Profit Price *
                </label>
                <input
                  type="number"
                  step="0.00001"
                  value={formData.takeProfitPrice}
                  onChange={(e) => setFormData(prev => ({ ...prev, takeProfitPrice: e.target.value }))}
                  placeholder="1.09000"
                  className="w-full bg-slate-600 border border-slate-500 rounded-lg px-3 py-2 text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              {/* Entry Price */}
              <div>
                <label className="block text-white text-sm font-medium mb-2">
                  Entry Price *
                </label>
                <input
                  type="number"
                  step="0.00001"
                  value={formData.entryPrice}
                  onChange={(e) => setFormData(prev => ({ ...prev, entryPrice: e.target.value }))}
                  placeholder="1.08500"
                  className="w-full bg-slate-600 border border-slate-500 rounded-lg px-3 py-2 text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              {/* Risk Percentage */}
              <div>
                <label className="block text-white text-sm font-medium mb-2">
                  Risk Percentage (%) *
                </label>
                <input
                  type="number"
                  step="0.1"
                  value={formData.riskPercentage}
                  onChange={(e) => setFormData(prev => ({ ...prev, riskPercentage: e.target.value }))}
                  placeholder="2"
                  className="w-full bg-slate-600 border border-slate-500 rounded-lg px-3 py-2 text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>
            </div>
          </div>

          {/* Calculated Lot Size */}
          <div className="bg-slate-700 rounded-lg p-4">
            <h3 className="text-white font-medium mb-2">Calculated Lot Size</h3>
            <div className="text-slate-400 text-sm mb-4">
              {calculations.stopLossPips > 0 
                ? `Lot Size: ${calculations.lotSize.toFixed(2)} | Risk: $${calculations.riskAmount.toFixed(2)} | SL Pips: ${calculations.stopLossPips}`
                : 'Enter Stop Loss to calculate lot size'
              }
            </div>
          </div>

          {/* Notes */}
          <div>
            <label className="block text-white text-sm font-medium mb-2">
              Notes *
            </label>
            <textarea
              value={formData.notes}
              onChange={(e) => setFormData(prev => ({ ...prev, notes: e.target.value }))}
              placeholder="Add your trade notes here..."
              rows="4"
              className="w-full bg-slate-700 border border-slate-600 rounded-lg px-3 py-3 text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500"
            />
          </div>

          {/* Chart Image Upload */}
          <div>
            <label className="block text-white text-sm font-medium mb-2">
              Chart Image (Before Trade) *
            </label>
            <div 
              onClick={() => document.getElementById('chart-upload').click()}
              className="border-2 border-dashed border-slate-600 rounded-lg p-8 text-center cursor-pointer hover:border-slate-500 transition-colors"
            >
              {formData.chartImage ? (
                <div className="text-emerald-400">
                  <div className="text-sm font-medium">Image uploaded successfully</div>
                  <div className="text-xs text-slate-400 mt-1">Click to change</div>
                </div>
              ) : (
                <>
                  <Upload className="mx-auto text-slate-400 mb-2" size={24} />
                  <div className="text-slate-400 text-sm">Click to upload before-trade chart</div>
                  <div className="text-slate-500 text-xs mt-1">PNG, JPG up to 10MB (1 image only)</div>
                </>
              )}
              <input
                id="chart-upload"
                type="file"
                accept="image/jpeg,image/jpg,image/png"
                onChange={handleImageUpload}
                className="hidden"
              />
            </div>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="flex gap-3 p-6 border-t border-slate-700">
          <button
            onClick={onClose}
            className="flex-1 py-3 px-4 bg-slate-700 hover:bg-slate-600 text-white rounded-lg font-medium transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            className="flex-1 py-3 px-4 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg font-medium transition-colors"
          >
            Save Trade
          </button>
        </div>
      </div>
    </div>
  );
};

export default SaveTradeModal;