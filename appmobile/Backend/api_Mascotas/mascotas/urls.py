from django.urls import path
from django.contrib import admin
from .views import MascotaView
from .models import Mascota

admin.site.register(Mascota)

urlpatterns = [
    path('mascotas_list', MascotaView.as_view() ),
    path('mascotas_create', MascotaView.as_view()),
    path('mascotas_update/<int:pk>', MascotaView.as_view(), name='mascotas_update'),
    path('mascotas_delete/<int:pk>', MascotaView.as_view(), name='mascotas_delete'),
    path('mascotas_id/<int:pk>', MascotaView.as_view(), name='mascotas_id'),
]
