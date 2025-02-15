from django.urls import path
from .views import LocationView

urlpatterns = [
    path('', LocationView.as_view(), name='location'),
    path('<int:mascota_id>/', LocationView.as_view(), name='location-detail'),
]
