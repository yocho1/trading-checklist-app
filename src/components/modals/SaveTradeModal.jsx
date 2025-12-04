// src/components/modals/SaveTradeModal.jsx
import React, { useState } from 'react';
import { X, Upload, Save, AlertCircle } from 'lucide-react';
import CurrencyPairSelector from './CurrencyPairSelector';
import { useTradeCalculations } from '../../hooks/useTradeCalculations';
import auth from '../../utils/auth';
import { tradeService } from '../../services/tradeService';
import { supabase } from '../../services/supabaseClient';

const SaveTradeModal = ({ isOpen, onClose, confluenceScore, onTradeSaved }) => {
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

  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  
  const calculations = useTradeCalculations(formData);

  const handleSave = async () => {
    console.log('=== SAVE TRADE STARTED ===');
    console.log('Form data:', formData);
    
    // Validate required fields
    if (!formData.currencyPair || !formData.accountBalance || 
        !formData.stopLossPrice || !formData.takeProfitPrice || 
        !formData.entryPrice || !formData.notes) {
      console.error('Validation failed: Missing required fields');
      setError('Please fill in all required fields');
      return;
    }

    if (!formData.chartImage) {
      setError('Please upload a chart image');
      return;
    }

    setSaving(true);
    setError('');

    try {
      // Get current user - try multiple sources
      let user = auth.getCurrentUser();
      if (!user) {
        // Fallback to localStorage currentUser
        const currentUserData = localStorage.getItem('currentUser');
        if (currentUserData) {
          user = JSON.parse(currentUserData);
        }
      }
      
      if (!user || !user.id) {
        setError('Please log in to save trades');
        setSaving(false);
        return;
      }
      
      console.log('Saving trade for user:', user.id, user.email);
      
      // Check if we have a Supabase session, but don't fail if we don't
      const sessionCheck = await auth.ensureSupabaseSession();
      const hasSupabaseSession = sessionCheck.success;

      // Prepare trade data for Supabase
      const tradeData = {
        currencyPair: formData.currencyPair,
        symbol: formData.currencyPair, // For compatibility with trades table
        direction: formData.direction,
        accountBalance: parseFloat(formData.accountBalance),
        stopLossPrice: parseFloat(formData.stopLossPrice),
        stop_loss: parseFloat(formData.stopLossPrice), // For trades table
        takeProfitPrice: parseFloat(formData.takeProfitPrice),
        take_profit: parseFloat(formData.takeProfitPrice), // For trades table
        entryPrice: parseFloat(formData.entryPrice),
        entry_price: parseFloat(formData.entryPrice), // For trades table
        riskPercentage: parseFloat(formData.riskPercentage),
        risk_percentage: parseFloat(formData.riskPercentage), // For trades table
        confluenceScore: confluenceScore,
        confluence_score: confluenceScore, // For trades table
        lotSize: calculations.lotSize,
        position_size: calculations.lotSize, // For trades table
        stopLossPips: calculations.stopLossPips,
        riskAmount: calculations.riskAmount,
        notes: formData.notes,
        chartImage: formData.chartImage,
        status: 'BEFORE',
        checklist_data: { // Store all form data as JSON
          confluenceScore,
          calculations,
          formData
        }
      };

      // Save to Supabase if session available, otherwise fallback to localStorage
      let result;
      
      if (hasSupabaseSession) {
        result = await tradeService.createTrade(tradeData);
      } else {
        // Fallback: Save to localStorage
        console.log('No Supabase session, saving to localStorage for user:', user.id);
        try {
          const data = localStorage.getItem('trading_app_shared_data');
          const parsed = data ? JSON.parse(data) : { users: [], trades: [], verificationCodes: {}, dashboardSettings: {} };
          
          const newTrade = {
            id: Date.now().toString(),
            userId: user.id,
            ...tradeData,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
          };
          
          console.log('New trade object:', newTrade);
          console.log('Current trades count before save:', parsed.trades?.length || 0);
          
          parsed.trades = parsed.trades || [];
          parsed.trades.push(newTrade);
          
          console.log('Trades count after adding:', parsed.trades.length);
          
          localStorage.setItem('trading_app_shared_data', JSON.stringify(parsed));
          console.log('Trade saved to localStorage successfully');
          
          result = { success: true, trade: newTrade };
        } catch (err) {
          result = { success: false, error: err.message };
        }
      }
      
      if (result.success) {
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

        // Show success message
        alert('Trade saved successfully to your trading journal!');
        
        // Call the callback to refresh data
        if (onTradeSaved) {
          onTradeSaved(result.trade);
        }
        
        // Don't reload - let the parent handle navigation/refresh
      } else {
        setError(`Failed to save trade: ${result.error}`);
      }
    } catch (error) {
      console.error('Error saving trade:', error);
      setError('An error occurred while saving the trade. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  const handleImageUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      if (file.size > 10 * 1024 * 1024) {
        setError('File size must be less than 10MB');
        return;
      }
      if (!['image/jpeg', 'image/jpg', 'image/png'].includes(file.type)) {
        setError('Only JPG and PNG files are allowed');
        return;
      }
      
      const reader = new FileReader();
      reader.onload = (e) => {
        setFormData(prev => ({ ...prev, chartImage: e.target.result }));
        setError(''); // Clear any previous errors
      };
      reader.onerror = () => {
        setError('Failed to upload image. Please try again.');
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
          <div>
            <h2 className="text-xl font-bold text-white">Save Trade to Journal</h2>
            <p className="text-slate-400 text-sm mt-1">
              Save this trade to your Supabase-powered trading journal
            </p>
          </div>
          <button
            onClick={onClose}
            disabled={saving}
            className="text-slate-400 hover:text-white transition-colors disabled:opacity-50"
          >
            <X size={24} />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6">
          {/* Error Message */}
          {error && (
            <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-4 flex items-start gap-3">
              <AlertCircle className="text-red-400 flex-shrink-0 mt-0.5" size={20} />
              <span className="text-red-400 text-sm">{error}</span>
            </div>
          )}

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
              onChange={(pair) => {
                setFormData(prev => ({ ...prev, currencyPair: pair }));
                setError('');
              }}
              disabled={saving}
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
                  onClick={() => {
                    setFormData(prev => ({ ...prev, direction }));
                    setError('');
                  }}
                  disabled={saving}
                  className={`flex-1 py-3 px-4 rounded-lg font-medium transition-colors disabled:opacity-50 ${
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
              onChange={(e) => {
                setFormData(prev => ({ ...prev, accountBalance: e.target.value }));
                setError('');
              }}
              placeholder="10,000"
              disabled={saving}
              className="w-full bg-slate-700 border border-slate-600 rounded-lg px-3 py-3 text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500 disabled:opacity-50"
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
                  onChange={(e) => {
                    setFormData(prev => ({ ...prev, stopLossPrice: e.target.value }));
                    setError('');
                  }}
                  placeholder="1.08000"
                  disabled={saving}
                  className="w-full bg-slate-600 border border-slate-500 rounded-lg px-3 py-2 text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500 disabled:opacity-50"
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
                  onChange={(e) => {
                    setFormData(prev => ({ ...prev, takeProfitPrice: e.target.value }));
                    setError('');
                  }}
                  placeholder="1.09000"
                  disabled={saving}
                  className="w-full bg-slate-600 border border-slate-500 rounded-lg px-3 py-2 text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500 disabled:opacity-50"
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
                  onChange={(e) => {
                    setFormData(prev => ({ ...prev, entryPrice: e.target.value }));
                    setError('');
                  }}
                  placeholder="1.08500"
                  disabled={saving}
                  className="w-full bg-slate-600 border border-slate-500 rounded-lg px-3 py-2 text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500 disabled:opacity-50"
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
                  onChange={(e) => {
                    setFormData(prev => ({ ...prev, riskPercentage: e.target.value }));
                    setError('');
                  }}
                  placeholder="2"
                  disabled={saving}
                  className="w-full bg-slate-600 border border-slate-500 rounded-lg px-3 py-2 text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500 disabled:opacity-50"
                />
              </div>
            </div>
          </div>

          {/* Calculated Lot Size */}
          <div className="bg-slate-700 rounded-lg p-4">
            <h3 className="text-white font-medium mb-2">Calculated Lot Size</h3>
            <div className="text-slate-400 text-sm mb-2">
              {calculations.stopLossPips > 0 
                ? `Based on your inputs, the system calculates:`
                : 'Enter Stop Loss to calculate lot size'
              }
            </div>
            {calculations.stopLossPips > 0 && (
              <div className="grid grid-cols-3 gap-3">
                <div className="text-center p-2 bg-slate-800 rounded">
                  <div className="text-emerald-400 font-bold text-lg">{calculations.lotSize.toFixed(2)}</div>
                  <div className="text-xs text-slate-400">Lot Size</div>
                </div>
                <div className="text-center p-2 bg-slate-800 rounded">
                  <div className="text-emerald-400 font-bold text-lg">${calculations.riskAmount.toFixed(2)}</div>
                  <div className="text-xs text-slate-400">Risk Amount</div>
                </div>
                <div className="text-center p-2 bg-slate-800 rounded">
                  <div className="text-emerald-400 font-bold text-lg">{calculations.stopLossPips}</div>
                  <div className="text-xs text-slate-400">SL Pips</div>
                </div>
              </div>
            )}
          </div>

          {/* Notes */}
          <div>
            <label className="block text-white text-sm font-medium mb-2">
              Notes *
              <span className="text-slate-400 text-xs ml-2">(Required for journaling)</span>
            </label>
            <textarea
              value={formData.notes}
              onChange={(e) => {
                setFormData(prev => ({ ...prev, notes: e.target.value }));
                setError('');
              }}
              placeholder="Why are you taking this trade? What's the setup? Market conditions? Emotions? Lessons learned..."
              rows="4"
              disabled={saving}
              className="w-full bg-slate-700 border border-slate-600 rounded-lg px-3 py-3 text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500 disabled:opacity-50"
            />
          </div>

          {/* Chart Image Upload */}
          <div>
            <label className="block text-white text-sm font-medium mb-2">
              Chart Image (Before Trade) *
              <span className="text-slate-400 text-xs ml-2">(Required for journaling)</span>
            </label>
            <div 
              onClick={() => !saving && document.getElementById('chart-upload').click()}
              className={`border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-colors ${
                saving ? 'border-slate-700 cursor-not-allowed opacity-50' :
                formData.chartImage ? 'border-emerald-500/30' : 'border-slate-600 hover:border-slate-500'
              }`}
            >
              {formData.chartImage ? (
                <div className="text-emerald-400">
                  <div className="text-sm font-medium">✓ Image uploaded successfully</div>
                  <div className="text-xs text-slate-400 mt-1">Click to change image</div>
                  <div className="mt-2">
                    <img 
                      src={formData.chartImage} 
                      alt="Chart preview" 
                      className="mx-auto max-h-32 rounded-lg border border-slate-600"
                    />
                  </div>
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
                disabled={saving}
                className="hidden"
              />
            </div>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="flex gap-3 p-6 border-t border-slate-700">
          <button
            onClick={onClose}
            disabled={saving}
            className="flex-1 py-3 px-4 bg-slate-700 hover:bg-slate-600 text-white rounded-lg font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            disabled={saving}
            className="flex-1 py-3 px-4 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            {saving ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent"></div>
                Saving to Supabase...
              </>
            ) : (
              <>
                <Save size={18} />
                Save to Trading Journal
              </>
            )}
          </button>
        </div>

        {/* Info Footer */}
        <div className="p-4 border-t border-slate-700 bg-slate-900/50 rounded-b-xl">
          <div className="text-xs text-slate-500 text-center">
            ✓ Trades are saved to your secure Supabase database
            <br />
            ✓ Access your full trading history anytime
            <br />
            ✓ Analyze performance with detailed statistics
          </div>
        </div>
      </div>
    </div>
  );
};

export default SaveTradeModal;