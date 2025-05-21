import requests
import json
import time

# URL de la API para enviar datos de ubicación
LOCATION_API_URL = "http://127.0.0.1:8000/location/location_list"

def send_to_api(mascota_id, latitude, longitude):
    """Envía los datos de ubicación a la API mediante HTTP POST"""
    try:
        # Crear payload con los datos necesarios
        location_data = {
            'mascota': mascota_id,
            'latitude': latitude,
            'longitude': longitude
        }
        
        # Mostrar datos que se enviarán
        print(f"\nEnviando datos: {json.dumps(location_data, indent=2)}")
        
        # Realizar la petición POST a la API
        response = requests.post(
            LOCATION_API_URL,
            json=location_data,
            headers={'Content-Type': 'application/json'}
        )
        
        # Verificar respuesta
        print(f"Status code: {response.status_code}")
        if response.status_code in (200, 201):
            print(f"✅ Datos enviados correctamente a la API.")
            print(f"Respuesta: {response.text}")
            return True
        else:
            print(f"❌ Error al enviar datos a la API.")
            print(f"Respuesta: {response.text}")
            return False
    except Exception as e:
        print(f"❌ Error al enviar datos a la API: {str(e)}")
        return False

# Prueba 1: Enviar datos válidos
print("=== PRUEBA 1: Datos válidos ===")
send_to_api(3, 0, 0)

# Esperar 2 segundos
print("\nEsperando 2 segundos...")
time.sleep(2)

# Prueba 2: Enviar otro conjunto de datos
print("\n=== PRUEBA 2: Datos de prueba ===")
send_to_api(3, -12.046374, -77.042793)

print("\nPruebas completadas.") 