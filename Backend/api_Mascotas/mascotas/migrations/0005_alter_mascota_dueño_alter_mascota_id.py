# Generated by Django 5.1.3 on 2025-02-14 21:41

import django.db.models.deletion
from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ("dueño", "0001_initial"),
        ("mascotas", "0004_mascota_dueño"),
    ]

    operations = [
        migrations.AlterField(
            model_name="mascota",
            name="dueño",
            field=models.ForeignKey(
                on_delete=django.db.models.deletion.CASCADE,
                related_name="mascota",
                to="dueño.dueño",
            ),
        ),
        migrations.AlterField(
            model_name="mascota",
            name="id",
            field=models.AutoField(primary_key=True, serialize=False),
        ),
    ]
