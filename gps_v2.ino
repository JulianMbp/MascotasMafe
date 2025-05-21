#include <Wire.h>
#include <TinyGPS++.h>
#include <WiFi.h>
#include <WiFiClientSecure.h>  // Para conexiones SSL
#include <ArduinoJson.h>
#include <PubSubClient.h>

// Configuración de pines GPS
#define RXD2 16
#define TXD2 17
HardwareSerial neogps(1);
char datoCmd = 0;

// Modo NMEA - Cambiar a 0 para modo normal después de depurar
#define NMEA 0  // Procesamiento normal de datos GPS

// Versión del firmware
#define VERSION "1.0.2"

// ID de mascota (estático)
const int ID_MASCOTA = 3;

// Configuración WiFi
char ssid[32] = "julian";      // Nombre de la red WiFi
char password[32] = "12345678";  // Contraseña de la red WiFi

// Flag para indicar modo de operación
bool usar_wifi = true;  // Se configurará a verdadero si la conexión es exitosa

// Configuración MQTT (EMQX)
char mqtt_server[50] = "z22e8be0.ala.us-east-1.emqxsl.com";  // Broker EMQX 
int mqtt_port = 8883;                    // Puerto MQTT SSL/TLS
char mqtt_user[32] = "julian";           // Usuario MQTT
char mqtt_password[32] = "1234";         // Contraseña MQTT
char mqtt_topic[50] = "ubicacion";       // Topic donde publicar
char mqtt_system_topic[50] = "sistema";  // Topic para mensajes del sistema
char mqtt_client_id[50] = "ESP32_Mascota_3"; // ID único para este dispositivo

// Intervalos de envío de datos (milisegundos)
const long intervalo_envio = 10000; // Enviar cada 10 segundos
unsigned long ultimo_envio = 0;

// Variables para reconexión MQTT
unsigned long ultimo_intento_mqtt = 0;
const long intervalo_reconexion = 5000; // 5 segundos entre intentos

// Variables para ping/heartbeat
unsigned long ultimo_heartbeat = 0;
const long intervalo_heartbeat = 60000; // Enviar heartbeat cada minuto

// Variables para GPS
float ultimaLatitud = 0;
float ultimaLongitud = 0;
bool datosGPSValidos = false;
int baudRateGPS = 9600;

// Certificado raíz para emqxsl.com (DigiCert Global Root G2)
const char* root_ca = \
"-----BEGIN CERTIFICATE-----\n" \
"MIIDjjCCAnagAwIBAgIQAzrx5qcRqaC7KGSxHQn65TANBgkqhkiG9w0BAQsFADBh\n" \
"MQswCQYDVQQGEwJVUzEVMBMGA1UEChMMRGlnaUNlcnQgSW5jMRkwFwYDVQQLExB3\n" \
"d3cuZGlnaWNlcnQuY29tMSAwHgYDVQQDExdEaWdpQ2VydCBHbG9iYWwgUm9vdCBH\n" \
"MjAeFw0xMzA4MDExMjAwMDBaFw0zODAxMTUxMjAwMDBaMGExCzAJBgNVBAYTAlVT\n" \
"MRUwEwYDVQQKEwxEaWdpQ2VydCBJbmMxGTAXBgNVBAsTEHd3dy5kaWdpY2VydC5j\n" \
"b20xIDAeBgNVBAMTF0RpZ2lDZXJ0IEdsb2JhbCBSb290IEcyMIIBIjANBgkqhkiG\n" \
"9w0BAQEFAAOCAQ8AMIIBCgKCAQEAuzfNNNx7a8myaJCtSnX/RrohCgiN9RlUyfuI\n" \
"2/Ou8jqJkTx65qsGGmvPrC3oXgkkRLpimn7Wo6h+4FR1IAWsULecYxpsMNzaHxmx\n" \
"1x7e/dfgy5SDN67sH0NO3Xss0r0upS/kqbitOtSZpLYl6ZtrAGCSYP9PIUkY92eQ\n" \
"q2EGnI/yuum06ZIya7XzV+hdG82MHauVBJVJ8zUtluNJbd134/tJS7SsVQepj5Wz\n" \
"tCO7TG1F8PapspUwtP1MVYwnSlcUfIKdzXOS0xZKBgyMUNGPHgm+F6HmIcr9g+UQ\n" \
"vIOlCsRnKPZzFBQ9RnbDhxSJITRNrw9FDKZJobq7nMWxM4MphQIDAQABo0IwQDAP\n" \
"BgNVHRMBAf8EBTADAQH/MA4GA1UdDwEB/wQEAwIBhjAdBgNVHQ4EFgQUTiJUIBiV\n" \
"5uNu5g/6+rkS7QYXjzkwDQYJKoZIhvcNAQELBQADggEBAGBnKJRvDkhj6zHd6mcY\n" \
"1Yl9PMWLSn/pvtsrF9+wX3N3KjITOYFnQoQj8kVnNeyIv/iPsGEMNKSuIEyExtv4\n" \
"NeF22d+mQrvHRAiGfzZ0JFrabA0UWTW98kndth/Jsw1HKj2ZL7tcu7XUIOGZX1NG\n" \
"Fdtom/DzMNU+MeKNhJ7jitralj41E6Vf8PlwUHBHQRFXGU7Aj64GxJUTFy8bJZ91\n" \
"8rGOmaFvE7FBcf6IKshPECBV1/MUReXgRPTqh5Uykw7+U0b6LJ3/iyK5S9kJRaTe\n" \
"pLiaWN0bfVKfjllDiIGknibVb63dDcY3fe0Dkhvld1927jyNxF1WW6LZZm6zNTfl\n" \
"MrY=\n" \
"-----END CERTIFICATE-----\n";

