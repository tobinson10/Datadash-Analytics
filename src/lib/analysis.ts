import type { Dataset } from '../types'

export type AnalysisGoal = 'dashboard' | 'metrics' | 'clean' | 'table' | 'custom'

export type AnalysisRequest = {
  goal: AnalysisGoal
  customInstruction: string
}

export const analysisGoals: Array<{ id: AnalysisGoal; title: string; description: string }> = [
  { id: 'dashboard', title: 'Create dashboard', description: 'Charts, filters, totals, averages, and key comparisons.' },
  { id: 'metrics', title: 'Calculate key metrics', description: 'Sum, average, count, minimum, maximum, and business totals.' },
  { id: 'clean', title: 'Clean data', description: 'Review blanks, data types, duplicates, and the cleaned records.' },
  { id: 'table', title: 'Create table', description: 'Search, filter, and inspect the cleaned underlying data.' },
  { id: 'custom', title: 'Something else', description: 'Describe the business question or result you need.' },
]

export function routeCustomInstruction(value: string): AnalysisGoal {
  const query = value.toLowerCase()
  if (/clean|blank|duplicate|missing|quality/.test(query)) return 'clean'
  if (/table|list|record|row|detail/.test(query)) return 'table'
  if (/average|mean|sum|total|count|sales|revenue|quarter|month|metric/.test(query)) return 'metrics'
  return 'dashboard'
}

export function datasetSummary(dataset: Dataset) {
  const missing = dataset.columns.reduce((total, column) => total + column.missing, 0)
  return {
    metrics: dataset.columns.filter(column => column.type === 'number').length,
    dateFields: dataset.columns.filter(column => column.type === 'date').length,
    categories: dataset.columns.filter(column => column.type === 'text' && column.unique > 1).length,
    missing,
  }
}
