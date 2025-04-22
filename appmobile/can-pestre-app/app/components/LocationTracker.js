import { Ionicons } from '@expo/vector-icons';
import * as Location from 'expo-location';
import React, { useEffect, useRef, useState } from 'react';
import { ActivityIndicator, Alert, StyleSheet, Switch, Text, TouchableOpacity, View } from 'react-native';
import { sendPetLocation } from '../services/api';

const LocationTracker = ({ mascotaId, mascotaNombre }) => {
  const [location, setLocation] = useState(null);
  const [errorMsg, setErrorMsg] = useState(null);
  const [sending, setSending] = useState(false);
  const [permissionStatus, setPermissionStatus] = useState(null);
  const [trackingActive, setTrackingActive] = useState(false);
  const [lastSentTime, setLastSentTime] = useState(null);
  const intervalRef = useRef(null);

  // Solicitar permisos de ubicación al cargar el componente
  useEffect(() => {
    (async () => {
      try {
        let { status } = await Location.requestForegroundPermissionsAsync();
        setPermissionStatus(status);
        
        if (status !== 'granted') {
          setErrorMsg('Permiso de ubicación denegado');
          return;
        }
      } catch (error) {
        console.error('Error al solicitar permisos de ubicación:', error);
        setErrorMsg('Error al solicitar permisos');
      }
    })();
  }, []);

  // Efecto para manejar el intervalo de seguimiento
  useEffect(() => {
    if (trackingActive) {
      // Enviar ubicación inmediatamente al activar
      sendLocationSilently();
      
      // Configurar intervalo para enviar cada minuto (60000 ms)
      intervalRef.current = setInterval(() => {
        sendLocationSilently();
      }, 60000);
      
      console.log('Seguimiento activado - enviando ubicación cada minuto');
    } else {
      // Limpiar intervalo cuando se desactiva el seguimiento
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
        console.log('Seguimiento desactivado');
      }
    }

    // Limpiar intervalo al desmontar el componente
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
        console.log('Limpiando intervalo al desmontar componente');
      }
    };
  }, [trackingActive]);

  // Función para obtener la ubicación actual
  const getCurrentLocation = async () => {
    try {
      if (permissionStatus !== 'granted') {
        // Intenta solicitar permisos nuevamente
        let { status } = await Location.requestForegroundPermissionsAsync();
        setPermissionStatus(status);
        
        if (status !== 'granted') {
          setErrorMsg('Permiso de ubicación denegado');
          return;
        }
      }

      // Obteniendo la ubicación actual
      let location = await Location.getCurrentPositionAsync({ 
        accuracy: Location.Accuracy.High 
      });
      setLocation(location);
      return location;
    } catch (error) {
      console.error('Error al obtener ubicación:', error);
      setErrorMsg('Error al obtener ubicación');
      return null;
    }
  };

  // Función para enviar ubicación silenciosamente (sin alertas)
  const sendLocationSilently = async () => {
    try {
      // Obtener ubicación actual
      const currentLocation = await getCurrentLocation();
      
      if (!currentLocation) {
        console.error('No se pudo obtener la ubicación actual');
        return;
      }
      
      // Extraer coordenadas
      const { latitude, longitude } = currentLocation.coords;
      
      // Enviar ubicación al servidor
      await sendPetLocation(mascotaId, latitude, longitude);
      
      // Actualizar hora del último envío
      const now = new Date();
      setLastSentTime(now);
      
      console.log(`Ubicación enviada: ${now.toLocaleTimeString()}`);
    } catch (error) {
      console.error('Error al enviar ubicación:', error);
    }
  };

  // Función para enviar la ubicación al servidor (con alertas)
  const sendLocation = async () => {
    try {
      setSending(true);
      
      // Obtener ubicación actual
      const currentLocation = await getCurrentLocation();
      
      if (!currentLocation) {
        Alert.alert('Error', 'No se pudo obtener la ubicación actual');
        setSending(false);
        return;
      }
      
      // Extraer coordenadas
      const { latitude, longitude } = currentLocation.coords;
      
      // Enviar ubicación al servidor
      await sendPetLocation(mascotaId, latitude, longitude);
      
      // Actualizar hora del último envío
      const now = new Date();
      setLastSentTime(now);
      
      Alert.alert('Éxito', `Ubicación de ${mascotaNombre} enviada correctamente`);
    } catch (error) {
      console.error('Error al enviar ubicación:', error);
      Alert.alert('Error', 'No se pudo enviar la ubicación');
    } finally {
      setSending(false);
    }
  };

  // Función para cambiar el estado del seguimiento
  const toggleTracking = () => {
    setTrackingActive(!trackingActive);
  };

  // Renderizar mensajes de estado
  let statusText = 'Esperando ubicación...';
  if (errorMsg) {
    statusText = errorMsg;
  } else if (location) {
    statusText = `Lat: ${location.coords.latitude.toFixed(5)}, Lon: ${location.coords.longitude.toFixed(5)}`;
  }

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Ubicación de {mascotaNombre}</Text>
      
      <View style={styles.statusContainer}>
        <Ionicons 
          name={errorMsg ? "location-off" : "location"} 
          size={24} 
          color={errorMsg ? "#FF6B6B" : "#4CAF50"} 
        />
        <Text style={styles.statusText}>{statusText}</Text>
      </View>
      
      {lastSentTime && (
        <Text style={styles.lastSentText}>
          Último envío: {lastSentTime.toLocaleTimeString()}
        </Text>
      )}
      
      <View style={styles.trackingContainer}>
        <Text style={styles.trackingText}>
          Seguimiento automático (cada minuto)
        </Text>
        <Switch
          value={trackingActive}
          onValueChange={toggleTracking}
          trackColor={{ false: "#767577", true: "#a5d6a7" }}
          thumbColor={trackingActive ? "#4CAF50" : "#f4f3f4"}
        />
      </View>
      
      <TouchableOpacity 
        style={[styles.button, (sending || trackingActive) && styles.buttonDisabled]} 
        onPress={sendLocation}
        disabled={sending || trackingActive}
      >
        {sending ? (
          <ActivityIndicator color="#FFFFFF" size="small" />
        ) : (
          <>
            <Ionicons name="send" size={20} color="#FFFFFF" />
            <Text style={styles.buttonText}>Enviar ubicación ahora</Text>
          </>
        )}
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#FFFFFF',
    borderRadius: 10,
    padding: 16,
    marginVertical: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  title: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 12,
    color: '#333333',
  },
  statusContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F5F5F5',
    padding: 12,
    borderRadius: 8,
    marginBottom: 8,
  },
  statusText: {
    marginLeft: 8,
    fontSize: 14,
    color: '#555555',
  },
  trackingContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginVertical: 12,
    backgroundColor: '#f5f5f5',
    padding: 10,
    borderRadius: 8,
  },
  trackingText: {
    fontSize: 14,
    color: '#555555',
    flex: 1,
  },
  lastSentText: {
    fontSize: 12,
    color: '#888888',
    marginBottom: 12,
    textAlign: 'right',
    fontStyle: 'italic',
  },
  button: {
    backgroundColor: '#4CAF50',
    borderRadius: 8,
    padding: 12,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
  },
  buttonDisabled: {
    backgroundColor: '#A5D6A7',
  },
  buttonText: {
    color: '#FFFFFF',
    fontWeight: 'bold',
    marginLeft: 8,
  },
});

export default LocationTracker; 