// Cliente WiFi seguro para conexiones SSL
WiFiClientSecure espClient;
PubSubClient client(espClient);
TinyGPSPlus gps;

//------------------------------------------------------------------------------------------------------------------------------------------

// Callback para mensajes MQTT recibidos
void callback(char* topic, byte* payload, unsigned int length) {
  Serial.print("Mensaje recibido en topic: ");
  Serial.println(topic);
  
  // Convertir payload a string
  String mensaje = "";
  for (int i = 0; i < length; i++) {
    mensaje += (char)payload[i];
  }
  Serial.print("Contenido: ");
  Serial.println(mensaje);
  
  // Si es un mensaje del sistema, procesarlo
  if (String(topic) == mqtt_system_topic) {
    procesarMensajeSistema(mensaje);
  }
}

// Procesar comandos recibidos via MQTT
void procesarMensajeSistema(String mensaje) {
  // Crear buffer JSON
  StaticJsonDocument<200> doc;
  DeserializationError error = deserializeJson(doc, mensaje);
  
  if (error) {
    Serial.print("Error parseando JSON: ");
    Serial.println(error.c_str());
    return;
  }
  
  // Verificar si es un ping
  if (doc.containsKey("comando") && String((const char*)doc["comando"]) == "ping") {
    Serial.println("Comando PING recibido. Respondiendo...");
    
    // Crear respuesta
    StaticJsonDocument<200> respuesta;
    respuesta["comando"] = "pong";
    respuesta["cliente_id"] = mqtt_client_id;
    respuesta["version"] = VERSION;
    respuesta["mascota_id"] = ID_MASCOTA;
    respuesta["uptime"] = millis() / 1000; // Segundos desde inicio
    
    if (datosGPSValidos) {
      respuesta["latitude"] = ultimaLatitud;
      respuesta["longitude"] = ultimaLongitud;
    }
    
    // Convertir a JSON y enviar
    char buffer[256];
    serializeJson(respuesta, buffer);
    client.publish(mqtt_system_topic, buffer);
    
    Serial.print("Respuesta enviada: ");
    Serial.println(buffer);
  }
}

