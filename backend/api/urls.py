from django.urls import path
from rest_framework.routers import DefaultRouter

from .views import (
    AddRoutineToDayView,
    AllWorkoutsView,
    BodyCompViewSet,
    CreateRoutineFromWorkoutView,
    ExerciseProgressView,
    ExerciseViewSet,
    FoodViewSet,
    LastWorkoutForExerciseView,
    RoutineViewSet,
    SummaryView,
    WorkoutViewSet,
)

router = DefaultRouter()
router.register("exercises", ExerciseViewSet, basename="exercise")
router.register("workouts", WorkoutViewSet, basename="workout")
router.register("food", FoodViewSet, basename="food")
router.register("bodycomp", BodyCompViewSet, basename="bodycomp")
router.register("routines", RoutineViewSet, basename="routine")

urlpatterns = [
    path("summary/", SummaryView.as_view(), name="summary"),
    path("last-workout/", LastWorkoutForExerciseView.as_view(), name="last-workout"),
    path("exercise-progress/", ExerciseProgressView.as_view(), name="exercise-progress"),
    path("all-workouts/", AllWorkoutsView.as_view(), name="all-workouts"),
    path("routines/<int:pk>/add-to-day/", AddRoutineToDayView.as_view(), name="routine-add-to-day"),
    path("routines/from-workout/", CreateRoutineFromWorkoutView.as_view(), name="routine-from-workout"),
] + router.urls
