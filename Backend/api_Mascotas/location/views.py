from django.shortcuts import render
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from .models import Location
from .serializer import LocationSerializer
from django.views.decorators.csrf import csrf_exempt
from django.utils.decorators import method_decorator
from django.utils import timezone
from datetime import timedelta
from rest_framework.decorators import api_view

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
            # Ya no llamamos a clean_old_locations aquí
            # self.clean_old_locations(request.data.get('mascota'))
            
            # Obtener datos de la app móvil
            data = {
                'latitude': request.data.get('latitud'),
                'longitude': request.data.get('longitud'),
                'mascota': request.data.get('mascota')
            }

            # Verificar que la mascota existe
            if not data['mascota']:
                return Response(
                    {'mensaje': 'Error: ID de mascota no proporcionado'},
                    status=status.HTTP_400_BAD_REQUEST
                )

            # Crear nueva ubicación
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

    # Opcional: Mantener este método pero modificado para limpiar ubicaciones muy antiguas
    def clean_old_locations(self, mascota_id):
        """Limpia ubicaciones más antiguas que una semana"""
        if mascota_id:
            # Mantener solo una semana de historial
            week_ago = timezone.now() - timedelta(days=7)
            Location.objects.filter(
                mascota_id=mascota_id,
                created_at__lt=week_ago
            ).delete()

@api_view(['GET'])
def get_latest_locations(request):
    try:
        last_id = request.query_params.get('last_id', 0)
        
        # Obtener ubicaciones más recientes que el último ID
        latest_locations = Location.objects.filter(
            id__gt=last_id
        ).select_related('mascota').order_by('id')  # Ordenar por ID ascendente
        
        print(f"Fetching locations after ID {last_id}. Found {latest_locations.count()} new locations.")
        
        serializer = LocationSerializer(latest_locations, many=True)
        return Response(serializer.data)
    except Exception as e:
        print(f"Error in get_latest_locations: {str(e)}")
        return Response(
            {'error': str(e)},
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )
