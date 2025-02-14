from django.shortcuts import render
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from .models import Dueño
from .serializer import DueñoSerializer

# Create your views here.
class DueñosList(APIView):
    def get(self, request):
        dueños = Dueño.objects.all()
        serializer = DueñoSerializer(dueños, many=True)
        return Response(serializer.data)

    def post(self, request):
        serializer = DueñoSerializer(data=request.data)
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
    
    def put(self, request, *args, **kwargs):
        dueño = self.get_object(kwargs['pk'])
        serializer = DueñoSerializer(dueño, data=request.data)
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
    
    def delete(self, request, *args, **kwargs):
        dueño = self.get_object(kwargs['pk'])
        dueño.delete()
        return Response(status=status.HTTP_204_NO_CONTENT)
    