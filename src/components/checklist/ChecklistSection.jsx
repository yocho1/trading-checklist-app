import React from 'react';
import { ToggleRow } from '../common/ToggleRow';

export const ChecklistSection = ({ section, checkedItems, timeframeScores, onToggle, getScoreColor }) => {
  return (
    <div className="bg-slate-800 rounded-xl border border-slate-700 shadow-lg">
      <div className="border-b border-slate-700 px-6 py-4">
        <h3 className="text-lg font-semibold text-white flex items-center">
          {section.title}
          {timeframeScores[section.title] && (
            <span className={`ml-2 text-sm ${getScoreColor(timeframeScores[section.title].percentage)}`}>
              ({timeframeScores[section.title].percentage}%)
            </span>
          )}
        </h3>
      </div>
      
      <div className="divide-y divide-slate-700">
        {section.items.map((item) => (
          <ToggleRow
            key={item.id}
            id={item.id}
            label={item.label}
            points={item.points}
            checked={checkedItems[item.id]}
            onChange={onToggle}
            hasChartHelper={item.hasChartHelper}
          />
        ))}
      </div>
    </div>
  );
};