package com.ken.fittrack.model

import com.google.gson.annotations.SerializedName

data class Exercise(
    val id: Int,
    val name: String
)

data class WorkoutSet(
    val id: Int,
    val date: String,
    val exercise: String,
    @SerializedName("weight") val weight: Double?,
    val reps: Int?,
    val sets: Int,
    val notes: String?,
    @SerializedName("calories_burned") val caloriesBurned: Double?,
    val created_at: String?
)

data class FoodEntry(
    val id: Int,
    val date: String,
    val name: String,
    val calories: Double,
    val meal_slot: String?,
    @SerializedName("protein_g") val proteinG: Double?,
    val notes: String?,
    val created_at: String?
)

data class BodyComp(
    val id: Int,
    val date: String,
    @SerializedName("weight_lb") val weightLb: Double,
    @SerializedName("body_fat_pct") val bodyFatPct: Double?,
    val notes: String?,
    // Live backend exposes these (all optional — tolerate null/missing):
    @SerializedName("muscle_rate") val muscleRate: Double?,
    @SerializedName("lean_body_mass") val leanBodyMass: Double?,
    @SerializedName("subcutaneous_fat") val subcutaneousFat: Double?,
    @SerializedName("visceral_fat") val visceralFat: Double?,
    @SerializedName("body_water") val bodyWater: Double?,
    @SerializedName("skeletal_mass_rate") val skeletalMassRate: Double?,
    @SerializedName("muscle_mass") val muscleMass: Double?,
    @SerializedName("bone_mass") val boneMass: Double?,
    @SerializedName("basal_metabolism") val basalMetabolism: Double?,
    @SerializedName("body_age") val bodyAge: Double?,
    @SerializedName("waist_hip_ratio") val waistHipRatio: Double?,
    @SerializedName("body_fat_mass") val bodyFatMass: Double?,
    @SerializedName("water_content") val waterContent: Double?,
    @SerializedName("protein_mass") val proteinMass: Double?,
    val created_at: String?
)

data class WorkoutCreate(
    val date: String,
    val exercise: String,
    val weight: Double?,
    val reps: Int?,
    val sets: Int,
    val notes: String
)

data class FoodCreate(
    val date: String,
    val name: String,
    val calories: Double,
    val meal_slot: String,
    val protein_g: Double?,
    val notes: String
)

data class BodyCompCreate(
    val date: String,
    val weight_lb: Double,
    val body_fat_pct: Double?,
    val notes: String
)

data class TodaySummary(
    val calories: Double,
    @SerializedName("protein_g") val proteinG: Double,
    @SerializedName("calorie_target") val calorieTarget: Double,
    @SerializedName("protein_target") val proteinTarget: Double,
    @SerializedName("workout_calories") val workoutCalories: Double?
)

data class CalorieDay(
    val date: String,
    val label: String,
    val calories: Double,
    @SerializedName("protein_g") val proteinG: Double
)

data class Workouts7d(
    val entries: Int,
    @SerializedName("distinct_days") val distinctDays: Int,
    @SerializedName("volume_lbs") val volumeLbs: Double
)

data class Summary(
    val today: TodaySummary,
    @SerializedName("calories_7d") val calories7d: List<CalorieDay>,
    @SerializedName("bodycomp_latest") val bodycompLatest: BodyComp?,
    @SerializedName("bodycomp_baseline") val bodycompBaseline: BodyComp?,
    @SerializedName("weight_delta") val weightDelta: Double?,
    @SerializedName("bf_delta") val bfDelta: Double?,
    @SerializedName("workouts_7d") val workouts7d: Workouts7d
)
