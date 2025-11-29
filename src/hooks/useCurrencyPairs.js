import { useState, useEffect } from 'react'
import { CURRENCY_CATEGORIES } from '../utils/constants'

export const useCurrencyPairs = () => {
  const [currencyPairs, setCurrencyPairs] = useState([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)

  const fetchCurrencyPairs = async () => {
    setLoading(true)
    setError(null)
    try {
      // In a real app, you would fetch from an API here
      // For now, we'll use our static data
      const pairs = [
        ...CURRENCY_CATEGORIES.major,
        ...CURRENCY_CATEGORIES.minor,
        ...CURRENCY_CATEGORIES.exotic,
        ...CURRENCY_CATEGORIES.metals,
      ]

      setCurrencyPairs(pairs)
    } catch (err) {
      console.error('Failed to fetch currency pairs:', err)
      setError('Failed to load currency pairs')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchCurrencyPairs()
  }, [])

  return { currencyPairs, loading, error }
}
