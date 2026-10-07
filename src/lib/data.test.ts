import { describe, expect, it } from 'vitest'
import { inferType, profileRows, groupedData } from './data'
describe('data profiling', () => {
  it('detects types and removes fully blank rows', () => { const d = profileRows([{ Date: '2024-01-01', Sales: '120', Team: 'A' }, { Date: '', Sales: '', Team: '' }], 'test.csv'); expect(d.rows).toHaveLength(1); expect(d.columns.find(c => c.name === 'Sales')?.type).toBe('number'); expect(d.columns.find(c => c.name === 'Date')?.type).toBe('date') })
  it('groups a chosen metric deterministically', () => expect(groupedData([{ Team: 'A', Sales: 2 }, { Team: 'A', Sales: 3 }, { Team: 'B', Sales: 7 }], 'Team', 'Sales')).toEqual([{name:'B',value:7},{name:'A',value:5}]))
  it('recognizes booleans', () => expect(inferType('active', ['yes', 'no', 'yes'])).toBe('boolean'))
})
