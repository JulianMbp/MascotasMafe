from django.urls import path
from django.contrib import admin
from .views import DueñosList
from .models import Dueño

admin.site.register(Dueño)

urlpatterns = [
    path('dueños_list', DueñosList.as_view()),
    path('dueños_create', DueñosList.as_view()),
    path('dueños_update/<int:pk>', DueñosList.as_view(), name='dueños_update'),
    path('dueños_delete/<int:pk>', DueñosList.as_view(), name='dueños_delete'),
    path('dueños_id/<int:pk>', DueñosList.as_view(), name='dueños_id'),
]