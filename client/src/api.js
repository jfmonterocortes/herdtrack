export class ApiError extends Error {
  constructor(message, status) {
    super(message)
    this.name = 'ApiError'
    this.status = status
  }
}

export async function apiRequest(path, { token, body, ...options } = {}) {
  const headers = new Headers(options.headers)
  headers.set('Accept', 'application/json')

  if (body !== undefined) {
    headers.set('Content-Type', 'application/json')
  }

  if (token) {
    headers.set('Authorization', `Bearer ${token}`)
  }

  let response
  try {
    response = await fetch(`/api${path}`, {
      ...options,
      headers,
      body: JSON.stringify(body),
    })
  } catch (error) {
    if (error.name === 'AbortError') throw error
    throw new ApiError('Could not reach HerdTrack. Check your connection and try again.')
  }

  if (response.status === 204) return null

  const isJson = response.headers.get('content-type')?.includes('application/json')
  const data = isJson ? await response.json().catch(() => null) : null

  if (!response.ok) {
    throw new ApiError(
      data?.error || data?.message || 'The request failed. Please try again.',
      response.status,
    )
  }

  if (data === null) {
    throw new ApiError('HerdTrack received an unexpected response. Please try again.', response.status)
  }

  return data
}
