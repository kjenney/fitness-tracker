from datetime import date, timedelta

from django.conf import settings
from django.db.models import F, Sum
from rest_framework import viewsets
from rest_framework.response import Response
from rest_framework.views import APIView


from .models import BodyComp, Exercise, FoodEntry, WorkoutSet
from .serializers import BodyCompSerializer, ExerciseSerializer, FoodSerializer, WorkoutSerializer

class DateFilterMixin:
    """Restrict list results to one day when ?date=YYYY-MM-DD is given."""

    def get_queryset(self):
        queryset = super().get_queryset()
        param = self.request.query_params.get("date")
        if param:
            try:
                day = date.fromisoformat(param)
            except ValueError:
                return queryset.none()
            queryset = queryset.filter(date=day)
        return queryset


class ExerciseViewSet(viewsets.ModelViewSet):
    queryset = Exercise.objects.all()
    serializer_class = ExerciseSerializer


class WorkoutViewSet(DateFilterMixin, viewsets.ModelViewSet):
    queryset = WorkoutSet.objects.all()
    serializer_class = WorkoutSerializer


class FoodViewSet(DateFilterMixin, viewsets.ModelViewSet):
    queryset = FoodEntry.objects.all()
    serializer_class = FoodSerializer


class BodyCompViewSet(viewsets.ModelViewSet):
    queryset = BodyComp.objects.all()
    serializer_class = BodyCompSerializer

class LastWorkoutForExerciseView(APIView):
    """Get the most recent workout set for a given exercise."""

    def get(self, request):
        exercise_name = request.query_params.get('exercise')
        if not exercise_name:
            return Response({'error': 'exercise parameter required'}, status=400)

        entry = WorkoutSet.objects.filter(exercise=exercise_name).order_by('-date', '-created_at').first()
        if entry:
            return Response({
                'weight': entry.weight,
                'reps': entry.reps,
                'sets': entry.sets,
                'notes': entry.notes,
            })
        return Response({})


class AllWorkoutsView(APIView):
    """Get all workouts sorted by date for a consolidated line chart."""

    def get(self, request):
        workouts = WorkoutSet.objects.order_by('date', 'id')
        result = []

        for w in workouts:
            result.append({
                'date': w.date.isoformat(),
                'weight': w.weight,
                'reps': w.reps,
                'exercise': w.exercise,
            })

        return Response(result)



class ExerciseProgressView(APIView):
    """Get historical workout data for exercises - weight, reps over time."""

    def get(self, request):
        # Get all unique exercises that have been worked out
        exercises_with_workouts = WorkoutSet.objects.values("exercise").distinct()

        result = []
        for ex_data in exercises_with_workouts:
            exercise_name = ex_data["exercise"]
            # Get all workouts for this exercise, ordered by date
            workouts = WorkoutSet.objects.filter(exercise=exercise_name).order_by("date")

            if workouts.exists():
                # Get the latest workout to show current stats
                latest = workouts.last()
                # Get the first workout as baseline
                baseline = workouts.first()

                # Calculate changes
                current_weight = latest.weight
                baseline_weight = baseline.weight
                current_reps = latest.reps
                baseline_reps = baseline.reps

                weight_change = None
                reps_change = None

                if current_weight is not None and baseline_weight is not None:
                    weight_change = current_weight - baseline_weight
                if current_reps is not None and baseline_reps is not None:
                    reps_change = current_reps - baseline_reps

                # Get last 10 workouts for the trend
                recent_workouts = list(workouts)[-10:]

                result.append({
                    "exercise": exercise_name,
                    "baseline_weight": baseline_weight,
                    "baseline_reps": baseline_reps,
                    "current_weight": current_weight,
                    "current_reps": current_reps,
                    "weight_change": round(weight_change, 1) if weight_change is not None else None,
                    "reps_change": round(reps_change, 1) if reps_change is not None else None,
                    "num_sessions": workouts.count(),
                    "last_workout_date": latest.date.isoformat(),
                    "recent_workouts": [
                        {
                            "date": w.date.isoformat(),
                            "weight": w.weight,
                            "reps": w.reps,
                            "sets": w.sets,
                        }
                        for w in recent_workouts
                    ],
                })

        # Sort by most improved (greatest weight or reps increase)
        result.sort(key=lambda x: (
            x["weight_change"] is None,
            -(x["weight_change"] or 0),
            x["reps_change"] is None,
            -(x["reps_change"] or 0),
        ), reverse=True)

        return Response(result)


class SummaryView(APIView):
    """Dashboard aggregates: today's food, 7-day calorie trend,
    latest vs baseline body comp, and 7-day training volume."""

    def get(self, request):
        today = date.today()
        week_ago = today - timedelta(days=6)

        # 7-day calorie/protein series (zero-filled)
        rows = (
            FoodEntry.objects.filter(date__gte=week_ago)
            .values("date")
            .annotate(calories=Sum("calories"), protein=Sum("protein_g"))
            .order_by("date")
        )
        by_date = {r["date"]: r for r in rows}
        calories_7d = []
        for i in range(7):
            d = week_ago + timedelta(days=i)
            r = by_date.get(d, {})
            calories_7d.append(
                {
                    "date": d.isoformat(),
                    "label": d.strftime("%a"),
                    "calories": round(r.get("calories") or 0),
                    "protein_g": round(r.get("protein") or 0, 1),
                }
            )

        latest = BodyComp.objects.order_by("-date").first()
        baseline = BodyComp.objects.order_by("date").first()
        weight_delta = round(latest.weight_lb - baseline.weight_lb, 1) if latest and baseline else None
        bf_delta = (
            round(latest.body_fat_pct - baseline.body_fat_pct, 1)
            if latest and baseline and latest.body_fat_pct is not None and baseline.body_fat_pct is not None
            else None
        )

        week_workouts = WorkoutSet.objects.filter(date__gte=week_ago)
        volume = week_workouts.aggregate(v=Sum(F("weight") * F("reps") * F("sets")))["v"] or 0
        distinct_days = week_workouts.values("date").distinct().count()

        return Response(
            {
                "today": {
                    "calories": round(FoodEntry.objects.filter(date=today).aggregate(c=Sum("calories"))["c"] or 0),
                    "protein_g": round(FoodEntry.objects.filter(date=today).aggregate(p=Sum("protein_g"))["p"] or 0, 1),
                    "calorie_target": settings.CALORIE_TARGET,
                    "protein_target": settings.PROTEIN_TARGET,
                },
                "calories_7d": calories_7d,
                "bodycomp_latest": BodyCompSerializer(latest).data if latest else None,
                "bodycomp_baseline": BodyCompSerializer(baseline).data if baseline else None,
                "weight_delta": weight_delta,
                "bf_delta": bf_delta,
                "workouts_7d": {
                    "entries": week_workouts.count(),
                    "distinct_days": distinct_days,
                    "volume_lbs": round(volume),
                },
                "exercise_progress": ExerciseProgressView().get(request).data,
            }
        )
