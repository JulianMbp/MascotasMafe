# Generated by Django 5.1.3 on 2025-02-12 22:41

import datetime
from django.db import migrations, models


class Migration(migrations.Migration):

    initial = True

    dependencies = []

    operations = [
        migrations.CreateModel(
            name="Mascota",
            fields=[
                (
                    "id",
                    models.BigAutoField(
                        auto_created=True,
                        primary_key=True,
                        serialize=False,
                        verbose_name="ID",
                    ),
                ),
                ("nombre", models.CharField(max_length=100)),
                ("peso", models.DecimalField(decimal_places=2, max_digits=5)),
                ("edad", models.IntegerField()),
                ("especie", models.CharField(max_length=100)),
                ("raza", models.CharField(max_length=100)),
                ("fecha_nacimiento", models.DateField()),
                ("fecha_creacion", models.DateTimeField(default=datetime.datetime.now)),
            ],
        ),
    ]
