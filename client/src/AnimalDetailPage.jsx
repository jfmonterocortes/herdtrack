import { useEffect, useMemo, useState } from 'react'
import { Link, useParams } from 'react-router'
import { useAuth } from './auth'
import { animalsApi } from './animalsApi'
import WeightsSection from './WeightsSection'
import { formatDate } from './weightsApi'
import './herd.css'

const STATUS_LABELS = { ACTIVE: 'Active', SOLD: 'Sold', DECEASED: 'Deceased' }

export default function AnimalDetailPage() {
  const { animalId } = useParams()
  const { request } = useAuth()
  const api = useMemo(() => animalsApi(request), [request])

  const [animal, setAnimal] = useState(null)
  const [error, setError] = useState('')

  useEffect(() => {
    let active = true
    setAnimal(null)
    setError('')
    api
      .get(animalId)
      .then((data) => active && setAnimal(data))
      .catch((err) => active && setError(err.message))
    return () => {
      active = false
    }
  }, [api, animalId])

  if (error) {
    return (
      <>
        <Link className="back-link" to="/herd">Back to herd</Link>
        <p className="herd-alert" role="alert">{error}</p>
      </>
    )
  }

  if (!animal) {
    return (
      <>
        <Link className="back-link" to="/herd">Back to herd</Link>
        <p className="card card-body empty-state">Loading animal…</p>
      </>
    )
  }

  return (
    <>
      <Link className="back-link" to="/herd">Back to herd</Link>
      <div className="herd-header">
        <div>
          <h1>{animal.name}</h1>
          <p className="intro">
            Tag <span className="herd-tag">{animal.tagNumber}</span> · {animal.species}
            {animal.breed ? ' · ' + animal.breed : ''} · {animal.sex === 'FEMALE' ? 'Female' : 'Male'}
            {animal.birthDate ? ' · Born ' + formatDate(animal.birthDate) : ''}
          </p>
        </div>
        <span className={'herd-badge herd-badge-' + animal.status.toLowerCase()}>
          {STATUS_LABELS[animal.status]}
        </span>
      </div>

      <WeightsSection animalId={animal.id} animalName={animal.name} />
    </>
  )
}
