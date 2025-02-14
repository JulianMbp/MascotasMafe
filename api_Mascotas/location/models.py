from django.db import models

class Location(models.Model):
    mascota = models.ForeignKey('mascotas.Mascota', on_delete=models.CASCADE, related_name='locations')
    latitude = models.DecimalField(max_digits=9, decimal_places=6)
    longitude = models.DecimalField(max_digits=9, decimal_places=6)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    is_active = models.BooleanField(default=True)

    class Meta:
        ordering = ['-created_at']

    def __str__(self):
        return f"Ubicación de {self.mascota.nombre}: ({self.latitude}, {self.longitude})"
