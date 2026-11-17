// FILE          : AddAnimalForm.jsx
// PROJECT       : HerdTrack - Group 6
// PROGRAMMER    : Halvin Silva Mayes
// FIRST VERSION : 2026-11-16
// DESCRIPTION   : Pop-up form to add a new animal to the herd.

import { useEffect, useState } from 'react'

const EMPTY = {
  name: '',
  tagNumber: '',
  species: '',
  sex: '',
  breed: '',
  birthDate: '',
}

const DEFAULT_SPECIES = ['Cattle', 'Goat', 'Sheep', 'Pig', 'Horse']

export default function AddAnimalForm({ api, speciesList = [], onClose, onCreated }) {
  const [form, setForm] = useState(EMPTY)
  const [error, setError] = useState('')
  const [saving, setSaving] = useState(false)

  const options = [...new Set([...DEFAULT_SPECIES, ...speciesList])]
  const today = new Date().toISOString().slice(0, 10)

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

    if (!form.name.trim() || !form.tagNumber.trim() || !form.species.trim() || !form.sex) {
      setError('Fill in name, tag number, species and sex.')
      return
    }

    setSaving(true)
    try {
      const animal = await api.create({
        name: form.name,
        tagNumber: form.tagNumber,
        species: form.species,
        sex: form.sex,
        breed: form.breed || null,
        birthDate: form.birthDate || null,
      })
      onCreated(animal)
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
        aria-labelledby="add-animal-title"
        onClick={(e) => e.stopPropagation()}
        onSubmit={submit}
        noValidate
      >
        <div className="herd-modal-header">
          <h2 id="add-animal-title">Add animal</h2>
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
            <label htmlFor="animal-name">Name *</label>
            <input id="animal-name" name="name" value={form.name} onChange={change} placeholder="Lola" autoFocus />
          </div>

          <div className="field">
            <label htmlFor="animal-tag">Tag number *</label>
            <input id="animal-tag" name="tagNumber" value={form.tagNumber} onChange={change} placeholder="1042" />
          </div>

          <div className="field">
            <label htmlFor="animal-species">Species *</label>
            <input
              id="animal-species"
              name="species"
              value={form.species}
              onChange={change}
              list="species-options"
              placeholder="Cattle"
            />
            <datalist id="species-options">
              {options.map((s) => (
                <option key={s} value={s} />
              ))}
            </datalist>
          </div>

          <div className="field">
            <label htmlFor="animal-sex">Sex *</label>
            <select id="animal-sex" name="sex" value={form.sex} onChange={change}>
              <option value="">Select…</option>
              <option value="FEMALE">Female</option>
              <option value="MALE">Male</option>
            </select>
          </div>

          <div className="field">
            <label htmlFor="animal-breed">Breed</label>
            <input id="animal-breed" name="breed" value={form.breed} onChange={change} placeholder="Holstein" />
          </div>

          <div className="field">
            <label htmlFor="animal-birth">Birth date</label>
            <input
              id="animal-birth"
              type="date"
              name="birthDate"
              value={form.birthDate}
              onChange={change}
              max={today}
            />
          </div>
        </div>

        <div className="herd-modal-actions">
          <button type="button" className="btn herd-secondary" onClick={onClose}>
            Cancel
          </button>
          <button type="submit" className="btn primary-button" disabled={saving}>
            {saving ? 'Saving…' : 'Add animal'}
          </button>
        </div>
      </form>
    </div>
  )
}