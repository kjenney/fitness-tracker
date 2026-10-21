from django.db import models


class WorkoutSet(models.Model):
    """One logged exercise: type, weight, reps (plus optional sets/notes)."""

    date = models.DateField()
    exercise = models.CharField(max_length=200)  # type of workout/exercise
    weight = models.FloatField(null=True, blank=True, help_text="lb (blank = bodyweight)")
    reps = models.IntegerField(null=True, blank=True)
    sets = models.IntegerField(default=1)
    notes = models.CharField(max_length=300, blank=True, default="")
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ["-date", "exercise", "created_at"]

    def __str__(self):
        w = f" {self.weight:g} lb" if self.weight else ""
        r = f" x {self.reps}" if self.reps else ""
        return f"{self.date} {self.exercise}{w}{r}"


class Exercise(models.Model):
    """Exercise library — suggestions for the workout log form."""

    name = models.CharField(max_length=200, unique=True)

    class Meta:
        ordering = ["name"]

    def __str__(self):
        return self.name


class FoodEntry(models.Model):
    """One logged meal/food item with calories (plus optional protein)."""

    MEAL_SLOTS = [
        ("", "Unspecified"),
        ("breakfast", "Breakfast"),
        ("lunch", "Lunch"),
        ("snack", "Snack"),
        ("dinner", "Dinner"),
    ]

    date = models.DateField()
    name = models.CharField(max_length=200)
    calories = models.FloatField(default=0)
    meal_slot = models.CharField(max_length=20, blank=True, default="", choices=MEAL_SLOTS)
    protein_g = models.FloatField(null=True, blank=True)
    notes = models.CharField(max_length=300, blank=True, default="")
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ["-date", "created_at"]

    def __str__(self):
        return f"{self.date} {self.name} ({self.calories:g} kcal)"


class BodyComp(models.Model):
    """Weight + body fat percentage readings."""

    date = models.DateField()
    weight_lb = models.FloatField()
    body_fat_pct = models.FloatField(null=True, blank=True)
    notes = models.CharField(max_length=300, blank=True, default="")
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ["-date"]

    def __str__(self):
        bf = f" / {self.body_fat_pct:g}% BF" if self.body_fat_pct is not None else ""
        return f"{self.date} {self.weight_lb:g} lb{bf}"
