// src/App.jsx
import React, { useState, useEffect } from 'react';
import { Save, History, LogOut, User } from 'lucide-react';

// Components
import { Header } from './components/layout/Header'; // Remove this import if not used
import { ScoreCard } from './components/layout/ScoreCard';
import { ChecklistSection } from './components/checklist/ChecklistSection';
import SaveTradeModal from './components/modals/SaveTradeModal';
import TradingHistory from './pages/TradingHistory';
import Login from './components/auth/Login';
import Register from './components/auth/Register';

// Hooks
import { useScoreCalculator } from './hooks/useScoreCalculator';
import { useAuth } from './hooks/useAuth';

// Data
import { CHECKLIST_DATA } from './data/checklistData';

const TradingChecklistApp = () => {
  const [checkedItems, setCheckedItems] = useState({});
  const [showSaveModal, setShowSaveModal] = useState(false);
  const [currentView, setCurrentView] = useState('checklist');
  const [authView, setAuthView] = useState('login'); // 'login' or 'register'
  
  const { totalScore, timeframeScores } = useScoreCalculator(checkedItems);
  
  // Destructure googleLogin from useAuth hook
  const { user, login, register, verifyEmail, resendVerificationCode, googleLogin, logout, loading } = useAuth();

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

  // Show loading while checking authentication
  if (loading) {
    return (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-4 border-emerald-500 border-t-transparent mx-auto mb-4"></div>
          <div className="text-white text-lg">Loading...</div>
        </div>
      </div>
    );
  }

  // Show auth pages if not logged in
if (authView === 'login') {
  return (
    <Login 
      onLogin={login} 
      onSwitchToRegister={() => setAuthView('register')} 
    />
  );
} else {
  return (
    <Register 
      onRegister={register} 
      onSwitchToLogin={() => setAuthView('login')}
      onGoogleLogin={googleLogin}
      onVerify={verifyEmail} // Make sure this is passed
      onResendCode={resendVerificationCode} // Make sure this is passed
    />
  );
}

  // Rest of your component remains the same...
  // Render Trading History View
  if (currentView === 'history') {
    return <TradingHistory />;
  }

  // Render Main Checklist View
  return (
    <div className='min-h-screen bg-slate-900 text-slate-200'>
      {/* Updated Header with User Info */}
      <header className="bg-slate-800 border-b border-slate-700">
        <div className="max-w-5xl mx-auto px-4 py-4 flex justify-between items-center">
          <div className="flex items-center space-x-3">
            <div className="bg-emerald-600 p-2 rounded-lg">
              <History className="text-white" size={24} />
            </div>
            <div>
              <h1 className="text-xl font-bold text-white">Trading Checklist</h1>
              <p className="text-slate-400 text-sm">Welcome, {user.name}</p>
            </div>
          </div>
          
          <div className="flex items-center gap-4">
            {/* View Toggle */}
            <div className="bg-slate-700 rounded-lg p-1 flex">
              <button
                onClick={() => setCurrentView('checklist')}
                className={`px-4 py-1 rounded-md text-sm font-medium transition-colors ${
                  currentView === 'checklist'
                    ? 'bg-emerald-600 text-white'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                Checklist
              </button>
              <button
                onClick={() => setCurrentView('history')}
                className={`px-4 py-1 rounded-md text-sm font-medium transition-colors flex items-center gap-1 ${
                  currentView === 'history'
                    ? 'bg-emerald-600 text-white'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                <History size={14} />
                History
              </button>
            </div>

            {/* User Menu */}
            <div className="flex items-center gap-2">
              <div className="bg-slate-700 p-2 rounded-lg">
                <User className="text-slate-300" size={16} />
              </div>
              <button
                onClick={logout}
                className="flex items-center gap-2 bg-slate-700 hover:bg-slate-600 text-slate-300 px-3 py-1 rounded-lg transition-colors text-sm"
              >
                <LogOut size={14} />
                Logout
              </button>
            </div>
          </div>
        </div>
      </header>

      <main className='max-w-5xl mx-auto px-4 py-8'>
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