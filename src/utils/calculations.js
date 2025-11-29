import { PIP_VALUES } from './constants'

export const calculatePipDifference = (
  entryPrice,
  stopLossPrice,
  currencyPair
) => {
  if (!entryPrice || !stopLossPrice || !currencyPair) return 0

  const entry = parseFloat(entryPrice)
  const stopLoss = parseFloat(stopLossPrice)

  if (isNaN(entry) || isNaN(stopLoss)) return 0

  const difference = Math.abs(entry - stopLoss)

  // Handle different pip calculations based on currency pair
  if (currencyPair.includes('XAU') || currencyPair.includes('XAG')) {
    // Metals: 1 pip = 0.01 (for prices like 4140.00)
    return Math.round(difference * 100)
  } else if (currencyPair.includes('JPY')) {
    // JPY pairs: 1 pip = 0.01
    return Math.round(difference * 100)
  } else {
    // Most Forex pairs: 1 pip = 0.0001
    return Math.round(difference * 10000)
  }
}

export const calculateRiskAmount = (accountBalance, riskPercentage) => {
  if (!accountBalance || !riskPercentage) return 0

  const balance = parseFloat(accountBalance)
  const riskPercent = parseFloat(riskPercentage)

  if (isNaN(balance) || isNaN(riskPercent)) return 0

  return balance * (riskPercent / 100)
}

export const calculateLotSize = (
  riskAmount,
  stopLossPips,
  currencyPair,
  entryPrice
) => {
  if (!riskAmount || !stopLossPips || !currencyPair || stopLossPips === 0)
    return 0

  let pipValue
  const entry = parseFloat(entryPrice) || 1

  if (currencyPair.includes('XAU')) {
    // Gold (XAU)
    // 1 standard lot = 100 ounces
    // Pip value = (0.01 / entry_price) * 100 * entry_price ≈ $1
    // More accurate: (tick_size * contract_size) / exchange_rate
    pipValue = 1 // $1 per pip for gold
  } else if (currencyPair.includes('XAG')) {
    // Silver (XAG)
    // 1 standard lot = 5000 ounces
    // Pip value = (0.01 / entry_price) * 5000 * entry_price ≈ $50
    pipValue = 50 // $50 per pip for silver
  } else {
    // Forex pairs
    pipValue = PIP_VALUES[currencyPair] || 10
  }

  console.log('Calculation details:', {
    riskAmount,
    stopLossPips,
    currencyPair,
    pipValue,
    entryPrice: entry,
  })

  const lotSize = riskAmount / (stopLossPips * pipValue)
  const roundedLotSize = Math.round(lotSize * 100) / 100

  console.log('Final lot size:', roundedLotSize)

  return roundedLotSize
}

export const calculateTradeParameters = (formData) => {
  const {
    accountBalance,
    riskPercentage,
    entryPrice,
    stopLossPrice,
    currencyPair,
  } = formData

  if (
    !accountBalance ||
    !riskPercentage ||
    !entryPrice ||
    !stopLossPrice ||
    !currencyPair
  ) {
    return {
      stopLossPips: 0,
      riskAmount: 0,
      lotSize: 0,
    }
  }

  const balance = parseFloat(accountBalance)
  const riskPercent = parseFloat(riskPercentage)
  const entry = parseFloat(entryPrice)
  const stopLoss = parseFloat(stopLossPrice)

  if (isNaN(balance) || isNaN(riskPercent) || isNaN(entry) || isNaN(stopLoss)) {
    return {
      stopLossPips: 0,
      riskAmount: 0,
      lotSize: 0,
    }
  }

  const stopLossPips = calculatePipDifference(entry, stopLoss, currencyPair)
  const riskAmount = calculateRiskAmount(balance, riskPercent)
  const lotSize = calculateLotSize(
    riskAmount,
    stopLossPips,
    currencyPair,
    entry
  )

  console.log('Trade parameters:', {
    stopLossPips,
    riskAmount,
    lotSize,
    currencyPair,
    entry,
    stopLoss,
  })

  return {
    stopLossPips,
    riskAmount: Math.round(riskAmount * 100) / 100,
    lotSize: lotSize > 0.001 ? lotSize : 0,
  }
}
