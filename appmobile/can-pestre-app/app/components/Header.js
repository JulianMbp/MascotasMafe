import { useNavigation, useRoute } from '@react-navigation/native';
import React from 'react';
import { Image, Platform, SafeAreaView, StatusBar, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';

export default function Header() {
  const route = useRoute();
  const navigation = useNavigation();
  
  // Obtener el título de la pestaña actual
  const getTabTitle = () => {
    switch (route.name) {
      case 'Home':
        return 'Inicio';
      case 'Profile':
        return 'Perfil';
      case 'Pets':
        return 'Mascotas';
      case 'Location':
        return 'Ubicación';
      case 'LiveTracking':
        return 'En vivo';
      case 'PetDetail':
        return 'Detalles';
      case 'PetForm':
        return 'Formulario';
      case 'OwnerDetail':
        return 'Detalles de Dueño';
      case 'OwnerForm':
        return 'Formulario de Dueño';
      default:
        return '';
    }
  };

  // Determinar si se debe mostrar el botón de regreso
  const showBackButton = () => {
    // Pantallas principales que no necesitan botón de regreso
    const mainScreens = ['Home', 'Profile', 'Pets', 'Location', 'LiveTracking'];
    return !mainScreens.includes(route.name);
  };

  // Manejar la acción de regresar
  const handleGoBack = () => {
    navigation.goBack();
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      {/* El botón de retroceso fuera del contenedor principal para asegurar que esté en primer plano */}
      {showBackButton() && (
        <TouchableOpacity 
          onPress={handleGoBack} 
          style={styles.absoluteBackButton}
          activeOpacity={0.7}
        >
          <Icon name="arrow-left" size={32} color="#00bf97" />
        </TouchableOpacity>
      )}

      <View style={styles.container}>
        {/* Espacio a la izquierda para el botón */}
        <View style={styles.leftSection} />
        
        {/* Título en el centro */}
        <View style={styles.centerSection}>
          <Text style={styles.title}>{getTabTitle()}</Text>
        </View>
        
        {/* Logo a la derecha */}
        <View style={styles.rightSection}>
          <View style={styles.logoContainer}>
            <Image
              source={require('../../assets/Club can-pestre.png')}
              style={styles.logo}
              resizeMode="contain"
            />
          </View>
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    backgroundColor: '#fff',
    paddingTop: Platform.OS === 'android' ? StatusBar.currentHeight : 0,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
    position: 'relative', // Para posicionar el botón absoluto
  },
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 15,
    paddingVertical: 10,
    height: 60,
  },
  absoluteBackButton: {
    position: 'absolute',
    left: 15,
    top: Platform.OS === 'android' ? (StatusBar.currentHeight || 0) + 14 : 20,
    zIndex: 999, // Asegurar que esté por encima de todo
    backgroundColor: 'white',
    borderRadius: 30,
    padding: 5,
    elevation: 5, // Para Android
    shadowColor: '#000', // Para iOS
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
  },
  leftSection: {
    flex: 1,
    alignItems: 'flex-start',
  },
  centerSection: {
    flex: 2,
    alignItems: 'center',
  },
  rightSection: {
    flex: 1,
    alignItems: 'flex-end',
  },
  logoContainer: {
    width: 40,
    height: 40,
  },
  logo: {
    width: '100%',
    height: '100%',
  },
  title: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#00bf97',
    textAlign: 'center',
  },
}); 