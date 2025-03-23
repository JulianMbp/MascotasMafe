import json
import base64
from django.shortcuts import render
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status, permissions
from mascotas.models import Mascota
from mascotas.serializer import MascotaSerializer


# Create your views here.

class MascotaView(APIView):
    def get(self, request, *args, **kwargs):
        # Verificar si se proporciona un 'pk' o un 'nombre'
        if 'pk' in kwargs:
            id = kwargs['pk']
            try:
                mascota = Mascota.objects.get(id=id)
                serializer = MascotaSerializer(mascota)
                return Response(serializer.data)
            except Mascota.DoesNotExist:
                return Response(
                    {
                        'message': 'Mascota no encontrada',
                    },
                    status=status.HTTP_404_NOT_FOUND
                )
        elif 'nombre' in request.query_params:
            nombre = request.query_params['nombre']
            try:
                mascota = Mascota.objects.get(nombre=nombre)
                serializer = MascotaSerializer(mascota)
                return Response(serializer.data)
            except Mascota.DoesNotExist:
                return Response(
                    {
                        'message': 'Mascota no encontrada',
                    },
                    status=status.HTTP_404_NOT_FOUND
                )
        else:
            # Este bloque maneja la lista de todas las mascotas
            mascotas = Mascota.objects.all()
            serializer = MascotaSerializer(mascotas, many=True)
            return Response(serializer.data)
    
    def post(self, request, *args, **kwargs):
        try:
            # Obtener la imagen del request
            imagen = request.FILES.get('imagen')
            imagen_base64 = None

            if imagen:
                # Leer la imagen y convertirla a base64
                imagen_bytes = imagen.read()
                imagen_base64 = base64.b64encode(imagen_bytes).decode('utf-8')

            # Crear el diccionario con los datos
            data = {
                'nombre': request.data.get('nombre'),
                'peso': request.data.get('peso'),
                'edad': request.data.get('edad'),
                'especie': request.data.get('especie'),
                'raza': request.data.get('raza'),
                'fecha_nacimiento': request.data.get('fecha_nacimiento'),
                'dueño': request.data.get('dueño'),
                'imagen': imagen_base64,
            }

            # Usar el serializer para validar y guardar
            serializador = MascotaSerializer(data=data)
            if serializador.is_valid():
                serializador.save()
                return Response(
                    {
                        "message": "Mascota creada con éxito",
                        "data": serializador.data,
                    },
                    status=status.HTTP_201_CREATED
                )
            else:
                return Response(
                    {
                        "message": "Error al crear mascota",
                        "data": serializador.errors,
                    },
                    status=status.HTTP_400_BAD_REQUEST
                )
        except Exception as e:
            print(f"Error al procesar la imagen: {str(e)}")
            return Response(
                {
                    "message": "Error al procesar la imagen",
                    "error": str(e)
                },
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )
    
    def put(self, request, *args, **kwargs):
        try:
            mascota = Mascota.objects.get(id=kwargs['pk'])
            
            # Manejar la imagen
            imagen = request.FILES.get('imagen')
            imagen_base64 = None
            
            if imagen:
                # Si hay una nueva imagen, convertirla a base64
                imagen_bytes = imagen.read()
                imagen_base64 = base64.b64encode(imagen_bytes).decode('utf-8')
            elif 'imagen_existente' in request.data:
                # Si no hay nueva imagen pero hay una existente, mantenerla
                imagen_base64 = request.data.get('imagen_existente')
            else:
                # Si no hay imagen nueva ni existente, mantener la actual
                imagen_base64 = mascota.imagen

            # Crear el diccionario con los datos actualizados
            data = {
                'nombre': request.data.get('nombre'),
                'peso': request.data.get('peso'),
                'edad': request.data.get('edad'),
                'especie': request.data.get('especie'),
                'raza': request.data.get('raza'),
                'fecha_nacimiento': request.data.get('fecha_nacimiento'),
                'dueño': request.data.get('dueño'),
                'imagen': imagen_base64,
            }

            serializador = MascotaSerializer(mascota, data=data)
            if serializador.is_valid():
                serializador.save()
                return Response(
                    {
                        "message": "Mascota actualizada con éxito",
                        "data": serializador.data
                    },
                    status=status.HTTP_200_OK
                )
            else:
                return Response(
                    {
                        "message": "Error al actualizar mascota",
                        "errors": serializador.errors
                    },
                    status=status.HTTP_400_BAD_REQUEST
                )
        except Mascota.DoesNotExist:
            return Response(
                {"message": "Mascota no encontrada"},
                status=status.HTTP_404_NOT_FOUND
            )
        except Exception as e:
            print(f"Error al actualizar la mascota: {str(e)}")
            return Response(
                {
                    "message": "Error al actualizar la mascota",
                    "error": str(e)
                },
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )
    
    def delete(self,request,*args,**kwargs):
        mi_mascotta = Mascota.objects.filter(id=kwargs['pk']).delete()
        return Response(
            {
                'message': 'Mascota eliminada correctamente',
                'data': mi_mascotta
            },
            status=status.HTTP_200_OK
        )