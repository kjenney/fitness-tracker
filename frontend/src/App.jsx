import { useEffect, useState, useCallback } from 'react'
import { api, todayStr, fmtDate } from './api.js'


/* ─── Trend Chart Component ─── */
function TrendChart({ workouts }) {
  // Filter out null values for weight or reps to plot
  const dataPoints = workouts
    .map((w, i) => ({ ...w, index: i }))
    .filter(w => w.weight !== null || w.reps !== null)

  if (dataPoints.length < 2) return null

  // Determine which metric to plot (weight preferred if available)
  const hasWeight = dataPoints.some(w => w.weight !== null)
  const metric = hasWeight ? 'weight' : 'reps'
  const values = dataPoints.map(w => w[metric] || 0)
  const minVal = Math.min(...values)
  const maxVal = Math.max(...values)
  const range = maxVal - minVal || 1

  // Create SVG path
  const width = 120
  const height = 40
  const points = dataPoints.map((w, i) => {
    const x = (i / (dataPoints.length - 1)) * width
    const y = height - ((w[metric] - minVal) / range) * height
    return `${x},${y}`
  }).join(' ')

  return (
    <svg width={width} height={height} className="trend-chart" viewBox={`0 0 ${width} ${height}`} preserveAspectRatio="none">
      <polyline
        fill="none"
        stroke="#6366f1"
        strokeWidth="2"
        points={points}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  )
}


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
          <button className={tab === 'progress' ? 'active' : ''} onClick={() => setTab('progress')}>Progress</button>
          <button className={tab === 'exercises' ? 'active' : ''} onClick={() => setTab('exercises')}>Exercises</button>
          <button className={tab === 'food' ? 'active' : ''} onClick={() => setTab('food')}>Food</button>
          <button className={tab === 'bodycomp' ? 'active' : ''} onClick={() => setTab('bodycomp')}>Body Comp</button>
        </nav>
      </header>
      {error && <div className="error">{error} <button onClick={() => setError('')}>×</button></div>}
      <main>
        {tab === 'dashboard' && <Dashboard summary={summary} />}
        {tab === 'workout' && <WorkoutTab onChanged={refresh} />}
        {tab === 'progress' && <ProgressTab />}
        {tab === 'exercises' && <ExerciseTab />}
        {tab === 'food' && <FoodTab summary={summary} onChanged={refresh} />}
        {tab === 'bodycomp' && <BodyCompTab />}
      </main>
    </div>
  )
}

/* ─── Progress Tab ─── */
function ProgressTab() {
  const [progress, setProgress] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    api.exerciseProgress().then(data => {
      setProgress(data)
      setLoading(false)
    }).catch(() => {
      setLoading(false)
    })
  }, [])

  return (
    <div>
      <h2>Exercise Progress</h2>
      <p className="muted" style={{ marginBottom: '1rem' }}>Track changes in weights and reps over time</p>

      {loading ? (
        <p className="muted">Loading progress data…</p>
      ) : progress.length > 0 ? (
        <div className="grid">
          {progress.map(ex => (
            <div key={ex.exercise} className="card">
              <div className="exercise-header">
                <h3>{ex.exercise}</h3>
                <span className="muted">{ex.num_sessions} session{ex.num_sessions !== 1 && 's'}</span>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
                <div>
                  <p className="muted" style={{ fontSize: '0.75rem', textTransform: 'uppercase', marginBottom: '0.25rem' }}>Current Weight</p>
                  <div className="big" style={{ fontSize: '1.4rem' }}>
                    {ex.current_weight !== null ? `${ex.current_weight} lb` : '—'}
                    {ex.weight_change !== null && ex.weight_change !== 0 && (
                      <span className={ex.weight_change > 0 ? 'good' : 'bad'}>
                        {' '}{ex.weight_change > 0 ? '+' : ''}{ex.weight_change}
                      </span>
                    )}
                  </div>
                </div>
                <div>
                  <p className="muted" style={{ fontSize: '0.75rem', textTransform: 'uppercase', marginBottom: '0.25rem' }}>Current Reps</p>
                  <div className="big" style={{ fontSize: '1.4rem' }}>
                    {ex.current_reps !== null ? ex.current_reps : '—'}
                    {ex.reps_change !== null && ex.reps_change !== 0 && (
                      <span className={ex.reps_change > 0 ? 'good' : 'bad'}>
                        {' '}{ex.reps_change > 0 ? '+' : ''}{ex.reps_change}
                      </span>
                    )}
                  </div>
                </div>
                <div>
                  <p className="muted" style={{ fontSize: '0.75rem', textTransform: 'uppercase', marginBottom: '0.25rem' }}>Baseline Weight</p>
                  <p>{ex.baseline_weight !== null ? `${ex.baseline_weight} lb` : '—'}</p>
                </div>
                <div>
                  <p className="muted" style={{ fontSize: '0.75rem', textTransform: 'uppercase', marginBottom: '0.25rem' }}>Baseline Reps</p>
                  <p>{ex.baseline_reps !== null ? ex.baseline_reps : '—'}</p>
                </div>
              </div>
              {ex.recent_workouts && ex.recent_workouts.length > 0 && (
                <div className="progress-chart">
                  <TrendChart workouts={ex.recent_workouts} />
                </div>
              )}
              <p className="muted" style={{ marginTop: '0.75rem', fontSize: '0.8rem' }}>
                Last workout: {fmtDate(ex.last_workout_date)}
              </p>
            </div>
          ))}
        </div>
      ) : (
        <div className="card">
          <p className="muted">No exercise data yet. Log some workouts to see your progress!</p>
        </div>
      )}
    </div>
  )
}