void setup() 
{
  Serial.begin(115200);
  
  // Esperar para conexión serial
  delay(1000);
  
  Serial.println("\n\n=== Sistema GPS Inicializando ===");
  Serial.print("Versión: ");
  Serial.println(VERSION);
  
  // Iniciar GPS con baudios más comunes para módulos GPS
  neogps.begin(9600, SERIAL_8N1, RXD2, TXD2);
  Serial.println("GPS configurado a 9600 baudios");
  
  // Configurar certificado raíz para SSL
  espClient.setCACert(root_ca);
  Serial.println("Certificado SSL configurado");
  
  // Configurar callback para mensajes MQTT
  client.setCallback(callback);
  
  // Conectar WiFi si hay credenciales
  if (strlen(ssid) > 0) {
    conectarWiFi();
    if (WiFi.status() == WL_CONNECTED) {
      // Configurar servidor MQTT
      client.setServer(mqtt_server, mqtt_port);
      
      // Mostrar información MQTT
      Serial.println("\n=== Configuración MQTT ===");
      Serial.print("Servidor: ");
      Serial.println(mqtt_server);
      Serial.print("Puerto: ");
      Serial.println(mqtt_port);
      Serial.print("Usuario: ");
      Serial.println(mqtt_user);
      Serial.print("Topic: ");
      Serial.println(mqtt_topic);
      Serial.print("Topic Sistema: ");
      Serial.println(mqtt_system_topic);
    }
  }
  
  Serial.println("\n=== Instrucciones del Sistema ===");
  Serial.println("1. Para ver datos GPS, coloca el dispositivo en exterior");
  Serial.println("2. Para cambiar WiFi: wifi,nombre_red,contraseña");
  Serial.println("3. Para cambiar broker MQTT: mqtt,servidor,puerto");
  Serial.println("4. Para cambiar velocidad GPS: gps,4800 o gps,9600");
  Serial.println("5. Para ver ayuda: help");
  
  Serial.println("\n=== Sistema listo para recibir datos GPS ===");
  
  delay(2000);
}

//------------------------------------------------------------------------------------------------------------------------------------------

void loop() 
{
  // Verificar comandos por puerto serie
  verificarComandosSerial();
  
  // Mantener conexión WiFi y MQTT
  verificarConexiones();
  
  // Enviar heartbeat periódico
  enviarHeartbeat();
  
  if (NMEA)
  {
    // Modo depuración - Mostrar datos crudos NMEA
    Serial.println("Leyendo tramas NMEA crudas:");
    int caracteres = 0;
    unsigned long inicio = millis();
    
    while (millis() - inicio < 3000) // Leer durante 3 segundos
    {
      if (neogps.available())
      {
        datoCmd = (char)neogps.read(); 
        Serial.print(datoCmd);
        caracteres++;
      }
    }
    
    if (caracteres == 0) {
      Serial.println("\nNo se recibieron datos del GPS. Verifica:");
      Serial.println("1. Conexiones físicas y alimentación del módulo GPS");
      Serial.println("2. Que el GPS esté en exterior o cerca de ventanas");
      Serial.println("3. Que los pines TX/RX estén correctamente conectados");
    } else {
      Serial.print("\nSe recibieron ");
      Serial.print(caracteres);
      Serial.println(" caracteres del GPS");
    }
    
    Serial.println("\n--- Esperando 2 segundos ---\n");
    delay(2000);
  } 
  else
  {
    boolean newData = false;
    for (unsigned long start = millis(); millis() - start < 1000;)
    {
      while (neogps.available())
      {
        char c = neogps.read();
        if (gps.encode(c))
        {
          newData = true;         
        }
      }
    }  

    if(newData == true)
    {
      newData = false;
      Serial.print("Satélites: ");
      Serial.println(gps.satellites.value());    
      
      // Guardar datos GPS para envío aunque no haya conexión
      if (gps.location.isValid()) {
        ultimaLatitud = gps.location.lat();
        ultimaLongitud = gps.location.lng();
        datosGPSValidos = true;
        
        Visualizacion_Serial();
      }
      
      // Enviar datos periódicamente si es tiempo (con o sin señal GPS)
      unsigned long tiempoActual = millis();
      if (tiempoActual - ultimo_envio >= intervalo_envio) {
        if (usar_wifi && WiFi.status() == WL_CONNECTED && client.connected()) {
          enviarDatosGPS();
        } else {
          Serial.println("\n=== DATOS GPS ACTUALES (MODO LOCAL) ===");
          Serial.print("ID Mascota: ");
          Serial.println(ID_MASCOTA);
          if (datosGPSValidos) {
            Serial.print("Lat: ");
            Serial.println(ultimaLatitud, 6);
            Serial.print("Lng: ");
            Serial.println(ultimaLongitud, 6);
          } else {
            Serial.println("Lat: 0");
            Serial.println("Lng: 0");
            Serial.println("Sin señal GPS válida");
          }
          Serial.println("================================");
        }
        ultimo_envio = tiempoActual;
      }
    }
    else
    {
      // Mantener el mensaje mínimo para no saturar la salida
      static unsigned long lastMsg = 0;
      if (millis() - lastMsg > 5000) {
        Serial.println("Esperando datos GPS válidos...");
        lastMsg = millis();
      }
      delay(100);  // Pequeña pausa
    }  
  }
}

