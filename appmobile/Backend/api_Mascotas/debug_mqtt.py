import paho.mqtt.client as mqtt
import ssl
import time
import json
import sys

# Configuración MQTT
MQTT_BROKER = "z22e8be0.ala.us-east-1.emqxsl.com"
MQTT_PORT = 8883
MQTT_TOPIC = "ubicacion"
MQTT_CLIENT_ID = "debug-listener"
MQTT_USERNAME = "julian"
MQTT_PASSWORD = "1234"

# Contador de mensajes
mensajes_recibidos = 0

def on_connect(client, userdata, flags, rc):
    if rc == 0:
        print(f"✅ Conectado exitosamente al broker MQTT: {MQTT_BROKER}")
        client.subscribe(MQTT_TOPIC)
        print(f"✅ Suscrito al topic: {MQTT_TOPIC}")
        print("Esperando mensajes...")
    else:
        print(f"❌ Error al conectar, código: {rc}")
        sys.exit(1)

def on_message(client, userdata, msg):
    global mensajes_recibidos
    mensajes_recibidos += 1
    
    try:
        payload = msg.payload.decode('utf-8')
        data = json.loads(payload)
        print(f"\n📨 [{time.strftime('%H:%M:%S')}] Mensaje #{mensajes_recibidos} recibido:")
        print(f"  Topic: {msg.topic}")
        print(f"  Contenido: {payload}")
        print(f"  Datos: mascota={data.get('mascota')}, lat={data.get('latitude')}, lng={data.get('longitude')}")
        
        # Simulando envío a la API
        print(f"  Simulando POST a http://127.0.0.1:8000/location/location_list")
        
    except Exception as e:
        print(f"❌ Error procesando mensaje: {str(e)}")

def main():
    print("=== DEPURADOR DE CONEXIÓN MQTT ===")
    print(f"Este script se conectará al broker {MQTT_BROKER} y mostrará")
    print(f"todos los mensajes que lleguen al topic {MQTT_TOPIC} en tiempo real.")
    print("Presiona Ctrl+C para detener.\n")
    
    # Crear cliente MQTT
    client = mqtt.Client(client_id=MQTT_CLIENT_ID)
    
    # Configurar SSL/TLS
    context = ssl.create_default_context()
    context.check_hostname = True
    context.verify_mode = ssl.CERT_REQUIRED
    client.tls_set_context(context)
    
    # Asignar callbacks
    client.on_connect = on_connect
    client.on_message = on_message
    
    # Configurar credenciales
    client.username_pw_set(MQTT_USERNAME, MQTT_PASSWORD)
    
    try:
        # Conectar al broker
        print(f"🔄 Intentando conectar a {MQTT_BROKER}:{MQTT_PORT}...")
        client.connect(MQTT_BROKER, MQTT_PORT, 60)
        
        # Iniciar loop
        client.loop_forever()
        
    except KeyboardInterrupt:
        print("\nDepurador detenido por el usuario.")
        client.disconnect()
    except Exception as e:
        print(f"❌ Error: {str(e)}")
        sys.exit(1)

if __name__ == "__main__":
    main() 