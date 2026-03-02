// src/utils/dataCleaning.js

// Set of markers that indicate missing values in the dataset
export const missingMarkers = new Set([
  '',
  'na',
  'n/a',
  'nan',
  'null',
  'none',
  'undefined',
  '-',
  '--',
])

// Helper function to determine if a value should be considered missing
export function isMissingValue(value) {
  if (value === null || value === undefined) return true
  const normalized = String(value).trim().toLowerCase()
  return missingMarkers.has(normalized)
}

// Helper function to convert a value to a numeric type if possible, otherwise return null
export function toNumeric(value) {
  if (typeof value === 'number' && Number.isFinite(value)) return value
  if (isMissingValue(value)) return null
  const parsed = Number(String(value).replace(/,/g, '').trim())
  return Number.isFinite(parsed) ? parsed : null
}

// Find the most frequent non-missing value (useful for categorical fill)
export function getMostFrequentValue(values) {
  const countMap = new Map()
  let bestValue = values[0]
  let bestCount = 0

  values.forEach((value) => {
    const key = String(value).trim().toLowerCase()
    const current = countMap.get(key) || { count: 0, value }
    const next = { count: current.count + 1, value: current.value }
    countMap.set(key, next)

    if (next.count > bestCount) {
      bestCount = next.count
      bestValue = next.value
    }
  })

  return bestValue
}

// Fill missing numeric values with the mean of the column
export function applyLocalFillMissingMean(rows, headers) {
  const nextRows = rows.map((row) => ({ ...row }))

  headers.forEach((header) => {
    const numericValues = nextRows
      .map((row) => toNumeric(row[header]))
      .filter((v) => v !== null)

    if (!numericValues.length) return

    const mean = numericValues.reduce((sum, v) => sum + v, 0) / numericValues.length

    nextRows.forEach((row) => {
      if (isMissingValue(row[header])) row[header] = Number(mean.toFixed(2))
    })
  })

  return nextRows
}

// Fill missing numeric values with the median of the column
export function applyLocalFillMissingMedian(rows, headers) {
  const nextRows = rows.map((row) => ({ ...row }))

  headers.forEach((header) => {
    const numericValues = nextRows
      .map((row) => toNumeric(row[header]))
      .filter((v) => v !== null)
      .sort((a, b) => a - b)

    if (!numericValues.length) return

    const mid = Math.floor(numericValues.length / 2)
    const median =
      numericValues.length % 2 === 0
        ? (numericValues[mid - 1] + numericValues[mid]) / 2
        : numericValues[mid]

    nextRows.forEach((row) => {
      if (isMissingValue(row[header])) row[header] = Number(median.toFixed(2))
    })
  })

  return nextRows
}

// Fill remaining missing values with 'Unknown' (categorical) or mean (numeric-only column)
export function applyLocalFillRemainingMissing(rows, headers) {
  const nextRows = rows.map((row) => ({ ...row }))

  headers.forEach((header) => {
    const nonMissingValues = nextRows
      .map((row) => row[header])
      .filter((v) => !isMissingValue(v))

    let replacement = 'Unknown'

    if (nonMissingValues.length > 0) {
      const numericValues = nonMissingValues
        .map((v) => toNumeric(v))
        .filter((v) => v !== null)

      if (numericValues.length === nonMissingValues.length) {
        const mean = numericValues.reduce((sum, v) => sum + v, 0) / numericValues.length
        replacement = Number(mean.toFixed(2))
      } else {
        replacement = getMostFrequentValue(nonMissingValues)
      }
    }

    nextRows.forEach((row) => {
      if (isMissingValue(row[header])) row[header] = replacement
    })
  })

  return nextRows
}

// Apply selected cleaning operations locally (fallback)
export function applyLocalOperations(headers, rows, operations) {
  let cleanedRows = rows.map((row) => ({ ...row }))

  // Mean first
  if (operations.includes('fill-missing-mean') || operations.includes('value-prediction')) {
    cleanedRows = applyLocalFillMissingMean(cleanedRows, headers)
  }

  // Median after
  if (operations.includes('fill-missing-median') || operations.includes('estimates-values')) {
    cleanedRows = applyLocalFillMissingMedian(cleanedRows, headers)
  }

  // Always finish with remaining fill
  cleanedRows = applyLocalFillRemainingMissing(cleanedRows, headers)

  return cleanedRows
}

// Health score + missing stats
export function calculateStats(headers, rows) {
  const totalCells = headers.length * rows.length
  let filledCells = 0
  const columnMissing = {}

  headers.forEach((h) => (columnMissing[h] = 0))

  rows.forEach((row) => {
    headers.forEach((h) => {
      const value = row[h]
      if (!isMissingValue(value)) filledCells++
      else columnMissing[h]++
    })
  })

  const health = totalCells > 0 ? Math.round((filledCells / totalCells) * 100) : 0

  const colors = [
    'var(--accent-blue)',
    'var(--accent-amber)',
    'var(--accent-rose)',
    'var(--accent-green)',
  ]

  const allMissing = headers
    .map((header, index) => ({
      label: header,
      value: rows.length > 0 ? Math.round((columnMissing[header] / rows.length) * 100) : 0,
      color: colors[index % colors.length],
    }))
    .filter((item) => item.value > 0)
    .sort((a, b) => b.value - a.value)

  const missingData = allMissing.slice(0, 5)

  return { health, missingData, allMissing }
}