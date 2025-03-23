import { useRoute } from '@react-navigation/native';
import React from 'react';
import { Image, Platform, SafeAreaView, StatusBar, StyleSheet, Text, View } from 'react-native';

export default function Header() {
  const route = useRoute();
  
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
      default:
        return '';
    }
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
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#00bf97',
  },
}); 