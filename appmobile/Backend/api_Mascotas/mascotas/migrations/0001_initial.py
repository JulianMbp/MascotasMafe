# Generated by Django 5.1.3 on 2025-04-23 01:32

import datetime
import django.db.models.deletion
from django.db import migrations, models


class Migration(migrations.Migration):

    initial = True

    dependencies = [
        ("dueño", "0001_initial"),
    ]

    operations = [
        migrations.CreateModel(
            name="Mascota",
            fields=[
                ("id", models.AutoField(primary_key=True, serialize=False)),
                ("nombre", models.CharField(max_length=100)),
                ("peso", models.DecimalField(decimal_places=2, max_digits=5)),
                ("edad", models.IntegerField()),
                ("especie", models.CharField(max_length=100)),
                ("raza", models.CharField(max_length=100)),
                ("imagen", models.TextField(null=True)),
                ("fecha_nacimiento", models.DateField(blank=True, null=True)),
                ("fecha_creacion", models.DateTimeField(default=datetime.datetime.now)),
                (
                    "dueño",
                    models.ForeignKey(
                        on_delete=django.db.models.deletion.CASCADE,
                        related_name="mascotas",
                        to="dueño.dueño",
                    ),
                ),
            ],
        ),
    ]
