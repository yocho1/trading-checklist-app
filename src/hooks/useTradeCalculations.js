import { useState, useEffect } from 'react'
import { calculateTradeParameters } from '../utils/calculations'

export const useTradeCalculations = (formData) => {
  const [calculations, setCalculations] = useState({
    stopLossPips: 0,
    riskAmount: 0,
    lotSize: 0,
  })

  useEffect(() => {
    const newCalculations = calculateTradeParameters(formData)
    setCalculations(newCalculations)
  }, [
    formData.accountBalance,
    formData.riskPercentage,
    formData.entryPrice,
    formData.stopLossPrice,
    formData.currencyPair,
  ])

  return calculations
}
