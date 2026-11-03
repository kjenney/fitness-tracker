from datetime import date, timedelta

from rest_framework.test import APITestCase

from .models import Exercise, WorkoutSet


class ExerciseCrudTests(APITestCase):
    def test_create(self):
        res = self.client.post("/api/exercises/", {"name": "Dumbbell curl"}, format="json")
        self.assertEqual(res.status_code, 201)
        self.assertEqual(Exercise.objects.filter(name="Dumbbell curl").count(), 1)

    def test_create_with_url(self):
        res = self.client.post(
            "/api/exercises/",
            {"name": "Dumbbell curl", "url": "https://exrx.com/db/1"},
            format="json",
        )
        self.assertEqual(res.status_code, 201)
        ex = Exercise.objects.get(name="Dumbbell curl")
        self.assertEqual(ex.url, "https://exrx.com/db/1")

    def test_create_duplicate_rejected(self):
        Exercise.objects.create(name="Dumbbell curl")
        res = self.client.post("/api/exercises/", {"name": "Dumbbell curl"}, format="json")
        self.assertEqual(res.status_code, 400)
        self.assertIn("name", res.json())

    def test_create_missing_name_rejected(self):
        res = self.client.post("/api/exercises/", {}, format="json")
        self.assertEqual(res.status_code, 400)

    def test_update(self):
        ex = Exercise.objects.create(name="Dumbbell curl")
        res = self.client.patch(f"/api/exercises/{ex.id}/", {"name": "Incline dumbbell curl"}, format="json")
        self.assertEqual(res.status_code, 200)
        ex.refresh_from_db()
        self.assertEqual(ex.name, "Incline dumbbell curl")

    def test_update_duplicate_rejected(self):
        ex = Exercise.objects.create(name="Dumbbell curl")
        Exercise.objects.create(name="Incline dumbbell curl")
        res = self.client.patch(f"/api/exercises/{ex.id}/", {"name": "Incline dumbbell curl"}, format="json")
        self.assertEqual(res.status_code, 400)

    def test_delete(self):
        ex = Exercise.objects.create(name="Dumbbell curl")
        res = self.client.delete(f"/api/exercises/{ex.id}/")
        self.assertEqual(res.status_code, 204)
        self.assertEqual(Exercise.objects.count(), 0)

    def test_list_still_works(self):
        Exercise.objects.create(name="Dumbbell curl")
        res = self.client.get("/api/exercises/")
        self.assertEqual(res.status_code, 200)
        self.assertEqual(res.json(), [{"id": res.json()[0]["id"], "name": "Dumbbell curl", "url": ""}])


class WorkoutListTests(APITestCase):
    def setUp(self):
        self.today = date.today()
        self.yesterday = self.today - timedelta(days=1)
        WorkoutSet.objects.create(date=self.today, exercise="Bench press", weight=135, reps=8)
        WorkoutSet.objects.create(date=self.yesterday, exercise="Squat", weight=225, reps=5)

    def test_list_filters_by_date(self):
        res = self.client.get("/api/workouts/", {"date": self.yesterday.isoformat()})
        self.assertEqual(res.status_code, 200)
        self.assertEqual(len(res.json()), 1)
        self.assertEqual(res.json()[0]["exercise"], "Squat")

    def test_list_without_date_returns_all(self):
        res = self.client.get("/api/workouts/")
        self.assertEqual(res.status_code, 200)
        self.assertEqual(len(res.json()), 2)

    def test_list_invalid_date_returns_empty(self):
        res = self.client.get("/api/workouts/", {"date": "not-a-date"})
        self.assertEqual(res.status_code, 200)
        self.assertEqual(res.json(), [])
