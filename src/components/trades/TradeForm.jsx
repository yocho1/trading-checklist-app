// src/components/trades/TradeForm.jsx
import React, { useState } from 'react'
import { Save, X } from 'lucide-react'

const TradeForm = ({ trade = null, onSubmit, onCancel, loading = false }) => {
  const [formData, setFormData] = useState({
    symbol: trade?.symbol || '',
    entry_price: trade?.entry_price || '',
    exit_price: trade?.exit_price || '',
    stop_loss: trade?.stop_loss || '',
    take_profit: trade?.take_profit || '',
    position_size: trade?.position_size || '',
    risk_reward_ratio: trade?.risk_reward_ratio || '',
    risk_percentage: trade?.risk_percentage || '',
    direction: trade?.direction || 'LONG',
    status: trade?.status || 'PENDING',
    notes: trade?.notes || '',
    checklist_data: trade?.checklist_data || {},
    entry_date: trade?.entry_date || new Date().toISOString().slice(0, 16),
    exit_date: trade?.exit_date || ''
  })

  const handleChange = (e) => {
    const { name, value } = e.target
    setFormData(prev => ({
      ...prev,
      [name]: value
    }))
  }

  const handleSubmit = (e) => {
    e.preventDefault()
    
    // Convert numeric fields
    const processedData = {
      ...formData,
      entry_price: formData.entry_price ? parseFloat(formData.entry_price) : null,
      exit_price: formData.exit_price ? parseFloat(formData.exit_price) : null,
      stop_loss: formData.stop_loss ? parseFloat(formData.stop_loss) : null,
      take_profit: formData.take_profit ? parseFloat(formData.take_profit) : null,
      position_size: formData.position_size ? parseFloat(formData.position_size) : null,
      risk_reward_ratio: formData.risk_reward_ratio ? parseFloat(formData.risk_reward_ratio) : null,
      risk_percentage: formData.risk_percentage ? parseFloat(formData.risk_percentage) : null,
    }

    onSubmit(processedData)
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Symbol */}
        <div>
          <label className="block text-sm font-medium text-slate-300 mb-1">
            Symbol *
          </label>
          <input
            type="text"
            name="symbol"
            value={formData.symbol}
            onChange={handleChange}
            required
            className="w-full px-3 py-2 bg-slate-800 border border-slate-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
            placeholder="BTC/USD, AAPL, etc."
          />
        </div>

        {/* Direction */}
        <div>
          <label className="block text-sm font-medium text-slate-300 mb-1">
            Direction *
          </label>
          <select
            name="direction"
            value={formData.direction}
            onChange={handleChange}
            required
            className="w-full px-3 py-2 bg-slate-800 border border-slate-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
          >
            <option value="LONG">LONG</option>
            <option value="SHORT">SHORT</option>
          </select>
        </div>

        {/* Entry Price */}
        <div>
          <label className="block text-sm font-medium text-slate-300 mb-1">
            Entry Price
          </label>
          <input
            type="number"
            step="0.01"
            name="entry_price"
            value={formData.entry_price}
            onChange={handleChange}
            className="w-full px-3 py-2 bg-slate-800 border border-slate-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
            placeholder="0.00"
          />
        </div>

        {/* Exit Price */}
        <div>
          <label className="block text-sm font-medium text-slate-300 mb-1">
            Exit Price
          </label>
          <input
            type="number"
            step="0.01"
            name="exit_price"
            value={formData.exit_price}
            onChange={handleChange}
            className="w-full px-3 py-2 bg-slate-800 border border-slate-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
            placeholder="0.00"
          />
        </div>

        {/* Stop Loss */}
        <div>
          <label className="block text-sm font-medium text-slate-300 mb-1">
            Stop Loss
          </label>
          <input
            type="number"
            step="0.01"
            name="stop_loss"
            value={formData.stop_loss}
            onChange={handleChange}
            className="w-full px-3 py-2 bg-slate-800 border border-slate-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
            placeholder="0.00"
          />
        </div>

        {/* Take Profit */}
        <div>
          <label className="block text-sm font-medium text-slate-300 mb-1">
            Take Profit
          </label>
          <input
            type="number"
            step="0.01"
            name="take_profit"
            value={formData.take_profit}
            onChange={handleChange}
            className="w-full px-3 py-2 bg-slate-800 border border-slate-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
            placeholder="0.00"
          />
        </div>

        {/* Position Size */}
        <div>
          <label className="block text-sm font-medium text-slate-300 mb-1">
            Position Size
          </label>
          <input
            type="number"
            step="0.01"
            name="position_size"
            value={formData.position_size}
            onChange={handleChange}
            className="w-full px-3 py-2 bg-slate-800 border border-slate-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
            placeholder="1.0"
          />
        </div>

        {/* Risk/Reward Ratio */}
        <div>
          <label className="block text-sm font-medium text-slate-300 mb-1">
            Risk/Reward Ratio
          </label>
          <input
            type="number"
            step="0.01"
            name="risk_reward_ratio"
            value={formData.risk_reward_ratio}
            onChange={handleChange}
            className="w-full px-3 py-2 bg-slate-800 border border-slate-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
            placeholder="2.0"
          />
        </div>

        {/* Risk Percentage */}
        <div>
          <label className="block text-sm font-medium text-slate-300 mb-1">
            Risk Percentage
          </label>
          <input
            type="number"
            step="0.01"
            name="risk_percentage"
            value={formData.risk_percentage}
            onChange={handleChange}
            className="w-full px-3 py-2 bg-slate-800 border border-slate-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
            placeholder="1.0"
          />
        </div>

        {/* Status */}
        <div>
          <label className="block text-sm font-medium text-slate-300 mb-1">
            Status
          </label>
          <select
            name="status"
            value={formData.status}
            onChange={handleChange}
            className="w-full px-3 py-2 bg-slate-800 border border-slate-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
          >
            <option value="PENDING">PENDING</option>
            <option value="OPEN">OPEN</option>
            <option value="CLOSED">CLOSED</option>
            <option value="CANCELLED">CANCELLED</option>
          </select>
        </div>

        {/* Entry Date */}
        <div>
          <label className="block text-sm font-medium text-slate-300 mb-1">
            Entry Date
          </label>
          <input
            type="datetime-local"
            name="entry_date"
            value={formData.entry_date}
            onChange={handleChange}
            className="w-full px-3 py-2 bg-slate-800 border border-slate-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
          />
        </div>

        {/* Exit Date */}
        <div>
          <label className="block text-sm font-medium text-slate-300 mb-1">
            Exit Date
          </label>
          <input
            type="datetime-local"
            name="exit_date"
            value={formData.exit_date}
            onChange={handleChange}
            className="w-full px-3 py-2 bg-slate-800 border border-slate-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
          />
        </div>
      </div>

      {/* Notes */}
      <div>
        <label className="block text-sm font-medium text-slate-300 mb-1">
          Notes
        </label>
        <textarea
          name="notes"
          value={formData.notes}
          onChange={handleChange}
          rows="3"
          className="w-full px-3 py-2 bg-slate-800 border border-slate-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
          placeholder="Trade notes, observations, etc."
        />
      </div>

      {/* Form Actions */}
      <div className="flex justify-end space-x-3 pt-4">
        <button
          type="button"
          onClick={onCancel}
          className="px-4 py-2 border border-slate-600 text-slate-300 rounded-lg hover:bg-slate-700 transition-colors flex items-center gap-2"
          disabled={loading}
        >
          <X size={18} />
          Cancel
        </button>
        <button
          type="submit"
          disabled={loading}
          className="px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-500 transition-colors disabled:bg-slate-600 flex items-center gap-2"
        >
          {loading ? (
            <>
              <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent"></div>
              Saving...
            </>
          ) : (
            <>
              <Save size={18} />
              {trade ? 'Update Trade' : 'Save Trade'}
            </>
          )}
        </button>
      </div>
    </form>
  )
}

export default TradeForm