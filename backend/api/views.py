from datetime import date, timedelta

from django.conf import settings
from django.db.models import F, Sum
from rest_framework import viewsets
from rest_framework.response import Response
from rest_framework.views import APIView

from .models import BodyComp, Exercise, FoodEntry, WorkoutSet
from .serializers import BodyCompSerializer, ExerciseSerializer, FoodSerializer, WorkoutSerializer


class ExerciseViewSet(viewsets.ReadOnlyModelViewSet):
    queryset = Exercise.objects.all()
    serializer_class = ExerciseSerializer


class WorkoutViewSet(viewsets.ModelViewSet):
    queryset = WorkoutSet.objects.all()
    serializer_class = WorkoutSerializer


class FoodViewSet(viewsets.ModelViewSet):
    queryset = FoodEntry.objects.all()
    serializer_class = FoodSerializer


class BodyCompViewSet(viewsets.ModelViewSet):
    queryset = BodyComp.objects.all()
    serializer_class = BodyCompSerializer


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
            }
        )
