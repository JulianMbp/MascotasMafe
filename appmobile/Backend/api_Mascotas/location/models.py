from django.db import models

class Location(models.Model):
    mascota = models.ForeignKey('mascotas.Mascota', related_name='locations', on_delete=models.CASCADE)
    latitude = models.DecimalField(max_digits=13, decimal_places=10)
    longitude = models.DecimalField(max_digits=13, decimal_places=10)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    is_active = models.BooleanField(default=True)

    class Meta:
        ordering = ['-created_at']

    def __str__(self):
        return f"Ubicación de {self.mascota.nombre}: ({self.latitude}, {self.longitude})"
