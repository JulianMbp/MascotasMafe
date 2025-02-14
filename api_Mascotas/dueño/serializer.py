from rest_framework import serializers
from .models import Dueño
from mascotas.models import Mascota

class MascotaSimpleSerializer(serializers.ModelSerializer):
    class Meta:
        model = Mascota
        fields = ['id', 'nombre', 'especie', 'raza', 'imagen', 'fecha_nacimiento']

class DueñoSerializer(serializers.ModelSerializer):
    mascotas = MascotaSimpleSerializer(many=True, read_only=True)

    class Meta:
        model = Dueño
        fields = ['id', 'nombre', 'apellido', 'email', 'telefono', 
                'direccion', 'ciudad', 'fecha_creacion', 'mascotas']

    def to_representation(self, instance):
        data = super().to_representation(instance)
        data['fecha_creacion'] = instance.fecha_creacion.strftime('%Y-%m-%d')
        return data
