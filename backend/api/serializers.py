from rest_framework import serializers

from .models import BodyComp, Exercise, FoodEntry, Routine, RoutineExercise, WorkoutSet


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


class RoutineExerciseSerializer(serializers.ModelSerializer):
    exercise_name = serializers.CharField(source='exercise.name', read_only=True)

    class Meta:
        model = RoutineExercise
        fields = ["id", "exercise", "exercise_name", "weight", "reps", "sets", "notes"]
        read_only_fields = ["id"]


class RoutineSerializer(serializers.ModelSerializer):
    exercises = RoutineExerciseSerializer(many=True, required=False)

    class Meta:
        model = Routine
        fields = ["id", "name", "created_at", "exercises"]
        read_only_fields = ["id", "created_at"]

    def create(self, validated_data):
        exercises_data = validated_data.pop('exercises', [])
        routine = Routine.objects.create(**validated_data)
        for exercise_data in exercises_data:
            RoutineExercise.objects.create(routine=routine, **exercise_data)
        return routine

    def update(self, instance, validated_data):
        exercises_data = validated_data.pop('exercises', [])
        instance.name = validated_data.get('name', instance.name)
        instance.save()
        # Update exercises
        existing_exercises = {e.id: e for e in instance.exercises.all()}
        new_exercises = []
        for exercise_data in exercises_data:
            if exercise_data.get('id') in existing_exercises:
                # Update existing
                ex = existing_exercises.pop(exercise_data['id'])
                ex.exercise = exercise_data.get('exercise', ex.exercise)
                ex.weight = exercise_data.get('weight', ex.weight)
                ex.reps = exercise_data.get('reps', ex.reps)
                ex.sets = exercise_data.get('sets', ex.sets)
                ex.notes = exercise_data.get('notes', ex.notes)
                ex.save()
                new_exercises.append(ex)
            else:
                # Create new
                new_exercises.append(RoutineExercise.objects.create(routine=instance, **exercise_data))
        # Delete removed exercises
        for ex in existing_exercises.values():
            ex.delete()
        return instance
