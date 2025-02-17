from django.urls import path
from .views import LocationView, LocationMobileView

urlpatterns = [
    path('location_list', LocationView.as_view(), name='location'),
    path('<int:mascota_id>/', LocationView.as_view(), name='location-detail'),
    path('mobile/', LocationMobileView.as_view(), name='location-mobile'),
]
