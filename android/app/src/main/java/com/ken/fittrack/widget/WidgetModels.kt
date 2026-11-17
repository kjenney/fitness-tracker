package com.ken.fittrack.widget

import com.ken.fittrack.model.WorkoutSet

/** One widget row: an exercise plus the details of how it was most recently logged. */
data class WidgetEntry(
    val name: String,
    val lastWeight: Double?,
    val lastReps: Int?,
    val lastSets: Int,
    val lastDate: String
) {
    fun lastLabel(): String {
        val w = if (lastWeight != null) "${lastWeight} lb" else "bodyweight"
        val r = lastReps?.let { " x $it" } ?: ""
        return "$w${r} (x${lastSets} sets)"
    }
}

object WidgetModels {
    const val MAX_ENTRIES = 5

    /**
     * Reduce workout history to at most MAX_ENTRIES unique exercises, most
     * recently used first, each carrying its most recent set details.
     * Pure function so it is unit-testable without a network.
     */
    fun build(workouts: List<WorkoutSet>): List<WidgetEntry> {
        val best = HashMap<String, WorkoutSet>()
        for (w in workouts) {
            val cur = best[w.exercise]
            if (cur == null || isMoreRecent(w, cur)) best[w.exercise] = w
        }
        return best.values
            .sortedWith(compareByDescending<WorkoutSet> { it.date }.thenBy { it.exercise })
            .take(MAX_ENTRIES)
            .map { WidgetEntry(it.exercise, it.weight, it.reps, it.sets, it.date) }
    }

    /**
     * Recency = when the workout happened (date, ISO so string compare works),
     * with created_at only breaking same-date ties. This matches the backend's
     * own `-date` ordering and tolerates a null created_at.
     */
    private fun isMoreRecent(a: WorkoutSet, b: WorkoutSet): Boolean {
        if (a.date != b.date) return a.date > b.date
        return (a.created_at ?: "") > (b.created_at ?: "")
    }
}
