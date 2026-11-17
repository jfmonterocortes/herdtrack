// FILE          : HerdPage.jsx
// PROJECT       : HerdTrack - Group 6
// PROGRAMMER    : Halvin Silva Mayes
// FIRST VERSION : 2026-11-16
// DESCRIPTION   : Herd list page with search, filters, sorting and add animal.

import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router'
import { useAuth } from './auth'
import { animalsApi } from './animalsApi'
import AddAnimalForm from './AddAnimalForm'
import './herd.css'

const STATUS_LABELS = { ACTIVE: 'Active', SOLD: 'Sold', DECEASED: 'Deceased' }

const SORT_OPTIONS = [
  { value: 'newest', label: 'Newest added' },
  { value: 'oldest', label: 'Oldest added' },
  { value: 'name', label: 'Name (A–Z)' },
  { value: 'tag', label: 'Tag number' },
  { value: 'youngest', label: 'Youngest first' },
]

function age(birthDate) {
  if (!birthDate) return '—'
  const months = Math.floor((Date.now() - new Date(birthDate)) / (1000 * 60 * 60 * 24 * 30.44))
  if (months < 1) return '< 1 mo'
  if (months < 24) return months + ' mo'
  return Math.floor(months / 12) + ' yr'
}

export default function HerdPage() {
  const { request } = useAuth()
  const api = useMemo(() => animalsApi(request), [request])

  const [animals, setAnimals] = useState([])
  const [speciesList, setSpeciesList] = useState([])
  const [search, setSearch] = useState('')
  const [debouncedSearch, setDebouncedSearch] = useState('')
  const [species, setSpecies] = useState('')
  const [status, setStatus] = useState('')
  const [sort, setSort] = useState('newest')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [showForm, setShowForm] = useState(false)

  useEffect(() => {
    const timer = setTimeout(() => setDebouncedSearch(search), 300)
    return () => clearTimeout(timer)
  }, [search])

  useEffect(() => {
    api.species().then(setSpeciesList).catch(() => {})
  }, [api])

  useEffect(() => {
    let active = true
    setLoading(true)
    setError('')
    api
      .list({ search: debouncedSearch, species, status, sort })
      .then((list) => active && setAnimals(list))
      .catch((err) => active && setError(err.message))
      .finally(() => active && setLoading(false))
    return () => {
      active = false
    }
  }, [api, debouncedSearch, species, status, sort])

  function handleCreated(animal) {
    setShowForm(false)
    setAnimals((list) => [animal, ...list])
    if (!speciesList.includes(animal.species)) {
      setSpeciesList([...speciesList, animal.species].sort())
    }
  }

  const hasFilters = search || species || status

  function clearFilters() {
    setSearch('')
    setSpecies('')
    setStatus('')
  }

  return (
    <>
      <div className="herd-header">
        <div>
          <h1>Herd</h1>
          <p className="intro">
            {animals.length} {animals.length === 1 ? 'animal' : 'animals'}
          </p>
        </div>
        <button className="btn primary-button" type="button" onClick={() => setShowForm(true)}>
          + Add animal
        </button>
      </div>

      <div className="herd-toolbar" role="search">
        <input
          className="herd-search"
          type="search"
          aria-label="Search animals"
          placeholder="Search by name, tag or breed…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />

        <select aria-label="Species" value={species} onChange={(e) => setSpecies(e.target.value)}>
          <option value="">All species</option>
          {speciesList.map((s) => (
            <option key={s} value={s}>
              {s}
            </option>
          ))}
        </select>

        <select aria-label="Status" value={status} onChange={(e) => setStatus(e.target.value)}>
          <option value="">All statuses</option>
          {Object.entries(STATUS_LABELS).map(([value, label]) => (
            <option key={value} value={value}>
              {label}
            </option>
          ))}
        </select>

        <select aria-label="Sort by" value={sort} onChange={(e) => setSort(e.target.value)}>
          {SORT_OPTIONS.map((o) => (
            <option key={o.value} value={o.value}>
              {o.label}
            </option>
          ))}
        </select>

        {hasFilters && (
          <button className="btn herd-secondary" type="button" onClick={clearFilters}>
            Clear
          </button>
        )}
      </div>

      {error && (
        <p className="herd-alert" role="alert">
          {error}
        </p>
      )}

      {loading ? (
        <p className="card card-body empty-state">Loading animals…</p>
      ) : animals.length === 0 ? (
        <div className="card card-body empty-state herd-empty">
          {hasFilters ? (
            <>
              <p>No animals match your filters.</p>
              <button className="btn herd-secondary" type="button" onClick={clearFilters}>
                Clear filters
              </button>
            </>
          ) : (
            <>
              <p>Your herd is empty.</p>
              <button className="btn primary-button" type="button" onClick={() => setShowForm(true)}>
                Add your first animal
              </button>
            </>
          )}
        </div>
      ) : (
        <div className="herd-table-wrap">
          <table className="herd-table">
            <thead>
              <tr>
                <th>Name</th>
                <th>Tag</th>
                <th>Species</th>
                <th>Breed</th>
                <th>Sex</th>
                <th>Age</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {animals.map((a) => (
                <tr key={a.id}>
                  <td>
                    <Link className="herd-name" to={'/herd/' + a.id}>
                      {a.name}
                    </Link>
                  </td>
                  <td className="herd-tag">{a.tagNumber}</td>
                  <td>{a.species}</td>
                  <td>{a.breed || '—'}</td>
                  <td>{a.sex === 'FEMALE' ? 'Female' : 'Male'}</td>
                  <td>{age(a.birthDate)}</td>
                  <td>
                    <span className={'herd-badge herd-badge-' + a.status.toLowerCase()}>
                      {STATUS_LABELS[a.status]}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {showForm && (
        <AddAnimalForm
          api={api}
          speciesList={speciesList}
          onClose={() => setShowForm(false)}
          onCreated={handleCreated}
        />
      )}
    </>
  )
}