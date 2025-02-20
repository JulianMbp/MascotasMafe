from django.utils import timezone
from datetime import timedelta
from .models import Location

def clean_old_locations():
    """
    Tarea programada para limpiar ubicaciones más antiguas que una semana
    """
    week_ago = timezone.now() - timedelta(days=7)
    old_locations = Location.objects.filter(created_at__lt=week_ago)
    count = old_locations.count()
    old_locations.delete()
    print(f"Cleaned {count} old locations") 