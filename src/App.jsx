// src/App.jsx
import React, { useState, useEffect } from 'react';
import { Save, History } from 'lucide-react';

// Components - Fixed imports
import { Header } from './components/layout/Header';
import { ScoreCard } from './components/layout/ScoreCard';
import { ChecklistSection } from './components/checklist/ChecklistSection';
import SaveTradeModal from './components/modals/SaveTradeModal'; // Fixed: default import
import TradingHistory from './pages/TradingHistory';

// Hooks
import { useScoreCalculator } from './hooks/useScoreCalculator';

// Data
import { CHECKLIST_DATA } from './data/checklistData';

// Main App Component
const TradingChecklistApp = () => {
  const [checkedItems, setCheckedItems] = useState({});
  const [showSaveModal, setShowSaveModal] = useState(false);
  const [currentView, setCurrentView] = useState('checklist'); // 'checklist' or 'history'
  const { totalScore, timeframeScores } = useScoreCalculator(checkedItems);

  // Initialize all items as unchecked
  useEffect(() => {
    const initialChecked = {};
    CHECKLIST_DATA.forEach((section) => {
      section.items.forEach((item) => {
        initialChecked[item.id] = false;
      });
    });
    setCheckedItems(initialChecked);
  }, []);

  const handleToggle = (id) => {
    setCheckedItems((prev) => ({
      ...prev,
      [id]: !prev[id],
    }));
  };

  const getScoreColor = (score) => {
    if (score < 50) return 'text-red-500';
    if (score >= 50) return 'text-emerald-400';
    return 'text-slate-200';
  };

  const getScoreText = (score) => {
    if (score < 50) return 'Weak Setup';
    if (score >= 50) return 'Strong Setup';
    return 'Neutral Setup';
  };

  // Render Trading History View
  if (currentView === 'history') {
    return <TradingHistory />;
  }

  // Render Main Checklist View
  return (
    <div className='min-h-screen bg-slate-900 text-slate-200'>
      <Header />

      <main className='max-w-5xl mx-auto px-4 py-8'>
        {/* View Toggle Buttons */}
        <div className="flex justify-center mb-8">
          <div className="bg-slate-800 rounded-lg p-1 flex">
            <button
              onClick={() => setCurrentView('checklist')}
              className={`px-6 py-2 rounded-md font-medium transition-colors ${
                currentView === 'checklist'
                  ? 'bg-emerald-600 text-white'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              Checklist
            </button>
            <button
              onClick={() => setCurrentView('history')}
              className={`px-6 py-2 rounded-md font-medium transition-colors flex items-center gap-2 ${
                currentView === 'history'
                  ? 'bg-emerald-600 text-white'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <History size={16} />
              History
            </button>
          </div>
        </div>

        <ScoreCard
          totalScore={totalScore}
          getScoreColor={getScoreColor}
          getScoreText={getScoreText}
        />

        {/* Checklist Sections */}
        <div className='grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8'>
          {CHECKLIST_DATA.map((section) => (
            <ChecklistSection
              key={section.title}
              section={section}
              checkedItems={checkedItems}
              timeframeScores={timeframeScores}
              onToggle={handleToggle}
              getScoreColor={getScoreColor}
            />
          ))}
        </div>

        {/* Confluence Summary */}
        <div className='bg-slate-800 rounded-xl border border-slate-700 p-6 mb-8 shadow-lg'>
          <h3 className='text-xl font-bold text-white mb-4'>
            Confluence Summary
          </h3>
          <div className='grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4'>
            {CHECKLIST_DATA.map(
              (section) =>
                timeframeScores[section.title] && (
                  <div key={section.title} className='text-center'>
                    <div className='text-sm text-slate-400 mb-1'>
                      {section.title}
                    </div>
                    <div
                      className={`text-2xl font-bold ${getScoreColor(
                        timeframeScores[section.title].percentage
                      )}`}
                    >
                      {timeframeScores[section.title].percentage}%
                    </div>
                    <div className='text-xs text-slate-500'>
                      {timeframeScores[section.title].achieved}/
                      {timeframeScores[section.title].possible}
                    </div>
                  </div>
                )
            )}
          </div>
        </div>

        {/* Save Button */}
        <div className='text-center'>
          <button
            onClick={() => setShowSaveModal(true)}
            className='bg-emerald-600 hover:bg-emerald-500 text-white font-semibold py-3 px-8 rounded-lg transition-colors flex items-center justify-center mx-auto space-x-2'
          >
            <Save size={20} />
            <span>Save Trade</span>
          </button>
        </div>
      </main>

      <SaveTradeModal
        isOpen={showSaveModal}
        onClose={() => setShowSaveModal(false)}
        confluenceScore={totalScore}
      />
    </div>
  );
};

export default TradingChecklistApp;