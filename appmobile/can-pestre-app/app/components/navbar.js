import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import React, { useEffect, useMemo, useState } from 'react';
import { ActivityIndicator, InteractionManager, Platform, Text, View } from 'react-native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';

// Importamos las pantallas
import Home from '../tabs/Home/Home';
import LiveTracking from '../tabs/LiveTracking/LiveTracking';
import Location from '../tabs/Location/Location';
import Pets from '../tabs/Pets/Pets';
import Profile from '../tabs/Profile/Profile';
import AnimatedTabBar from './AnimatedTabBar';
import Header, { Footer } from './Header';
import OwnerDetail from './OwnerDetail';
import OwnerForm from './OwnerForm';
import PetDetail from './PetDetail';
import PetForm from './PetForm';
import TabTransition from './TabTransition';
import { screenOptions } from './TransitionConfig';

const Tab = createBottomTabNavigator();
const PetsStack = createNativeStackNavigator();
const ProfileStack = createNativeStackNavigator();
const HomeStack = createNativeStackNavigator();
const LocationStack = createNativeStackNavigator();
const LiveStack = createNativeStackNavigator();

// Componente de placehoder durante la carga para evitar pantallas en blanco
const LazyPlaceholder = () => (
  <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#f8f9fa' }}>
    <ActivityIndicator size="large" color="#00bf97" />
    <Text style={{ marginTop: 10, color: '#666', fontSize: 14 }}>Cargando...</Text>
  </View>
);

// Configuración básica para el stack sin hooks
const basicStackOptions = {
  headerShown: false,
  animationEnabled: Platform.OS === 'ios',
};

// Wrapper para cargar componentes pesados de forma diferida
const withLazyLoading = (Component) => {
  return (props) => {
    const [isReady, setIsReady] = useState(false);
    
    useEffect(() => {
      // Usamos InteractionManager para asegurar que la UI esté lista
      InteractionManager.runAfterInteractions(() => {
        // Agregamos un pequeño retraso para asegurar que todo esté listo
        setTimeout(() => {
          setIsReady(true);
        }, 100);
      });
    }, []);
    
    if (!isReady) {
      return <LazyPlaceholder />;
    }
    
    return <Component {...props} />;
  };
};

// Cada stack con memorización para evitar recrear componentes
const HomeStackScreen = React.memo(() => {
  // Movemos useMemo dentro del componente
  const stackOptions = useMemo(() => ({
    ...screenOptions.fadeInTransition,
    headerShown: false,
    animationEnabled: Platform.OS === 'ios',
  }), []);

  return (
    <HomeStack.Navigator screenOptions={stackOptions}>
      <HomeStack.Screen name="HomeMain" component={Home} />
    </HomeStack.Navigator>
  );
});

const PetsStackScreen = React.memo(() => {
  // Movemos useMemo dentro del componente
  const stackOptions = useMemo(() => ({
    ...screenOptions.fadeInTransition,
    headerShown: false,
    animationEnabled: Platform.OS === 'ios',
  }), []);

  const detailOptions = useMemo(() => ({
    ...screenOptions.fadeInTransition,
    headerShown: false,
  }), []);

  return (
    <PetsStack.Navigator screenOptions={stackOptions}>
      <PetsStack.Screen name="PetsList" component={Pets} />
      <PetsStack.Screen 
        name="PetDetail" 
        component={withLazyLoading(PetDetail)}
        options={detailOptions}
      />
      <PetsStack.Screen 
        name="PetForm" 
        component={withLazyLoading(PetForm)}
        options={detailOptions}
      />
    </PetsStack.Navigator>
  );
});

const ProfileStackScreen = React.memo(() => {
  // Movemos useMemo dentro del componente
  const stackOptions = useMemo(() => ({
    ...screenOptions.fadeInTransition,
    headerShown: false,
    animationEnabled: Platform.OS === 'ios',
  }), []);

  const detailOptions = useMemo(() => ({
    ...screenOptions.fadeInTransition,
    headerShown: false,
  }), []);

  return (
    <ProfileStack.Navigator screenOptions={stackOptions}>
      <ProfileStack.Screen name="ProfileMain" component={Profile} />
      <ProfileStack.Screen 
        name="OwnerDetail" 
        component={withLazyLoading(OwnerDetail)}
        options={detailOptions}
      />
      <ProfileStack.Screen 
        name="OwnerForm" 
        component={withLazyLoading(OwnerForm)}
        options={detailOptions}
      />
      <ProfileStack.Screen 
        name="PetDetail" 
        component={withLazyLoading(PetDetail)}
        options={detailOptions}
      />
    </ProfileStack.Navigator>
  );
});

const LocationStackScreen = React.memo(() => {
  // Movemos useMemo dentro del componente
  const stackOptions = useMemo(() => ({
    ...screenOptions.fadeInTransition,
    headerShown: false,
    animationEnabled: Platform.OS === 'ios',
  }), []);

  return (
    <LocationStack.Navigator screenOptions={stackOptions}>
      <LocationStack.Screen name="LocationMain" component={Location} />
    </LocationStack.Navigator>
  );
});

const LiveTrackingStackScreen = React.memo(() => {
  // Movemos useMemo dentro del componente
  const stackOptions = useMemo(() => ({
    ...screenOptions.fadeInTransition,
    headerShown: false,
    animationEnabled: Platform.OS === 'ios',
  }), []);

  return (
    <LiveStack.Navigator screenOptions={stackOptions}>
      <LiveStack.Screen name="LiveMain" component={LiveTracking} />
    </LiveStack.Navigator>
  );
});

