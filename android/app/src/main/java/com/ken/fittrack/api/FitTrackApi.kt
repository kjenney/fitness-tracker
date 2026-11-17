package com.ken.fittrack.api

import com.ken.fittrack.model.BodyComp
import com.ken.fittrack.model.BodyCompCreate
import com.ken.fittrack.model.Exercise
import com.ken.fittrack.model.FoodCreate
import com.ken.fittrack.model.FoodEntry
import com.ken.fittrack.model.Summary
import com.ken.fittrack.model.WorkoutCreate
import com.ken.fittrack.model.WorkoutSet
import retrofit2.Response
import retrofit2.http.Body
import retrofit2.http.DELETE
import retrofit2.http.GET
import retrofit2.http.POST
import retrofit2.http.Path
import retrofit2.http.Query

interface FitTrackApi {

    @GET("api/summary/")
    suspend fun getSummary(): Response<Summary>

    @GET("api/exercises/")
    suspend fun getExercises(): Response<List<Exercise>>

    @GET("api/workouts/")
    suspend fun getWorkouts(@Query("date") date: String?): Response<List<WorkoutSet>>

    @POST("api/workouts/")
    suspend fun createWorkout(@Body body: WorkoutCreate): Response<WorkoutSet>

    @DELETE("api/workouts/{id}/")
    suspend fun deleteWorkout(@Path("id") id: Int): Response<Unit>

    @GET("api/food/")
    suspend fun getFood(@Query("date") date: String?): Response<List<FoodEntry>>

    @POST("api/food/")
    suspend fun createFood(@Body body: FoodCreate): Response<FoodEntry>

    @DELETE("api/food/{id}/")
    suspend fun deleteFood(@Path("id") id: Int): Response<Unit>

    @GET("api/bodycomp/")
    suspend fun getBodyComp(): Response<List<BodyComp>>

    @POST("api/bodycomp/")
    suspend fun createBodyComp(@Body body: BodyCompCreate): Response<BodyComp>

    @DELETE("api/bodycomp/{id}/")
    suspend fun deleteBodyComp(@Path("id") id: Int): Response<Unit>
}
