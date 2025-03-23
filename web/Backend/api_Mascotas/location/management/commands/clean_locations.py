from django.core.management.base import BaseCommand
from django.utils import timezone
from datetime import timedelta
from location.models import Location

class Command(BaseCommand):
    help = 'Elimina registros de ubicación de días anteriores'

    def handle(self, *args, **options):
        # Obtener la fecha de ayer
        yesterday = timezone.now().date() - timedelta(days=1)
        
        # Eliminar registros anteriores a hoy
        deleted_count = Location.objects.filter(
            created_at__date__lt=timezone.now().date()
        ).delete()[0]
        
        self.stdout.write(
            self.style.SUCCESS(f'Se eliminaron {deleted_count} registros de ubicación antiguos')
        ) 