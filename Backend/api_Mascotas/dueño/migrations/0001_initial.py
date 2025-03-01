# Generated by Django 5.1.3 on 2025-02-14 21:41

import datetime
from django.db import migrations, models


class Migration(migrations.Migration):

    initial = True

    dependencies = [
        ("mascotas", "0004_mascota_dueño"),
    ]

    operations = [
        migrations.CreateModel(
            name="Dueño",
            fields=[
                ("id", models.AutoField(primary_key=True, serialize=False)),
                ("nombre", models.CharField(max_length=100)),
                ("apellido", models.CharField(max_length=100)),
                ("email", models.EmailField(max_length=100)),
                ("telefono", models.CharField(max_length=100)),
                ("direccion", models.CharField(max_length=100)),
                ("ciudad", models.CharField(max_length=100)),
                ("fecha_creacion", models.DateTimeField(default=datetime.datetime.now)),
                (
                    "mascotas",
                    models.ManyToManyField(
                        related_name="dueños", to="mascotas.mascota"
                    ),
                ),
            ],
        ),
    ]
