import React, { useState } from 'react';
import { Check, ChartBar } from 'lucide-react';

export const ToggleRow = ({ 
  id, 
  label, 
  points, 
  checked, 
  onChange, 
  hasChartHelper = false 
}) => {
  const [showChartHelper, setShowChartHelper] = useState(false);

  return (
    <div className="flex items-center justify-between p-3 border-b border-slate-700 last:border-b-0">
      <div className="flex items-center space-x-3">
        <button
          onClick={() => onChange(id)}
          className={`w-6 h-6 rounded border-2 flex items-center justify-center transition-all ${
            checked 
              ? 'bg-emerald-500 border-emerald-500' 
              : 'border-slate-500 hover:border-slate-400'
          }`}
        >
          {checked && <Check size={14} className="text-white" />}
        </button>
        
        <span className="text-slate-200">{label}</span>
        
        {hasChartHelper && (
          <button
            onClick={() => setShowChartHelper(!showChartHelper)}
            className="p-1 rounded hover:bg-slate-700 transition-colors"
            title="Chart Helper"
          >
            <ChartBar size={16} className="text-slate-400" />
          </button>
        )}
      </div>

      <div className="flex items-center space-x-2">
        {points > 0 && (
          <span className="text-emerald-400 font-medium">+{points}%</span>
        )}
      </div>

      {showChartHelper && hasChartHelper && (
        <div className="absolute left-1/2 transform -translate-x-1/2 mt-12 bg-slate-800 border border-slate-600 rounded-lg p-4 z-10 shadow-xl">
          <div className="flex space-x-4">
            <button className="px-4 py-2 bg-emerald-600 rounded-lg text-white font-medium">
              Yes
            </button>
            <button className="px-4 py-2 bg-red-600 rounded-lg text-white font-medium">
              No
            </button>
          </div>
        </div>
      )}
    </div>
  );
};