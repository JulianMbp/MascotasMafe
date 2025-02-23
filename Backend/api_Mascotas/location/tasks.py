from django.utils import timezone
from .models import Location
from celery import shared_task

@shared_task
def clean_old_locations():
    """Tarea programada para limpiar ubicaciones antiguas"""
    try:
        today = timezone.now().date()
        deleted_count = Location.objects.filter(created_at__date__lt=today).delete()[0]
        print(f"Se eliminaron {deleted_count} ubicaciones antiguas")
    except Exception as e:
        print(f"Error al limpiar ubicaciones antiguas: {str(e)}") 