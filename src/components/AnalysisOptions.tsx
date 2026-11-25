import { useMemo, useState } from 'react'
import type { Dataset } from '../types'
import { analysisGoals, datasetSummary, routeCustomInstruction, type AnalysisGoal, type AnalysisRequest } from '../lib/analysis'

export function AnalysisOptions({ dataset, onContinue, onBack }: {
  dataset: Dataset
  onContinue: (request: AnalysisRequest) => void
  onBack: () => void
}) {
  const [goal, setGoal] = useState<AnalysisGoal>('dashboard')
  const [instruction, setInstruction] = useState('')
  const summary = useMemo(() => datasetSummary(dataset), [dataset])

  const continueWithGoal = () => {
    const selectedGoal = goal === 'custom' ? routeCustomInstruction(instruction) : goal
    onContinue({ goal: selectedGoal, customInstruction: instruction.trim() })
  }

  return <main>
    <header><b className="brand">data<span>dash</span></b><button className="text" onClick={onBack}>← Choose another file</button></header>
    <section className="analysis-options">
      <p className="eyebrow">FILE READY TO EXPLORE</p>
      <h1>What would you like to do with this data?</h1>
      <p className="analysis-intro">Choose a starting point. DataDash will still keep the cleaned data, core totals, averages, filters, and original file details available throughout your analysis.</p>
      <section className="quality-strip" aria-label="Detected data summary">
        <span><b>{dataset.rows.length.toLocaleString()}</b> clean rows</span>
        <span><b>{summary.metrics}</b> numeric fields</span>
        <span><b>{summary.dateFields}</b> date fields</span>
        <span><b>{summary.missing.toLocaleString()}</b> empty cells</span>
      </section>
      <div className="analysis-goals">
        {analysisGoals.map(item => <button type="button" key={item.id} className={goal === item.id ? 'selected' : ''} onClick={() => setGoal(item.id)}>
          <strong>{item.title}</strong><span>{item.description}</span>
        </button>)}
      </div>
      {goal === 'custom' && <label className="custom-request">What do you need from this data?
        <textarea value={instruction} onChange={event => setInstruction(event.target.value)} placeholder="For example: Show quarterly sales totals and average order value by region." />
        <small>DataDash will use matching terms such as totals, averages, quarters, tables, and data cleaning to choose the best starting view. Your cleaned data remains available.</small>
      </label>}
      <button className="analysis-continue" onClick={continueWithGoal}>{goal === 'custom' && instruction.trim() ? 'Create requested analysis' : 'Continue to analysis'} →</button>
    </section>
  </main>
}
