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
        # Obtener la última ubicación por fecha de creación
        ultima_location = obj.locations.order_by('-created_at').first()
        if ultima_location:
            return {
                'id': ultima_location.id,
                'latitude': ultima_location.latitude,
                'longitude': ultima_location.longitude,
                'created_at': ultima_location.created_at
            }
        return None

    def to_representation(self, instance):
        data = super().to_representation(instance)
        data['fecha_creacion'] = instance.fecha_creacion.strftime('%Y-%m-%d')
        return data