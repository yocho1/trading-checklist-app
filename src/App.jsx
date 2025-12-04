// src/App.jsx
import React, { useState, useEffect } from 'react';
import { Save, History, LogOut, User, Home, BarChart3 } from 'lucide-react';

// Components
import { ScoreCard } from './components/layout/ScoreCard';
import { ChecklistSection } from './components/checklist/ChecklistSection';
import SaveTradeModal from './components/modals/SaveTradeModal';
import TradingHistory from './pages/TradingHistory';
import Account from './pages/Account';
import Dashboard from './pages/Dashboard';
import Login from './components/auth/Login';
import Register from './components/auth/Register';

// Hooks
import { useScoreCalculator } from './hooks/useScoreCalculator';
import { useAuth } from './hooks/useAuth';
import { useDashboardData } from './hooks/useDashboardData';

// Data & Utils
import { CHECKLIST_DATA } from './data/checklistData';
import { initSampleData, ensureUserHasTrades } from './utils/initSampleData';

const TradingChecklistApp = () => {
  const [checkedItems, setCheckedItems] = useState({});
  const [showSaveModal, setShowSaveModal] = useState(false);
  const [currentView, setCurrentView] = useState('dashboard');
  const [authView, setAuthView] = useState('login');
  
  const { totalScore, timeframeScores } = useScoreCalculator(checkedItems);
  const { user, login, register, verifyEmail, resendVerificationCode, googleLogin, logout, loading } = useAuth();
  const { dashboardData, isLoading: dashboardLoading, refreshData, addNewTrade } = useDashboardData(user?.id);

  // Initialize sample data on first load
  useEffect(() => {
    console.log('Initializing app...');
    
    // Initialize sample data
    const initializedData = initSampleData();
    console.log('Sample data initialized:', initializedData ? 'Success' : 'Failed');
    
    // Debug: Log what's in localStorage
    const debugData = localStorage.getItem('trading_app_shared_data');
    if (debugData) {
      try {
        const parsed = JSON.parse(debugData);
        console.log('Current storage state:', {
          users: parsed.users?.length || 0,
          trades: parsed.trades?.length || 0,
          userIDs: parsed.users?.map(u => u.id) || []
        });
      } catch (e) {
        console.error('Error parsing storage data:', e);
      }
    }
  }, []);

  // Ensure user has trades when they log in
  useEffect(() => {
    if (user?.id) {
      console.log('User logged in, ensuring they have trades:', user.id);
      ensureUserHasTrades(user.id);
    }
  }, [user?.id]);

  // Debug logging
  useEffect(() => {
    console.log('=== APP STATE DEBUG ===');
    console.log('User:', user ? `${user.name} (${user.id})` : 'Not logged in');
    console.log('Loading:', loading);
    console.log('Dashboard Loading:', dashboardLoading);
    console.log('Auth View:', authView);
    console.log('Current View:', currentView);
    console.log('Dashboard Data:', dashboardData ? 'Loaded' : 'Loading...');
    console.log('========================');
  }, [user, loading, dashboardLoading, authView, currentView, dashboardData]);

  // Initialize all checklist items as unchecked
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

  // Handle trade saved from modal
  const handleTradeSaved = (newTrade) => {
    if (addNewTrade) {
      addNewTrade(newTrade);
    }
    refreshData(); // Refresh dashboard data
  };

  // Quick demo login
  const handleDemoLogin = () => {
    // Create demo user
    const demoUser = {
      id: 'demo_user_123',
      name: 'Demo Trader',
      email: 'demo@trading.com',
      isVerified: true,
      createdAt: new Date().toISOString(),
      settings: {
        theme: 'dark',
        notifications: true,
        defaultTimeframe: '1h',
        riskPerTrade: 1
      }
    };
    
    // Set user immediately
    const event = new CustomEvent('setUser', { detail: demoUser });
    window.dispatchEvent(event);
  };

  // Show loading while checking authentication
  if (loading) {
    return (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-4 border-emerald-500 border-t-transparent mx-auto mb-4"></div>
          <div className="text-white text-lg">Loading Trading Dashboard...</div>
          <p className="text-slate-400 text-sm mt-2">Preparing your trading environment</p>
        </div>
      </div>
    );
  }

  // Show auth pages if not logged in
  if (!user) {
    console.log('No user found, showing auth pages. Auth view:', authView);
    
    if (authView === 'login') {
      return (
        <div className="min-h-screen bg-slate-900">
          <Login 
            onLogin={login} 
            onSwitchToRegister={() => setAuthView('register')}
            onGoogleLogin={googleLogin}
          />
          <div className="fixed bottom-6 left-0 right-0 text-center px-4">
            <button
              onClick={handleDemoLogin}
              className="inline-flex items-center gap-2 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-medium py-3 px-6 rounded-lg transition-all transform hover:scale-105 shadow-lg"
            >
              <BarChart3 size={20} />
              Try Demo Dashboard
            </button>
            <p className="text-slate-400 text-sm mt-3 max-w-md mx-auto">
              Experience the full trading dashboard with sample data. No registration required.
            </p>
          </div>
        </div>
      );
    } else {
      return (
        <Register 
          onRegister={register} 
          onSwitchToLogin={() => setAuthView('login')}
          onGoogleLogin={googleLogin}
          onVerify={verifyEmail}
          onResendCode={resendVerificationCode}
        />
      );
    }
  }

  // Render different views based on currentView state
  const renderContent = () => {
    switch (currentView) {
      case 'dashboard':
        return (
          <Dashboard 
            onBack={() => setCurrentView('checklist')} 
            data={dashboardData} 
            loading={dashboardLoading}
            onRefresh={refreshData}
          />
        );
      case 'history':
        return <TradingHistory onBack={() => setCurrentView('dashboard')} userId={user?.id} />;
      case 'account':
        return <Account onBack={() => setCurrentView('dashboard')} user={user} />;
      case 'checklist':
      default:
        return (
          <>
            <ScoreCard
              totalScore={totalScore}
              getScoreColor={getScoreColor}
              getScoreText={getScoreText}
            />

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

            <div className='text-center'>
              <button
                onClick={() => setShowSaveModal(true)}
                className='bg-emerald-600 hover:bg-emerald-500 text-white font-semibold py-3 px-8 rounded-lg transition-colors flex items-center justify-center mx-auto space-x-2 shadow-lg hover:shadow-xl transform hover:-translate-y-0.5'
              >
                <Save size={20} />
                <span>Save Trade</span>
              </button>
            </div>
          </>
        );
    }
  };

  return (
    <div className='min-h-screen bg-slate-900 text-slate-200'>
      {/* Header */}
      <header className="bg-slate-800 border-b border-slate-700 sticky top-0 z-50 shadow-xl">
        <div className="max-w-7xl mx-auto px-4 py-4 flex justify-between items-center">
          <div className="flex items-center space-x-3">
            <div className="bg-gradient-to-br from-emerald-600 to-teal-600 p-2 rounded-lg shadow-lg">
              <BarChart3 className="text-white" size={24} />
            </div>
            <div>
              <h1 className="text-xl font-bold text-white">Trading Dashboard</h1>
              <p className="text-slate-400 text-sm">Welcome, {user.name}</p>
            </div>
          </div>
          
          <div className="flex items-center gap-4">
            {/* Navigation */}
            <div className="bg-slate-700/50 backdrop-blur-sm rounded-lg p-1 flex border border-slate-600">
              <button
                onClick={() => setCurrentView('dashboard')}
                className={`px-4 py-1 rounded-md text-sm font-medium transition-all flex items-center gap-1 ${
                  currentView === 'dashboard'
                    ? 'bg-gradient-to-r from-emerald-600 to-teal-600 text-white shadow-lg'
                    : 'text-slate-400 hover:text-white hover:bg-slate-600/50'
                }`}
              >
                <Home size={14} />
                Dashboard
              </button>
              <button
                onClick={() => setCurrentView('checklist')}
                className={`px-4 py-1 rounded-md text-sm font-medium transition-all ${
                  currentView === 'checklist'
                    ? 'bg-gradient-to-r from-emerald-600 to-teal-600 text-white shadow-lg'
                    : 'text-slate-400 hover:text-white hover:bg-slate-600/50'
                }`}
              >
                Checklist
              </button>
              <button
                onClick={() => setCurrentView('history')}
                className={`px-4 py-1 rounded-md text-sm font-medium transition-all flex items-center gap-1 ${
                  currentView === 'history'
                    ? 'bg-gradient-to-r from-emerald-600 to-teal-600 text-white shadow-lg'
                    : 'text-slate-400 hover:text-white hover:bg-slate-600/50'
                }`}
              >
                <History size={14} />
                History
              </button>
            </div>

            {/* Account & Logout */}
            <div className="flex items-center gap-2">
              <button
                onClick={() => setCurrentView('account')}
                className="flex items-center gap-2 bg-slate-700 hover:bg-slate-600 text-slate-300 px-3 py-1.5 rounded-lg transition-colors text-sm border border-slate-600"
              >
                <User size={14} />
                Account
              </button>
              <button
                onClick={logout}
                className="flex items-center gap-2 bg-slate-700 hover:bg-slate-600 text-slate-300 px-3 py-1.5 rounded-lg transition-colors text-sm border border-slate-600"
              >
                <LogOut size={14} />
                Logout
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className='max-w-7xl mx-auto px-4 py-8'>
        {renderContent()}
      </main>

      {/* Modals */}
      <SaveTradeModal
        isOpen={showSaveModal}
        onClose={() => setShowSaveModal(false)}
        confluenceScore={totalScore}
        onTradeSaved={handleTradeSaved}
      />

      {/* Footer */}
      <footer className="mt-12 pt-8 border-t border-slate-800">
        <div className="max-w-7xl mx-auto px-4 py-6">
          <div className="text-center text-slate-500 text-sm">
            <p>Trading Dashboard v1.0 • Demo Mode: {user.email === 'demo@trading.com' ? 'Active' : 'Inactive'}</p>
            <p className="mt-2">For demonstration purposes only. Not financial advice.</p>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default TradingChecklistApp;