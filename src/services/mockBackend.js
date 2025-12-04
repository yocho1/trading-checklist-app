// src/services/mockBackend.js

// Simulate API delay
const delay = (ms) => new Promise(resolve => setTimeout(resolve, ms));

// Generate a unique ID
const generateId = () => {
  return Date.now().toString(36) + Math.random().toString(36).substr(2);
};

// Get stored data from localStorage
const getStoredData = () => {
  try {
    const data = localStorage.getItem('trading_app_shared_data');
    if (!data) return null;
    return JSON.parse(data);
  } catch (error) {
    console.error('Error reading from localStorage:', error);
    return null;
  }
};

// Save data to localStorage
const saveData = (data) => {
  try {
    localStorage.setItem('trading_app_shared_data', JSON.stringify(data));
    return true;
  } catch (error) {
    console.error('Error saving to localStorage:', error);
    return false;
  }
};

// Initialize data if it doesn't exist
const initializeData = () => {
  const existingData = getStoredData();
  if (!existingData) {
    const initialData = {
      users: [],
      verificationCodes: {},
      trades: [],
      dashboardSettings: {
        userId: null,
        theme: 'dark',
        notifications: true
      }
    };
    saveData(initialData);
    return initialData;
  }
  return existingData;
};

// AUTHENTICATION FUNCTIONS

// Register a new user
export const registerUser = async (userData) => {
  await delay(800);
  
  const data = getStoredData() || initializeData();
  
  // Check if user already exists
  const existingUser = data.users.find(user => user.email === userData.email);
  if (existingUser) {
    throw new Error('User with this email already exists');
  }
  
  // Create new user
  const newUser = {
    id: generateId(),
    name: userData.name,
    email: userData.email,
    password: userData.password, // In real app, this should be hashed
    isVerified: false,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    authProvider: 'email',
    settings: {
      theme: 'dark',
      notifications: true,
      defaultTimeframe: '1h',
      riskPerTrade: 1
    }
  };
  
  data.users.push(newUser);
  
  // Generate verification code
  const verificationCode = Math.floor(100000 + Math.random() * 900000).toString();
  data.verificationCodes[newUser.email] = {
    code: verificationCode,
    expiresAt: new Date(Date.now() + 30 * 60 * 1000).toISOString() // 30 minutes
  };
  
  saveData(data);
  
  return {
    success: true,
    message: 'Registration successful. Please verify your email.',
    userId: newUser.id,
    verificationCode: verificationCode // In real app, send via email
  };
};

// Login user
export const loginUser = async (email, password) => {
  await delay(600);
  
  const data = getStoredData() || initializeData();
  
  const user = data.users.find(u => u.email === email && u.password === password);
  
  if (!user) {
    throw new Error('Invalid email or password');
  }
  
  if (!user.isVerified) {
    throw new Error('Please verify your email before logging in');
  }
  
  // Update last login
  user.lastLogin = new Date().toISOString();
  saveData(data);
  
  return {
    success: true,
    user: {
      id: user.id,
      name: user.name,
      email: user.email,
      isVerified: user.isVerified,
      createdAt: user.createdAt,
      settings: user.settings
    }
  };
};

// Verify email
export const verifyEmail = async (email, code) => {
  await delay(500);
  
  const data = getStoredData();
  if (!data) {
    throw new Error('No data found');
  }
  
  const verification = data.verificationCodes[email];
  
  if (!verification) {
    throw new Error('No verification code found. Please request a new one.');
  }
  
  const expiresAt = new Date(verification.expiresAt);
  if (expiresAt < new Date()) {
    delete data.verificationCodes[email];
    saveData(data);
    throw new Error('Verification code has expired. Please request a new one.');
  }
  
  if (verification.code !== code) {
    throw new Error('Invalid verification code');
  }
  
  // Mark user as verified
  const user = data.users.find(u => u.email === email);
  if (user) {
    user.isVerified = true;
    user.updatedAt = new Date().toISOString();
  }
  
  // Remove verification code
  delete data.verificationCodes[email];
  
  saveData(data);
  
  return {
    success: true,
    message: 'Email verified successfully!'
  };
};

