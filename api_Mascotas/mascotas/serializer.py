from rest_framework import serializers
from .models import Mascota
from dueño.serializer import DueñoSimpleSerializer
from location.serializer import LocationSerializer

class MascotaSerializer(serializers.ModelSerializer):
    dueño_info = DueñoSimpleSerializer(source='dueño', read_only=True)
    ultima_ubicacion = serializers.SerializerMethodField()

    class Meta:
        model = Mascota
        fields = ['id', 'nombre', 'peso', 'edad', 'especie', 'raza', 'imagen', 
                'fecha_nacimiento', 'fecha_creacion', 'dueño', 'dueño_info', 'ultima_ubicacion']

    def get_ultima_ubicacion(self, obj):
        ultima_location = obj.locations.filter(is_active=True).first()
        if ultima_location:
            return LocationSerializer(ultima_location).data
        return None

    def to_representation(self, instance):
        data = super().to_representation(instance)
        data['fecha_creacion'] = instance.fecha_creacion.strftime('%Y-%m-%d')
        return data