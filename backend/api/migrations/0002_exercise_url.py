from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('api', '0001_initial'),
    ]

    operations = [
        migrations.AddField(
            model_name='exercise',
            name='url',
            field=models.URLField(blank=True, default='', help_text='Link to form/instruction (e.g. exercise video or database page)'),
        ),
    ]
