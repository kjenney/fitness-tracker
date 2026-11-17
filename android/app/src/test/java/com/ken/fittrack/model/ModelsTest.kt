package com.ken.fittrack.model

import com.google.gson.GsonBuilder
import com.google.gson.JsonParser
import org.junit.Assert.*
import org.junit.Test

class ModelsTest {

    private val gson = GsonBuilder().create()

    @Test
    fun workoutCreate_serializesCorrectly() {
        val body = WorkoutCreate("2026-11-16", "Bench press", 135.0, 10, 3, "felt good")
        val json = gson.toJson(body)
        val obj = JsonParser.parseString(json).asJsonObject
        assertEquals("2026-11-16", obj.get("date").asString)
        assertEquals("Bench press", obj.get("exercise").asString)
        assertEquals(135.0, obj.get("weight").asDouble, 0.001)
        assertEquals(10, obj.get("reps").asInt)
        assertEquals(3, obj.get("sets").asInt)
        assertEquals("felt good", obj.get("notes").asString)
    }

    @Test
    fun workoutCreate_nullFieldsOmitCorrectly() {
        val body = WorkoutCreate("2026-11-16", "Push ups", null, null, 2, "")
        val json = gson.toJson(body)
        val obj = JsonParser.parseString(json).asJsonObject
        // Gson omits null fields by default. Django DRF treats a missing
        // nullable field as null, so the payload is still valid.
        assertTrue(!obj.has("weight"))
        assertTrue(!obj.has("reps"))
        assertEquals("2026-11-16", obj.get("date").asString)
        assertEquals("Push ups", obj.get("exercise").asString)
        assertEquals(2, obj.get("sets").asInt)
    }

    @Test
    fun foodCreate_serializesCorrectly() {
        val body = FoodCreate("2026-11-16", "Chicken breast", 220.0, "lunch", 45.0, "")
        val json = gson.toJson(body)
        val obj = JsonParser.parseString(json).asJsonObject
        assertEquals("2026-11-16", obj.get("date").asString)
        assertEquals("Chicken breast", obj.get("name").asString)
        assertEquals(220.0, obj.get("calories").asDouble, 0.001)
        assertEquals("lunch", obj.get("meal_slot").asString)
        assertEquals(45.0, obj.get("protein_g").asDouble, 0.001)
    }

    @Test
    fun bodyCompCreate_serializesCorrectly() {
        val body = BodyCompCreate("2026-11-16", 185.5, 18.2, "morning")
        val json = gson.toJson(body)
        val obj = JsonParser.parseString(json).asJsonObject
        assertEquals(185.5, obj.get("weight_lb").asDouble, 0.001)
        assertEquals(18.2, obj.get("body_fat_pct").asDouble, 0.001)
    }

    @Test
    fun summary_deserializesFromApiShape() {
        // Mirrors the exact JSON the Django /api/summary/ endpoint returns
        val json = """
        {
          "today": {
            "calories": 1200,
            "protein_g": 85.5,
            "calorie_target": 2250,
            "protein_target": 170
          },
          "calories_7d": [
            {"date": "2026-11-10", "label": "Thu", "calories": 2100, "protein_g": 150.0}
          ],
          "bodycomp_latest": {
            "id": 1, "date": "2026-11-15", "weight_lb": 185.0, "body_fat_pct": 18.0, "notes": "", "created_at": "2026-11-15T09:00:00Z"
          },
          "bodycomp_baseline": {
            "id": 1, "date": "2026-11-15", "weight_lb": 185.0, "body_fat_pct": 18.0, "notes": "", "created_at": "2026-11-15T09:00:00Z"
          },
          "weight_delta": 0.0,
          "bf_delta": 0.0,
          "workouts_7d": {
            "entries": 5, "distinct_days": 3, "volume_lbs": 42000
          }
        }
        """.trimIndent()
        val s = gson.fromJson(json, Summary::class.java)
        assertNotNull(s)
        assertEquals(1200.0, s.today.calories, 0.001)
        assertEquals(85.5, s.today.proteinG, 0.001)
        assertEquals(2250.0, s.today.calorieTarget, 0.001)
        assertEquals(1, s.calories7d.size)
        assertEquals("2026-11-10", s.calories7d[0].date)
        assertEquals("Thu", s.calories7d[0].label)
        assertNotNull(s.bodycompLatest)
        val bc = s.bodycompLatest!!
        assertEquals(185.0, bc.weightLb, 0.001)
        assertEquals(18.0, bc.bodyFatPct!!, 0.001)
        assertEquals(5, s.workouts7d.entries)
        assertEquals(3, s.workouts7d.distinctDays)
        assertEquals(42000.0, s.workouts7d.volumeLbs, 0.001)
    }

    @Test
    fun workoutSet_deserializesFromApiShape() {
        val json = """
        {
          "id": 42, "date": "2026-11-16", "exercise": "Squat",
          "weight": 225.0, "reps": 5, "sets": 3, "notes": "PR", "created_at": "2026-11-16T12:00:00Z"
        }
        """.trimIndent()
        val w = gson.fromJson(json, WorkoutSet::class.java)
        assertEquals(42, w.id)
        assertEquals("Squat", w.exercise)
        assertEquals(225.0, w.weight!!, 0.001)
        assertEquals(5, w.reps)
        assertEquals(3, w.sets)
        assertEquals("PR", w.notes)
    }

    @Test
    fun foodEntry_deserializesFromApiShape() {
        val json = """
        {
          "id": 7, "date": "2026-11-16", "name": "Rice",
          "calories": 200.0, "meal_slot": "dinner", "protein_g": 5.0, "notes": "", "created_at": "2026-11-16T19:00:00Z"
        }
        """.trimIndent()
        val f = gson.fromJson(json, FoodEntry::class.java)
        assertEquals(7, f.id)
        assertEquals("Rice", f.name)
        assertEquals(200.0, f.calories, 0.001)
        assertEquals("dinner", f.meal_slot)
        assertEquals(5.0, f.proteinG!!, 0.001)
    }

    @Test
    fun bodyComp_deserializesFromApiShape() {
        val json = """
        {
          "id": 1, "date": "2026-11-16", "weight_lb": 184.0, "body_fat_pct": 17.8, "notes": "", "created_at": "2026-11-16T08:00:00Z"
        }
        """.trimIndent()
        val b = gson.fromJson(json, BodyComp::class.java)
        assertEquals(1, b.id)
        assertEquals(184.0, b.weightLb, 0.001)
        assertEquals(17.8, b.bodyFatPct!!, 0.001)
    }

    @Test
    fun exercise_deserializesFromApiShape() {
        val json = """[{"id":1,"name":"Bench press"},{"id":2,"name":"Squat"}]"""
        val list = gson.fromJson(json, Array<Exercise>::class.java)!!.toList()
        assertEquals(2, list.size)
        assertEquals(1, list[0].id)
        assertEquals("Bench press", list[0].name)
    }
}