// Componente personalizado para las pestañas con animaciones optimizado
const AnimatedTabScreen = React.memo(({ children, isFocused, transitionType }) => {
  // Usamos lógica simple sin setTimeout
  if (!isFocused) {
    return null;
  }
  
  return (
    <TabTransition isFocused={isFocused} transitionType={transitionType}>
      <View style={{ flex: 1 }}>
        {children}
        <Footer />
      </View>
    </TabTransition>
  );
});

// Priorizar carga de pestañas secuencialmente
const delayMs = Platform.OS === 'android' ? 150 : 0;

const Navbar = () => {
  // Configuramos las transiciones optimizadas para cada pestaña
  const tabTransitions = useMemo(() => ({
    Home: 'fade',
    Profile: 'fade',
    Pets: 'fade',
    Location: 'fade',
    LiveTracking: 'fade',
  }), []);

  // Estado para cargar pestañas progresivamente
  const [loadedTabs, setLoadedTabs] = useState({
    Home: true,  // La primera pestaña siempre está cargada
    Profile: false,
    Pets: false,
    Location: false,
    LiveTracking: false
  });

  // Cargar pestañas progresivamente para evitar sobrecarga
  useEffect(() => {
    const loadTabsProgressively = async () => {
      // Cargar la primera pestaña de inmediato, luego las demás progresivamente
      await new Promise(resolve => setTimeout(resolve, delayMs));
      setLoadedTabs(prev => ({ ...prev, Profile: true }));
      
      await new Promise(resolve => setTimeout(resolve, delayMs));
      setLoadedTabs(prev => ({ ...prev, Pets: true }));
      
      await new Promise(resolve => setTimeout(resolve, delayMs));
      setLoadedTabs(prev => ({ ...prev, Location: true }));
      
      await new Promise(resolve => setTimeout(resolve, delayMs));
      setLoadedTabs(prev => ({ ...prev, LiveTracking: true }));
    };
    
    loadTabsProgressively();
  }, []);

  // Configuración de pantallas memorizadas
  const navScreenOptions = useMemo(() => ({
    tabBarActiveTintColor: '#00bf97',
    tabBarInactiveTintColor: '#95a5a6',
    headerShown: true,
    header: () => <Header />,
    // Optimizaciones adicionales
    tabBarHideOnKeyboard: true,
    lazy: true, 
    lazyPlaceholder: () => <LazyPlaceholder />,
    freezeOnBlur: true, // Congelar componentes cuando no están en foco
    tabBarStyle: {
      height: Platform.OS === 'android' ? 60 : 80,
      paddingBottom: Platform.OS === 'android' ? 5 : 20,
    }
  }), []);

  return (
    <Tab.Navigator
      tabBar={props => <AnimatedTabBar {...props} />}
      screenOptions={navScreenOptions}
      backBehavior="initialRoute"
      detachInactiveScreens={true}
    > 
      <Tab.Screen 
        name="Home" 
        options={{
          tabBarLabel: 'Inicio',
          tabBarIcon: ({ color, size }) => (
            <Icon name="home" color={color} size={size} />
          ),
        }}
      >
        {({ navigation, route }) => (
          <AnimatedTabScreen
            isFocused={navigation.isFocused()}
            transitionType={tabTransitions.Home}
          >
            <HomeStackScreen />
          </AnimatedTabScreen>
        )}
      </Tab.Screen>

      {loadedTabs.Profile && (
        <Tab.Screen 
          name="Profile" 
          options={{
            tabBarLabel: 'Dueños',
            tabBarIcon: ({ color, size }) => (
              <Icon name="account" color={color} size={size} />
            ),
          }}
        >
          {({ navigation, route }) => (
            <AnimatedTabScreen
              isFocused={navigation.isFocused()}
              transitionType={tabTransitions.Profile}
            >
              <ProfileStackScreen />
            </AnimatedTabScreen>
          )}
        </Tab.Screen>
      )}

      {loadedTabs.Pets && (
        <Tab.Screen 
          name="Pets" 
          options={{
            tabBarLabel: 'Mascotas',
            tabBarIcon: ({ color, size }) => (
              <Icon name="paw" color={color} size={size} />
            ),
          }}
        >
          {({ navigation, route }) => (
            <AnimatedTabScreen
              isFocused={navigation.isFocused()}
              transitionType={tabTransitions.Pets}
            >
              <PetsStackScreen />
            </AnimatedTabScreen>
          )}
        </Tab.Screen>
      )}

      {loadedTabs.Location && (
        <Tab.Screen 
          name="Location" 
          options={{
            tabBarLabel: 'Ubicación',
            tabBarIcon: ({ color, size }) => (
              <Icon name="map-marker" color={color} size={size} />
            ),
          }}
        >
          {({ navigation, route }) => (
            <AnimatedTabScreen
              isFocused={navigation.isFocused()}
              transitionType={tabTransitions.Location}
            >
              <LocationStackScreen />
            </AnimatedTabScreen>
          )}
        </Tab.Screen>
      )}

      {loadedTabs.LiveTracking && (
        <Tab.Screen 
          name="LiveTracking" 
          options={{
            tabBarLabel: 'En vivo',
            tabBarIcon: ({ color, size }) => (
              <Icon name="camera" color={color} size={size} />
            ),
          }}
        >
          {({ navigation, route }) => (
            <AnimatedTabScreen
              isFocused={navigation.isFocused()}
              transitionType={tabTransitions.LiveTracking}
            >
              <LiveTrackingStackScreen />
            </AnimatedTabScreen>
          )}
        </Tab.Screen>
      )}
    </Tab.Navigator>
  );
};

export default React.memo(Navbar);
