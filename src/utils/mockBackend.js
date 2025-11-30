// src/utils/mockBackend.js
const MOCK_BACKEND_KEY = 'trading_app_shared_data'

export const mockBackend = {
  // Get all shared data
  getSharedData() {
    try {
      return JSON.parse(localStorage.getItem(MOCK_BACKEND_KEY) || '{}')
    } catch (error) {
      return {}
    }
  },

  // Save shared data
  saveSharedData(data) {
    localStorage.setItem(MOCK_BACKEND_KEY, JSON.stringify(data))
  },

  // Get users
  getUsers() {
    const data = this.getSharedData()
    return data.users || []
  },

  // Save users
  saveUsers(users) {
    const data = this.getSharedData()
    data.users = users
    this.saveSharedData(data)
  },

  // Get verification codes
  getVerificationCodes() {
    const data = this.getSharedData()
    return data.verificationCodes || {}
  },

  // Save verification codes
  saveVerificationCodes(codes) {
    const data = this.getSharedData()
    data.verificationCodes = codes
    this.saveSharedData(data)
  },

  // Get trades
  getTrades() {
    const data = this.getSharedData()
    return data.trades || []
  },

  // Save trades
  saveTrades(trades) {
    const data = this.getSharedData()
    data.trades = trades
    this.saveSharedData(data)
  },
}