// Resend verification code
export const resendVerificationCode = async (email) => {
  await delay(500);
  
  const data = getStoredData();
  if (!data) {
    throw new Error('No data found');
  }
  
  const user = data.users.find(u => u.email === email);
  if (!user) {
    throw new Error('User not found');
  }
  
  // Generate new verification code
  const verificationCode = Math.floor(100000 + Math.random() * 900000).toString();
  data.verificationCodes[email] = {
    code: verificationCode,
    expiresAt: new Date(Date.now() + 30 * 60 * 1000).toISOString()
  };
  
  saveData(data);
  
  return {
    success: true,
    message: 'Verification code sent',
    verificationCode: verificationCode
  };
};

// Google login (simulated)
export const googleLogin = async () => {
  await delay(700);
  
  const data = getStoredData() || initializeData();
  
  // Check if demo user exists
  let user = data.users.find(u => u.email === 'demo@example.com');
  
  if (!user) {
    // Create demo user
    user = {
      id: generateId(),
      name: 'Demo User',
      email: 'demo@example.com',
      password: 'demo123',
      isVerified: true,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      authProvider: 'google',
      settings: {
        theme: 'dark',
        notifications: true,
        defaultTimeframe: '1h',
        riskPerTrade: 1
      }
    };
    data.users.push(user);
    saveData(data);
  }
  
  return {
    success: true,
    user: {
      id: user.id,
      name: user.name,
      email: user.email,
      isVerified: user.isVerified,
      createdAt: user.createdAt,
      settings: user.settings
    }
  };
};

// TRADE FUNCTIONS

// Save a new trade
export const saveTrade = async (tradeData) => {
  await delay(400);
  
  const data = getStoredData() || initializeData();
  
  const newTrade = {
    id: generateId(),
    ...tradeData,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  };
  
  data.trades.push(newTrade);
  saveData(data);
  
  return {
    success: true,
    trade: newTrade,
    message: 'Trade saved successfully'
  };
};

// Get all trades for a user
export const getTrades = async (userId, filters = {}) => {
  await delay(300);
  
  const data = getStoredData() || initializeData();
  
  let trades = data.trades.filter(trade => trade.userId === userId);
  
  // Apply filters
  if (filters.timeframe) {
    trades = trades.filter(trade => {
      const tradeDate = new Date(trade.createdAt);
      const now = new Date();
      
      switch (filters.timeframe) {
        case 'today':
          return tradeDate.toDateString() === now.toDateString();
        case 'week':
          const weekAgo = new Date();
          weekAgo.setDate(weekAgo.getDate() - 7);
          return tradeDate >= weekAgo;
        case 'month':
          const monthAgo = new Date();
          monthAgo.setMonth(monthAgo.getMonth() - 1);
          return tradeDate >= monthAgo;
        default:
          return true;
      }
    });
  }
  
  if (filters.type) {
    trades = trades.filter(trade => trade.type === filters.type);
  }
  
  if (filters.symbol) {
    trades = trades.filter(trade => trade.symbol.includes(filters.symbol));
  }
  
  // Sort by date (newest first)
  trades.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
  
  return {
    success: true,
    trades,
    total: trades.length
  };
};

// Update a trade
export const updateTrade = async (tradeId, updates) => {
  await delay(400);
  
  const data = getStoredData();
  if (!data) {
    throw new Error('No data found');
  }
  
  const tradeIndex = data.trades.findIndex(t => t.id === tradeId);
  if (tradeIndex === -1) {
    throw new Error('Trade not found');
  }
  
  data.trades[tradeIndex] = {
    ...data.trades[tradeIndex],
    ...updates,
    updatedAt: new Date().toISOString()
  };
  
  saveData(data);
  
  return {
    success: true,
    trade: data.trades[tradeIndex]
  };
};

// Delete a trade
export const deleteTrade = async (tradeId) => {
  await delay(300);
  
  const data = getStoredData();
  if (!data) {
    throw new Error('No data found');
  }
  
  const tradeIndex = data.trades.findIndex(t => t.id === tradeId);
  if (tradeIndex === -1) {
    throw new Error('Trade not found');
  }
  
  const deletedTrade = data.trades.splice(tradeIndex, 1)[0];
  saveData(data);
  
  return {
    success: true,
    message: 'Trade deleted successfully',
    trade: deletedTrade
  };
};

// DASHBOARD FUNCTIONS

