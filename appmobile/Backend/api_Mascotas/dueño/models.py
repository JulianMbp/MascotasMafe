from django.db import models
from datetime import datetime

# Create your models here.
class Dueño(models.Model):
    id = models.AutoField(primary_key=True)
    nombre = models.CharField(max_length=100)
    apellido = models.CharField(max_length=100)
    email = models.EmailField(max_length=100)
    telefono = models.CharField(max_length=100)
    direccion = models.CharField(max_length=100)
    ciudad = models.CharField(max_length=100)
    fecha_creacion = models.DateTimeField(default=datetime.now)

    def __str__(self):
        return f"{self.nombre} {self.apellido}"
