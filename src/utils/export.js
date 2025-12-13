// src/utils/export.js
// Utility functions to export trades as JSON or CSV and trigger download

function downloadBlob(content, filename, contentType) {
  const blob = new Blob([content], { type: contentType })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
  URL.revokeObjectURL(url)
}

export function exportTradesJSON(trades, filename = 'trades.json') {
  try {
    const content = JSON.stringify(trades, null, 2)
    downloadBlob(content, filename, 'application/json')
    return true
  } catch (e) {
    console.error('Failed to export trades as JSON', e)
    return false
  }
}

export function exportTradesCSV(trades, filename = 'trades.csv') {
  try {
    if (!Array.isArray(trades) || trades.length === 0) {
      downloadBlob(
        'id,symbol,date,timeframe,type,result,confluence\n',
        filename,
        'text/csv'
      )
      return true
    }
    const headers = [
      'id',
      'symbol',
      'date',
      'timeframe',
      'type',
      'result',
      'confluence',
    ]
    const rows = trades.map((t) => [
      t.id ?? '',
      t.symbol ?? '',
      t.date ?? '',
      t.timeframe ?? '',
      t.type ?? '',
      t.result ?? '',
      t.confluence ?? '',
    ])
    const csv = [
      headers.join(','),
      ...rows.map((r) =>
        r
          .map((v) => {
            const s = String(v)
            // Escape commas, quotes, and newlines
            if (/[",\n]/.test(s)) {
              return '"' + s.replace(/"/g, '""') + '"'
            }
            return s
          })
          .join(',')
      ),
    ].join('\n')
    downloadBlob(csv, filename, 'text/csv')
    return true
  } catch (e) {
    console.error('Failed to export trades as CSV', e)
    return false
  }
}
