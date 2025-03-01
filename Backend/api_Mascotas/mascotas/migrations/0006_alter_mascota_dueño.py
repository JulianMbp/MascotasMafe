# Generated by Django 5.1.3 on 2025-02-14 22:08

import django.db.models.deletion
from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ("dueño", "0002_remove_dueño_mascotas"),
        ("mascotas", "0005_alter_mascota_dueño_alter_mascota_id"),
    ]

    operations = [
        migrations.AlterField(
            model_name="mascota",
            name="dueño",
            field=models.ForeignKey(
                on_delete=django.db.models.deletion.CASCADE,
                related_name="mascotas",
                to="dueño.dueño",
            ),
        ),
    ]
