# Fix Exercise.url column to ensure it has a proper default
# This addresses a schema mismatch where the db column lacked a default

from django.db import migrations


class Migration(migrations.Migration):

    dependencies = [
        ('api', '0005_workout_calories_burned'),
    ]

    operations = [
        # Recreate the api_exercise table with the correct schema that includes
        # a NOT NULL url column with a default empty string
        migrations.RunSQL(
            sql="""
            CREATE TABLE api_exercise_new (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                name VARCHAR(200) NOT NULL UNIQUE,
                url VARCHAR(200) NOT NULL DEFAULT ''
            );
            INSERT INTO api_exercise_new (id, name, url)
            SELECT id, name, COALESCE(url, '') FROM api_exercise;
            DROP TABLE api_exercise;
            ALTER TABLE api_exercise_new RENAME TO api_exercise;
            """,
            reverse_sql="""
            CREATE TABLE api_exercise_new (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                name VARCHAR(200) NOT NULL UNIQUE,
                url VARCHAR(200)
            );
            INSERT INTO api_exercise_new (id, name, url)
            SELECT id, name, url FROM api_exercise;
            DROP TABLE api_exercise;
            ALTER TABLE api_exercise_new RENAME TO api_exercise;
            """,
        ),
    ]
