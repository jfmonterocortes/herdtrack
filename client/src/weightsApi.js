export function weightsApi(request) {
  return {
    list(animalId) {
      return request('/animals/' + animalId + '/weights')
    },
    growth(animalId) {
      return request('/animals/' + animalId + '/growth')
    },
    create(animalId, weight) {
      return request('/animals/' + animalId + '/weights', { method: 'POST', body: weight })
    },
    update(weightId, changes) {
      return request('/weights/' + weightId, { method: 'PUT', body: changes })
    },
    remove(weightId) {
      return request('/weights/' + weightId, { method: 'DELETE' })
    },
  }
}

const LB_PER_KG = 1 / 0.453592

export function fromKg(kg, unit) {
  if (kg === null || kg === undefined) return null
  const value = unit === 'LB' ? kg * LB_PER_KG : kg
  return Math.round(value * 100) / 100
}

export function unitLabel(unit) {
  return unit === 'LB' ? 'lb' : 'kg'
}

export function formatDate(date) {
  return new Date(date).toLocaleDateString(undefined, {
    timeZone: 'UTC',
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  })
}
