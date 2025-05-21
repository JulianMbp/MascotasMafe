#include <Wire.h>
#include <TinyGPS++.h>
#include <WiFi.h>
#include <ArduinoJson.h>
#include <PubSubClient.h>

// Configuración de pines GPS
#define RXD2 16
#define TXD2 17
HardwareSerial neogps(1);
char datoCmd = 0;

#define NMEA 0

// ID de mascota (estático)
const int ID_MASCOTA = 3;

// Configuración WiFi - Dejar vacío para configurar después
const char* ssid = "";      // Nombre de la red WiFi
const char* password = "";  // Contraseña de la red WiFi

// Configuración RabbitMQ (MQTT)
const char* mqtt_server = ""; // Dirección del servidor RabbitMQ
const int mqtt_port = 1883;   // Puerto MQTT estándar
const char* mqtt_user = "";   // Usuario MQTT/RabbitMQ
const char* mqtt_password = ""; // Contraseña MQTT/RabbitMQ
const char* mqtt_topic = "mascota/ubicacion"; // Topic donde publicar

// Intervalos de envío de datos (milisegundos)
const long intervalo_envio = 60000; // Enviar cada 1 minuto
unsigned long ultimo_envio = 0;

WiFiClient espClient;
PubSubClient client(espClient);
TinyGPSPlus gps;

//------------------------------------------------------------------------------------------------------------------------------------------

void setup() 
{
  Serial.begin(115200);
  neogps.begin(9600, SERIAL_8N1, RXD2, TXD2); 
  Serial.println("Sistema GPS Iniciado");
  
  // Configuración WiFi
  setupWiFi();
  
  // Configuración MQTT (RabbitMQ)
  client.setServer(mqtt_server, mqtt_port);
  
  delay(2000);
}

//------------------------------------------------------------------------------------------------------------------------------------------

void loop() 
{
  // Mantener conexión MQTT
  if (!client.connected() && strlen(mqtt_server) > 0) {
    reconnectMQTT();
  }
  client.loop();
  
  if (NMEA)
  {
    while (neogps.available())
    {
     datoCmd  = (char)neogps.read(); 
     Serial.print(datoCmd);
    }
  } 
  else
  {
    boolean newData = false;
    for (unsigned long start = millis(); millis() - start < 1000;)
    {
      while (neogps.available())
      {
        if (gps.encode(neogps.read()))
        {
          newData = true;         
        }
      }
    }  

    if(newData == true)
    {
      newData = false;
      Serial.println(gps.satellites.value());    
      Visualizacion_Serial();
      
      // Enviar datos si es tiempo y hay señal GPS válida
      unsigned long tiempoActual = millis();
      if (tiempoActual - ultimo_envio >= intervalo_envio && gps.location.isValid()) {
        enviarDatosGPS();
        ultimo_envio = tiempoActual;
      }
    }
    else
    {
      // Sin datos nuevos
    }  
  }
}

//------------------------------------------------------------------------------------------------------------------------------------------

void setupWiFi() {
  if (strlen(ssid) > 0) {
    Serial.println();
    Serial.print("Conectando a WiFi: ");
    Serial.println(ssid);
    
    WiFi.begin(ssid, password);
    
    while (WiFi.status() != WL_CONNECTED) {
      delay(500);
      Serial.print(".");
    }
    
    Serial.println("");
    Serial.println("WiFi conectado");
    Serial.print("Dirección IP: ");
    Serial.println(WiFi.localIP());
  } else {
    Serial.println("Configuración WiFi pendiente. Configure SSID y contraseña.");
  }
}

void reconnectMQTT() {
  // Intentar reconectar
  while (!client.connected()) {
    Serial.print("Conectando a MQTT (RabbitMQ)...");
    String clientId = "ESP32-GPS-";
    clientId += String(random(0xffff), HEX);
    
    // Intento de conexión con o sin credenciales
    bool connected = false;
    if (strlen(mqtt_user) > 0) {
      connected = client.connect(clientId.c_str(), mqtt_user, mqtt_password);
    } else {
      connected = client.connect(clientId.c_str());
    }
    
    if (connected) {
      Serial.println("conectado");
    } else {
      Serial.print("falló, rc=");
      Serial.print(client.state());
      Serial.println(" intentando nuevamente en 5 segundos");
      delay(5000);
    }
  }
}

void enviarDatosGPS() {
  if (!client.connected() || !gps.location.isValid()) {
    return;
  }
  
  // Crear JSON
  StaticJsonDocument<200> doc;
  doc["mascota"] = ID_MASCOTA;
  doc["latitude"] = gps.location.lat();
  doc["longitude"] = gps.location.lng();
  
  char buffer[256];
  serializeJson(doc, buffer);
  
  // Enviar datos por MQTT
  Serial.print("Enviando datos GPS: ");
  Serial.println(buffer);
  
  if (client.publish(mqtt_topic, buffer)) {
    Serial.println("Datos enviados con éxito");
  } else {
    Serial.println("Error al enviar datos");
  }
}

void Visualizacion_Serial(void)
{ 
   
  if (gps.location.isValid() ==  1)
  {  
    Serial.print("Lat: ");
    Serial.println(gps.location.lat(),6);
    Serial.print("Lng: ");
    Serial.println(gps.location.lng(),6);  
    Serial.print("Speed: ");
    Serial.println(gps.speed.kmph());    
    Serial.print("SAT:");
    Serial.println(gps.satellites.value());
    Serial.print("ALT:");   
    Serial.println(gps.altitude.meters(), 0);     

    Serial.print("Date: ");
    Serial.print(gps.date.day()); Serial.print("/");
    Serial.print(gps.date.month()); Serial.print("/");
    Serial.println(gps.date.year());

    Serial.print("Hour: ");
    Serial.print(gps.time.hour()); Serial.print(":");
    Serial.print(gps.time.minute()); Serial.print(":");
    Serial.println(gps.time.second());
    Serial.println("---------------------------");
  }
  else
  {
    Serial.println("Sin señal gps");  
  }  
}