//------------------------------------------------------------------------------------------------------------------------------------------

// Función para verificar y mantener conexiones
void verificarConexiones() {
  // Verificar WiFi primero
  if (usar_wifi && WiFi.status() != WL_CONNECTED) {
    Serial.println("WiFi desconectado. Reintentando...");
    conectarWiFi();
  }
  
  // Verificar conexión MQTT si WiFi está conectado
  if (usar_wifi && WiFi.status() == WL_CONNECTED) {
    if (!client.connected()) {
      // Solo intentar reconectar cada X segundos para evitar sobrecarga
      unsigned long tiempoActual = millis();
      if (tiempoActual - ultimo_intento_mqtt >= intervalo_reconexion) {
        ultimo_intento_mqtt = tiempoActual;
        reconnectMQTT();
      }
    } else {
      // Mantener la conexión MQTT procesando mensajes entrantes
      client.loop();
    }
  }
}

// Enviar heartbeat periódicamente
void enviarHeartbeat() {
  if (!usar_wifi || WiFi.status() != WL_CONNECTED || !client.connected()) {
    return;  // No enviar si no hay conexión
  }
  
  unsigned long tiempoActual = millis();
  if (tiempoActual - ultimo_heartbeat >= intervalo_heartbeat) {
    ultimo_heartbeat = tiempoActual;
    
    // Crear JSON de heartbeat
    StaticJsonDocument<200> doc;
    doc["tipo"] = "heartbeat";
    doc["cliente_id"] = mqtt_client_id;
    doc["mascota"] = ID_MASCOTA;
    doc["version"] = VERSION;
    doc["uptime"] = tiempoActual / 1000;  // Segundos desde inicio
    
    if (datosGPSValidos) {
      doc["latitude"] = ultimaLatitud;
      doc["longitude"] = ultimaLongitud;
    }
    
    // Enviar al topic del sistema
    char buffer[256];
    serializeJson(doc, buffer);
    
    Serial.print("Enviando heartbeat: ");
    Serial.println(buffer);
    
    client.publish(mqtt_system_topic, buffer);
  }
}

