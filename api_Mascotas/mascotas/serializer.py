from rest_framework import serializers
from .models import Mascota

class MascotaSerializer(serializers.ModelSerializer):
    class Meta:
        model = Mascota
        fields = 'id, nombre, peso, edad, especie, raza, fecha_nacimiento, fecha_creacion'
        read_only_fields = 'fecha_creacion'

    def to_representation(self, instance):
        data = super().to_representation(instance)
        data['date_created'] = instance.fecha_creacion.strftime('%Y-%m-%d')
        data['date_birth'] = instance.fecha_nacimiento.strftime('%Y-%m-%d')
        data['edad'] = instance.age()
        return data