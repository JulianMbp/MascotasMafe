import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import React from 'react';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';

// Importamos las pantallas
import Home from '../tabs/Home/Home';
import LiveTracking from '../tabs/LiveTracking/LiveTracking';
import Location from '../tabs/Location/Location';
import Pets from '../tabs/Pets/Pets';
import Profile from '../tabs/Profile/Profile';
import AnimatedTabBar from './AnimatedTabBar';
import Header from './Header';
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

// Opciones de transición para los stacks
const stackOptions = {
  ...screenOptions.zoomInTransition,
  headerShown: false,
  animationEnabled: true,
};

// Cada stack tendrá su propia configuración de transición
function HomeStackScreen() {
  return (
    <HomeStack.Navigator screenOptions={stackOptions}>
      <HomeStack.Screen name="HomeMain" component={Home} />
    </HomeStack.Navigator>
  );
}

function PetsStackScreen() {
  return (
    <PetsStack.Navigator screenOptions={stackOptions}>
      <PetsStack.Screen name="PetsList" component={Pets} />
      <PetsStack.Screen 
        name="PetDetail" 
        component={PetDetail}
        options={{
          ...screenOptions.slideFromRightTransition,
          headerShown: false,
        }}
      />
      <PetsStack.Screen 
        name="PetForm" 
        component={PetForm}
        options={{
          ...screenOptions.slideFromBottomTransition,
          headerShown: false,
        }}
      />
    </PetsStack.Navigator>
  );
}

function ProfileStackScreen() {
  return (
    <ProfileStack.Navigator screenOptions={stackOptions}>
      <ProfileStack.Screen name="ProfileMain" component={Profile} />
      <ProfileStack.Screen 
        name="OwnerDetail" 
        component={OwnerDetail}
        options={{
          ...screenOptions.slideFromRightTransition,
          headerShown: false,
        }}
      />
      <ProfileStack.Screen 
        name="OwnerForm" 
        component={OwnerForm}
        options={{
          ...screenOptions.slideFromBottomTransition,
          headerShown: false,
        }}
      />
      <ProfileStack.Screen 
        name="PetDetail" 
        component={PetDetail}
        options={{
          ...screenOptions.slideFromRightTransition,
          headerShown: false,
        }}
      />
    </ProfileStack.Navigator>
  );
}

function LocationStackScreen() {
  return (
    <LocationStack.Navigator screenOptions={stackOptions}>
      <LocationStack.Screen name="LocationMain" component={Location} />
    </LocationStack.Navigator>
  );
}

function LiveTrackingStackScreen() {
  return (
    <LiveStack.Navigator screenOptions={stackOptions}>
      <LiveStack.Screen name="LiveMain" component={LiveTracking} />
    </LiveStack.Navigator>
  );
}

// Componente personalizado para las pestañas con animaciones
const AnimatedTabScreen = ({ children, isFocused, transitionType }) => {
  return (
    <TabTransition isFocused={isFocused} transitionType={transitionType}>
      {children}
    </TabTransition>
  );
};

export default function Navbar() {
  // Asignar un tipo de transición distinto a cada pestaña para variedad
  const tabTransitions = {
    Home: 'fade',
    Profile: 'slide',
    Pets: 'zoom',
    Location: 'slideUp',
    LiveTracking: 'fade',
  };

  return (
    <Tab.Navigator
      tabBar={props => <AnimatedTabBar {...props} />}
      screenOptions={{
        tabBarActiveTintColor: '#00bf97',
        tabBarInactiveTintColor: '#95a5a6',
        header: () => <Header />,
      }}
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
    </Tab.Navigator>
  );
}
