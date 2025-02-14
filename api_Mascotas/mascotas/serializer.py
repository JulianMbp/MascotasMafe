from rest_framework import serializers
from .models import Mascota
from dueño.serializer import DueñoSimpleSerializer

class MascotaSerializer(serializers.ModelSerializer):
    dueño_info = DueñoSimpleSerializer(source='dueño', read_only=True)

    class Meta:
        model = Mascota
        fields = ['id', 'nombre', 'peso', 'edad', 'especie', 'raza', 'imagen', 
                'fecha_nacimiento', 'fecha_creacion', 'dueño', 'dueño_info']

    def to_representation(self, instance):
        data = super().to_representation(instance)
        data['fecha_creacion'] = instance.fecha_creacion.strftime('%Y-%m-%d')
        return data