#!/usr/bin/env python
"""
Script para iniciar el servicio bridge MQTT-API
Uso: python iniciar_mqtt.py
"""
import os
import sys
import django

# Configurar entorno Django
os.environ.setdefault("DJANGO_SETTINGS_MODULE", "api_Mascotas.settings")
django.setup()

# Ahora se puede importar del proyecto Django
from location.mqtt_bridge import start_mqtt_bridge

if __name__ == "__main__":
    print("Iniciando servicio de bridge MQTT-API...")
    start_mqtt_bridge() 