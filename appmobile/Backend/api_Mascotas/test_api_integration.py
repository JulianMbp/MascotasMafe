import paho.mqtt.client as mqtt
import ssl
import time
import json
import sys

# Configuración MQTT
MQTT_BROKER = "z22e8be0.ala.us-east-1.emqxsl.com"
MQTT_PORT = 8883
MQTT_TOPIC = "ubicacion"
MQTT_CLIENT_ID = "test-api-integration"
MQTT_USERNAME = "julian"
MQTT_PASSWORD = "1234"

def on_connect(client, userdata, flags, rc):
    if rc == 0:
        print(f"✅ Conectado exitosamente al broker MQTT: {MQTT_BROKER}")
        print(f"Preparado para enviar mensaje al topic: {MQTT_TOPIC}")
    else:
        print(f"❌ Error al conectar, código: {rc}")
        print("Saliendo...")
        sys.exit(1)

def on_publish(client, userdata, mid):
    print(f"✅ Mensaje publicado con éxito (ID: {mid})")
    print("El mensaje debería ser recibido por el suscriptor MQTT y reenviado a la API")
    print("Verifique los logs del servidor para confirmar que se procesó correctamente")

def main():
    print("=== PRUEBA DE INTEGRACIÓN MQTT -> API ===")
    print("Este script enviará un mensaje MQTT de prueba que debería ser")
    print("recibido por el suscriptor y enviado a la API local.")
    
    # Crear cliente MQTT
    client = mqtt.Client(client_id=MQTT_CLIENT_ID)
    
    # Configurar SSL/TLS
    context = ssl.create_default_context()
    context.check_hostname = True
    context.verify_mode = ssl.CERT_REQUIRED
    client.tls_set_context(context)
    
    # Asignar callbacks
    client.on_connect = on_connect
    client.on_publish = on_publish
    
    # Configurar credenciales
    client.username_pw_set(MQTT_USERNAME, MQTT_PASSWORD)
    
    try:
        # Conectar al broker
        print(f"🔄 Intentando conectar a {MQTT_BROKER}:{MQTT_PORT}...")
        client.connect(MQTT_BROKER, MQTT_PORT, 60)
        client.loop_start()
        
        # Dar tiempo para que se establezca la conexión
        time.sleep(2)
        
        # Datos de prueba
        location_data = {
            "mascota": 3,
            "latitude": -12.046374,
            "longitude": -77.042793
        }
        
        # Convertir a JSON
        mensaje = json.dumps(location_data)
        print(f"Enviando mensaje: {mensaje}")
        
        # Publicar mensaje con QoS 1 para garantizar entrega
        result = client.publish(MQTT_TOPIC, mensaje, qos=1)
        result.wait_for_publish()
        
        # Esperar un momento para que se procese
        print("Esperando 5 segundos para que se procese el mensaje...")
        time.sleep(5)
        
        # Limpiar
        client.disconnect()
        client.loop_stop()
        print("Test completado.")
        
    except Exception as e:
        print(f"❌ Error: {str(e)}")
        sys.exit(1)

if __name__ == "__main__":
    main() 