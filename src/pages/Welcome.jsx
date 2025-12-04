import React from 'react';
import { ArrowRight, CheckCircle, BarChart3, Shield, Zap } from 'lucide-react';

const Welcome = ({ user, onContinue }) => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 text-white">
      {/* Header */}
      <div className="bg-slate-800/50 border-b border-slate-700/50 backdrop-blur-sm sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-2xl font-bold text-emerald-400">Trading Checklist</h1>
              <p className="text-slate-400 text-sm">Welcome, {user?.name || 'Demo User'}! 🎉</p>
            </div>
            <div className="text-right">
              <p className="text-emerald-400 font-semibold">{user?.email}</p>
              <p className="text-slate-400 text-xs">Gmail Registration</p>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        {/* Welcome Hero */}
        <div className="text-center mb-16">
          <div className="inline-block mb-6 p-4 bg-emerald-500/10 border border-emerald-500/20 rounded-full">
            <BarChart3 size={48} className="text-emerald-400" />
          </div>
          <h2 className="text-4xl font-bold mb-4">Welcome to Your Trading Dashboard!</h2>
          <p className="text-xl text-slate-300 mb-8">
            You've successfully registered with your Gmail account. Let's get started with your trading journey.
          </p>
        </div>

        {/* Features Grid */}
        <div className="grid md:grid-cols-3 gap-6 mb-12">
          {/* Feature 1 */}
          <div className="bg-slate-800 border border-slate-700 rounded-lg p-6 hover:border-emerald-500/30 transition-colors">
            <div className="flex items-start gap-4">
              <CheckCircle className="text-emerald-400 flex-shrink-0 mt-1" size={24} />
              <div>
                <h3 className="font-semibold text-lg mb-2">Trade Checklist</h3>
                <p className="text-slate-400 text-sm">
                  Use our interactive checklist to evaluate every trade setup before entry.
                </p>
              </div>
            </div>
          </div>

          {/* Feature 2 */}
          <div className="bg-slate-800 border border-slate-700 rounded-lg p-6 hover:border-emerald-500/30 transition-colors">
            <div className="flex items-start gap-4">
              <Shield className="text-emerald-400 flex-shrink-0 mt-1" size={24} />
              <div>
                <h3 className="font-semibold text-lg mb-2">Risk Management</h3>
                <p className="text-slate-400 text-sm">
                  Calculate position sizes and manage risk with precision on every trade.
                </p>
              </div>
            </div>
          </div>

          {/* Feature 3 */}
          <div className="bg-slate-800 border border-slate-700 rounded-lg p-6 hover:border-emerald-500/30 transition-colors">
            <div className="flex items-start gap-4">
              <Zap className="text-emerald-400 flex-shrink-0 mt-1" size={24} />
              <div>
                <h3 className="font-semibold text-lg mb-2">Performance Tracking</h3>
                <p className="text-slate-400 text-sm">
                  Monitor your trading journal and analyze your performance over time.
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Quick Info Box */}
        <div className="bg-emerald-500/5 border border-emerald-500/20 rounded-lg p-8 mb-12">
          <h3 className="text-xl font-semibold mb-4">Getting Started</h3>
          <ul className="space-y-3 text-slate-300">
            <li className="flex items-start gap-3">
              <span className="text-emerald-400 font-bold">1.</span>
              <span>Go through the pre-trade checklist to evaluate your setup quality</span>
            </li>
            <li className="flex items-start gap-3">
              <span className="text-emerald-400 font-bold">2.</span>
              <span>Save your trade with all relevant details and chart image</span>
            </li>
            <li className="flex items-start gap-3">
              <span className="text-emerald-400 font-bold">3.</span>
              <span>Review your trading journal to track performance and improve</span>
            </li>
            <li className="flex items-start gap-3">
              <span className="text-emerald-400 font-bold">4.</span>
              <span>Analyze your statistics to identify patterns and optimize your strategy</span>
            </li>
          </ul>
        </div>

        {/* CTA Button */}
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <button
            onClick={onContinue}
            className="flex items-center justify-center gap-2 bg-emerald-600 hover:bg-emerald-500 text-white font-semibold py-4 px-8 rounded-lg transition-colors"
          >
            Start Trading Checklist
            <ArrowRight size={20} />
          </button>
          <button
            onClick={onContinue}
            className="flex items-center justify-center gap-2 bg-slate-700 hover:bg-slate-600 text-white font-semibold py-4 px-8 rounded-lg transition-colors"
          >
            View Dashboard
          </button>
        </div>
      </div>

      {/* Footer */}
      <div className="border-t border-slate-700/50 mt-16 py-8">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center text-slate-400 text-sm">
          <p>Trading Checklist v1.0 • Demo Mode: Inactive</p>
          <p>For demonstration purposes only. Not financial advice.</p>
        </div>
      </div>
    </div>
  );
};

export default Welcome;
