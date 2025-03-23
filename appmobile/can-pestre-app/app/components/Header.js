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
      <View style={styles.container}>
        <View style={styles.logoContainer}>
          <Image
            source={require('../../assets/Club can-pestre.png')}
            style={styles.logo}
            resizeMode="contain"
          />
        </View>
        
        {showBackButton() && (
          <TouchableOpacity onPress={handleGoBack} style={styles.backButton}>
            <Icon name="arrow-left" size={24} color="#000000" />
          </TouchableOpacity>
        )}
        
        <Text style={styles.title}>{getTabTitle()}</Text>
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
  },
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-start',
    paddingHorizontal: 15,
    paddingVertical: 10,
    height: 60,
  },
  logoContainer: {
    width: 40,
    height: 40,
    marginRight: 10,
  },
  logo: {
    width: '100%',
    height: '100%',
  },
  backButton: {
    padding: 8,
    marginRight: 10,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#00bf97',
  },
}); 