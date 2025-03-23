import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import React from 'react';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';

// Importamos las pantallas
import Home from '../tabs/Home/Home';
import LiveTracking from '../tabs/LiveTracking/LiveTracking';
import Location from '../tabs/Location/Location';
import Pets from '../tabs/Pets/Pets';
import Profile from '../tabs/Profile/Profile';
import Header from './Header';

const Tab = createBottomTabNavigator();

export default function Navbar() {
  return (
    <Tab.Navigator
      screenOptions={{
        tabBarActiveTintColor: '#00bf97',
        tabBarInactiveTintColor: '#95a5a6',
        tabBarStyle: {
          backgroundColor: '#fff',
          borderTopWidth: 1,
          borderTopColor: '#f2f2f2',
          paddingBottom: 5,
          paddingTop: 5,
          height: 85,
        },
        header: () => <Header />,
      }}
    > 
      <Tab.Screen 
        name="Home" 
        component={Home} 
        options={{
          tabBarLabel: 'Inicio',
          tabBarIcon: ({ color, size }) => (
            <Icon name="home" color={color} size={size} />
          ),
        }}
      />
      <Tab.Screen 
        name="Profile" 
        component={Profile} 
        options={{
          tabBarLabel: 'Perfil',
          tabBarIcon: ({ color, size }) => (
            <Icon name="account" color={color} size={size} />
          ),
        }}
      />
      <Tab.Screen 
        name="Pets" 
        component={Pets} 
        options={{
          tabBarLabel: 'Mascotas',
          tabBarIcon: ({ color, size }) => (
            <Icon name="paw" color={color} size={size} />
          ),
        }}
      />
      <Tab.Screen 
        name="Location" 
        component={Location} 
        options={{
          tabBarLabel: 'Ubicación',
          tabBarIcon: ({ color, size }) => (
            <Icon name="map-marker" color={color} size={size} />
          ),
        }}
      />
      <Tab.Screen 
        name="LiveTracking" 
        component={LiveTracking} 
        options={{
          tabBarLabel: 'En vivo',
          tabBarIcon: ({ color, size }) => (
            <Icon name="camera" color={color} size={size} />
          ),
        }}
      />
    </Tab.Navigator>
  );
}
