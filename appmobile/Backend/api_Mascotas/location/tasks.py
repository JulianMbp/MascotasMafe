from django.utils import timezone
from .models import Location
from celery import shared_task
import paho.mqtt.client as mqtt
import json
import time
import ssl
import logging
import requests
from django.conf import settings

# Configurar logger
logger = logging.getLogger(__name__)

# Configuración MQTT desde settings.py o valores por defecto
MQTT_BROKER = "z22e8be0.ala.us-east-1.emqxsl.com"
MQTT_PORT = 8883
MQTT_TOPIC = "ubicacion"
MQTT_CLIENT_ID = "django-backend-mascota-api"
MQTT_USERNAME = "julian"
MQTT_PASSWORD = "1234"

# URL de la API para enviar datos de ubicación
LOCATION_API_URL = "http://127.0.0.1:8000/location/location_list"

@shared_task
def clean_old_locations():
    """Tarea programada para limpiar ubicaciones antiguas"""
    try:
        today = timezone.now().date()
        deleted_count = Location.objects.filter(created_at__date__lt=today).delete()[0]
        print(f"Se eliminaron {deleted_count} ubicaciones antiguas")
    except Exception as e:
        print(f"Error al limpiar ubicaciones antiguas: {str(e)}")

def send_to_api(data):
    """Envía los datos de ubicación a la API mediante HTTP POST"""
    try:
        # Verificar que los datos contienen los campos necesarios
        if all(k in data for k in ['mascota', 'latitude', 'longitude']):
            # Extraer solo los campos necesarios para evitar enviar datos extras
            location_data = {
                'mascota': data['mascota'],
                'latitude': data['latitude'],
                'longitude': data['longitude']
            }
            
            # Realizar la petición POST a la API
            response = requests.post(
                LOCATION_API_URL,
                json=location_data,
                headers={'Content-Type': 'application/json'}
            )
            
            # Verificar respuesta
            if response.status_code in (200, 201):
                logger.info(f"✅ Datos enviados correctamente a la API. Status: {response.status_code}")
                return True
            else:
                logger.error(f"❌ Error al enviar datos a la API. Status: {response.status_code}, Respuesta: {response.text}")
                return False
        else:
            logger.warning("❌ Datos incompletos para enviar a la API")
            return False
    except Exception as e:
        logger.error(f"❌ Error al enviar datos a la API: {str(e)}")
        return False

