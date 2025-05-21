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

// Modo NMEA - Cambiar a 0 para modo normal después de depurar
#define NMEA 0  // Procesamiento normal de datos GPS

// ID de mascota (estático)
const int ID_MASCOTA = 3;

// Configuración WiFi - MODIFICAR SEGÚN TU RED DISPONIBLE
// IMPORTANTE: Deja estas cadenas vacías para configurar por puerto serie
char ssid[32] = "julian";      // Nombre de la red WiFi
char password[32] = "12345678";  // Contraseña de la red WiFi

// Flag para indicar modo de operación
bool usar_wifi = false;  // Se configurará a verdadero si la conexión es exitosa

// Configuración RabbitMQ (MQTT)
const char* mqtt_server = "10.162.36.255"; // Dirección del servidor RabbitMQ
const int mqtt_port = 1883;   // Puerto MQTT estándar
const char* mqtt_user = "";   // Usuario MQTT/RabbitMQ
const char* mqtt_password = ""; // Contraseña MQTT/RabbitMQ
const char* mqtt_topic = "mascota/ubicacion"; // Topic donde publicar

// Intervalos de envío de datos (milisegundos)
const long intervalo_envio = 5000; // Enviar cada 5 segundos para pruebas
unsigned long ultimo_envio = 0;

// Variables para GPS
float ultimaLatitud = 0;
float ultimaLongitud = 0;
bool datosGPSValidos = false;

WiFiClient espClient;
PubSubClient client(espClient);
TinyGPSPlus gps;

//------------------------------------------------------------------------------------------------------------------------------------------

void setup() 
{
  Serial.begin(115200);
  
  // Esperar para conexión serial
  delay(1000);
  
  Serial.println("\n\n=== Sistema GPS Inicializando ===");
  
  // Iniciar GPS con baudios más comunes para módulos GPS
  neogps.begin(9600, SERIAL_8N1, RXD2, TXD2);
  Serial.println("GPS configurado a 9600 baudios");
  
  Serial.println("\n=== Instrucciones del Sistema ===");
  Serial.println("1. Para ver datos GPS, coloca el dispositivo en exterior o cerca de ventanas");
  Serial.println("2. Para configurar WiFi, escribe 'wifi,nombre_red,contraseña' en el monitor serial");
  Serial.println("3. Para probar otra velocidad GPS, escribe 'gps,4800' o 'gps,9600'");
  
  Serial.println("\n=== MODO LOCAL ACTIVADO ===");
  Serial.println("El sistema funcionará sin WiFi hasta que lo configures.");
  Serial.println("Todos los datos GPS se mostrarán en el monitor serial.");
  
  delay(2000);
}

//------------------------------------------------------------------------------------------------------------------------------------------

void loop() 
{
  // Verificar comandos por puerto serie
  verificarComandosSerial();
  
  // Mantener conexión MQTT solo si WiFi está activo
  if (usar_wifi) {
    if (WiFi.status() != WL_CONNECTED) {
      Serial.println("WiFi desconectado. Reintentando...");
      setupWiFi();
    }
    
    if (!client.connected() && strlen(mqtt_server) > 0 && WiFi.status() == WL_CONNECTED) {
      reconnectMQTT();
    }
    client.loop();
  }
  
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
      
      // Enviar datos si es tiempo y hay señal GPS válida
      unsigned long tiempoActual = millis();
      if (tiempoActual - ultimo_envio >= intervalo_envio && datosGPSValidos) {
        if (usar_wifi && WiFi.status() == WL_CONNECTED) {
          enviarDatosGPS();
        } else {
          Serial.println("\n=== DATOS GPS ACTUALES (MODO LOCAL) ===");
          Serial.print("ID Mascota: ");
          Serial.println(ID_MASCOTA);
          Serial.print("Lat: ");
          Serial.println(ultimaLatitud, 6);
          Serial.print("Lng: ");
          Serial.println(ultimaLongitud, 6);
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
          if (setupWiFi()) {
            Serial.println("Conexión exitosa a la nueva red WiFi");
            client.setServer(mqtt_server, mqtt_port);
            usar_wifi = true;
          }
        }
      } else {
        Serial.println("Formato incorrecto. Usar: wifi,nombre_red,contraseña");
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
    else if (command == "help") {
      Serial.println("\n=== Comandos disponibles ===");
      Serial.println("wifi,nombre_red,contraseña - Configura una nueva red WiFi");
      Serial.println("gps,4800 - Cambia la velocidad del GPS a 4800 baudios");
      Serial.println("gps,9600 - Cambia la velocidad del GPS a 9600 baudios (estándar)");
      Serial.println("help - Muestra este menú de ayuda");
    }
  }
}

bool setupWiFi() {
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
  // Intentar reconectar
  int intentos = 0;
  while (!client.connected() && intentos < 3) {
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
      intentos++;
    }
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
  
  if (!datosGPSValidos) {
    Serial.println("No hay datos GPS válidos para enviar");
    return;
  }
  
  // Crear JSON
  StaticJsonDocument<200> doc;
  doc["mascota"] = ID_MASCOTA;
  doc["latitude"] = ultimaLatitud;
  doc["longitude"] = ultimaLongitud;
  
  char buffer[256];
  serializeJson(doc, buffer);
  
  // Enviar datos por MQTT
  Serial.print("Enviando datos GPS: ");
  Serial.println(buffer);
  
  if (client.publish(mqtt_topic, buffer)) {
    Serial.println("Datos enviados con éxito a MQTT");
  } else {
    Serial.println("Error al enviar datos a MQTT");
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
  }  
}