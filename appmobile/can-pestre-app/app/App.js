import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { StatusBar } from 'expo-status-bar';
import React, { useEffect, useMemo } from 'react';
import { LogBox, Platform, View } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { Footer } from './components/Header';
import Navbar from './components/navbar';
import Start from './components/Start';

// Ignorar warnings específicos para mejorar el rendimiento
LogBox.ignoreLogs([
  'ViewPropTypes will be removed',
  'ColorPropType will be removed',
  'Non-serializable values were found in the navigation state',
  'EventEmitter.removeListener',
]);

const Stack = createNativeStackNavigator();

// Componente para envolver pantallas con el Footer
const ScreenWithFooter = ({ children }) => {
  return (
    <View style={{ flex: 1 }}>
      {children}
      <Footer />
    </View>
  );
};

export default function App() {
  // Optimizar el rendimiento a nivel de aplicación
  useEffect(() => {
    // Forzar el uso de la GPU para renderizado (Android)
    if (Platform.OS === 'android') {
      if (Platform.Version >= 21) {
        // Ajustamos la configuración de hardware acceleration
        // Esto se hace automáticamente a través de la configuración en app.json
      }
    }
  }, []);

  // Usamos useMemo para las configuraciones que no cambian
  const theme = useMemo(() => ({
    dark: false,
    colors: {
      primary: '#00bf97',
      background: '#f9f9f9',
      card: '#ffffff',
      text: '#000000',
      border: '#d8d8d8',
      notification: '#ff3b30',
    },
    // Definimos explícitamente las fuentes para evitar el error
    fonts: {
      // Los valores default para evitar problemas
      regular: {
        fontFamily: undefined,
        fontWeight: 'normal',
      },
      medium: {
        fontFamily: undefined,
        fontWeight: '500',
      },
      light: {
        fontFamily: undefined,
        fontWeight: '300',
      },
      thin: {
        fontFamily: undefined,
        fontWeight: '100',
      }
    }
  }), []);

  const navigatorScreenOptions = useMemo(() => ({ 
    headerShown: false,
    animation: 'fade', // Usando solo fade para mejor rendimiento
    animationDuration: 200,
    presentation: 'transparentModal',
  }), []);

  const mainScreenOptions = useMemo(() => ({ 
    animationEnabled: false,
  }), []);

  return (
    <SafeAreaProvider>
      <StatusBar style="auto" />
      <NavigationContainer
        theme={theme}
        onStateChange={() => {}}
      >
        <Stack.Navigator 
          initialRouteName="Start" 
          screenOptions={navigatorScreenOptions}
        >
          <Stack.Screen 
            name="Start" 
            component={props => (
              <ScreenWithFooter>
                <Start {...props} />
              </ScreenWithFooter>
            )} 
          />
          <Stack.Screen 
            name="Main" 
            component={Navbar} 
            options={mainScreenOptions}
          />
        </Stack.Navigator>
      </NavigationContainer>
    </SafeAreaProvider>
  );
}
