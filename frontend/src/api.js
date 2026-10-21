const BASE = '/api'

async function req(path, options = {}) {
  const res = await fetch(BASE + path, {
    headers: { 'Content-Type': 'application/json' },
    ...options,
  })
  if (!res.ok) {
    let detail = res.statusText
    try {
      const body = await res.json()
      detail = JSON.stringify(body)
    } catch { /* ignore */ }
    throw new Error(`HTTP ${res.status}: ${detail}`)
  }
  if (res.status === 204) return null
  return res.json()
}

export const api = {
  summary: () => req('/summary/'),
  exercises: {
    list: () => req('/exercises/'),
    create: (name) => req('/exercises/', { method: 'POST', body: JSON.stringify({ name }) }),
    update: (id, name) => req(`/exercises/${id}/`, { method: 'PATCH', body: JSON.stringify({ name }) }),
    remove: (id) => req(`/exercises/${id}/`, { method: 'DELETE' }),
  },
  workouts: {
    list: (date) => req('/workouts/' + (date ? `?date=${date}` : '')),
    create: (data) => req('/workouts/', { method: 'POST', body: JSON.stringify(data) }),
    remove: (id) => req(`/workouts/${id}/`, { method: 'DELETE' }),
  },
  food: {
    list: (date) => req('/food/' + (date ? `?date=${date}` : '')),
    create: (data) => req('/food/', { method: 'POST', body: JSON.stringify(data) }),
    remove: (id) => req(`/food/${id}/`, { method: 'DELETE' }),
  },
  bodycomp: {
    list: () => req('/bodycomp/'),
    create: (data) => req('/bodycomp/', { method: 'POST', body: JSON.stringify(data) }),
    remove: (id) => req(`/bodycomp/${id}/`, { method: 'DELETE' }),
  },
}

export const todayStr = () => new Date().toISOString().slice(0, 10)
export const fmtDate = (iso) => new Date(iso + 'T00:00:00').toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })
