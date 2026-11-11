# Generated to add extended body composition fields

from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('api', '0002_exercise_url'),
    ]

    operations = [
        migrations.AddField(
            model_name='bodycomp',
            name='basal_metabolism',
            field=models.FloatField(blank=True, help_text='Basal Metabolic Rate (kcal/day)', null=True),
        ),
        migrations.AddField(
            model_name='bodycomp',
            name='body_age',
            field=models.IntegerField(blank=True, help_text='Body Age (years)', null=True),
        ),
        migrations.AddField(
            model_name='bodycomp',
            name='body_fat_mass',
            field=models.FloatField(blank=True, help_text='Body Fat Mass (lb)', null=True),
        ),
        migrations.AddField(
            model_name='bodycomp',
            name='body_water',
            field=models.FloatField(blank=True, help_text='Body Water (%)', null=True),
        ),
        migrations.AddField(
            model_name='bodycomp',
            name='lean_body_mass',
            field=models.FloatField(blank=True, help_text='Lean Body Mass (lb)', null=True),
        ),
        migrations.AddField(
            model_name='bodycomp',
            name='muscle_mass',
            field=models.FloatField(blank=True, help_text='Muscle Mass (lb)', null=True),
        ),
        migrations.AddField(
            model_name='bodycomp',
            name='muscle_rate',
            field=models.FloatField(blank=True, help_text='Muscle Rate (%)', null=True),
        ),
        migrations.AddField(
            model_name='bodycomp',
            name='bone_mass',
            field=models.FloatField(blank=True, help_text='Bone Mass (lb)', null=True),
        ),
        migrations.AddField(
            model_name='bodycomp',
            name='protein',
            field=models.FloatField(blank=True, help_text='Protein (%)', null=True),
        ),
        migrations.AddField(
            model_name='bodycomp',
            name='protein_mass',
            field=models.FloatField(blank=True, help_text='Protein Mass (lb)', null=True),
        ),
        migrations.AddField(
            model_name='bodycomp',
            name='skeletal_mass_rate',
            field=models.FloatField(blank=True, help_text='Skeletal Muscle Mass Rate (%)', null=True),
        ),
        migrations.AddField(
            model_name='bodycomp',
            name='subcutaneous_fat',
            field=models.FloatField(blank=True, help_text='Subcutaneous Fat (%)', null=True),
        ),
        migrations.AddField(
            model_name='bodycomp',
            name='visceral_fat',
            field=models.FloatField(blank=True, help_text='Visceral Fat level (1-50)', null=True),
        ),
        migrations.AddField(
            model_name='bodycomp',
            name='waist_hip_ratio',
            field=models.FloatField(blank=True, help_text='Waist-to-Hip Ratio', null=True),
        ),
        migrations.AddField(
            model_name='bodycomp',
            name='water_content',
            field=models.FloatField(blank=True, help_text='Water Content (lb)', null=True),
        ),
    ]
