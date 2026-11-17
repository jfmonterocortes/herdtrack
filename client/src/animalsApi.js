// FILE          : animalsApi.js
// PROJECT       : HerdTrack - Group 6
// PROGRAMMER    : Halvin Silva Mayes
// FIRST VERSION : 2026-11-16
// DESCRIPTION   : Calls to the animal endpoints using the signed-in user's token.

export function animalsApi(request) {
  return {
    list(filters = {}) {
      const params = new URLSearchParams()
      for (const [key, value] of Object.entries(filters)) {
        if (value) params.append(key, value)
      }
      const query = params.toString()
      return request('/animals' + (query ? '?' + query : ''))
    },
    species() {
      return request('/animals/species')
    },
    get(id) {
      return request('/animals/' + id)
    },
    create(animal) {
      return request('/animals', { method: 'POST', body: animal })
    },
    update(id, changes) {
      return request('/animals/' + id, { method: 'PUT', body: changes })
    },
    remove(id) {
      return request('/animals/' + id, { method: 'DELETE' })
    },
  }
}