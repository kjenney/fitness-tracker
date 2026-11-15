"""MET (Metabolic Equivalent of Task) values for common exercises.

MET values represent the energy cost of physical activities.
Calories burned = MET * weight_kg * duration_hours

Source: Compendium of Physical Activities
"""

# MET values per exercise name (exact match)
EXERCISE_METS = {
    #Upper body - pushing exercises
    "bench press": 6.0,
    "incline bench press": 6.5,
    "decline bench press": 7.0,
    "pushups": 7.0,
    "chest fly": 4.0,
    "dumbbell press": 6.0,
    "pec deck": 5.0,

    #Upper body - pulling exercises
    "pullups": 9.8,
    "lat pulldown": 6.0,
    "bent over row": 6.0,
    "seated row": 5.0,
    "curls": 3.5,
    "hammer curls": 3.5,
    "preacher curl": 3.5,
    "tricep pushdown": 3.5,
    "overhead tricep extension": 3.0,
    "skull crushers": 4.0,

    #Lower body
    "squats": 6.0,
    "leg press": 5.0,
    "leg extension": 3.5,
    "leg curl": 3.5,
    "lunges": 5.0,
    "deadlift": 6.0,
    "good mornings": 5.0,
    "hip thrust": 5.0,
    "calf raise": 3.0,

    #Shoulders
    "overhead press": 6.0,
    "lateral raise": 4.0,
    "front raise": 4.0,
    "rear delt fly": 3.0,
    "shrvs": 3.5,

    #Core
    "crunches": 4.0,
    "plank": 3.0,
    " Russian twists": 5.0,
    "leg raises": 5.0,
    "situps": 4.0,

    #Cardio
    "running": 8.0,
    "treadmill walk": 3.5,
    "treadmill run": 9.0,
    "elliptical": 7.0,
    "cycling": 6.0,
    "rowing": 8.0,
    "jump rope": 10.0,
    "burpees": 8.0,

    #Mixed/Functional
    "kettlebell swing": 8.0,
    "clean and press": 8.0,
    "snatch": 8.0,
    "muvements": 6.0,

    # Bodyweight exercises
    "bodyweight squats": 3.5,
    "pushups": 7.0,
    "lunges": 5.0,
    "plank": 3.0,
    "mountain climbers": 8.0,
    "jumping jacks": 8.0,
}

# Category-based MET values (used as fallback)
CATEGORY_METS = {
    "upper": 4.5,  # General upper body
    "lower": 5.5,  # General lower body
    "cardio": 7.0,  # General cardio
    "core": 4.0,  # General core
    "push": 5.0,  # Push movements
    "pull": 5.5,  # Pull movements
}

DEFAULT_MET = 4.0  # Fallback for unknown exercises
DURATION_PER_SET_MINUTES = 1.5  # Default: 90 seconds per set (work + rest)


def get_met(exercise_name: str) -> float:
    """Get MET value for an exercise by name.

    Args:
        exercise_name: The name of the exercise (case-insensitive)

    Returns:
        MET value for the exercise, or DEFAULT_MET if not found
    """
    if not exercise_name:
        return DEFAULT_MET

    # Exact match (case-insensitive)
    lower_name = exercise_name.lower().strip()
    if lower_name in EXERCISE_METS:
        return EXERCISE_METS[lower_name]

    # Partial match - check if exercise name contains any known exercise
    for known, met in EXERCISE_METS.items():
        if known in lower_name or lower_name in known:
            return met

    # Categorize by keywords
    exercise_lower = lower_name
    if any(word in exercise_lower for word in ["pull", "row", "bicep", "curl"]):
        return CATEGORY_METS.get("pull", 5.5)
    if any(word in exercise_lower for word in ["press", "push", "chest", "tricep"]):
        return CATEGORY_METS.get("push", 5.0)
    if any(word in exercise_lower for word in ["squats", "leg", "lunge", "deadlift", "hip"]):
        return CATEGORY_METS.get("lower", 5.5)
    if any(word in exercise_lower for word in ["cardio", "run", "walk", "cycle", "ellipt", "row"]):
        return CATEGORY_METS.get("cardio", 7.0)
    if any(word in exercise_lower for word in ["core", "crunch", "plank", "situp", "l raise"]):
        return CATEGORY_METS.get("core", 4.0)
    if any(word in exercise_lower for word in ["shoulder", "del", "press"]):
        return CATEGORY_METS.get("upper", 4.5)

    return DEFAULT_MET


def calculate_calories(weight_lb: float, exercise: str, sets: int, reps: int | None = None) -> float:
    """Calculate calories burned for a workout set.

    Calorie formula: METs * weight_kg * duration_hours

    Args:
        weight_lb: Weight used (or bodyweight if null)
        exercise: Name of the exercise
        sets: Number of sets performed
        reps: Number of reps (optional, not used in basic calculation)

    Returns:
        Estimated calories burned
    """
    if weight_lb is None or weight_lb <= 0:
        weight_lb = 175  # Default assumed weight in lbs

    weight_kg = weight_lb / 2.205
    met = get_met(exercise)
    duration_hours = (sets * DURATION_PER_SET_MINUTES) / 60.0

    calories = met * weight_kg * duration_hours
    return round(calories, 1)
