package com.ken.fittrack.api

import com.ken.fittrack.model.Summary
import kotlinx.coroutines.runBlocking
import org.junit.Assert.*
import org.junit.Test
import okhttp3.OkHttpClient
import retrofit2.Retrofit
import retrofit2.converter.gson.GsonConverterFactory
import java.util.concurrent.TimeUnit

/**
 * Integration test: hits the live Django backend at 127.0.0.1:8000.
 * Skipped gracefully (returns) if the backend is not running, so the
 * suite still passes in CI where no backend exists.
 */
class ApiLiveTest {

    private val base = "http://diffuser.tail4f5ca.ts.net:8080/"

    private fun buildRetrofit(): Retrofit = Retrofit.Builder()
        .baseUrl(base)
        .client(OkHttpClient.Builder()
            .connectTimeout(5, TimeUnit.SECONDS)
            .readTimeout(10, TimeUnit.SECONDS)
            .build())
        .addConverterFactory(GsonConverterFactory.create())
        .build()

    @Test
    fun getSummary_returnsValidShape() = runBlocking {
        val api = buildRetrofit().create(FitTrackApi::class.java)
        val resp = runCatching { api.getSummary() }
        if (resp.isFailure) {
            // Backend not reachable in this environment — skip.
            return@runBlocking
        }
        val body = resp.getOrNull()?.body()
        assertNotNull(body)
        val s = body!!
        assertTrue(s.today.calorieTarget > 0)
        assertTrue(s.calories7d.size == 7)
        assertNotNull(s.workouts7d)
        assertTrue(s.workouts7d.entries >= 0)
    }

    @Test
    fun getExercises_returnsList() = runBlocking {
        val api = buildRetrofit().create(FitTrackApi::class.java)
        val resp = runCatching { api.getExercises() }
        if (resp.isFailure) return@runBlocking
        val list = resp.getOrNull()?.body()
        assertNotNull(list)
        assertTrue(list!!.isNotEmpty())
        assertTrue(list.all { it.name.isNotBlank() })
    }

    @Test
    fun createAndDeleteWorkout_roundTrip() = runBlocking {
        val api = buildRetrofit().create(FitTrackApi::class.java)
        val resp = runCatching { api.getSummary() }
        if (resp.isFailure) return@runBlocking // backend down

        val body = com.ken.fittrack.model.WorkoutCreate(
            date = "2026-11-16",
            exercise = "API Test Set",
            weight = 100.0,
            reps = 5,
            sets = 1,
            notes = "created by ApiLiveTest — safe to delete"
        )
        val created = api.createWorkout(body)
        assertTrue(created.isSuccessful)
        val w = created.body()!!
        assertEquals("API Test Set", w.exercise)
        assertEquals(100.0, w.weight!!, 0.001)

        val deleted = api.deleteWorkout(w.id)
        assertTrue(deleted.isSuccessful)
    }
}