// Get user stats
export const getUserStats = async (userId) => {
  await delay(400);
  
  const data = getStoredData() || initializeData();
  
  const user = data.users.find(u => u.id === userId);
  if (!user) {
    throw new Error('User not found');
  }
  
  const userTrades = data.trades.filter(trade => trade.userId === userId);
  
  // Calculate stats
  const totalTrades = userTrades.length;
  const winningTrades = userTrades.filter(t => t.result > 0);
  const losingTrades = userTrades.filter(t => t.result < 0);
  
  const totalProfit = winningTrades.reduce((sum, t) => sum + t.result, 0);
  const totalLoss = Math.abs(losingTrades.reduce((sum, t) => sum + t.result, 0));
  const netPnl = totalProfit - totalLoss;
  
  const winRate = totalTrades > 0 ? (winningTrades.length / totalTrades) * 100 : 0;
  const profitFactor = totalLoss > 0 ? totalProfit / totalLoss : totalProfit > 0 ? Infinity : 0;
  
  // Calculate average confluence
  const averageConfluence = totalTrades > 0 
    ? Math.round(userTrades.reduce((sum, t) => sum + (t.confluence || 50), 0) / totalTrades)
    : 55;
  
  // Find largest win and loss
  const largestWin = winningTrades.length > 0 
    ? Math.max(...winningTrades.map(t => t.result))
    : 0;
  
  const largestLoss = losingTrades.length > 0 
    ? Math.abs(Math.min(...losingTrades.map(t => t.result)))
    : 0;
  
  // Calculate streaks
  const sortedTrades = [...userTrades].sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt));
  let currentStreak = 0;
  let bestWinningStreak = 0;
  let currentWinningStreak = 0;
  
  for (const trade of sortedTrades) {
    if (trade.result > 0) {
      currentStreak = currentStreak > 0 ? currentStreak + 1 : 1;
      currentWinningStreak++;
      bestWinningStreak = Math.max(bestWinningStreak, currentWinningStreak);
    } else if (trade.result < 0) {
      currentStreak = currentStreak < 0 ? currentStreak - 1 : -1;
      currentWinningStreak = 0;
    } else {
      currentStreak = 0;
      currentWinningStreak = 0;
    }
  }
  
  return {
    success: true,
    stats: {
      userId,
      totalTrades,
      winningTrades: winningTrades.length,
      losingTrades: losingTrades.length,
      winRate: parseFloat(winRate.toFixed(1)),
      profitFactor: parseFloat(profitFactor.toFixed(2)),
      totalProfit: parseFloat(totalProfit.toFixed(2)),
      totalLoss: parseFloat(totalLoss.toFixed(2)),
      netPnl: parseFloat(netPnl.toFixed(2)),
      averageConfluence,
      largestWin: parseFloat(largestWin.toFixed(2)),
      largestLoss: parseFloat(largestLoss.toFixed(2)),
      bestWinningStreak,
      currentStreak,
      avgWin: winningTrades.length > 0 ? parseFloat((totalProfit / winningTrades.length).toFixed(2)) : 0,
      avgLoss: losingTrades.length > 0 ? parseFloat((totalLoss / losingTrades.length).toFixed(2)) : 0,
      roi: totalTrades > 0 ? parseFloat(((netPnl / (totalProfit + totalLoss)) * 100).toFixed(1)) : 0
    }
  };
};