void verificarComandosSerial() {
  if (Serial.available()) {
    String command = Serial.readStringUntil('\n');
    command.trim();
    
    if (command.startsWith("wifi,")) {
      // Formato: wifi,nombre_red,contraseña
      int primerComa = command.indexOf(',');
      int segundaComa = command.indexOf(',', primerComa + 1);
      
      if (segundaComa > primerComa) {
        String nuevoSSID = command.substring(primerComa + 1, segundaComa);
        String nuevaPass = command.substring(segundaComa + 1);
        
        nuevoSSID.trim();
        nuevaPass.trim();
        
        if (nuevoSSID.length() > 0) {
          Serial.print("Configurando nueva red WiFi: '");
          Serial.print(nuevoSSID);
          Serial.println("'");
          
          // Guardar nueva configuración
          nuevoSSID.toCharArray(ssid, sizeof(ssid));
          nuevaPass.toCharArray(password, sizeof(password));
          
          // Intentar conectar
          if (conectarWiFi()) {
            Serial.println("Conexión exitosa a la nueva red WiFi");
            client.setServer(mqtt_server, mqtt_port);
            client.setCallback(callback);
            usar_wifi = true;
          }
        }
      } else {
        Serial.println("Formato incorrecto. Usar: wifi,nombre_red,contraseña");
      }
    }
    else if (command.startsWith("mqtt,")) {
      // Formato: mqtt,servidor,puerto (ejemplo: mqtt,broker.emqx.io,1883)
      int primerComa = command.indexOf(',');
      int segundaComa = command.indexOf(',', primerComa + 1);
      
      if (segundaComa > primerComa && WiFi.status() == WL_CONNECTED) {
        String nuevoServer = command.substring(primerComa + 1, segundaComa);
        String nuevoPuerto = command.substring(segundaComa + 1);
        
        nuevoServer.trim();
        nuevoPuerto.trim();
        
        if (nuevoServer.length() > 0) {
          Serial.print("Configurando nuevo servidor MQTT: ");
          Serial.println(nuevoServer);
          
          // Guardar nueva configuración
          nuevoServer.toCharArray(mqtt_server, sizeof(mqtt_server));
          mqtt_port = nuevoPuerto.toInt();
          
          client.setServer(mqtt_server, mqtt_port);
          client.setCallback(callback);
          Serial.println("Servidor MQTT actualizado. Reconectando...");
          reconnectMQTT();
        }
      } else {
        Serial.println("Formato incorrecto o WiFi no conectado. Usar: mqtt,servidor,puerto");
      }
    }
    else if (command.startsWith("user,")) {
      // Formato: user,usuario,contraseña (ejemplo: user,julian,1234)
      int primerComa = command.indexOf(',');
      int segundaComa = command.indexOf(',', primerComa + 1);
      
      if (segundaComa > primerComa) {
        String nuevoUser = command.substring(primerComa + 1, segundaComa);
        String nuevaPass = command.substring(segundaComa + 1);
        
        nuevoUser.trim();
        nuevaPass.trim();
        
        if (nuevoUser.length() > 0) {
          Serial.print("Configurando nuevas credenciales MQTT: ");
          Serial.println(nuevoUser);
          
          // Guardar nueva configuración
          nuevoUser.toCharArray(mqtt_user, sizeof(mqtt_user));
          nuevaPass.toCharArray(mqtt_password, sizeof(mqtt_password));
          
          Serial.println("Credenciales MQTT actualizadas. Reconectando...");
          reconnectMQTT();
        }
      } else {
        Serial.println("Formato incorrecto. Usar: user,usuario,contraseña");
      }
    }
    else if (command.startsWith("topic,")) {
      // Formato: topic,nuevo_topic (ejemplo: topic,mascota/gps)
      int coma = command.indexOf(',');
      if (coma > 0) {
        String nuevoTopic = command.substring(coma + 1);
        nuevoTopic.trim();
        
        if (nuevoTopic.length() > 0) {
          nuevoTopic.toCharArray(mqtt_topic, sizeof(mqtt_topic));
          Serial.print("Nuevo topic MQTT: ");
          Serial.println(mqtt_topic);
        }
      }
    }
    else if (command.startsWith("gps,")) {
      // Formato: gps,baudios (ejemplo: gps,4800)
      int coma = command.indexOf(',');
      if (coma > 0) {
        String baudStr = command.substring(coma + 1);
        baudStr.trim();
        int baudRate = baudStr.toInt();
        
        if (baudRate == 4800 || baudRate == 9600 || baudRate == 38400) {
          Serial.print("Cambiando velocidad GPS a ");
          Serial.print(baudRate);
          Serial.println(" baudios");
          
          neogps.end();
          delay(500);
          neogps.begin(baudRate, SERIAL_8N1, RXD2, TXD2);
          
          Serial.println("Velocidad cambiada. Verificando datos...");
        } else {
          Serial.println("Velocidad no válida. Usar: 4800, 9600 o 38400");
        }
      }
    }
    else if (command == "test") {
      // Enviar datos de prueba
      if (datosGPSValidos) {
        Serial.println("Enviando datos de prueba...");
        enviarDatosGPS();
      } else {
        Serial.println("No hay datos GPS válidos para enviar");
        // Generar datos de prueba
        ultimaLatitud = -12.046374;
        ultimaLongitud = -77.042793;
        datosGPSValidos = true;
        Serial.println("Generando datos de prueba y enviando...");
        enviarDatosGPS();
      }
    }
    else if (command == "ping") {
      // Enviar ping al broker
      if (usar_wifi && WiFi.status() == WL_CONNECTED && client.connected()) {
        StaticJsonDocument<200> doc;
        doc["comando"] = "ping";
        doc["cliente_id"] = mqtt_client_id;
        doc["mascota"] = ID_MASCOTA;
        
        char buffer[256];
        serializeJson(doc, buffer);
        
        Serial.print("Enviando ping al broker: ");
        Serial.println(buffer);
        
        if (client.publish(mqtt_system_topic, buffer)) {
          Serial.println("Ping enviado correctamente");
        } else {
          Serial.println("Error al enviar ping");
        }
      } else {
        Serial.println("No se puede enviar ping, sin conexión MQTT");
      }
    }
    else if (command == "status") {
      // Mostrar estado actual
      Serial.println("\n=== ESTADO DEL SISTEMA ===");
      Serial.print("Versión: ");
      Serial.println(VERSION);
      Serial.print("WiFi: ");
      Serial.println(WiFi.status() == WL_CONNECTED ? "Conectado" : "Desconectado");
      if (WiFi.status() == WL_CONNECTED) {
        Serial.print("  SSID: ");
        Serial.println(WiFi.SSID());
        Serial.print("  IP: ");
        Serial.println(WiFi.localIP());
        Serial.print("  RSSI: ");
        Serial.print(WiFi.RSSI());
        Serial.println(" dBm");
      }
      
      Serial.print("MQTT: ");
      Serial.println(client.connected() ? "Conectado" : "Desconectado");
      if (client.connected()) {
        Serial.print("  Broker: ");
        Serial.print(mqtt_server);
        Serial.print(":");
        Serial.println(mqtt_port);
        Serial.print("  Cliente ID: ");
        Serial.println(mqtt_client_id);
        Serial.print("  Topic: ");
        Serial.println(mqtt_topic);
      }
      
      Serial.print("GPS: ");
      Serial.println(datosGPSValidos ? "Datos válidos" : "Sin datos válidos");
      if (datosGPSValidos) {
        Serial.print("  Lat: ");
        Serial.println(ultimaLatitud, 6);
        Serial.print("  Lng: ");
        Serial.println(ultimaLongitud, 6);
        Serial.print("  Satélites: ");
        Serial.println(gps.satellites.value());
      }
      
      Serial.print("Tiempo encendido: ");
      unsigned long uptime = millis() / 1000;
      Serial.print(uptime / 3600); // Horas
      Serial.print("h ");
      Serial.print((uptime % 3600) / 60); // Minutos
      Serial.print("m ");
      Serial.print(uptime % 60); // Segundos
      Serial.println("s");
      
      Serial.println("========================");
    }
    else if (command == "help") {
      Serial.println("\n=== Comandos disponibles ===");
      Serial.println("wifi,nombre_red,contraseña - Configura una nueva red WiFi");
      Serial.println("mqtt,servidor,puerto - Configura servidor MQTT");
      Serial.println("user,usuario,contraseña - Configura credenciales MQTT");
      Serial.println("topic,nuevo_topic - Cambia el topic MQTT");
      Serial.println("gps,4800 - Cambia la velocidad del GPS a 4800 baudios");
      Serial.println("gps,9600 - Cambia la velocidad del GPS a 9600 baudios (estándar)");
      Serial.println("test - Envía datos de prueba (generados si no hay GPS)");
      Serial.println("ping - Envía un mensaje de ping al broker MQTT");
      Serial.println("status - Muestra el estado actual del sistema");
      Serial.println("help - Muestra este menú de ayuda");
    }
  }
}

