import { useEffect, useState, useCallback } from 'react'
import { api, todayStr, fmtDate } from './api.js'

export default function App() {
  const [tab, setTab] = useState('dashboard')
  const [summary, setSummary] = useState(null)
  const [error, setError] = useState('')

  const refresh = useCallback(() => {
    api.summary().then(setSummary).catch(e => setError(e.message))
  }, [])

  useEffect(() => { refresh() }, [refresh])

  return (
    <div className="app">
      <header className="header">
        <h1>Ken's Fitness Tracker</h1>
        <nav className="tabs">
          <button className={tab === 'dashboard' ? 'active' : ''} onClick={() => setTab('dashboard')}>Dashboard</button>
          <button className={tab === 'workout' ? 'active' : ''} onClick={() => setTab('workout')}>Workout</button>
          <button className={tab === 'exercises' ? 'active' : ''} onClick={() => setTab('exercises')}>Exercises</button>
          <button className={tab === 'food' ? 'active' : ''} onClick={() => setTab('food')}>Food</button>
          <button className={tab === 'bodycomp' ? 'active' : ''} onClick={() => setTab('bodycomp')}>Body Comp</button>
        </nav>
      </header>
      {error && <div className="error">{error} <button onClick={() => setError('')}>×</button></div>}
      <main>
        {tab === 'dashboard' && <Dashboard summary={summary} />}
        {tab === 'workout' && <WorkoutTab onChanged={refresh} />}
        {tab === 'exercises' && <ExerciseTab />}
        {tab === 'food' && <FoodTab summary={summary} onChanged={refresh} />}
        {tab === 'bodycomp' && <BodyCompTab />}
      </main>
    </div>
  )
}

