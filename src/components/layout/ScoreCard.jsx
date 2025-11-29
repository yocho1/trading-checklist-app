import React from 'react';

export const ScoreCard = ({ totalScore, getScoreColor, getScoreText }) => {
  return (
    <div className="bg-slate-800 rounded-xl border border-slate-700 p-6 mb-8 shadow-lg">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-white mb-2">Confluence Score</h2>
          <p className={`text-lg font-semibold ${getScoreColor(totalScore)}`}>
            {getScoreText(totalScore)}
          </p>
        </div>
        <div className="text-right">
          <div className={`text-4xl font-bold ${getScoreColor(totalScore)}`}>
            {totalScore}%
          </div>
          <p className="text-slate-400 text-sm">Overall Score</p>
        </div>
      </div>
    </div>
  );
};