bool conectarWiFi() {
  if (strlen(ssid) == 0) {
    Serial.println("Configuración WiFi no establecida. Continuando en modo local.");
    return false;
  }
  
  Serial.println("Intentando conectar a WiFi...");
  Serial.print("SSID: '");
  Serial.print(ssid);
  Serial.println("'");
  
  // Desconectar si ya estaba conectado
  WiFi.disconnect(true);
  delay(1000);
  
  // Reiniciar WiFi completamente
  WiFi.mode(WIFI_OFF);
  delay(1000);
  WiFi.mode(WIFI_STA);
  
  WiFi.begin(ssid, password);
  
  // Intentar conectar por 10 segundos máximo
  int intentos = 0;
  Serial.print("Conectando");
  while (WiFi.status() != WL_CONNECTED && intentos < 20) {
    delay(500);
    Serial.print(".");
    intentos++;
  }
  
  if (WiFi.status() == WL_CONNECTED) {
    Serial.println("");
    Serial.println("WiFi conectado correctamente!");
    Serial.print("Dirección IP: ");
    Serial.println(WiFi.localIP());
    return true;
  } else {
    Serial.println("");
    Serial.println("ERROR: No se pudo conectar a WiFi.");
    
    // Mostrar código de error
    int status = WiFi.status();
    Serial.print("Código de error WiFi: ");
    Serial.println(status);
    
    switch(status) {
      case WL_IDLE_STATUS:
        Serial.println("Estado: Inactivo");
        break;
      case WL_NO_SSID_AVAIL:
        Serial.println("Estado: La red especificada (SSID) no fue encontrada");
        Serial.println("IMPORTANTE: Verifica que la red '" + String(ssid) + "' esté disponible");
        break;
      case WL_CONNECT_FAILED:
        Serial.println("Estado: Conexión fallida (posiblemente contraseña incorrecta)");
        break;
      case WL_DISCONNECTED:
        Serial.println("Estado: Desconectado");
        break;
      default:
        Serial.println("Estado: Otro problema no identificado");
    }
    
    return false;
  }
}

