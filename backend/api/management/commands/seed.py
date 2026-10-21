from django.core.management.base import BaseCommand

from api.models import BodyComp, Exercise

# Ken's 3-day barbell program (from body-plan.spec.json / workouts.csv)
PROGRAM = [
    # Day 1
    ("Barbell bench press", 4, "6-8", "2 min rest"),
    ("Overhead press", 3, "8-10", ""),
    ("Incline dumbbell press", 3, "10-12", ""),
    ("Dips (weighted)", 3, "8-12", ""),
    ("Barbell back squat", 4, "6-8", "2 min rest"),
    ("Romanian deadlift", 3, "8-10", "3s eccentric"),
    ("Cable lateral raises", 3, "12-15", "light, strict"),
    # Day 2
    ("Conventional deadlift", 4, "5-6", "2-3 min rest"),
    ("Barbell front squat", 3, "8-10", ""),
    ("Leg press (high/wide)", 3, "12", ""),
    ("Bent-over barbell row", 4, "8-10", "no shrug"),
    ("Weighted pull-ups", 3, "AMRAP", "+10-20 lb"),
    ("Face pulls (rope)", 3, "15", ""),
    ("Hanging leg raises", 3, "12-15", ""),
    # Day 3
    ("Barbell squat", 3, "8", "moderate load"),
    ("Pendlay rows", 3, "10", "explosive"),
    ("Walking lunges (DB)", 3, "12/leg", ""),
    ("Farmer's carries", 3, "40 m", "2x90 lb+"),
    ("Barbell shrugs", 3, "12", ""),
    ("Cable crunch / ab wheel", 3, "15", ""),
]


class Command(BaseCommand):
    help = "Seed baseline body comp (2026-10-19) and the exercise library. Idempotent."

    def handle(self, *args, **options):
        created = 0
        for name, _sets, _reps, _notes in PROGRAM:
            obj, was_created = Exercise.objects.get_or_create(name=name)
            created += was_created
        self.stdout.write(f"Exercises: {Exercise.objects.count()} total ({created} new)")

        base, was_created = BodyComp.objects.get_or_create(
            date="2026-10-19",
            defaults={
                "weight_lb": 231.4,
                "body_fat_pct": 44.8,
                "notes": "Baseline (scan 2026-10-19). Visceral fat level 20, muscle 119 lb",
            },
        )
        self.stdout.write(
            f"Baseline body comp: {base.date} {base.weight_lb} lb / {base.body_fat_pct}% BF ({'created' if was_created else 'exists'})"
        )
