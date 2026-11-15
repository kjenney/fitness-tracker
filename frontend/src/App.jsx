import { useEffect, useState, useCallback } from 'react'
import { api, todayStr, fmtDate } from './api.js'


/* ─── Consolidated Workout Line Chart Component ─── */
function WorkoutLineChart({ workouts }) {
  // Sort workouts by date
  const sortedWorkouts = [...workouts].sort((a, b) => new Date(a.date) - new Date(b.date))

  // Group by exercise and create data series
  const exercises = {}
  sortedWorkouts.forEach(w => {
    if (!exercises[w.exercise]) {
      exercises[w.exercise] = []
    }
    exercises[w.exercise].push(w)
  })

  // Filter out exercises with only one data point for the chart
  // (single points can't form a line)
  const exerciseData = Object.entries(exercises).filter(([_, data]) => data.length >= 2)

  // If no exercises have multiple data points, show a single data point warning
  if (exerciseData.length === 0) {
    return (
      <div style={{ padding: '2rem', textAlign: 'center', color: 'var(--muted)' }}>
        <p>Need at least 2 data points per exercise to show a trend</p>
      </div>
    )
  }

  // Create a unified x-axis based on all data points
  const allDataPoints = sortedWorkouts.map((w, i) => ({ ...w, index: i }))
    .filter(w => w.weight !== null || w.reps !== null)

  if (allDataPoints.length < 2) return null

  // Determine which metric to plot (weight preferred if available)
  const hasWeight = allDataPoints.some(w => w.weight !== null)
  const metric = hasWeight ? 'weight' : 'reps'
  const values = allDataPoints.map(w => w[metric] || 0)
  const minVal = Math.min(...values)
  const maxVal = Math.max(...values)
  const range = maxVal - minVal || 1

  // SVG dimensions
  const width = 800
  const height = 300
  const padding = { top: 20, right: 20, bottom: 30, left: 50 }
  const chartWidth = width - padding.left - padding.right
  const chartHeight = height - padding.top - padding.bottom

  // Generate points for each exercise
  const pointsByExercise = exerciseData.map(([exercise, data], idx) => {
    // Map each data point to its index in allDataPoints
    const points = data
      .map(d => {
        const foundIndex = allDataPoints.findIndex(w => w.exercise === d.exercise && w.date === d.date && (w.weight === d.weight || w.reps === d.reps))
        return { ...d, chartIndex: foundIndex }
      })
      .filter(d => d.chartIndex >= 0)
      .map((d, i) => {
        const x = (d.chartIndex / (allDataPoints.length - 1)) * chartWidth + padding.left
        const y = chartHeight - ((d[metric] - minVal) / range) * chartHeight + padding.top
        return `${x},${y}`
      }).join(' ')

    return { exercise, points, color: idx }
  })

  // Generate x-axis labels
  const numLabels = Math.min(7, allDataPoints.length)
  const xLabels = []
  for (let i = 0; i < numLabels; i++) {
    const idx = Math.round((i / (numLabels - 1)) * (allDataPoints.length - 1))
    const date = allDataPoints[idx].date
    xLabels.push({ idx, date })
  }

  // Colors for different exercises
  const colors = ['#6366f1', '#8b5cf6', '#ec4899', '#f43f5e', '#06b6d4', '#10b981', '#f59e0b', '#3b82f6']

  return (
    <div style={{ overflowX: 'auto' }}>
      <svg width={width} height={height} className="workout-line-chart" viewBox={`0 0 ${width} ${height}`} preserveAspectRatio="none">
        {/* Grid lines */}
        <line x1={padding.left} y1={padding.top} x2={padding.left} y2={chartHeight + padding.top} stroke="var(--border)" strokeWidth="1" />
        <line x1={padding.left} y1={chartHeight + padding.top} x2={width - padding.right} y2={chartHeight + padding.top} stroke="var(--border)" strokeWidth="1" />

        {/* Y-axis labels (metric values) */}
        {[0, 0.25, 0.5, 0.75, 1].map((p, i) => {
          const val = minVal + p * range
          const y = chartHeight - p * chartHeight + padding.top
          return (
            <text key={i} x={padding.left - 5} y={y + 4} fontSize="10" textAnchor="end" fill="var(--muted)">
              {Math.round(val)}
            </text>
          )
        })}

        {/* X-axis labels (dates) */}
        {xLabels.map((label, i) => {
          const x = (label.idx / (allDataPoints.length - 1)) * chartWidth + padding.left
          return (
            <text key={i} x={x} y={height - 5} fontSize="10" textAnchor="middle" fill="var(--muted)">
              {new Date(label.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
            </text>
          )
        })}

        {/* Data series lines */}
        {pointsByExercise.map((series, idx) => (
          <polyline
            key={series.exercise}
            fill="none"
            stroke={colors[idx % colors.length]}
            strokeWidth="2"
            points={series.points}
            strokeLinecap="round"
            strokeLinejoin="round"
            className="workout-series"
          />
        ))}

        {/* Legend */}
        <g transform={`translate(${padding.left}, ${padding.top - 10})`}>
          {pointsByExercise.map((series, idx) => (
            <g key={series.exercise} transform={`translate(${idx * 120}, 0)`}>
              <rect x="0" y="-5" width="12" height="12" fill={colors[idx % colors.length]} rx="2" />
              <text x="16" y="6" fontSize="11" fill="var(--text)">{series.exercise}</text>
            </g>
          ))}
        </g>
      </svg>
    </div>
  )
}


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
  const [allWorkouts, setAllWorkouts] = useState([])
  const [error, setError] = useState('')

  const refresh = useCallback(() => {
    api.summary().then(setSummary).catch(e => setError(e.message))
  }, [])

  const refreshWorkouts = useCallback(() => {
    api.allWorkouts().then(setAllWorkouts).catch(() => {})
  }, [])

  useEffect(() => { refresh() }, [refresh])
  useEffect(() => { refreshWorkouts() }, [refreshWorkouts])

  return (
    <div className="app">
      <header className="header">
        <h1>Ken's Fitness Tracker</h1>
        <nav className="tabs">
          <button className={tab === 'dashboard' ? 'active' : ''} onClick={() => setTab('dashboard')}>Dashboard</button>
          <button className={tab === 'workout' ? 'active' : ''} onClick={() => setTab('workout')}>Workout</button>
          <button className={tab === 'routine' ? 'active' : ''} onClick={() => setTab('routine')}>Routine</button>
          <button className={tab === 'progress' ? 'active' : ''} onClick={() => setTab('progress')}>Progress</button>
          <button className={tab === 'exercises' ? 'active' : ''} onClick={() => setTab('exercises')}>Exercises</button>
          <button className={tab === 'food' ? 'active' : ''} onClick={() => setTab('food')}>Food</button>
          <button className={tab === 'bodycomp' ? 'active' : ''} onClick={() => setTab('bodycomp')}>Body Comp</button>
        </nav>
      </header>
      {error && <div className="error">{error} <button onClick={() => setError('')}>×</button></div>}
      <main>
        {tab === 'dashboard' && <Dashboard summary={summary} allWorkouts={allWorkouts} />}
        {tab === 'workout' && <WorkoutTab onChanged={refresh} />}
        {tab === 'routine' && <RoutineTab />}
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
function Dashboard({ summary, allWorkouts }) {
  if (!summary) return <p className="muted">Loading…</p>
  const { today, calories_7d, workout_calories_7d, bodycomp_latest, weight_delta, bf_delta, workouts_7d, exercise_progress } = summary
  const pct = Math.min(100, Math.round((today.calories / today.calorie_target) * 100))
  const workoutCalsToday = today.workout_calories || 0

  return (
    <div className="grid">
      <div className="card">
        <h3>Today's Calories</h3>
        <div className="big">{today.calories.toLocaleString()} <span className="unit">/ {today.calorie_target.toLocaleString()} kcal</span></div>
        <div className="progress-bar"><div className="progress-fill" style={{ width: pct + '%' }} /></div>
        <p className="muted">{pct}% of target · {today.protein_g}g protein (target {today.protein_target}g)</p>
      </div>

      <div className="card">
        <h3>Workout Calories</h3>
        <div className="big">{workoutCalsToday.toLocaleString()} <span className="unit">kcal</span></div>
        <p className="muted">Calories burned from exercise</p>
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
        <h3>7-Day Calories</h3>
        <p className="muted" style={{ marginBottom: '0.5rem' }}>Food intake (top) + Workout burn (bottom)</p>
        <div className="bar-chart" style={{ height: '140px' }}>
          {calories_7d.map((d, i) => {
            const intakeH = Math.max(4, Math.min(100, (d.calories / (summary.today.calorie_target * 1.2)) * 100))
            const workoutCals = workout_calories_7d?.[i]?.calories_burned || 0
            const burnH = Math.max(4, Math.min(50, (workoutCals / 500) * 100)) // Scale to 500 max
            return (
              <div key={d.date} className="bar-col" style={{ height: '100%', justifyContent: 'flex-end' }}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
                  <div className="bar" title={`${d.date}: ${d.calories} kcal food`} style={{ height: intakeH + '%' }} />
                  <div className="bar" title={`${d.date}: ${workoutCals} kcal burned`} style={{ height: burnH + '%', background: '#34d399' }} />
                </div>
                <span>{d.label}</span>
              </div>
            )
          })}
        </div>
        <p className="muted" style={{ marginTop: '0.5rem', fontSize: '0.75rem' }}>
          <span style={{ color: '#6366f1' }}>Blue: Food</span> · <span style={{ color: '#34d399' }}>Green: Workout burn</span>
        </p>
      </div>

      <div className="card wide">
        <h3>Workouts Over Time</h3>
        <p className="muted" style={{ marginBottom: '1rem' }}>Track all exercises by date</p>
        {allWorkouts && allWorkouts.length > 0 ? (
          <WorkoutLineChart workouts={allWorkouts} />
        ) : (
          <p className="muted">No workout data yet. Log some workouts to see your progress!</p>
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
  const [showCreateRoutineModal, setShowCreateRoutineModal] = useState(false)
  const [routineName, setRoutineName] = useState('')

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

  const createRoutineFromWorkout = () => {
    const name = routineName.trim() || `Routine - ${viewDate}`
    api.routines.createFromWorkout({ date: viewDate, name: name }).then(() => {
      setRoutineName('')
      setShowCreateRoutineModal(false)
      onChanged()
      alert(`Created routine "${name}" from workouts on ${fmtDate(viewDate)}`)
    }).catch(err => {
      alert('Error: ' + err.message)
    })
  }

  return (
    <div>
      <div className="form">
        <span className="muted">View day</span>
        <input type="date" value={viewDate} max={todayStr()} onChange={e => e.target.value && setViewDate(e.target.value)} />
        {entries.length > 0 && (
          <button onClick={() => setShowCreateRoutineModal(true)}>Create Routine</button>
        )}
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

      {/* Daily workout calories total */}
      {entries.length > 0 && (
        <div className="card" style={{ marginBottom: '1rem' }}>
          <p className="muted" style={{ marginBottom: '0.25rem' }}>Total Calories Burned</p>
          <div className="big" style={{ fontSize: '1.4rem' }}>
            {entries.reduce((sum, en) => sum + (en.calories_burned || 0), 0).toLocaleString()} <span className="unit">kcal</span>
          </div>
        </div>
      )}

      <h3 className="section-title">Logs for {fmtDate(viewDate)}</h3>
      <table className="table">
        <thead><tr><th>Exercise</th><th>Weight</th><th>Reps</th><th>Sets</th><th>Calories</th><th>Notes</th><th></th></tr></thead>
        <tbody>
          {entries.map(en => (
            <tr key={en.id}>
              <td>{en.exercise}</td>
              <td>{en.weight ? `${en.weight} lb` : 'BW'}</td>
              <td>{en.reps ?? '—'}</td>
              <td>{en.sets}</td>
              <td>{en.calories_burned ? Math.round(en.calories_burned).toLocaleString() : '—'}</td>
              <td>{en.notes}</td>
              <td><button className="btn-sm" onClick={() => remove(en.id)}>×</button></td>
            </tr>
          ))}
          {entries.length === 0 && <tr><td colSpan="7" className="muted">No entries for this date</td></tr>}
        </tbody>
      </table>

      {/* Create Routine Modal */}
      {showCreateRoutineModal && (
        <div style={{
          position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
          background: 'rgba(0,0,0,0.7)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000
        }}>
          <div style={{
            background: 'var(--surface)', padding: '1.5rem', borderRadius: '8px',
            width: '90%', maxWidth: '400px', maxHeight: '90vh', overflow: 'auto'
          }}>
            <h2>Create Routine</h2>
            <p className="muted" style={{ marginBottom: '1rem' }}>
              Create a routine from the {entries.length} exercise{entries.length !== 1 && 's'} logged on {fmtDate(viewDate)}.
            </p>
            <form className="form" onSubmit={createRoutineFromWorkout}>
              <input
                type="text"
                placeholder="Routine name"
                value={routineName}
                onChange={e => setRoutineName(e.target.value)}
                required
                style={{ width: '100%', marginBottom: '1rem' }}
              />
              <div className="form" style={{ justifyContent: 'flex-end', gap: '0.5rem' }}>
                <button type="button" onClick={() => setShowCreateRoutineModal(false)}>Cancel</button>
                <button type="submit">Create Routine</button>
              </div>
            </form>
          </div>
        </div>
      )}
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

/* ─── Routine Tab ─── */
function RoutineTab() {
  const [routines, setRoutines] = useState([])
  const [loading, setLoading] = useState(true)
  const [form, setForm] = useState({ name: '', exercises: [{ exercise: '', weight: '', reps: '', sets: '1', notes: '' }] })
  const [editing, setEditing] = useState(null)
  const [editName, setEditName] = useState('')
  const [editExercises, setEditExercises] = useState([])
  const [showAddModal, setShowAddModal] = useState(false)
  const [showEditModal, setShowEditModal] = useState(false)

  useEffect(() => {
    loadRoutines()
  }, [])

  const loadRoutines = () => {
    api.routines.list().then(data => {
      setRoutines(data)
      setLoading(false)
    }).catch(() => {
      setLoading(false)
    })
  }

  const addExerciseRow = () => {
    setForm({ ...form, exercises: [...form.exercises, { exercise: '', weight: '', reps: '', sets: '1', notes: '' }] })
  }

  const removeExerciseRow = (index) => {
    const newExercises = [...form.exercises]
    newExercises.splice(index, 1)
    setForm({ ...form, exercises: newExercises })
  }

  const handleExerciseChange = (index, value) => {
    const newExercises = [...form.exercises]
    newExercises[index].exercise = value
    setForm({ ...form, exercises: newExercises })
  }

  const handleWeightChange = (index, value) => {
    const newExercises = [...form.exercises]
    newExercises[index].weight = value
    setForm({ ...form, exercises: newExercises })
  }

  const handleRepsChange = (index, value) => {
    const newExercises = [...form.exercises]
    newExercises[index].reps = value
    setForm({ ...form, exercises: newExercises })
  }

  const handleSetsChange = (index, value) => {
    const newExercises = [...form.exercises]
    newExercises[index].sets = value
    setForm({ ...form, exercises: newExercises })
  }

  const handleNotesChange = (index, value) => {
    const newExercises = [...form.exercises]
    newExercises[index].notes = value
    setForm({ ...form, exercises: newExercises })
  }

  const handleAddSubmit = (e) => {
    e.preventDefault()
    const trimmedName = form.name.trim()
    if (!trimmedName) return

    const exercisesData = form.exercises
      .filter(ex => ex.exercise.trim())
      .map(ex => ({
        exercise: ex.exercise,
        weight: ex.weight ? +ex.weight : null,
        reps: ex.reps ? +ex.reps : null,
        sets: ex.sets ? +ex.sets : 1,
        notes: ex.notes.trim(),
      }))

    if (exercisesData.length === 0) {
      alert('Please add at least one exercise')
      return
    }

    api.routines.create({ name: trimmedName, exercises_write: exercisesData }).then(() => {
      setForm({ name: '', exercises: [{ exercise: '', weight: '', reps: '', sets: '1', notes: '' }] })
      setShowAddModal(false)
      loadRoutines()
    })
  }

  const handleEditSubmit = (id) => {
    const trimmedName = editName.trim()
    if (!trimmedName) return

    const exercisesData = editExercises
      .filter(ex => ex.exercise.trim())
      .map(ex => ({
        exercise: ex.exercise,
        weight: ex.weight ? +ex.weight : null,
        reps: ex.reps ? +ex.reps : null,
        sets: ex.sets ? +ex.sets : 1,
        notes: ex.notes.trim(),
      }))

    if (exercisesData.length === 0) {
      alert('Please add at least one exercise')
      return
    }

    api.routines.update(id, { name: trimmedName, exercises_write: exercisesData }).then(() => {
      setEditing(null)
      setEditName('')
      setEditExercises([])
      setShowEditModal(false)
      loadRoutines()
    })
  }

  const removeRoutine = (id) => {
    if (confirm('Are you sure you want to delete this routine?')) {
      api.routines.remove(id).then(loadRoutines)
    }
  }

  const addToDay = (routine) => {
    const date = prompt('Enter date to add routine (YYYY-MM-DD):', todayStr())
    if (date) {
      api.routines.addToDay(routine.id, date).then(() => {
        loadRoutines()
      }).catch(err => {
        alert('Error: ' + err.message)
      })
    }
  }

  return (
    <div>
      <div className="form">
        <button onClick={() => setShowAddModal(true)}>+ Create Routine</button>
      </div>

      {loading ? (
        <p className="muted">Loading routines…</p>
      ) : routines.length === 0 ? (
        <div className="card">
          <p className="muted">No routines yet. Create one to get started!</p>
        </div>
      ) : (
        <div className="grid">
          {routines.map(routine => (
            <div key={routine.id} className="card">
              <div className="exercise-header">
                <h3>{routine.name}</h3>
                <span className="muted">{routine.exercises?.length || 0} exercise{routine.exercises?.length !== 1 && 's'}</span>
              </div>
              {routine.exercises && routine.exercises.length > 0 && (
                <ul style={{ marginBottom: '1rem' }}>
                  {routine.exercises.map(ex => (
                    <li key={ex.id} style={{ marginBottom: '0.25rem' }}>
                      {ex.exercise_name || ex.exercise}
                      {ex.weight ? ` (${ex.weight} lb)` : ''}
                      {ex.reps ? ` x ${ex.reps}` : ''}
                      {ex.sets ? ` x ${ex.sets} sets` : ''}
                      {ex.notes ? <span className="muted"> - {ex.notes}</span> : ''}
                    </li>
                  ))}
                </ul>
              )}
              <div className="form">
                <button onClick={() => addToDay(routine)}>Add to Day</button>
                <button className="neutral" onClick={() => {
                  setEditing(routine)
                  setEditName(routine.name)
                  setEditExercises(routine.exercises || [])
                  setShowEditModal(true)
                }}>Edit</button>
                <button className="bad" onClick={() => removeRoutine(routine.id)}>Delete</button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Add Routine Modal */}
      {showAddModal && (
        <div style={{
          position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
          background: 'rgba(0,0,0,0.7)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000
        }}>
          <div style={{
            background: 'var(--surface)', padding: '1.5rem', borderRadius: '8px',
            width: '90%', maxWidth: '500px', maxHeight: '90vh', overflow: 'auto'
          }}>
            <h2>Create Routine</h2>
            <form className="form" onSubmit={handleAddSubmit}>
              <input
                type="text"
                placeholder="Routine name"
                value={form.name}
                onChange={e => setForm({ ...form, name: e.target.value })}
                required
                style={{ width: '100%', marginBottom: '1rem' }}
              />
              <div style={{ marginBottom: '1rem' }}>
                <h4>Exercises</h4>
                {form.exercises.map((ex, index) => (
                  <div key={index} style={{ border: '1px solid var(--border)', borderRadius: '6px', padding: '0.75rem', marginBottom: '0.5rem' }}>
                    <select
                      value={ex.exercise}
                      onChange={e => handleExerciseChange(index, e.target.value)}
                      required
                      style={{ width: '100%', marginBottom: '0.5rem' }}
                    >
                      <option value="">Select exercise…</option>
                      <ExerciseOptions />
                    </select>
                    <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                      <input
                        type="number"
                        placeholder="Weight (lb)"
                        min="0"
                        step="5"
                        value={ex.weight}
                        onChange={e => handleWeightChange(index, e.target.value)}
                        style={{ width: '100px' }}
                      />
                      <input
                        type="number"
                        placeholder="Reps"
                        min="0"
                        value={ex.reps}
                        onChange={e => handleRepsChange(index, e.target.value)}
                        style={{ width: '80px' }}
                      />
                      <input
                        type="number"
                        placeholder="Sets"
                        min="1"
                        value={ex.sets}
                        onChange={e => handleSetsChange(index, e.target.value)}
                        style={{ width: '80px' }}
                      />
                      <input
                        type="text"
                        placeholder="Notes"
                        value={ex.notes}
                        onChange={e => handleNotesChange(index, e.target.value)}
                        style={{ flex: 1 }}
                      />
                      {form.exercises.length > 1 && (
                        <button type="button" className="bad" onClick={() => removeExerciseRow(index)}>×</button>
                      )}
                    </div>
                  </div>
                ))}
                <button type="button" onClick={addExerciseRow}>+ Add Exercise</button>
              </div>
              <div className="form">
                <button type="submit">Create Routine</button>
                <button type="button" onClick={() => setShowAddModal(false)}>Cancel</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit Routine Modal */}
      {showEditModal && editing && (
        <div style={{
          position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
          background: 'rgba(0,0,0,0.7)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000
        }}>
          <div style={{
            background: 'var(--surface)', padding: '1.5rem', borderRadius: '8px',
            width: '90%', maxWidth: '500px', maxHeight: '90vh', overflow: 'auto'
          }}>
            <h2>Edit Routine</h2>
            <form className="form" onSubmit={() => handleEditSubmit(editing.id)}>
              <input
                type="text"
                placeholder="Routine name"
                value={editName}
                onChange={e => setEditName(e.target.value)}
                required
                style={{ width: '100%', marginBottom: '1rem' }}
              />
              <div style={{ marginBottom: '1rem' }}>
                <h4>Exercises</h4>
                {editExercises.map((ex, index) => (
                  <div key={ex.id || index} style={{ border: '1px solid var(--border)', borderRadius: '6px', padding: '0.75rem', marginBottom: '0.5rem' }}>
                    <select
                      value={ex.exercise_name || ex.exercise || ''}
                      onChange={e => {
                        const newExercises = [...editExercises]
                        newExercises[index].exercise = e.target.value
                        setEditExercises(newExercises)
                      }}
                      required
                      style={{ width: '100%', marginBottom: '0.5rem' }}
                    >
                      <option value="">Select exercise…</option>
                      <ExerciseOptions />
                    </select>
                    <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                      <input
                        type="number"
                        placeholder="Weight (lb)"
                        min="0"
                        step="5"
                        value={ex.weight || ''}
                        onChange={e => {
                          const newExercises = [...editExercises]
                          newExercises[index].weight = e.target.value
                          setEditExercises(newExercises)
                        }}
                        style={{ width: '100px' }}
                      />
                      <input
                        type="number"
                        placeholder="Reps"
                        min="0"
                        value={ex.reps || ''}
                        onChange={e => {
                          const newExercises = [...editExercises]
                          newExercises[index].reps = e.target.value
                          setEditExercises(newExercises)
                        }}
                        style={{ width: '80px' }}
                      />
                      <input
                        type="number"
                        placeholder="Sets"
                        min="1"
                        value={ex.sets || ''}
                        onChange={e => {
                          const newExercises = [...editExercises]
                          newExercises[index].sets = e.target.value
                          setEditExercises(newExercises)
                        }}
                        style={{ width: '80px' }}
                      />
                      <input
                        type="text"
                        placeholder="Notes"
                        value={ex.notes || ''}
                        onChange={e => {
                          const newExercises = [...editExercises]
                          newExercises[index].notes = e.target.value
                          setEditExercises(newExercises)
                        }}
                        style={{ flex: 1 }}
                      />
                      {editExercises.length > 1 && (
                        <button type="button" className="bad" onClick={() => {
                          const newExercises = [...editExercises]
                          newExercises.splice(index, 1)
                          setEditExercises(newExercises)
                        }}>×</button>
                      )}
                    </div>
                  </div>
                ))}
                <button type="button" onClick={() => setEditExercises([...editExercises, { exercise: '', weight: '', reps: '', sets: '1', notes: '' }])}>+ Add Exercise</button>
              </div>
              <div className="form">
                <button type="submit">Save Changes</button>
                <button type="button" onClick={() => setShowEditModal(false)}>Cancel</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}

function ExerciseOptions() {
  const [exercises, setExercises] = useState([])
  const [error, setError] = useState('')

  useEffect(() => {
    api.exercises.list().then(setExercises).catch(() => {
      setError('Failed to load exercises')
    })
  }, [])

  if (error) return <option value="">{error}</option>

  return exercises.map(ex => (
    <option key={ex.id} value={ex.name}>{ex.name}</option>
  ))
}