void reconnectMQTT() {
  // Intentar reconectar MQTT
  int intentos = 0;
  
  Serial.println("Conectando al broker MQTT...");
  Serial.print("Servidor: ");
  Serial.println(mqtt_server);
  Serial.print("Puerto: ");
  Serial.println(mqtt_port);
  Serial.print("Usuario: ");
  Serial.println(mqtt_user);
  Serial.print("Cliente ID: ");
  Serial.println(mqtt_client_id);
  
  while (!client.connected() && intentos < 3) {
    Serial.print("Intento MQTT #");
    Serial.print(intentos + 1);
    Serial.print("...");
    
    // Intento de conexión con o sin credenciales
    bool connected = false;
    if (strlen(mqtt_user) > 0) {
      connected = client.connect(mqtt_client_id, mqtt_user, mqtt_password);
    } else {
      connected = client.connect(mqtt_client_id);
    }
    
    if (connected) {
      Serial.println("Conectado con éxito al broker MQTT!");
      
      // Suscribirse al topic de sistema para recibir comandos
      client.subscribe(mqtt_system_topic);
      Serial.print("Suscrito al topic de sistema: ");
      Serial.println(mqtt_system_topic);
      
      // Enviar mensaje de estado al conectar
      StaticJsonDocument<256> doc;
      doc["tipo"] = "conexion";
      doc["cliente_id"] = mqtt_client_id;
      doc["mascota"] = ID_MASCOTA;
      doc["version"] = VERSION;
      doc["rssi"] = WiFi.RSSI();
      
      char buffer[256];
      serializeJson(doc, buffer);
      client.publish(mqtt_system_topic, buffer);
      
      Serial.print("Mensaje de conexión enviado: ");
      Serial.println(buffer);
    } else {
      Serial.print("Error (");
      Serial.print(client.state());
      Serial.println(")");
      
      // Códigos de error MQTT
      switch (client.state()) {
        case -1: Serial.println("- Tiempo de espera agotado"); break;
        case -2: Serial.println("- Conexión rechazada"); break;
        case -3: Serial.println("- Servidor no disponible"); break;
        case -4: Serial.println("- Credenciales incorrectas"); break;
        case -5: Serial.println("- No autorizado"); break;
      }
      
      Serial.println("Reintentando en 5 segundos...");
      delay(5000);
    }
    
    intentos++;
  }
}

void enviarDatosGPS() {
  if (!client.connected()) {
    Serial.println("Error: Cliente MQTT no conectado. Reintentando conexión...");
    reconnectMQTT();
    if (!client.connected()) {
      Serial.println("No se pudo enviar datos: MQTT desconectado");
      return;
    }
  }
  
  // Crear JSON con el formato solicitado
  StaticJsonDocument<128> doc;
  doc["mascota"] = ID_MASCOTA;
  
  if (!datosGPSValidos) {
    Serial.println("No hay datos GPS válidos, enviando coordenadas (0,0)");
    doc["latitude"] = 0;
    doc["longitude"] = 0;
  } else {
    doc["latitude"] = ultimaLatitud;
    doc["longitude"] = ultimaLongitud;
  }
  
  char buffer[256];
  serializeJson(doc, buffer);
  
  // Enviar datos por MQTT
  Serial.print("Enviando datos GPS: ");
  Serial.println(buffer);
  
  if (client.publish(mqtt_topic, buffer)) {
    Serial.println("Datos enviados con éxito a EMQX");
  } else {
    Serial.println("Error al enviar datos a EMQX");
  }
}

void Visualizacion_Serial(void)
{ 
   
  if (gps.location.isValid() ==  1)
  {  
    Serial.println("\n--- DATOS GPS RECIBIDOS ---");
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
    Serial.println("Sin señal GPS - Posiblemente en interior o necesita más tiempo");  
    Serial.println("Se enviarán coordenadas (0,0) en el próximo intervalo");
  }  
} 