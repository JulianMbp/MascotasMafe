import { useNavigation } from '@react-navigation/native';
import React, { useRef } from 'react';
import { Animated, ScrollView, StyleSheet, Text, TouchableWithoutFeedback, View } from 'react-native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';

export default function Home() {
  const navigation = useNavigation();
  
  // Referencias para las animaciones de cada botón
  const animatedValueDueños = useRef(new Animated.Value(1)).current;
  const animatedValueMascotas = useRef(new Animated.Value(1)).current;
  const animatedValueUbicación = useRef(new Animated.Value(1)).current;
  const animatedValueEnVivo = useRef(new Animated.Value(1)).current;

  // Función para animar presionar un botón
  const presionarBoton = (animatedValue) => {
    Animated.sequence([
      // Primero reducimos la escala rápidamente
      Animated.timing(animatedValue, {
        toValue: 0.9,
        duration: 100,
        useNativeDriver: true,
      }),
      // Después hacemos un pequeño rebote al volver
      Animated.spring(animatedValue, {
        toValue: 1,
        friction: 5,
        tension: 40,
        useNativeDriver: true,
      })
    ]).start();
  };

  const navigateTo = (screen, animatedValue) => {
    // Animamos primero, luego navegamos
    presionarBoton(animatedValue);
    
    // Retrasamos la navegación para que se vea la animación
    setTimeout(() => {
      navigation.navigate(screen);
    }, 150);
  };

  return (
    <ScrollView style={styles.scrollView}>
      <View style={styles.container}>
        <Text style={styles.welcome}>¡Bienvenido a Can-Pestre!</Text>
        <Text style={styles.subtitle}>Selecciona una opción para comenzar:</Text>
        
        <View style={styles.menuGrid}>
          {/* Botón para Dueños */}
          <TouchableWithoutFeedback 
            onPress={() => navigateTo('Profile', animatedValueDueños)}
          >
            <Animated.View style={[
              styles.menuItem, 
              { transform: [{ scale: animatedValueDueños }] }
            ]}>
              <View style={[styles.iconContainer, { backgroundColor: '#f9d5e5' }]}>
                <Icon name="account" size={40} color="#e84a5f" />
              </View>
              <Text style={styles.menuText}>Dueños</Text>
            </Animated.View>
          </TouchableWithoutFeedback>

          {/* Botón para Mascotas */}
          <TouchableWithoutFeedback 
            onPress={() => navigateTo('Pets', animatedValueMascotas)}
          >
            <Animated.View style={[
              styles.menuItem, 
              { transform: [{ scale: animatedValueMascotas }] }
            ]}>
              <View style={[styles.iconContainer, { backgroundColor: '#e3f6f5' }]}>
                <Icon name="paw" size={40} color="#00b3aa" />
              </View>
              <Text style={styles.menuText}>Mascotas</Text>
            </Animated.View>
          </TouchableWithoutFeedback>

          {/* Botón para Ubicación */}
          <TouchableWithoutFeedback 
            onPress={() => navigateTo('Location', animatedValueUbicación)}
          >
            <Animated.View style={[
              styles.menuItem, 
              { transform: [{ scale: animatedValueUbicación }] }
            ]}>
              <View style={[styles.iconContainer, { backgroundColor: '#f6e3ff' }]}>
                <Icon name="map-marker" size={40} color="#9b5de5" />
              </View>
              <Text style={styles.menuText}>Ubicación</Text>
            </Animated.View>
          </TouchableWithoutFeedback>

          {/* Botón para En vivo */}
          <TouchableWithoutFeedback 
            onPress={() => navigateTo('LiveTracking', animatedValueEnVivo)}
          >
            <Animated.View style={[
              styles.menuItem, 
              { transform: [{ scale: animatedValueEnVivo }] }
            ]}>
              <View style={[styles.iconContainer, { backgroundColor: '#fff3db' }]}>
                <Icon name="camera" size={40} color="#ff9e00" />
              </View>
              <Text style={styles.menuText}>En vivo</Text>
            </Animated.View>
          </TouchableWithoutFeedback>
        </View>

        <View style={styles.infoSection}>
          <Text style={styles.infoTitle}>Club Can-Pestre</Text>
          <Text style={styles.infoText}>
            Tu aplicación para el seguimiento y cuidado de mascotas. Registra dueños, 
            visualiza información de tus mascotas y mantén un seguimiento de su ubicación.
          </Text>
        </View>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  scrollView: {
    flex: 1,
    backgroundColor: '#f8f9fa',
  },
  container: {
    flex: 1,
    padding: 20,
  },
  welcome: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#00bf97',
    marginTop: 20,
    marginBottom: 10,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 16,
    color: '#666',
    marginBottom: 30,
    textAlign: 'center',
  },
  menuGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    marginBottom: 20,
  },
  menuItem: {
    width: '48%',
    alignItems: 'center',
    marginBottom: 20,
    padding: 15,
    backgroundColor: 'white',
    borderRadius: 15,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  iconContainer: {
    width: 70,
    height: 70,
    borderRadius: 35,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 10,
  },
  menuText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
  },
  infoSection: {
    backgroundColor: 'white',
    borderRadius: 15,
    padding: 20,
    marginTop: 10,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  infoTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#00bf97',
    marginBottom: 10,
  },
  infoText: {
    fontSize: 14,
    color: '#666',
    lineHeight: 20,
  }
}); 