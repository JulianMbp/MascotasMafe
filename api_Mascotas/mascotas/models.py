from django.db import models
from datetime import datetime

# Create your models here.
class Mascota(models.Model):
    id = models.AutoField(primary_key=True)
    nombre = models.CharField(max_length=100)
    peso = models.DecimalField(max_digits=5, decimal_places=2)
    edad = models.IntegerField()
    especie = models.CharField(max_length=100)
    raza = models.CharField(max_length=100)
    imagen = models.TextField(null=True)
    fecha_nacimiento = models.DateField(null=True, blank=True)
    fecha_creacion = models.DateTimeField(default=datetime.now)
    dueño = models.ForeignKey('dueño.Dueño', on_delete=models.CASCADE, related_name='mascotas')
    def __str__(self):
        return self.nombre