@shared_task
def start_mqtt_listener():
    """Tarea para iniciar el cliente MQTT y suscribirse al topic de ubicaciones"""
    try:
        logger.info(f"Iniciando suscriptor MQTT: {MQTT_BROKER}:{MQTT_PORT} en topic: {MQTT_TOPIC}")
        
        # Callbacks para la conexión MQTT
        def on_connect(client, userdata, flags, rc):
            if rc == 0:
                logger.info("✅ Conectado exitosamente al broker MQTT")
                # Suscribirse al topic
                client.subscribe(MQTT_TOPIC)
                logger.info(f"✅ Suscrito al topic: {MQTT_TOPIC}")
            else:
                logger.error(f"❌ Error al conectar, código: {rc}")
                rc_codes = {
                    0: "Conexión exitosa",
                    1: "Versión de protocolo incorrecta",
                    2: "Identificador de cliente rechazado",
                    3: "Servidor no disponible",
                    4: "Credenciales incorrectas",
                    5: "No autorizado"
                }
                logger.error(f"Razón: {rc_codes.get(rc, 'Desconocido')}")

        def on_message(client, userdata, msg):
            try:
                # Decodificar el mensaje JSON
                payload = msg.payload.decode('utf-8')
                logger.info(f"📨 Mensaje recibido en {msg.topic}: {payload}")
                
                # Parsear el JSON
                data = json.loads(payload)
                
                # Extraer datos (soportar diferentes formatos)
                mascota_id = data.get("mascota", None)
                latitude = data.get("latitude", None)
                longitude = data.get("longitude", None)
                
                # Verificar que tenemos todos los datos necesarios
                if mascota_id is None or latitude is None or longitude is None:
                    logger.warning(f"❌ Datos incompletos en el mensaje: {data}")
                    return
                
                # 1. Guardar en la base de datos local
                try:
                    location = Location(
                        mascota_id=mascota_id,
                        latitude=latitude,
                        longitude=longitude
                    )
                    location.save()
                    logger.info(f"✅ Ubicación guardada en BD local - Mascota ID: {mascota_id}, Coords: {latitude},{longitude}")
                except Exception as e:
                    logger.error(f"❌ Error al guardar en base de datos: {str(e)}")
                
                # 2. Enviar a la API por HTTP
                api_sent = send_to_api(data)
                if api_sent:
                    logger.info(f"✅ Datos enviados a la API - Mascota ID: {mascota_id}")
                else:
                    logger.warning(f"⚠️ No se pudieron enviar los datos a la API - Mascota ID: {mascota_id}")
            
            except json.JSONDecodeError:
                logger.error(f"❌ Error al decodificar JSON: {payload}")
            except Exception as e:
                logger.error(f"❌ Error procesando mensaje: {str(e)}")

        # Crear cliente MQTT con ID único
        client = mqtt.Client(client_id=MQTT_CLIENT_ID)
        
        # Configurar SSL/TLS
        context = ssl.create_default_context()
        context.check_hostname = True
        context.verify_mode = ssl.CERT_REQUIRED
        client.tls_set_context(context)
        
        # Asignar callbacks
        client.on_connect = on_connect
        client.on_message = on_message
        
        # Configurar credenciales si existen
        if MQTT_USERNAME and MQTT_PASSWORD:
            client.username_pw_set(MQTT_USERNAME, MQTT_PASSWORD)
            logger.info(f"Usando credenciales - Usuario: {MQTT_USERNAME}")
        
        # Conectar al broker
        logger.info(f"Intentando conectar a {MQTT_BROKER}:{MQTT_PORT}...")
        client.connect(MQTT_BROKER, MQTT_PORT, 60)
        
        # Iniciar el loop en primer plano (blocking)
        logger.info("🔄 Iniciando loop MQTT...")
        client.loop_forever()
        
    except Exception as e:
        logger.error(f"❌ Error crítico en cliente MQTT: {str(e)}")
        # Esperar antes de reintentar
        time.sleep(10)
        return start_mqtt_listener()

@shared_task
def start_mqtt_daemon():
    """Tarea para iniciar el cliente MQTT como daemon (mejor para producción)"""
    try:
        client = mqtt.Client(client_id=MQTT_CLIENT_ID)
        
        def on_connect(client, userdata, flags, rc):
            if rc == 0:
                logger.info("✅ Conectado exitosamente al broker MQTT")
                client.subscribe(MQTT_TOPIC)
                logger.info(f"✅ Suscrito al topic: {MQTT_TOPIC}")
            else:
                logger.error(f"❌ Error al conectar, código: {rc}")

        def on_message(client, userdata, msg):
            try:
                payload = msg.payload.decode('utf-8')
                data = json.loads(payload)
                
                mascota_id = data.get("mascota", None)
                latitude = data.get("latitude", None)
                longitude = data.get("longitude", None)
                
                if all([mascota_id, latitude, longitude]):
                    # 1. Guardar en base de datos local
                    location = Location(
                        mascota_id=mascota_id,
                        latitude=latitude,
                        longitude=longitude
                    )
                    location.save()
                    logger.info(f"✅ Ubicación guardada en BD local - Mascota ID: {mascota_id}")
                    
                    # 2. Enviar a la API por HTTP
                    api_sent = send_to_api(data)
                    if api_sent:
                        logger.info(f"✅ Datos enviados a la API - Mascota ID: {mascota_id}")
                    else:
                        logger.warning(f"⚠️ No se pudieron enviar los datos a la API - Mascota ID: {mascota_id}")
            except Exception as e:
                logger.error(f"❌ Error: {str(e)}")

        # Configurar SSL/TLS
        context = ssl.create_default_context()
        client.tls_set_context(context)
        
        # Asignar callbacks
        client.on_connect = on_connect
        client.on_message = on_message
        
        # Configurar credenciales
        client.username_pw_set(MQTT_USERNAME, MQTT_PASSWORD)
        
        # Conectar al broker
        client.connect(MQTT_BROKER, MQTT_PORT, 60)
        
        # Iniciar loop en background (non-blocking)
        client.loop_start()
        
        # Mantener la tarea activa
        while True:
            time.sleep(60)
            
    except Exception as e:
        logger.error(f"❌ Error en daemon MQTT: {str(e)}")
        time.sleep(10)
        return start_mqtt_daemon() 