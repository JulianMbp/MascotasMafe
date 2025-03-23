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
import Header from './Header';
import OwnerDetail from './OwnerDetail';
import OwnerForm from './OwnerForm';
import PetDetail from './PetDetail';
import PetForm from './PetForm';

const Tab = createBottomTabNavigator();
const PetsStack = createNativeStackNavigator();
const ProfileStack = createNativeStackNavigator();

function PetsStackScreen() {
  return (
    <PetsStack.Navigator
      screenOptions={{
        headerShown: false,
      }}
    >
      <PetsStack.Screen name="PetsList" component={Pets} />
      <PetsStack.Screen name="PetDetail" component={PetDetail} />
      <PetsStack.Screen name="PetForm" component={PetForm} />
    </PetsStack.Navigator>
  );
}

function ProfileStackScreen() {
  return (
    <ProfileStack.Navigator
      screenOptions={{
        headerShown: false,
      }}
    >
      <ProfileStack.Screen name="ProfileMain" component={Profile} />
      <ProfileStack.Screen name="OwnerDetail" component={OwnerDetail} />
      <ProfileStack.Screen name="OwnerForm" component={OwnerForm} />
      <ProfileStack.Screen name="PetDetail" component={PetDetail} />
    </ProfileStack.Navigator>
  );
}

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
        component={ProfileStackScreen} 
        options={{
          tabBarLabel: 'Perfil',
          tabBarIcon: ({ color, size }) => (
            <Icon name="account" color={color} size={size} />
          ),
        }}
      />
      <Tab.Screen 
        name="Pets" 
        component={PetsStackScreen} 
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
