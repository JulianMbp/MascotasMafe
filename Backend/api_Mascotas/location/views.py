from django.shortcuts import render
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from .models import Location
from .serializer import LocationSerializer
from django.views.decorators.csrf import csrf_exempt
from django.utils.decorators import method_decorator

# Create your views here.

class LocationView(APIView):
    def get(self, request, *args, **kwargs):
        if 'mascota_id' in request.query_params:
            # Obtener la última ubicación de una mascota específica
            locations = Location.objects.filter(
                mascota_id=request.query_params['mascota_id']
            ).order_by('-created_at').first()  # Ordenar por fecha de creación descendente
            if locations:
                serializer = LocationSerializer(locations)
                return Response(serializer.data)
            return Response(
                {'message': 'No se encontró ubicación para esta mascota'},
                status=status.HTTP_404_NOT_FOUND
            )
        
        # Obtener todas las ubicaciones
        locations = Location.objects.all().order_by('-created_at')  # Ordenar por fecha de creación descendente
        serializer = LocationSerializer(locations, many=True)
        return Response(serializer.data)

    def post(self, request, *args, **kwargs):
        # Crear nueva ubicación sin desactivar las anteriores
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

@method_decorator(csrf_exempt, name='dispatch')
class LocationMobileView(APIView):
    def post(self, request, *args, **kwargs):
        try:
            # Obtener datos de la app móvil
            data = {
                'latitude': request.data.get('latitud'),
                'longitude': request.data.get('longitud'),
                'mascota': request.data.get('mascota')
            }

            # Verificar que la mascota existe antes de continuar
            if not data['mascota']:
                return Response(
                    {
                        'mensaje': 'Error: ID de mascota no proporcionado',
                    },
                    status=status.HTTP_400_BAD_REQUEST
                )

            # Crear nueva ubicación sin desactivar las anteriores
            serializer = LocationSerializer(data=data)
            if serializer.is_valid():
                serializer.save()
                return Response(
                    {
                        'mensaje': 'Ubicación recibida y almacenada correctamente',
                        'data': serializer.data
                    },
                    status=status.HTTP_201_CREATED
                )
            return Response(
                {
                    'mensaje': 'Error al procesar los datos de ubicación',
                    'errores': serializer.errors
                },
                status=status.HTTP_400_BAD_REQUEST
            )
        except Exception as e:
            return Response(
                {
                    'mensaje': 'Error al procesar la solicitud',
                    'error': str(e)
                },
                status=status.HTTP_400_BAD_REQUEST
            )
