from rest_framework import serializers
from .models import Mascota

class MascotaSerializer(serializers.ModelSerializer):
    class Meta:
        model = Mascota
        fields = ['id', 'nombre', 'peso', 'edad', 'especie', 'raza', 'imagen', 'fecha_nacimiento', 'fecha_creacion']

    def to_representation(self, instance):
        data = super().to_representation(instance)
        data['date_created'] = instance.fecha_creacion.strftime('%Y-%m-%d')
        return data