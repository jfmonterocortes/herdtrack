import { useCallback, useEffect, useMemo, useState } from 'react'
import { CartesianGrid, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'
import { useAuth } from './auth'
import LogWeightForm from './LogWeightForm'
import { formatDate, fromKg, unitLabel, weightsApi } from './weightsApi'
import './weights.css'

export default function WeightsSection({ animalId, animalName }) {
  const { request, user } = useAuth()
  const api = useMemo(() => weightsApi(request), [request])
  const unit = user?.weightUnit || 'KG'
  const label = unitLabel(unit)

  const [weights, setWeights] = useState([])
  const [growth, setGrowth] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [formWeight, setFormWeight] = useState(null)
  const [showForm, setShowForm] = useState(false)

  const load = useCallback(async () => {
    setError('')
    try {
      const [list, stats] = await Promise.all([api.list(animalId), api.growth(animalId)])
      setWeights(list)
      setGrowth(stats)
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }, [api, animalId])

  useEffect(() => {
    load()
  }, [load])

  function openNew() {
    setFormWeight(null)
    setShowForm(true)
  }

  function openEdit(weight) {
    setFormWeight(weight)
    setShowForm(true)
  }

  function closeForm() {
    setShowForm(false)
    setFormWeight(null)
  }

  async function save(data) {
    if (formWeight) {
      await api.update(formWeight.id, data)
    } else {
      await api.create(animalId, data)
    }
    closeForm()
    await load()
  }

  async function remove(weight) {
    if (!window.confirm('Delete the weight from ' + formatDate(weight.date) + '?')) return
    try {
      await api.remove(weight.id)
      await load()
    } catch (err) {
      setError(err.message)
    }
  }

  const chartData = weights.map((w) => ({
    time: new Date(w.date).getTime(),
    weight: fromKg(w.weightKg, unit),
  }))

  const newestFirst = [...weights].reverse()

  function show(kg) {
    return kg === null || kg === undefined ? '—' : fromKg(kg, unit) + ' ' + label
  }

  function showGain(kg) {
    if (kg === null || kg === undefined) return '—'
    const value = fromKg(kg, unit)
    return (value > 0 ? '+' : '') + value + ' ' + label
  }

  function showDailyGain(kg) {
    if (kg === null || kg === undefined) return '—'
    const value = unit === 'LB' ? kg / 0.453592 : kg
    return Math.round(value * 1000) / 1000 + ' ' + label + '/day'
  }

  return (
    <section className="weights-section" aria-labelledby="weights-title">
      <div className="herd-header">
        <h2 id="weights-title">Weight and growth</h2>
        <button className="btn primary-button" type="button" onClick={openNew}>
          + Log weight
        </button>
      </div>

      {error && (
        <p className="herd-alert" role="alert">
          {error}
        </p>
      )}

      <div className="weights-stats">
        <div className="weights-stat">
          <span>Current weight</span>
          <strong>{show(growth?.currentWeight)}</strong>
        </div>
        <div className="weights-stat">
          <span>Total gain</span>
          <strong>{showGain(growth?.totalGain)}</strong>
        </div>
        <div className="weights-stat">
          <span>Average daily gain</span>
          <strong>{showDailyGain(growth?.averageDailyGain)}</strong>
        </div>
      </div>

      {loading ? (
        <p className="card card-body empty-state">Loading weights…</p>
      ) : weights.length === 0 ? (
        <div className="card card-body empty-state herd-empty">
          <p>No weights logged yet.</p>
          <button className="btn primary-button" type="button" onClick={openNew}>
            Log the first weight
          </button>
        </div>
      ) : (
        <>
          <div className="weights-chart">
            {weights.length < 2 ? (
              <p className="weights-chart-note">Log one more weight to see the growth chart.</p>
            ) : (
              <ResponsiveContainer width="100%" height={280}>
                <LineChart data={chartData} margin={{ top: 10, right: 20, bottom: 0, left: 0 }}>
                  <CartesianGrid stroke="#e3eef1" vertical={false} />
                  <XAxis
                    dataKey="time"
                    type="number"
                    scale="time"
                    domain={['dataMin', 'dataMax']}
                    tickFormatter={formatDate}
                    tick={{ fontSize: 12, fill: '#485e66' }}
                    padding={{ left: 20, right: 20 }}
                  />
                  <YAxis
                    tick={{ fontSize: 12, fill: '#485e66' }}
                    unit={' ' + label}
                    width={70}
                    domain={['auto', 'auto']}
                  />
                  <Tooltip
                    labelFormatter={formatDate}
                    formatter={(value) => [value + ' ' + label, 'Weight']}
                  />
                  <Line
                    type="monotone"
                    dataKey="weight"
                    stroke="#145c78"
                    strokeWidth={2.5}
                    dot={{ r: 4, fill: '#145c78' }}
                    activeDot={{ r: 6 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            )}
          </div>

          <div className="herd-table-wrap">
            <table className="herd-table">
              <thead>
                <tr>
                  <th>Date</th>
                  <th>Weight</th>
                  <th>Notes</th>
                  <th aria-label="Actions"></th>
                </tr>
              </thead>
              <tbody>
                {newestFirst.map((w) => (
                  <tr key={w.id}>
                    <td>{formatDate(w.date)}</td>
                    <td className="weights-value">{show(w.weightKg)}</td>
                    <td>{w.notes || '—'}</td>
                    <td className="weights-actions">
                      <button className="btn btn-link text-button" type="button" onClick={() => openEdit(w)}>
                        Edit
                      </button>
                      <button className="btn btn-link weights-delete" type="button" onClick={() => remove(w)}>
                        Delete
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}

      {showForm && (
        <LogWeightForm
          animalName={animalName}
          weight={formWeight}
          defaultUnit={unit}
          onSave={save}
          onClose={closeForm}
        />
      )}
    </section>
  )
}
