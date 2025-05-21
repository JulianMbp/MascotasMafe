from django.core.management.base import BaseCommand
from location.mqtt_bridge import start_mqtt_bridge

class Command(BaseCommand):
    help = 'Inicia el servicio de puente MQTT-API para recibir ubicaciones GPS'

    def handle(self, *args, **options):
        self.stdout.write(self.style.SUCCESS('Iniciando servicio de puente MQTT-API...'))
        self.stdout.write('Presiona Ctrl+C para detener el servicio')
        start_mqtt_bridge() 