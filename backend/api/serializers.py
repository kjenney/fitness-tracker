from rest_framework import serializers

from .models import BodyComp, Exercise, FoodEntry, WorkoutSet


class ExerciseSerializer(serializers.ModelSerializer):
    class Meta:
        model = Exercise
        fields = ["id", "name"]


class WorkoutSerializer(serializers.ModelSerializer):
    class Meta:
        model = WorkoutSet
        fields = ["id", "date", "exercise", "weight", "reps", "sets", "notes", "created_at"]
        read_only_fields = ["id", "created_at"]


class FoodSerializer(serializers.ModelSerializer):
    class Meta:
        model = FoodEntry
        fields = ["id", "date", "name", "calories", "meal_slot", "protein_g", "notes", "created_at"]
        read_only_fields = ["id", "created_at"]


class BodyCompSerializer(serializers.ModelSerializer):
    class Meta:
        model = BodyComp
        fields = ["id", "date", "weight_lb", "body_fat_pct", "notes", "created_at"]
        read_only_fields = ["id", "created_at"]
