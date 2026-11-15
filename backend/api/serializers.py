from rest_framework import serializers

from .models import BodyComp, Exercise, FoodEntry, Routine, RoutineExercise, WorkoutSet


class ExerciseSerializer(serializers.ModelSerializer):
    class Meta:
        model = Exercise
        fields = ["id", "name", "url"]


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
        fields = [
            "id", "date", "weight_lb", "body_fat_pct",
            "muscle_rate", "lean_body_mass", "subcutaneous_fat", "visceral_fat",
            "body_water", "skeletal_mass_rate", "muscle_mass", "bone_mass",
            "protein", "basal_metabolism", "body_age", "waist_hip_ratio",
            "body_fat_mass", "water_content", "protein_mass",
            "notes", "created_at"
        ]
        read_only_fields = ["id", "created_at"]


class RoutineExerciseSerializer(serializers.ModelSerializer):
    exercise_name = serializers.CharField(source='exercise.name', read_only=True)

    class Meta:
        model = RoutineExercise
        fields = ["id", "exercise", "exercise_name", "weight", "reps", "sets", "notes"]


class RoutineSerializer(serializers.ModelSerializer):
    exercises = RoutineExerciseSerializer(many=True, read_only=True)
    exercises_write = RoutineExerciseSerializer(many=True, write_only=True, required=False)

    class Meta:
        model = Routine
        fields = ["id", "name", "created_at", "exercises", "exercises_write"]
        read_only_fields = ["id", "created_at", "exercises"]

    def create(self, validated_data):
        exercises_data = validated_data.pop("exercises_write", [])
        routine = Routine.objects.create(**validated_data)
        for exercise_data in exercises_data:
            RoutineExercise.objects.create(routine=routine, **exercise_data)
        return routine

    def update(self, instance, validated_data):
        exercises_data = validated_data.pop("exercises_write", None)
        instance.name = validated_data.get("name", instance.name)
        instance.save()
        if exercises_data is not None:
            instance.exercises.all().delete()
            for exercise_data in exercises_data:
                RoutineExercise.objects.create(routine=instance, **exercise_data)
        return instance
