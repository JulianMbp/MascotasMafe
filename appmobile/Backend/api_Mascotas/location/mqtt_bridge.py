import paho.mqtt.client as mqtt
import ssl
import time
import json
import sys
import requests
import logging
from django.conf import settings
from .models import Location

# Configurar logger
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

# Configuración MQTT
MQTT_BROKER = "z22e8be0.ala.us-east-1.emqxsl.com"
MQTT_PORT = 8883
MQTT_TOPIC = "ubicacion"
MQTT_CLIENT_ID = "django-backend-mqtt-bridge"
MQTT_USERNAME = "julian"
MQTT_PASSWORD = "1234"

# URL de la API para enviar datos de ubicación
LOCATION_API_URL = "http://127.0.0.1:8000/location/location_list"

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
            logger.info(f"Enviando datos a {LOCATION_API_URL}: {json.dumps(location_data)}")
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

def save_to_database(data):
    """Guarda los datos de ubicación directamente en la base de datos"""
    try:
        mascota_id = data.get("mascota", None)
        latitude = data.get("latitude", None)
        longitude = data.get("longitude", None)
        
        if all([mascota_id, latitude, longitude]):
            location = Location(
                mascota_id=mascota_id,
                latitude=latitude,
                longitude=longitude
            )
            location.save()
            logger.info(f"✅ Ubicación guardada en BD local - Mascota ID: {mascota_id}, Coords: {latitude},{longitude}")
            return True
        else:
            logger.warning(f"❌ Datos incompletos para guardar en BD: {data}")
            return False
    except Exception as e:
        logger.error(f"❌ Error al guardar en base de datos: {str(e)}")
        return False

def start_mqtt_bridge():
    """Inicia el puente MQTT-API que escucha mensajes y los envía directamente a la API"""
    
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
            
            # 1. Guardar en la base de datos local
            db_saved = save_to_database(data)
            
            # 2. Enviar a la API por HTTP
            api_sent = send_to_api(data)
            
            if db_saved and api_sent:
                logger.info(f"✅ Datos procesados completamente - Mascota ID: {data.get('mascota')}")
            else:
                logger.warning(f"⚠️ Datos procesados parcialmente - DB: {db_saved}, API: {api_sent}")
            
        except json.JSONDecodeError:
            logger.error(f"❌ Error al decodificar JSON: {payload}")
        except Exception as e:
            logger.error(f"❌ Error procesando mensaje: {str(e)}")

    try:
        logger.info("=== INICIANDO BRIDGE MQTT-API ===")
        logger.info(f"Broker: {MQTT_BROKER}:{MQTT_PORT}")
        logger.info(f"Topic: {MQTT_TOPIC}")
        logger.info(f"API URL: {LOCATION_API_URL}")
        
        # Crear cliente MQTT con ID único
        client = mqtt.Client(client_id=MQTT_CLIENT_ID)
        
        # Configurar SSL/TLS
        context = ssl.create_default_context()
        context.check_hostname = False  # Desactivar verificación de hostname
        context.verify_mode = ssl.CERT_NONE  # Desactivar verificación de certificado
        client.tls_set_context(context)
        
        # Asignar callbacks
        client.on_connect = on_connect
        client.on_message = on_message
        
        # Configurar credenciales
        client.username_pw_set(MQTT_USERNAME, MQTT_PASSWORD)
        
        # Conectar al broker
        logger.info(f"Intentando conectar a {MQTT_BROKER}:{MQTT_PORT}...")
        try:
            client.connect(MQTT_BROKER, MQTT_PORT, 60)
        except Exception as e:
            logger.error(f"❌ Error detallado de conexión MQTT: {type(e).__name__}: {str(e)}")
            logger.error("Verificando conectividad...")
            import socket
            try:
                socket_info = socket.getaddrinfo(MQTT_BROKER, MQTT_PORT)
                logger.info(f"Info de resolución DNS: {socket_info}")
                s = socket.socket(socket.AF_INET, socket.SOCK_STREAM)
                s.settimeout(10)
                s.connect((MQTT_BROKER, MQTT_PORT))
                s.close()
                logger.info(f"✅ Conexión socket exitosa a {MQTT_BROKER}:{MQTT_PORT}")
            except Exception as socket_error:
                logger.error(f"❌ Error de socket: {type(socket_error).__name__}: {str(socket_error)}")
            raise
        
        # Iniciar el loop en primer plano (blocking)
        logger.info("🔄 Iniciando loop MQTT...")
        client.loop_forever()
        
    except KeyboardInterrupt:
        logger.info("\nServicio detenido por el usuario.")
        client.disconnect()
    except Exception as e:
        logger.error(f"❌ Error crítico en bridge MQTT: {str(e)}")
        # Esperar antes de reintentar
        time.sleep(10)
        return start_mqtt_bridge()

# Para ejecutar directamente: python manage.py shell -c "from location.mqtt_bridge import start_mqtt_bridge; start_mqtt_bridge()"
if __name__ == "__main__":
    print("Este módulo debe ejecutarse desde Django.")
    print("Ejecuta: python manage.py shell -c \"from location.mqtt_bridge import start_mqtt_bridge; start_mqtt_bridge()\"") 