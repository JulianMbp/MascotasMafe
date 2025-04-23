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
        try:
            # Parámetros de la solicitud
            mascota_id = request.query_params.get('mascota_id')
            minutos = int(request.query_params.get('minutos', 30))  # Por defecto 30 minutos
            
            # Si se solicita una mascota específica
            if mascota_id:
                # Si solo queremos la última ubicación
                if request.query_params.get('ultima', 'false').lower() == 'true':
                    location = Location.objects.filter(
                        mascota_id=mascota_id
                    ).order_by('-created_at').first()
                    
                    if location:
                        serializer = LocationSerializer(location)
                        return Response(serializer.data)
                    return Response(
                        {'mensaje': 'No se encontró ubicación para esta mascota'},
                        status=status.HTTP_404_NOT_FOUND
                    )
                
                # Si queremos el historial reciente de una mascota
                time_limit = timezone.now() - timedelta(minutes=minutos)
                locations = Location.objects.filter(
                    mascota_id=mascota_id,
                    created_at__gte=time_limit
                ).order_by('-created_at')[:100]  # Máximo 100 ubicaciones
                
                serializer = LocationSerializer(locations, many=True)
                return Response(serializer.data)
            
            # Si no se especifica mascota, devolver ubicaciones recientes de todas las mascotas
            time_limit = timezone.now() - timedelta(minutes=minutos)
            locations = Location.objects.filter(
                created_at__gte=time_limit
            ).order_by('-created_at')[:100]  # Máximo 100 ubicaciones
            
            serializer = LocationSerializer(locations, many=True)
            return Response(serializer.data)
            
        except Exception as e:
            print(f"Error en LocationView.get: {str(e)}")
            return Response(
                {'error': str(e)},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )

    def post(self, request, *args, **kwargs):
        # Crear nueva ubicación sin desactivar las anteriores
        serializer = LocationSerializer(data=request.data)
        if serializer.is_valid():
            serializer.save()
            return Response(
                {
                    'mensaje': 'Ubicación registrada con éxito',
                    'data': serializer.data
                },
                status=status.HTTP_201_CREATED
            )
        return Response(
            {
                'mensaje': 'Error al registrar ubicación',
                'errores': serializer.errors
            },
            status=status.HTTP_400_BAD_REQUEST
        )

    def clean_old_locations(self):
        """Elimina las ubicaciones más antiguas que una semana para mantener la base de datos eficiente"""
        try:
            week_ago = timezone.now() - timedelta(days=7)
            deleted, _ = Location.objects.filter(created_at__lt=week_ago).delete()
            if deleted > 0:
                print(f"Se eliminaron {deleted} ubicaciones antiguas")
        except Exception as e:
            print(f"Error al limpiar ubicaciones antiguas: {str(e)}")

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
        # Obtener parámetros de la solicitud
        last_id = request.query_params.get('last_id', 0)
        mascota_id = request.query_params.get('mascota_id')
        minutos = int(request.query_params.get('minutos', 30))  # Por defecto 30 minutos
        
        # Calcular el tiempo límite (normalmente 30 minutos atrás)
        time_limit = timezone.now() - timedelta(minutes=minutos)
        
        # Iniciar la consulta base
        query = Location.objects.filter(
            created_at__gte=time_limit  # Solo ubicaciones de los últimos X minutos
        )
        
        # Filtrar por ID (opcional)
        if last_id and int(last_id) > 0:
            query = query.filter(id__gt=int(last_id))
            
        # Filtrar por mascota si se proporciona
        if mascota_id:
            query = query.filter(mascota_id=mascota_id)
        
        # Ordenar y limitar resultados
        latest_locations = query.select_related('mascota').order_by('-created_at')[:100]  # Máximo 100 ubicaciones
        
        print(f"Obteniendo ubicaciones de los últimos {minutos} minutos. Encontradas: {latest_locations.count()}")
        
        serializer = LocationSerializer(latest_locations, many=True)
        return Response(serializer.data)
    except Exception as e:
        print(f"Error in get_latest_locations: {str(e)}")
        return Response(
            {'error': str(e)},
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )
