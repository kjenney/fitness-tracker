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
          <button className={tab === 'food' ? 'active' : ''} onClick={() => setTab('food')}>Food</button>
          <button className={tab === 'bodycomp' ? 'active' : ''} onClick={() => setTab('bodycomp')}>Body Comp</button>
          <button className={tab === 'routines' ? 'active' : ''} onClick={() => setTab('routines')}>Routines</button>
        </nav>
      </header>
      {error && <div className="error">{error} <button onClick={() => setError('')}>×</button></div>}
      <main>
        {tab === 'dashboard' && <Dashboard summary={summary} />}
        {tab === 'workout' && <WorkoutTab onChanged={refresh} setTab={setTab} />}
        {tab === 'food' && <FoodTab summary={summary} onChanged={refresh} />}
        {tab === 'bodycomp' && <BodyCompTab />}
        {tab === 'routines' && <RoutinesTab />}
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
function WorkoutTab({ onChanged, setTab }) {
  const [exercises, setExercises] = useState([])
  const [entries, setEntries] = useState([])
  const [form, setForm] = useState({ date: todayStr(), exercise: '', weight: '', reps: '', sets: '1', notes: '' })
  const [editing, setEditing] = useState(null) // { id, data } of the row being edited, or null

  useEffect(() => {
    api.exercises().then(setExercises).catch(() => {})
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

  const startEdit = (en) => {
    setEditing({
      id: en.id,
      data: {
        date: en.date,
        exercise: en.exercise,
        weight: en.weight ?? '',
        reps: en.reps ?? '',
        sets: en.sets,
        notes: en.notes || '',
      },
    })
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  const setEditField = (field, value) => setEditing((ed) => ({ ...ed, data: { ...ed.data, [field]: value } }))

  const saveEdit = (e) => {
    e.preventDefault()
    const d = editing.data
    const payload = {
      date: d.date,
      exercise: d.exercise,
      weight: d.weight === '' || d.weight === null ? null : +d.weight,
      reps: d.reps === '' || d.reps === null ? null : +d.reps,
      sets: d.sets ? +d.sets : 1,
      notes: d.notes || '',
    }
    api.workouts.update(editing.id, payload).then(() => {
      setEditing(null)
      loadEntries()
      onChanged()
    })
  }

  const cancelEdit = () => setEditing(null)

  const remove = (id) => {
    if (editing?.id === id) setEditing(null)
    api.workouts.remove(id).then(() => { loadEntries(); onChanged() })
  }

  const [routineModalOpen, setRoutineModalOpen] = useState(false)
  const [routineName, setRoutineName] = useState('')

  const handleCreateRoutine = () => {
    setRoutineName(form.date + ' Workout')
    setRoutineModalOpen(true)
  }

  const confirmCreateRoutine = () => {
    if (!routineName.trim()) return
    api.workoutsToRoutine({ name: routineName, date: form.date }).then(routine => {
      setRoutineModalOpen(false)
      setRoutineName('')
      // Switch to routines tab
      setTab('routines')
    }).catch(e => {
      alert('Failed to create routine: ' + e.message)
    })
  }

  return (
    <div>
      <h2>Log a Set</h2>
      <form className="form" onSubmit={submit}>
        <div className="workout-date-row">
          <input type="date" value={form.date} onChange={e => setForm({ ...form, date: e.target.value })} />
          <button type="button" onClick={handleCreateRoutine}>Create Routine</button>
        </div>
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

      {routineModalOpen && (
        <div className="modal">
          <h3>Create Routine</h3>
          <p>Turn today's workout into a reusable routine.</p>
          <input
            type="text"
            placeholder="Routine name"
            value={routineName}
            onChange={e => setRoutineName(e.target.value)}
            autoFocus
          />
          <div className="modal-actions">
            <button onClick={confirmCreateRoutine}>Create</button>
            <button onClick={() => setRoutineModalOpen(false)}>Cancel</button>
          </div>
        </div>
      )}

      <h3 className="section-title">Logs for {fmtDate(form.date)}</h3>
      <table className="table">
        <thead><tr><th>Exercise</th><th>Weight</th><th>Reps</th><th>Sets</th><th>Notes</th><th></th></tr></thead>
        <tbody>
          {entries.map(en => {
            const isEditing = editing?.id === en.id
            return (
              <tr key={en.id} className={isEditing ? 'editing' : ''}>
                {isEditing ? (
                  <td colSpan="6">
                    <form className="row-edit-form" onSubmit={saveEdit}>
                      <select value={editing.data.exercise} onChange={e => setEditField('exercise', e.target.value)} required>
                        <option value="">Exercise…</option>
                        {exercises.map(ex => <option key={ex.id} value={ex.name}>{ex.name}</option>)}
                      </select>
                      <input type="number" placeholder="lb" min="0" step="5" value={editing.data.weight} onChange={e => setEditField('weight', e.target.value)} />
                      <input type="number" placeholder="Reps" min="0" value={editing.data.reps} onChange={e => setEditField('reps', e.target.value)} />
                      <input type="number" placeholder="Sets" min="1" value={editing.data.sets} onChange={e => setEditField('sets', e.target.value)} />
                      <input type="text" placeholder="Notes" value={editing.data.notes} onChange={e => setEditField('notes', e.target.value)} />
                      <div className="row-edit-actions">
                        <button type="submit" className="btn-sm save">Save</button>
                        <button type="button" className="btn-sm" onClick={cancelEdit}>Cancel</button>
                      </div>
                    </form>
                  </td>
                ) : (
                  <>
                    <td>{en.exercise}</td>
                    <td>{en.weight ? `${en.weight} lb` : 'BW'}</td>
                    <td>{en.reps ?? '—'}</td>
                    <td>{en.sets}</td>
                    <td>{en.notes}</td>
                    <td className="row-actions">
                      <button className="btn-sm edit" title="Edit" onClick={() => startEdit(en)}>Edit</button>
                      <button className="btn-sm" title="Delete" onClick={() => remove(en.id)}>×</button>
                    </td>
                  </>
                )}
              </tr>
            )
          })}
          {entries.length === 0 && <tr><td colSpan="6" className="muted">No entries for this date</td></tr>}
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

/* ─── Routines Tab ─── */
function RoutinesTab() {
  const [routines, setRoutines] = useState([])
  const [exercises, setExercises] = useState([])
  const [form, setForm] = useState({ name: '', exercises: [] })
  const [editing, setEditing] = useState(null)
  const [showExerciseModal, setShowExerciseModal] = useState(false)
  const [selectedExercises, setSelectedExercises] = useState([])

  useEffect(() => {
    api.routines.list().then(setRoutines).catch(() => {})
    api.exercises().then(setExercises).catch(() => {})
  }, [])

  const openCreate = () => {
    setForm({ name: '', exercises: [] })
    setSelectedExercises([])
    setEditing(null)
    setShowExerciseModal(false)
  }

  const openEdit = (routine) => {
    setForm({ name: routine.name, exercises: routine.exercises || [] })
    setSelectedExercises(routine.exercises || [])
    setEditing(routine)
    setShowExerciseModal(false)
  }

  const addExerciseToRoutine = (exerciseId) => {
    const ex = exercises.find(e => e.id === exerciseId)
    if (ex && !selectedExercises.find(se => se.exercise === exerciseId)) {
      setSelectedExercises([...selectedExercises, {
        id: null,
        exercise: exerciseId,
        weight: '',
        reps: '',
        sets: '1',
        notes: ''
      }])
    }
  }

  const removeExerciseFromRoutine = (index) => {
    setSelectedExercises(selectedExercises.filter((_, i) => i !== index))
  }

  const updateExercise_field = (index, field, value) => {
    const newExercises = [...selectedExercises]
    newExercises[index] = { ...newExercises[index], [field]: value }
    setSelectedExercises(newExercises)
  }

  const submit = (e) => {
    e.preventDefault()
    const payload = {
      name: form.name,
      exercises: selectedExercises.map(ex => ({
        id: ex.id,
        exercise: ex.exercise,
        weight: ex.weight ? +ex.weight : null,
        reps: ex.reps ? +ex.reps : null,
        sets: ex.sets ? +ex.sets : 1,
        notes: ex.notes || ''
      }))
    }
    if (editing) {
      api.routines.update(editing.id, payload).then(() => {
        setEditing(null)
        setForm({ name: '', exercises: [] })
        setSelectedExercises([])
        api.routines.list().then(setRoutines)
      })
    } else {
      api.routines.create(payload).then(() => {
        setForm({ name: '', exercises: [] })
        setSelectedExercises([])
        api.routines.list().then(setRoutines)
      })
    }
  }

  const remove = (id) => {
    api.routines.remove(id).then(() => api.routines.list().then(setRoutines))
  }

  return (
    <div>
      <h2>Routines</h2>
      <form className="form" onSubmit={submit}>
        <input type="text" placeholder="Routine name" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} required />

        <div className="routine-exercises">
          <h4>Exercises</h4>
          {selectedExercises.map((ex, idx) => (
            <div key={idx} className="routine-exercise-row">
              <select value={ex.exercise || ''} onChange={e => updateExercise_field(idx, 'exercise', e.target.value)} required>
                <option value="">Select exercise...</option>
                {exercises.map(ex => <option key={ex.id} value={ex.id}>{ex.name}</option>)}
              </select>
              <input type="number" placeholder="Weight (lb)" min="0" step="5" value={ex.weight || ''} onChange={e => updateExercise_field(idx, 'weight', e.target.value)} />
              <input type="number" placeholder="Reps" min="0" value={ex.reps || ''} onChange={e => updateExercise_field(idx, 'reps', e.target.value)} />
              <input type="number" placeholder="Sets" min="1" value={ex.sets || '1'} onChange={e => updateExercise_field(idx, 'sets', e.target.value)} />
              <input type="text" placeholder="Notes" value={ex.notes || ''} onChange={e => updateExercise_field(idx, 'notes', e.target.value)} />
              <button type="button" className="btn-sm" onClick={() => removeExerciseFromRoutine(idx)}>×</button>
            </div>
          ))}
          <button type="button" onClick={() => setShowExerciseModal(true)}>Add Exercise</button>
        </div>

        <button type="submit">{editing ? 'Save' : 'Create'} Routine</button>
      </form>

      {showExerciseModal && (
        <div className="modal">
          <h3>Add Exercise</h3>
          <select onChange={e => { addExerciseToRoutine(e.target.value); e.target.value = ''; }}>
            <option value="">Select exercise...</option>
            {exercises.map(ex => <option key={ex.id} value={ex.id}>{ex.name}</option>)}
          </select>
          <button onClick={() => setShowExerciseModal(false)}>Close</button>
        </div>
      )}

      <h3 className="section-title">Saved Routines</h3>
      <table className="table">
        <thead><tr><th>Name</th><th>Exercises</th><th></th></tr></thead>
        <tbody>
          {routines.map(r => (
            <tr key={r.id}>
              <td>{r.name}</td>
              <td>{r.exercises ? r.exercises.map(e => e.exercise_name).join(', ') : 'No exercises'}</td>
              <td className="row-actions">
                <button className="btn-sm edit" onClick={() => openEdit(r)}>Edit</button>
                <button className="btn-sm" onClick={() => remove(r.id)}>×</button>
              </td>
            </tr>
          ))}
          {routines.length === 0 && <tr><td colSpan="3" className="muted">No routines yet</td></tr>}
        </tbody>
      </table>
    </div>
  )
}
