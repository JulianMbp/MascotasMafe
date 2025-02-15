from django.shortcuts import render
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from .models import Location
from .serializer import LocationSerializer

# Create your views here.

class LocationView(APIView):
    def get(self, request, *args, **kwargs):
        if 'mascota_id' in request.query_params:
            # Obtener la última ubicación de una mascota específica
            locations = Location.objects.filter(
                mascota_id=request.query_params['mascota_id'],
                is_active=True
            ).first()
            if locations:
                serializer = LocationSerializer(locations)
                return Response(serializer.data)
            return Response(
                {'message': 'No se encontró ubicación para esta mascota'},
                status=status.HTTP_404_NOT_FOUND
            )
        
        # Obtener todas las ubicaciones activas
        locations = Location.objects.filter(is_active=True)
        serializer = LocationSerializer(locations, many=True)
        return Response(serializer.data)

    def post(self, request, *args, **kwargs):
        # Desactivar ubicaciones anteriores de la mascota
        Location.objects.filter(
            mascota_id=request.data.get('mascota'),
            is_active=True
        ).update(is_active=False)

        # Crear nueva ubicación
        serializer = LocationSerializer(data=request.data)
        if serializer.is_valid():
            serializer.save()
            return Response(
                {
                    'message': 'Ubicación registrada con éxito',
                    'data': serializer.data
                },
                status=status.HTTP_201_CREATED
            )
        return Response(
            {
                'message': 'Error al registrar ubicación',
                'errors': serializer.errors
            },
            status=status.HTTP_400_BAD_REQUEST
        )