// Get dashboard summary
export const getDashboardSummary = async (userId) => {
  await delay(500);
  
  const [statsResponse, tradesResponse] = await Promise.all([
    getUserStats(userId),
    getTrades(userId, { timeframe: 'all' })
  ]);
  
  const stats = statsResponse.stats;
  const trades = tradesResponse.trades;
  
  // Group trades by timeframe for performance
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const weekAgo = new Date(today);
  weekAgo.setDate(weekAgo.getDate() - 7);
  const monthAgo = new Date(today);
  monthAgo.setMonth(monthAgo.getMonth() - 1);
  const yearAgo = new Date(today);
  yearAgo.setFullYear(yearAgo.getFullYear() - 1);
  
  const filterTradesByDate = (startDate) => {
    return trades.filter(trade => new Date(trade.createdAt) >= startDate);
  };
  
  const calculateTimeframeStats = (filteredTrades) => {
    const winning = filteredTrades.filter(t => t.result > 0);
    const totalPnl = filteredTrades.reduce((sum, t) => sum + (t.result || 0), 0);
    const winRate = filteredTrades.length > 0 ? (winning.length / filteredTrades.length * 100) : 0;
    
    return {
      trades: filteredTrades.length,
      winRate: parseFloat(winRate.toFixed(1)),
      pnl: parseFloat(totalPnl.toFixed(2))
    };
  };
  
  // Get recent trades
  const recentTrades = trades.slice(0, 10).map(trade => ({
    id: trade.id,
    symbol: trade.symbol || 'N/A',
    date: new Date(trade.createdAt).toLocaleDateString(),
    time: new Date(trade.createdAt).toLocaleTimeString(),
    result: trade.result || 0,
    confluence: trade.confluence || 50,
    type: trade.type || 'N/A',
    timeframe: trade.timeframe || 'N/A'
  }));
  
  // Get top trading pairs
  const pairCounts = {};
  const pairProfits = {};
  
  trades.forEach(trade => {
    const pair = trade.symbol || 'Unknown';
    pairCounts[pair] = (pairCounts[pair] || 0) + 1;
    pairProfits[pair] = (pairProfits[pair] || 0) + (trade.result || 0);
  });
  
  const topPairs = Object.entries(pairCounts)
    .map(([pair, count]) => ({
      pair,
      count,
      profit: parseFloat(pairProfits[pair].toFixed(2))
    }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 5);
  
  // Calculate win rate by trade type
  const longTrades = trades.filter(t => t.type === 'Long');
  const shortTrades = trades.filter(t => t.type === 'Short');
  
  const longWinRate = longTrades.length > 0 
    ? (longTrades.filter(t => t.result > 0).length / longTrades.length * 100)
    : 0;
  
  const shortWinRate = shortTrades.length > 0 
    ? (shortTrades.filter(t => t.result > 0).length / shortTrades.length * 100)
    : 0;
  
  return {
    success: true,
    summary: {
      overview: stats,
      performance: {
        daily: calculateTimeframeStats(filterTradesByDate(today)),
        weekly: calculateTimeframeStats(filterTradesByDate(weekAgo)),
        monthly: calculateTimeframeStats(filterTradesByDate(monthAgo)),
        yearly: calculateTimeframeStats(filterTradesByDate(yearAgo))
      },
      recentTrades,
      topPairs,
      winRateByType: {
        long: parseFloat(longWinRate.toFixed(1)),
        short: parseFloat(shortWinRate.toFixed(1))
      },
      totalTrades: trades.length,
      lastUpdated: new Date().toISOString()
    }
  };
};

// Get performance chart data
export const getPerformanceChartData = async (userId, period = 'month') => {
  await delay(400);
  
  const { trades } = await getTrades(userId, { timeframe: 'all' });
  
  const now = new Date();
  let dataPoints = [];
  
  switch (period) {
    case 'week':
      for (let i = 6; i >= 0; i--) {
        const date = new Date(now);
        date.setDate(date.getDate() - i);
        const dayTrades = trades.filter(t => {
          const tradeDate = new Date(t.createdAt);
          return tradeDate.toDateString() === date.toDateString();
        });
        const dayPnl = dayTrades.reduce((sum, t) => sum + (t.result || 0), 0);
        dataPoints.push({
          date: date.toLocaleDateString('en-US', { weekday: 'short' }),
          pnl: parseFloat(dayPnl.toFixed(2))
        });
      }
      break;
      
    case 'month':
      for (let i = 29; i >= 0; i--) {
        const date = new Date(now);
        date.setDate(date.getDate() - i);
        const dayTrades = trades.filter(t => {
          const tradeDate = new Date(t.createdAt);
          return tradeDate.toDateString() === date.toDateString();
        });
        const dayPnl = dayTrades.reduce((sum, t) => sum + (t.result || 0), 0);
        dataPoints.push({
          date: date.getDate().toString(),
          pnl: parseFloat(dayPnl.toFixed(2))
        });
      }
      break;
      
    case 'year':
      for (let i = 11; i >= 0; i--) {
        const date = new Date(now);
        date.setMonth(date.getMonth() - i);
        const monthTrades = trades.filter(t => {
          const tradeDate = new Date(t.createdAt);
          return tradeDate.getMonth() === date.getMonth() && 
                 tradeDate.getFullYear() === date.getFullYear();
        });
        const monthPnl = monthTrades.reduce((sum, t) => sum + (t.result || 0), 0);
        dataPoints.push({
          date: date.toLocaleDateString('en-US', { month: 'short' }),
          pnl: parseFloat(monthPnl.toFixed(2))
        });
      }
      break;
  }
  
  return {
    success: true,
    period,
    data: dataPoints
  };
};

// Generate sample trades for new users
export const generateSampleTrades = (userId) => {
  const symbols = ['EUR/USD', 'GBP/USD', 'USD/JPY', 'BTC/USD', 'ETH/USD', 'AAPL', 'TSLA', 'GOOGL'];
  const timeframes = ['1m', '5m', '15m', '1h', '4h', '1d'];
  
  const trades = [];
  const now = new Date();
  
  for (let i = 0; i < 20; i++) {
    const date = new Date(now);
    date.setDate(date.getDate() - Math.floor(Math.random() * 30));
    date.setHours(Math.floor(Math.random() * 24));
    date.setMinutes(Math.floor(Math.random() * 60));
    
    const result = (Math.random() - 0.4) * 500; // -200 to +300 range
    const isWin = result > 0;
    const confluence = Math.floor(Math.random() * 30) + (isWin ? 50 : 30);
    
    trades.push({
      id: generateId(),
      userId: userId,
      symbol: symbols[Math.floor(Math.random() * symbols.length)],
      type: Math.random() > 0.5 ? 'Long' : 'Short',
      timeframe: timeframes[Math.floor(Math.random() * timeframes.length)],
      entryPrice: 100 + Math.random() * 50,
      exitPrice: 100 + Math.random() * 50,
      result: parseFloat(result.toFixed(2)),
      confluence: confluence,
      createdAt: date.toISOString(),
      updatedAt: date.toISOString(),
      notes: isWin ? 'Good trade setup with strong confluence' : 'Need better risk management',
      tags: isWin ? ['win', 'good-setup'] : ['loss', 'review-needed']
    });
  }
  
  return trades;
};

// Initialize sample data for new users
export const initializeUserSampleData = (userId) => {
  const data = getStoredData() || initializeData();
  
  // Check if user already has trades
  const userTrades = data.trades.filter(t => t.userId === userId);
  if (userTrades.length === 0) {
    const sampleTrades = generateSampleTrades(userId);
    data.trades.push(...sampleTrades);
    saveData(data);
  }
  
  return true;
};

// Get user settings
export const getUserSettings = async (userId) => {
  await delay(200);
  
  const data = getStoredData();
  if (!data) {
    throw new Error('No data found');
  }
  
  const user = data.users.find(u => u.id === userId);
  if (!user) {
    throw new Error('User not found');
  }
  
  return {
    success: true,
    settings: user.settings || {
      theme: 'dark',
      notifications: true,
      defaultTimeframe: '1h',
      riskPerTrade: 1,
      defaultConfluenceThreshold: 50
    }
  };
};

// Update user settings
export const updateUserSettings = async (userId, newSettings) => {
  await delay(300);
  
  const data = getStoredData();
  if (!data) {
    throw new Error('No data found');
  }
  
  const userIndex = data.users.findIndex(u => u.id === userId);
  if (userIndex === -1) {
    throw new Error('User not found');
  }
  
  data.users[userIndex].settings = {
    ...data.users[userIndex].settings,
    ...newSettings
  };
  data.users[userIndex].updatedAt = new Date().toISOString();
  
  saveData(data);
  
  return {
    success: true,
    settings: data.users[userIndex].settings
  };
};

// Logout user
export const logoutUser = async () => {
  await delay(200);
  return { success: true };
};

// Check if user is authenticated
export const checkAuth = async () => {
  await delay(100);
  
  const data = getStoredData();
  if (!data) return { authenticated: false };
  
  // In a real app, you'd check for a token or session
  // For mock, we'll just return the first user if exists
  const user = data.users[0];
  
  if (user && user.isVerified) {
    return {
      authenticated: true,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        isVerified: user.isVerified
      }
    };
  }
  
  return { authenticated: false };
};

// Reset all data (for testing)
export const resetAllData = () => {
  localStorage.removeItem('trading_app_shared_data');
  initializeData();
  return { success: true, message: 'All data reset successfully' };
};

// Export all functions
export default {
  // Auth
  registerUser,
  loginUser,
  verifyEmail,
  resendVerificationCode,
  googleLogin,
  logoutUser,
  checkAuth,
  
  // Trades
  saveTrade,
  getTrades,
  updateTrade,
  deleteTrade,
  
  // Dashboard
  getUserStats,
  getDashboardSummary,
  getPerformanceChartData,
  
  // User
  getUserSettings,
  updateUserSettings,
  initializeUserSampleData,
  
  // Utility
  resetAllData
};