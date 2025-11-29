export const CHECKLIST_DATA = [
  {
    title: 'Weekly',
    items: [
      { id: 'weekly-trend', label: 'Trend', points: 10, hasChartHelper: true },
      { id: 'weekly-aoi', label: 'At AOI / Rejected', points: 10 },
      { id: 'weekly-ema', label: 'Touching EMA', points: 5 },
      { id: 'weekly-psych', label: 'Round Psychological Level', points: 5 },
      {
        id: 'weekly-structure',
        label: 'Rejection from Previous Structure',
        points: 10,
      },
      {
        id: 'weekly-candle',
        label: 'Candlestick Rejection from AOI',
        points: 10,
      },
      {
        id: 'weekly-break',
        label: 'Break & Retest / Head & Shoulders',
        points: 10,
      },
    ],
  },
  {
    title: 'Daily',
    items: [
      { id: 'daily-trend', label: 'Trend', points: 10, hasChartHelper: true },
      { id: 'daily-aoi', label: 'At AOI / Rejected', points: 10 },
      { id: 'daily-ema', label: 'Touching EMA', points: 5 },
      { id: 'daily-psych', label: 'Round Psychological Level', points: 5 },
      {
        id: 'daily-structure',
        label: 'Rejection from Previous Structure',
        points: 10,
      },
      {
        id: 'daily-candle',
        label: 'Candlestick Rejection from AOI',
        points: 10,
      },
      { id: 'daily-break', label: 'Break & Retest', points: 10 },
    ],
  },
  {
    title: '4H',
    items: [
      { id: '4h-trend', label: 'Trend', points: 5, hasChartHelper: true },
      { id: '4h-aoi', label: 'At AOI / Rejected', points: 5 },
      { id: '4h-ema', label: 'Touching EMA', points: 5 },
      { id: '4h-psych', label: 'Round Psychological Level', points: 5 },
      {
        id: '4h-structure',
        label: 'Rejection from Previous Structure',
        points: 10,
      },
      { id: '4h-candle', label: 'Candlestick Rejection from AOI', points: 5 },
      { id: '4h-break', label: 'Break & Retest', points: 10 },
    ],
  },
  {
    title: '2H/1H/30m',
    items: [
      { id: 'lower-trend', label: 'Trend', points: 5 },
      { id: 'lower-ema', label: 'Touching EMA', points: 5 },
      { id: 'lower-break', label: 'Break & Retest', points: 5 },
    ],
  },
  {
    title: 'Entry Signal',
    items: [
      { id: 'entry-sos', label: 'SOS', points: 10 },
      { id: 'entry-engulfing', label: 'Engulfing candlestick', points: 10 },
    ],
  },
  {
    title: 'Risk Management',
    items: [
      { id: 'risk-stop', label: 'Stop Loss', points: 10 },
      { id: 'risk-take', label: 'Take Profit', points: 10 },
    ],
  },
]
