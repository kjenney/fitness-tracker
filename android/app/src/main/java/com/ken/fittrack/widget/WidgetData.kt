package com.ken.fittrack.widget

import com.ken.fittrack.Net
import com.ken.fittrack.model.WorkoutCreate
import kotlinx.coroutines.runBlocking
import java.time.LocalDate

/**
 * Blocking data access for widgets. RemoteViews collections and widget
 * broadcasts run on the main thread and cannot suspend, so every entry point
 * here is a synchronous call (coroutine run on a worker thread internally).
 */
object WidgetData {

    /** Refresh the shared cache from the backend. Returns true on success. */
    fun refresh(): Boolean {
        return runBlocking {
            val today = LocalDate.now().toString()
            val workouts = try {
                val r = Net.api.getWorkouts(null)
                if (r.isSuccessful) r.body() ?: emptyList() else emptyList()
            } catch (e: Exception) { emptyList() }

            val entries = WidgetModels.build(workouts)
            WidgetCache.exercises = entries
            WidgetCache.lastSet = entries.firstOrNull()
            WidgetCache.todaySets = try {
                val r = Net.api.getWorkouts(today)
                if (r.isSuccessful) r.body()?.size ?: 0 else 0
            } catch (e: Exception) { 0 }
            true
        }
    }

    /** Log one set. Returns null on success, an error message on failure. */
    fun logSet(exercise: String, weight: Double?, reps: Int?, sets: Int): String? {
        val body = WorkoutCreate(
            date = LocalDate.now().toString(),
            exercise = exercise,
            weight = weight,
            reps = reps,
            sets = sets,
            notes = ""
        )
        return runBlocking {
            try {
                val r = Net.api.createWorkout(body)
                if (r.isSuccessful) null else "HTTP ${r.code()}"
            } catch (e: Exception) { e.message }
        }
    }
}
