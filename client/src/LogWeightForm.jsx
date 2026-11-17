import { useEffect, useState } from 'react'
import { fromKg } from './weightsApi'

function today() {
  const now = new Date()
  now.setMinutes(now.getMinutes() - now.getTimezoneOffset())
  return now.toISOString().slice(0, 10)
}

export default function LogWeightForm({ animalName, weight, defaultUnit, onSave, onClose }) {
  const editing = Boolean(weight)
  const [form, setForm] = useState({
    date: editing ? weight.date.slice(0, 10) : today(),
    weight: editing ? String(fromKg(weight.weightKg, defaultUnit)) : '',
    unit: defaultUnit || 'KG',
    notes: editing ? weight.notes || '' : '',
  })
  const [error, setError] = useState('')
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    function onKey(e) {
      if (e.key === 'Escape') onClose()
    }
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [onClose])

  function change(e) {
    setForm({ ...form, [e.target.name]: e.target.value })
  }

  async function submit(e) {
    e.preventDefault()
    setError('')

    if (!form.date || !form.weight) {
      setError('Fill in the date and the weight.')
      return
    }

    if (form.date > today()) {
      setError('The date can not be in the future.')
      return
    }

    const number = Number(form.weight)
    if (isNaN(number) || number <= 0) {
      setError('Weight must be a number greater than 0.')
      return
    }

    setSaving(true)
    try {
      await onSave({
        date: form.date,
        weight: number,
        unit: form.unit,
        notes: form.notes.trim() || null,
      })
    } catch (err) {
      setError(err.message)
      setSaving(false)
    }
  }

  return (
    <div className="herd-backdrop" onClick={onClose}>
      <form
        className="herd-modal"
        role="dialog"
        aria-modal="true"
        aria-labelledby="log-weight-title"
        onClick={(e) => e.stopPropagation()}
        onSubmit={submit}
        noValidate
      >
        <div className="herd-modal-header">
          <h2 id="log-weight-title">
            {editing ? 'Edit weight' : 'Log weight'}
            {animalName ? ' – ' + animalName : ''}
          </h2>
          <button type="button" className="herd-close" onClick={onClose} aria-label="Close">
            ×
          </button>
        </div>

        {error && (
          <p className="herd-alert" role="alert">
            {error}
          </p>
        )}

        <div className="herd-form-grid">
          <div className="field">
            <label htmlFor="weight-date">Date *</label>
            <input id="weight-date" type="date" name="date" value={form.date} onChange={change} max={today()} />
          </div>

          <div className="field">
            <label htmlFor="weight-value">Weight *</label>
            <div className="weight-input">
              <input
                id="weight-value"
                name="weight"
                type="number"
                inputMode="decimal"
                min="0"
                step="0.01"
                value={form.weight}
                onChange={change}
                placeholder="450"
                autoFocus
              />
              <select aria-label="Unit" name="unit" value={form.unit} onChange={change}>
                <option value="KG">kg</option>
                <option value="LB">lb</option>
              </select>
            </div>
          </div>

          <div className="field weight-notes">
            <label htmlFor="weight-notes">Notes</label>
            <input
              id="weight-notes"
              name="notes"
              value={form.notes}
              onChange={change}
              placeholder="After weaning"
            />
          </div>
        </div>

        <div className="herd-modal-actions">
          <button type="button" className="btn herd-secondary" onClick={onClose}>
            Cancel
          </button>
          <button type="submit" className="btn primary-button" disabled={saving}>
            {saving ? 'Saving…' : editing ? 'Save changes' : 'Log weight'}
          </button>
        </div>
      </form>
    </div>
  )
}
