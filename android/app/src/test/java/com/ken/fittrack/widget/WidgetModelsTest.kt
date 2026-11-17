package com.ken.fittrack.widget

import com.ken.fittrack.model.WorkoutSet
import org.junit.Assert.*
import org.junit.Test

/**
 * Unit tests for the pure widget data-shaping logic. These run without any
 * network or Android framework — they exercise the reduce-to-unique-exercises
 * behavior that backs the Quick Log home-screen widget.
 */
class WidgetModelsTest {

    private fun w(
        exercise: String,
        weight: Double?,
        reps: Int?,
        sets: Int,
        date: String,
        createdAt: String
    ) = WorkoutSet(
        id = 0,
        date = date,
        exercise = exercise,
        weight = weight,
        reps = reps,
        sets = sets,
        notes = "",
        caloriesBurned = null,
        created_at = createdAt
    )

    @Test
    fun emptyInput_yieldsEmptyWidget() {
        assertEquals(0, WidgetModels.build(emptyList()).size)
    }

    @Test
    fun dedupesToOneMostRecentPerExercise() {
        val input = listOf(
            w("Barbell bench press", 185.0, 6, 4, "2026-11-10", "2026-11-10T09:00:00Z"),
            w("Barbell bench press", 195.0, 5, 4, "2026-11-15", "2026-11-15T09:00:00Z"),
            w("Overhead press", 95.0, 8, 3, "2026-11-14", "2026-11-14T09:00:00Z")
        )
        val out = WidgetModels.build(input)
        assertEquals(2, out.size)
        // Bench keeps the newer set (195 / 5 / 4).
        val bench = out.first { it.name == "Barbell bench press" }
        assertEquals(195.0, bench.lastWeight!!, 0.001)
        assertEquals(5, bench.lastReps)
        assertEquals(4, bench.lastSets)
        assertEquals("2026-11-15", bench.lastDate)
    }

    @Test
    fun bodyweightSetPreservesNulls() {
        val out = WidgetModels.build(listOf(w("Hanging leg raises", null, 12, 3, "2026-11-15", "2026-11-15T09:00:00Z")))
        val e = out.first()
        assertNull(e.lastWeight)
        assertEquals(12, e.lastReps)
        assertTrue(e.lastLabel().startsWith("bodyweight"))
    }

    @Test
    fun capsAtMaxEntriesMostRecentFirst() {
        val input = (1..8).map {
            w("Ex$it", 100.0 + it, 5, 1, "2026-11-0${it % 9 + 1}".ifEmpty { "2026-11-01" }, "2026-11-1$it T00:00:00Z")
        }
        val out = WidgetModels.build(input)
        assertEquals(WidgetModels.MAX_ENTRIES, out.size)
        // Most recently dated exercise should come first.
        assertTrue(out.first().lastDate >= out.last().lastDate)
    }

    @Test
    fun nullCreatedAtTolerated() {
        val a = WorkoutSet(1, "2026-11-15", "Squat", 200.0, 5, 3, "", null, null)
        val b = WorkoutSet(2, "2026-11-10", "Squat", 180.0, 8, 3, "", null, "2026-11-10T09:00:00Z")
        val out = WidgetModels.build(listOf(a, b))
        assertEquals(1, out.size)
        // a (later date, no created_at) should win.
        assertEquals(200.0, out.first().lastWeight!!, 0.001)
    }
}
