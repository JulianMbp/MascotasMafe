from rest_framework import serializers
from .models import Location

class LocationSerializer(serializers.ModelSerializer):
    class Meta:
        model = Location
        fields = ['id', 'mascota', 'latitude', 'longitude', 'created_at', 'updated_at', 'is_active']
        read_only_fields = ['created_at', 'updated_at']
