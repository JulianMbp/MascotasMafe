import json
from django.shortcuts import render
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status, permissions
from mascotas.models import Mascota
from mascotas.serializer import MascotaSerializer
import base64


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
        # Crear el diccionario con los datos
        imagen = request.FILES.get('imagen')
        if imagen:
            imagen_bytes = imagen.read()
            imagen_base64 = base64.b64encode(imagen_bytes).decode('utf-8')
        else:
            imagen_base64 = None

        data = {
            'nombre': request.data.get('nombre'),
            'peso': request.data.get('peso'),
            'edad': request.data.get('edad'),
            'especie': request.data.get('especie'),
            'imagen': imagen_base64,
            'raza': request.data.get('raza'),
            'fecha_nacimiento': request.data.get('fecha_nacimiento'),
            'dueño': request.data.get('dueño'),
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
    
    def put(self,request,*args,**kwargs):
        mi_mascotta = Mascota.objects.filter(id=kwargs['pk']).update(
            nombre=request.data.get('nombre'),
            peso=request.data.get('peso'),
            edad=request.data.get('edad'),
            especie=request.data.get('especie'),
            imagen=request.data.get('imagen'),
            raza=request.data.get('raza'),
            fecha_nacimiento=request.data.get('fecha_nacimiento'),
        )
        return Response(
            {
                'message': 'Mascota actualizada correctamente',
                'data': mi_mascotta
            },
            status=status.HTTP_200_OK
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