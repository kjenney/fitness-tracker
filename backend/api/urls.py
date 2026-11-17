from django.urls import path
from rest_framework.routers import DefaultRouter

from .views import BodyCompViewSet, ExerciseViewSet, FoodViewSet, RoutineViewSet, SummaryView, WorkoutViewSet

router = DefaultRouter()
router.register("exercises", ExerciseViewSet, basename="exercise")
router.register("workouts", WorkoutViewSet, basename="workout")
router.register("food", FoodViewSet, basename="food")
router.register("bodycomp", BodyCompViewSet, basename="bodycomp")
router.register("routines", RoutineViewSet, basename="routine")

urlpatterns = [
    path("summary/", SummaryView.as_view(), name="summary"),
] + router.urls
