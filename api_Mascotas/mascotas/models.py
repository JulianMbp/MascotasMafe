from django.db import models
from datetime import datetime

# Create your models here.

class Mascota(models.Model):
    nombre = models.CharField(max_length=100)
    peso = models.DecimalField(max_digits=5, decimal_places=2)
    edad = models.IntegerField()
    especie = models.CharField(max_length=100)
    raza = models.CharField(max_length=100)
    fecha_nacimiento = models.DateField()
    fecha_creacion = models.DateTimeField(default=datetime.now)
    def __str__(self):
        return self.nombre