/* ─── Dashboard ─── */
function Dashboard({ summary }) {
  if (!summary) return <p className="muted">Loading…</p>
  const { today, calories_7d, bodycomp_latest, weight_delta, bf_delta, workouts_7d } = summary
  const pct = Math.min(100, Math.round((today.calories / today.calorie_target) * 100))

  return (
    <div className="grid">
      <div className="card">
        <h3>Today's Calories</h3>
        <div className="big">{today.calories.toLocaleString()} <span className="unit">/ {today.calorie_target.toLocaleString()} kcal</span></div>
        <div className="progress-bar"><div className="progress-fill" style={{ width: pct + '%' }} /></div>
        <p className="muted">{pct}% of target · {today.protein_g}g protein (target {today.protein_target}g)</p>
      </div>

      <div className="card">
        <h3>Body Comp</h3>
        {bodycomp_latest ? (
          <>
            <div className="big">{bodycomp_latest.weight_lb} lb {bf_delta !== null && <span className={bf_delta < 0 ? 'good' : 'bad'}>({bf_delta > 0 ? '+' : ''}{bf_delta}% BF)</span>}</div>
            <p className="muted">BF: {bodycomp_latest.body_fat_pct}% · {fmtDate(bodycomp_latest.date)}</p>
            {weight_delta !== null && <p className="muted">Total change: {weight_delta > 0 ? '+' : ''}{weight_delta} lb since baseline</p>}
          </>
        ) : <p className="muted">No readings yet</p>}
      </div>

      <div className="card">
        <h3>7-Day Training</h3>
        <div className="big">{workouts_7d.distinct_days} <span className="unit">days</span></div>
        <p className="muted">{workouts_7d.entries} entries · {workouts_7d.volume_lbs.toLocaleString()} lb total volume</p>
      </div>

      <div className="card wide">
        <h3>7-Day Calorie Trend</h3>
        <div className="bar-chart">
          {calories_7d.map(d => {
            const h = Math.max(4, Math.min(100, (d.calories / (summary.today.calorie_target * 1.2)) * 100))
            return (
              <div key={d.date} className="bar-col" title={`${d.date}: ${d.calories} kcal`}>
                <div className="bar" style={{ height: h + '%' }} />
                <span>{d.label}</span>
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}

/* ─── Workout Tab ─── */
function WorkoutTab({ onChanged }) {
  const [exercises, setExercises] = useState([])
  const [entries, setEntries] = useState([])
  const [form, setForm] = useState({ date: todayStr(), exercise: '', weight: '', reps: '', sets: '1', notes: '' })

  useEffect(() => {
    api.exercises.list().then(setExercises).catch(() => {})
    loadEntries()
  }, [])

  const loadEntries = () => {
    api.workouts.list(form.date).then(setEntries).catch(() => setEntries([]))
  }

  const submit = (e) => {
    e.preventDefault()
    const data = { ...form, weight: form.weight ? +form.weight : null, reps: form.reps ? +form.reps : null }
    api.workouts.create(data).then(() => {
      setForm({ ...form, weight: '', reps: '' })
      loadEntries()
      onChanged()
    })
  }

  const remove = (id) => { api.workouts.remove(id).then(() => { loadEntries(); onChanged() }) }

  return (
    <div>
      <h2>Log a Set</h2>
      <form className="form" onSubmit={submit}>
        <input type="date" value={form.date} onChange={e => setForm({ ...form, date: e.target.value })} />
        <select value={form.exercise} onChange={e => setForm({ ...form, exercise: e.target.value })} required>
          <option value="">Select exercise…</option>
          {exercises.map(ex => <option key={ex.id} value={ex.name}>{ex.name}</option>)}
        </select>
        <input type="number" placeholder="Weight (lb)" min="0" step="5" value={form.weight} onChange={e => setForm({ ...form, weight: e.target.value })} />
        <input type="number" placeholder="Reps" min="0" value={form.reps} onChange={e => setForm({ ...form, reps: e.target.value })} />
        <input type="number" placeholder="Sets" min="1" value={form.sets} onChange={e => setForm({ ...form, sets: e.target.value })} />
        <input type="text" placeholder="Notes" value={form.notes} onChange={e => setForm({ ...form, notes: e.target.value })} />
        <button type="submit">Add</button>
      </form>

      <h3 className="section-title">Logs for {fmtDate(form.date)}</h3>
      <table className="table">
        <thead><tr><th>Exercise</th><th>Weight</th><th>Reps</th><th>Sets</th><th>Notes</th><th></th></tr></thead>
        <tbody>
          {entries.map(en => (
            <tr key={en.id}>
              <td>{en.exercise}</td>
              <td>{en.weight ? `${en.weight} lb` : 'BW'}</td>
              <td>{en.reps ?? '—'}</td>
              <td>{en.sets}</td>
              <td>{en.notes}</td>
              <td><button className="btn-sm" onClick={() => remove(en.id)}>×</button></td>
            </tr>
          ))}
          {entries.length === 0 && <tr><td colSpan="6" className="muted">No entries for this date</td></tr>}
        </tbody>
      </table>
    </div>
  )
}

/* ─── Exercises Tab ─── */
function ExerciseTab() {
  const [exercises, setExercises] = useState([])
  const [name, setName] = useState('')
  const [editing, setEditing] = useState(null)
  const [editName, setEditName] = useState('')

  const load = () => api.exercises.list().then(setExercises).catch(() => setExercises([]))
  useEffect(() => { load() }, [])

  const add = (e) => {
    e.preventDefault()
    const trimmed = name.trim()
    if (!trimmed) return
    api.exercises.create(trimmed).then(() => {
      setName('')
      load()
    })
  }

  const saveEdit = (id) => {
    const trimmed = editName.trim()
    if (!trimmed) return
    api.exercises.update(id, trimmed).then(() => {
      setEditing(null)
      load()
    })
  }

  const remove = (id) => { api.exercises.remove(id).then(load) }

  return (
    <div>
      <h2>Exercise Library</h2>
      <p className="muted" style={{ marginBottom: '1rem' }}>Suggestions offered when logging a workout. Removing an exercise does not delete its logged sets.</p>
      <form className="form" onSubmit={add}>
        <input type="text" placeholder="Exercise name" value={name} onChange={e => setName(e.target.value)} required />
        <button type="submit">Add</button>
      </form>

      <table className="table">
        <thead><tr><th>Exercise</th><th></th></tr></thead>
        <tbody>
          {exercises.map(ex => (
            <tr key={ex.id}>
              {editing === ex.id ? (
                <>
                  <td>
                    <input
                      value={editName}
                      onChange={e => setEditName(e.target.value)}
                      onKeyDown={e => {
                        if (e.key === 'Enter') saveEdit(ex.id)
                        if (e.key === 'Escape') setEditing(null)
                      }}
                      autoFocus
                    />
                  </td>
                  <td>
                    <button className="btn-sm good" onClick={() => saveEdit(ex.id)}>Save</button>
                    <button className="btn-sm" onClick={() => setEditing(null)}>Cancel</button>
                  </td>
                </>
              ) : (
                <>
                  <td>{ex.name}</td>
                  <td>
                    <button className="btn-sm neutral" onClick={() => { setEditing(ex.id); setEditName(ex.name) }}>Edit</button>
                    <button className="btn-sm" onClick={() => remove(ex.id)}>Delete</button>
                  </td>
                </>
              )}
            </tr>
          ))}
          {exercises.length === 0 && <tr><td colSpan="2" className="muted">No exercises yet</td></tr>}
        </tbody>
      </table>
    </div>
  )
}

/* ─── Food Tab ─── */
function FoodTab({ summary, onChanged }) {
  const [entries, setEntries] = useState([])
  const [form, setForm] = useState({ date: todayStr(), name: '', calories: '', meal_slot: '', protein_g: '', notes: '' })
  const [dayCals, setDayCals] = useState(0)

  useEffect(() => {
    loadEntries()
  }, [form.date])

  const loadEntries = () => {
    api.food.list(form.date).then(data => {
      setEntries(data)
      setDayCals(data.reduce((s, e) => s + e.calories, 0))
    }).catch(() => setEntries([]))
  }

  const submit = (e) => {
    e.preventDefault()
    const data = { ...form, calories: +form.calories || 0, protein_g: form.protein_g ? +form.protein_g : null }
    api.food.create(data).then(() => {
      setForm({ ...form, name: '', calories: '', protein_g: '' })
      loadEntries()
      onChanged()
    })
  }

  const remove = (id) => { api.food.remove(id).then(() => { loadEntries(); onChanged() }) }

  const target = summary?.today?.calorie_target || 2250
  const pct = Math.min(100, Math.round((dayCals / target) * 100))

  return (
    <div>
      <h2>Log Food</h2>
      <div className="progress-row">
        <span className="muted">{dayCals.toLocaleString()} / {target.toLocaleString()} kcal ({pct}%)</span>
        <div className="progress-bar"><div className="progress-fill" style={{ width: pct + '%' }} /></div>
      </div>
      <form className="form" onSubmit={submit}>
        <input type="date" value={form.date} onChange={e => setForm({ ...form, date: e.target.value })} />
        <input type="text" placeholder="Food name" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} required />
        <input type="number" placeholder="Calories" min="0" value={form.calories} onChange={e => setForm({ ...form, calories: e.target.value })} required />
        <select value={form.meal_slot} onChange={e => setForm({ ...form, meal_slot: e.target.value })}>
          <option value="">Meal…</option>
          <option value="breakfast">Breakfast</option>
          <option value="lunch">Lunch</option>
          <option value="snack">Snack</option>
          <option value="dinner">Dinner</option>
        </select>
        <input type="number" placeholder="Protein (g)" min="0" value={form.protein_g} onChange={e => setForm({ ...form, protein_g: e.target.value })} />
        <button type="submit">Add</button>
      </form>

      <h3 className="section-title">Logs for {fmtDate(form.date)}</h3>
      <table className="table">
        <thead><tr><th>Food</th><th>Meal</th><th>Calories</th><th>Protein</th><th>Notes</th><th></th></tr></thead>
        <tbody>
          {entries.map(en => (
            <tr key={en.id}>
              <td>{en.name}</td>
              <td>{en.meal_slot || '—'}</td>
              <td>{en.calories}</td>
              <td>{en.protein_g ? `${en.protein_g}g` : '—'}</td>
              <td>{en.notes}</td>
              <td><button className="btn-sm" onClick={() => remove(en.id)}>×</button></td>
            </tr>
          ))}
          {entries.length === 0 && <tr><td colSpan="6" className="muted">No entries for this date</td></tr>}
        </tbody>
      </table>
    </div>
  )
}

/* ─── Body Comp Tab ─── */
function BodyCompTab() {
  const [readings, setReadings] = useState([])
  const [form, setForm] = useState({ date: todayStr(), weight_lb: '', body_fat_pct: '', notes: '' })

  const load = () => api.bodycomp.list().then(setReadings).catch(() => {})
  useEffect(() => { load() }, [])

  const submit = (e) => {
    e.preventDefault()
    const data = { ...form, weight_lb: +form.weight_lb, body_fat_pct: form.body_fat_pct ? +form.body_fat_pct : null }
    api.bodycomp.create(data).then(() => {
      setForm({ ...form, weight_lb: '', body_fat_pct: '', notes: '' })
      load()
    })
  }

  const remove = (id) => { api.bodycomp.remove(id).then(load) }

  return (
    <div>
      <h2>Weight & Body Fat</h2>
      <form className="form" onSubmit={submit}>
        <input type="date" value={form.date} onChange={e => setForm({ ...form, date: e.target.value })} />
        <input type="number" placeholder="Weight (lb)" min="0" step="0.1" value={form.weight_lb} onChange={e => setForm({ ...form, weight_lb: e.target.value })} required />
        <input type="number" placeholder="Body fat %" min="1" max="80" step="0.1" value={form.body_fat_pct} onChange={e => setForm({ ...form, body_fat_pct: e.target.value })} />
        <input type="text" placeholder="Notes" value={form.notes} onChange={e => setForm({ ...form, notes: e.target.value })} />
        <button type="submit">Save</button>
      </form>

      <h3 className="section-title">History</h3>
      <table className="table">
        <thead><tr><th>Date</th><th>Weight</th><th>Body Fat %</th><th>Δ Weight</th><th>Notes</th><th></th></tr></thead>
        <tbody>
          {readings.map((r, i) => {
            const prev = readings[i + 1]
            const delta = prev ? (r.weight_lb - prev.weight_lb).toFixed(1) : ''
            return (
              <tr key={r.id}>
                <td>{fmtDate(r.date)}</td>
                <td>{r.weight_lb} lb</td>
                <td>{r.body_fat_pct ?? '—'}</td>
                <td className={delta < 0 ? 'good' : delta > 0 ? 'bad' : ''}>{delta || '—'}</td>
                <td>{r.notes}</td>
                <td><button className="btn-sm" onClick={() => remove(r.id)}>×</button></td>
              </tr>
            )
          })}
          {readings.length === 0 && <tr><td colSpan="6" className="muted">No readings yet</td></tr>}
        </tbody>
      </table>
    </div>
  )
}