/* ─── Dashboard ─── */
function Dashboard({ summary }) {
  if (!summary) return <p className="muted">Loading…</p>
  const { today, calories_7d, bodycomp_latest, weight_delta, bf_delta, workouts_7d, exercise_progress } = summary
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

      <div className="card wide">
        <h3>Exercise Progress</h3>
        <p className="muted" style={{ marginBottom: '1rem' }}>Track changes in weights and reps over time</p>
        {exercise_progress && exercise_progress.length > 0 ? (
          <div className="exercise-progress-grid">
            {exercise_progress.map(ex => (
              <div key={ex.exercise} className="exercise-progress-card">
                <div className="exercise-header">
                  <h4>{ex.exercise}</h4>
                  <span className="muted">{ex.num_sessions} session{ex.num_sessions !== 1 && 's'}</span>
                </div>
                <div className="progress-row">
                  <div className="progress-card">
                    <div>
                      <div className="progress-label">Weight</div>
                      <div className="progress-value">
                        {ex.current_weight !== null ? `${ex.current_weight} lb` : '—'}
                        <span className={ex.weight_change > 0 ? 'good' : ex.weight_change < 0 ? 'bad' : ''}>
                          {ex.weight_change !== null && ex.weight_change !== 0 ? (ex.weight_change > 0 ? '+' : '') + ex.weight_change : ''}
                        </span>
                      </div>
                    </div>
                    <div>
                      <div className="progress-label">Reps</div>
                      <div className="progress-value">
                        {ex.current_reps !== null ? ex.current_reps : '—'}
                        <span className={ex.reps_change > 0 ? 'good' : ex.reps_change < 0 ? 'bad' : ''}>
                          {ex.reps_change !== null && ex.reps_change !== 0 ? (ex.reps_change > 0 ? '+' : '') + ex.reps_change : ''}
                        </span>
                      </div>
                    </div>
                  </div>
                  {ex.recent_workouts && ex.recent_workouts.length > 1 && (
                    <div className="trend-visual">
                      <TrendChart workouts={ex.recent_workouts} />
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <p className="muted">No exercise data yet. Log some workouts to see progress!</p>
        )}
      </div>
    </div>
  )
}

/* ─── Workout Tab ─── */
function WorkoutTab({ onChanged }) {
  const [exercises, setExercises] = useState([])
  const [entries, setEntries] = useState([])
  const [viewDate, setViewDate] = useState(todayStr())
  const [form, setForm] = useState({ exercise: '', weight: '', reps: '', sets: '1', notes: '' })

  const isToday = viewDate === todayStr()

  useEffect(() => {
    api.exercises.list().then(setExercises).catch(() => {})
  }, [])

  const loadEntries = () => {
    api.workouts.list(viewDate).then(setEntries).catch(() => setEntries([]))
  }

  const handleExerciseChange = (e) => {
    const exerciseName = e.target.value
    setForm({ ...form, exercise: exerciseName })
    if (exerciseName) {
      api.workouts.lastForExercise(exerciseName).then(last => {
        if (last && (last.weight !== null || last.reps !== null)) {
          setForm(prev => ({
            ...prev,
            weight: last.weight ?? '',
            reps: last.reps ?? '',
            sets: last.sets?.toString() ?? '1',
            notes: last.notes ?? '',
          }))
        }
      }).catch(() => {})
    }
  }

  useEffect(() => { loadEntries() }, [viewDate])

  const submit = (e) => {
    e.preventDefault()
    const data = {
      date: todayStr(),
      ...form,
      weight: form.weight ? +form.weight : null,
      reps: form.reps ? +form.reps : null,
    }
    api.workouts.create(data).then(() => {
      setForm({ exercise: '', weight: '', reps: '', sets: '1', notes: '' })
      loadEntries()
      onChanged()
    })
  }

  const remove = (id) => { api.workouts.remove(id).then(() => { loadEntries(); onChanged() }) }

  return (
    <div>
      <div className="form">
        <span className="muted">View day</span>
        <input type="date" value={viewDate} max={todayStr()} onChange={e => e.target.value && setViewDate(e.target.value)} />
      </div>

      {isToday ? (
        <>
          <h2>Log a Set</h2>
          <form className="form" onSubmit={submit}>
            <select value={form.exercise} onChange={handleExerciseChange} required>
              <option value="">Select exercise…</option>
              {exercises.map(ex => <option key={ex.id} value={ex.name}>{ex.name}</option>)}
            </select>
            <input type="number" placeholder="Weight (lb)" min="0" step="5" value={form.weight} onChange={e => setForm({ ...form, weight: e.target.value })} />
            <input type="number" placeholder="Reps" min="0" value={form.reps} onChange={e => setForm({ ...form, reps: e.target.value })} />
            <input type="number" placeholder="Sets" min="1" value={form.sets} onChange={e => setForm({ ...form, sets: e.target.value })} />
            <input type="text" placeholder="Notes" value={form.notes} onChange={e => setForm({ ...form, notes: e.target.value })} />
            <button type="submit">Add</button>
          </form>
        </>
      ) : (
        <p className="muted" style={{ marginBottom: '1rem' }}>Sets can only be logged for today — this day is shown as recorded.</p>
      )}

      <h3 className="section-title">Logs for {fmtDate(viewDate)}</h3>
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
  const [url, setUrl] = useState('')
  const [editing, setEditing] = useState(null)
  const [editName, setEditName] = useState('')
  const [editUrl, setEditUrl] = useState('')

  const load = () => api.exercises.list().then(setExercises).catch(() => setExercises([]))
  useEffect(() => { load() }, [])

  const add = (e) => {
    e.preventDefault()
    const trimmed = name.trim()
    if (!trimmed) return
    api.exercises.create({ name: trimmed, url: url.trim() }).then(() => {
      setName('')
      setUrl('')
      load()
    })
  }

  const saveEdit = (id) => {
    const trimmed = editName.trim()
    if (!trimmed) return
    api.exercises.update(id, { name: trimmed, url: editUrl.trim() }).then(() => {
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
        <input type="url" placeholder="URL (video, form guide…)" value={url} onChange={e => setUrl(e.target.value)} />
        <button type="submit">Add</button>
      </form>

      <table className="table">
        <thead><tr><th>Exercise</th><th>URL</th><th></th></tr></thead>
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
                    <input
                      type="url"
                      placeholder="URL"
                      value={editUrl}
                      onChange={e => setEditUrl(e.target.value)}
                      onKeyDown={e => {
                        if (e.key === 'Enter') saveEdit(ex.id)
                        if (e.key === 'Escape') setEditing(null)
                      }}
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
                  <td>{ex.url ? <a href={ex.url} target="_blank" rel="noopener noreferrer">{ex.url}</a> : <span className="muted">—</span>}</td>
                  <td>
                    <button className="btn-sm neutral" onClick={() => { setEditing(ex.id); setEditName(ex.name); setEditUrl(ex.url) }}>Edit</button>
                    <button className="btn-sm" onClick={() => remove(ex.id)}>Delete</button>
                  </td>
                </>
              )}
            </tr>
          ))}
          {exercises.length === 0 && <tr><td colSpan="3" className="muted">No exercises yet</td></tr>}
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
  const [form, setForm] = useState({
    date: todayStr(),
    weight_lb: '',
    body_fat_pct: '',
    muscle_rate: '',
    lean_body_mass: '',
    subcutaneous_fat: '',
    visceral_fat: '',
    body_water: '',
    skeletal_mass_rate: '',
    muscle_mass: '',
    bone_mass: '',
    protein: '',
    basal_metabolism: '',
    body_age: '',
    waist_hip_ratio: '',
    body_fat_mass: '',
    water_content: '',
    protein_mass: '',
    notes: ''
  })

  const load = () => api.bodycomp.list().then(setReadings).catch(() => {})
  useEffect(() => { load() }, [])

  const submit = (e) => {
    e.preventDefault()
    const data = {
      ...form,
      weight_lb: +form.weight_lb,
      body_fat_pct: form.body_fat_pct ? +form.body_fat_pct : null,
      muscle_rate: form.muscle_rate ? +form.muscle_rate : null,
      lean_body_mass: form.lean_body_mass ? +form.lean_body_mass : null,
      subcutaneous_fat: form.subcutaneous_fat ? +form.subcutaneous_fat : null,
      visceral_fat: form.visceral_fat ? +form.visceral_fat : null,
      body_water: form.body_water ? +form.body_water : null,
      skeletal_mass_rate: form.skeletal_mass_rate ? +form.skeletal_mass_rate : null,
      muscle_mass: form.muscle_mass ? +form.muscle_mass : null,
      bone_mass: form.bone_mass ? +form.bone_mass : null,
      protein: form.protein ? +form.protein : null,
      basal_metabolism: form.basal_metabolism ? +form.basal_metabolism : null,
      body_age: form.body_age ? +form.body_age : null,
      waist_hip_ratio: form.waist_hip_ratio ? +form.waist_hip_ratio : null,
      body_fat_mass: form.body_fat_mass ? +form.body_fat_mass : null,
      water_content: form.water_content ? +form.water_content : null,
      protein_mass: form.protein_mass ? +form.protein_mass : null
    }
    api.bodycomp.create(data).then(() => {
      setForm({
        ...form,
        weight_lb: '',
        body_fat_pct: '',
        muscle_rate: '',
        lean_body_mass: '',
        subcutaneous_fat: '',
        visceral_fat: '',
        body_water: '',
        skeletal_mass_rate: '',
        muscle_mass: '',
        bone_mass: '',
        protein: '',
        basal_metabolism: '',
        body_age: '',
        waist_hip_ratio: '',
        body_fat_mass: '',
        water_content: '',
        protein_mass: '',
        notes: ''
      })
      load()
    })
  }

  const remove = (id) => { api.bodycomp.remove(id).then(load) }

  return (
    <div>
      <h2>Body Composition</h2>
      <form className="form" onSubmit={submit}>
        <input type="date" value={form.date} onChange={e => setForm({ ...form, date: e.target.value })} />

        <div className="form-group">
          <h4>Basic Metrics</h4>
          <input type="number" placeholder="Weight (lb)" min="0" step="0.1" value={form.weight_lb} onChange={e => setForm({ ...form, weight_lb: e.target.value })} required />
          <input type="number" placeholder="Body fat %" min="1" max="80" step="0.1" value={form.body_fat_pct} onChange={e => setForm({ ...form, body_fat_pct: e.target.value })} />
        </div>

        <div className="form-group">
          <h4>Composition</h4>
          <input type="number" placeholder="Muscle Rate %" min="0" max="100" step="0.1" value={form.muscle_rate} onChange={e => setForm({ ...form, muscle_rate: e.target.value })} />
          <input type="number" placeholder="Lean Body Mass (lb)" min="0" step="0.1" value={form.lean_body_mass} onChange={e => setForm({ ...form, lean_body_mass: e.target.value })} />
          <input type="number" placeholder="Subcutaneous Fat %" min="0" max="100" step="0.1" value={form.subcutaneous_fat} onChange={e => setForm({ ...form, subcutaneous_fat: e.target.value })} />
          <input type="number" placeholder="Visceral Fat (1-50)" min="1" max="50" step="1" value={form.visceral_fat} onChange={e => setForm({ ...form, visceral_fat: e.target.value })} />
          <input type="number" placeholder="Body Water %" min="0" max="100" step="0.1" value={form.body_water} onChange={e => setForm({ ...form, body_water: e.target.value })} />
          <input type="number" placeholder="Skeletal Mass Rate %" min="0" max="100" step="0.1" value={form.skeletal_mass_rate} onChange={e => setForm({ ...form, skeletal_mass_rate: e.target.value })} />
          <input type="number" placeholder="Muscle Mass (lb)" min="0" step="0.1" value={form.muscle_mass} onChange={e => setForm({ ...form, muscle_mass: e.target.value })} />
          <input type="number" placeholder="Bone Mass (lb)" min="0" step="0.1" value={form.bone_mass} onChange={e => setForm({ ...form, bone_mass: e.target.value })} />
          <input type="number" placeholder="Protein %" min="0" max="100" step="0.1" value={form.protein} onChange={e => setForm({ ...form, protein: e.target.value })} />
        </div>

        <div className="form-group">
          <h4>Additional Metrics</h4>
          <input type="number" placeholder="Basal Metabolism (kcal/day)" min="0" step="1" value={form.basal_metabolism} onChange={e => setForm({ ...form, basal_metabolism: e.target.value })} />
          <input type="number" placeholder="Body Age (years)" min="0" max="120" step="1" value={form.body_age} onChange={e => setForm({ ...form, body_age: e.target.value })} />
          <input type="number" placeholder="Waist-to-Hip Ratio" min="0" step="0.01" value={form.waist_hip_ratio} onChange={e => setForm({ ...form, waist_hip_ratio: e.target.value })} />
          <input type="number" placeholder="Body Fat Mass (lb)" min="0" step="0.1" value={form.body_fat_mass} onChange={e => setForm({ ...form, body_fat_mass: e.target.value })} />
          <input type="number" placeholder="Water Content (lb)" min="0" step="0.1" value={form.water_content} onChange={e => setForm({ ...form, water_content: e.target.value })} />
          <input type="number" placeholder="Protein Mass (lb)" min="0" step="0.1" value={form.protein_mass} onChange={e => setForm({ ...form, protein_mass: e.target.value })} />
        </div>

        <input type="text" placeholder="Notes" value={form.notes} onChange={e => setForm({ ...form, notes: e.target.value })} />
        <button type="submit">Save</button>
      </form>

      <h3 className="section-title">History</h3>
      <table className="table">
        <thead>
          <tr>
            <th>Date</th>
            <th>Weight</th>
            <th>BF %</th>
            <th>Muscle Rate</th>
            <th>Lean Body Mass</th>
            <th>Visceral Fat</th>
            <th>Notes</th>
            <th></th>
          </tr>
        </thead>
        <tbody>
          {readings.map((r, i) => {
            const prev = readings[i + 1]
            const weightDelta = prev ? (r.weight_lb - prev.weight_lb).toFixed(1) : ''
            const bfDelta = prev && r.body_fat_pct !== null && prev.body_fat_pct !== null
              ? (r.body_fat_pct - prev.body_fat_pct).toFixed(1)
              : ''
            return (
              <tr key={r.id}>
                <td>{fmtDate(r.date)}</td>
                <td>{r.weight_lb} lb {weightDelta && <span className={weightDelta < 0 ? 'good' : 'bad'}>({weightDelta > 0 ? '+' : ''}{weightDelta})</span>}</td>
                <td>{r.body_fat_pct !== null ? `${r.body_fat_pct}%` : '—'} {bfDelta && <span className={bfDelta < 0 ? 'good' : 'bad'}>({bfDelta > 0 ? '+' : ''}{bfDelta}%)</span>}</td>
                <td>{r.muscle_rate !== null ? `${r.muscle_rate}%` : '—'}</td>
                <td>{r.lean_body_mass ? `${r.lean_body_mass} lb` : '—'}</td>
                <td>{r.visceral_fat !== null ? r.visceral_fat : '—'}</td>
                <td>{r.notes}</td>
                <td><button className="btn-sm" onClick={() => remove(r.id)}>×</button></td>
              </tr>
            )
          })}
          {readings.length === 0 && <tr><td colSpan="8" className="muted">No readings yet</td></tr>}
        </tbody>
      </table>
    </div>
  )
}
