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
    url = models.URLField(blank=True, default="", help_text="Link to form/instruction (e.g. exercise video or database page)")

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
    """Weight + body composition readings."""

    date = models.DateField()
    weight_lb = models.FloatField()
    body_fat_pct = models.FloatField(null=True, blank=True)
    muscle_rate = models.FloatField(null=True, blank=True, help_text="Muscle Rate (%)")
    lean_body_mass = models.FloatField(null=True, blank=True, help_text="Lean Body Mass (lb)")
    subcutaneous_fat = models.FloatField(null=True, blank=True, help_text="Subcutaneous Fat (%)")
    visceral_fat = models.FloatField(null=True, blank=True, help_text="Visceral Fat level (1-50)")
    body_water = models.FloatField(null=True, blank=True, help_text="Body Water (%)")
    skeletal_mass_rate = models.FloatField(null=True, blank=True, help_text="Skeletal Muscle Mass Rate (%)")
    muscle_mass = models.FloatField(null=True, blank=True, help_text="Muscle Mass (lb)")
    bone_mass = models.FloatField(null=True, blank=True, help_text="Bone Mass (lb)")
    protein = models.FloatField(null=True, blank=True, help_text="Protein (%)")
    basal_metabolism = models.FloatField(null=True, blank=True, help_text="Basal Metabolic Rate (kcal/day)")
    body_age = models.IntegerField(null=True, blank=True, help_text="Body Age (years)")
    waist_hip_ratio = models.FloatField(null=True, blank=True, help_text="Waist-to-Hip Ratio")
    body_fat_mass = models.FloatField(null=True, blank=True, help_text="Body Fat Mass (lb)")
    water_content = models.FloatField(null=True, blank=True, help_text="Water Content (lb)")
    protein_mass = models.FloatField(null=True, blank=True, help_text="Protein Mass (lb)")
    notes = models.CharField(max_length=300, blank=True, default="")
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ["-date"]

    def __str__(self):
        bf = f" / {self.body_fat_pct:g}% BF" if self.body_fat_pct is not None else ""
        return f"{self.date} {self.weight_lb:g} lb{bf}"
