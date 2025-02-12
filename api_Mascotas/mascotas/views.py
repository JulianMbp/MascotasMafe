import json
from django.shortcuts import render
from rest_framework import APIView
from rest_framework.response import Response
from rest_framework import status, permissions
from .models import Mascota
from .serializer import MascotaSerializer
from django.shortcuts import render
import base64

# Create your views here.

class MascotaView(APIView):
    def get(self,request,*args,**kwargs):
        mascotas = Mascota.objects.all()
        serializer = MascotaSerializer(mascotas, many=True)
        return Response(serializer.data)
    
    def post(self,request,*args,**kwargs):
        serializer = MascotaSerializer(data=request.data)
        data = {
            'nombre': request.data.get('nombre'),
            'peso': request.data.get('peso'),
            'edad': request.data.get('edad'),
            'especie': request.data.get('especie'),
            'raza': request.data.get('raza'),
            'fecha_nacimiento': request.data.get('fecha_nacimiento'),
        }
        serializer = MascotaSerializer(data=data)
        if serializer.is_valid():
            serializer.save()
            return Response(
                {
                    'message': 'Mascota creada correctamente',
                    'data': serializer.data
                },
                status=status.HTTP_201_CREATED
            )
        else:
            return Response(
                {
                    'message': 'Error al crear la mascota',
                    'data': serializer.errors
                },
                status=status.HTTP_400_BAD_REQUEST
            )
    
    def put(self,request,*args,**kwargs):
        mi_mascotta = Mascota.objects.filter(id=kwargs['pk']).update(
            nombre=request.data.get('nombre'),
            peso=request.data.get('peso'),
            edad=request.data.get('edad'),
            especie=request.data.get('especie'),
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
    def get_id(self,request,*args,**kwargs):
        id = kwargs['pk']
        if id:
            mascota = Mascota.objects.get(id=id)
            serializer = MascotaSerializer(mascota)
            return Response(serializer.data)
        else:
            return Response(
                {
                    'message': 'Mascota no encontrada',
                },
                status=status.HTTP_404_NOT_FOUND
            )