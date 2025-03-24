import { useNavigation } from '@react-navigation/native';
import React, { useEffect, useState } from 'react';
import { ActivityIndicator, FlatList, RefreshControl, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import OwnerCard from '../../components/OwnerCard';
import { fetchDueños, fetchMascotas } from '../../services/api';

export default function Profile({ route }) {
  const [owners, setOwners] = useState([]);
  const [pets, setPets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState(null);
  const navigation = useNavigation();

  // Verificar si hay parámetros de needsRefresh en la ruta
  const needsRefresh = route?.params?.needsRefresh || false;

  const loadData = async (forceRefresh = false) => {
    try {
      if (!forceRefresh && !refreshing) {
        setLoading(true);
      }
      setError(null);
      
      // Usar Promise.all para cargar dueños y mascotas paralelamente
      const [dueñosData, mascotasData] = await Promise.all([
        fetchDueños(forceRefresh),
        fetchMascotas(forceRefresh)
      ]);
      
      setOwners(dueñosData);
      setPets(mascotasData);
    } catch (err) {
      console.error('Error al cargar datos:', err);
      setError('No se pudieron cargar los datos. Por favor, intenta nuevamente.');
    } finally {
      setLoading(false);
      setRefreshing(false);
      
      // Limpiar el parámetro de needsRefresh si existe
      if (route.params?.needsRefresh) {
        navigation.setParams({ needsRefresh: false });
      }
    }
  };

  useEffect(() => {
    // Cargar datos con caché si no se requiere refresco
    loadData(needsRefresh);

    // Listener para cuando volvemos a esta pantalla
    const unsubscribe = navigation.addListener('focus', () => {
      const focusNeedsRefresh = route.params?.needsRefresh || false;
      if (focusNeedsRefresh) {
        console.log('Forzando refresco de dueños por needsRefresh');
        loadData(true); // Forzar refresco si es necesario
      }
    });

    return unsubscribe;
  }, [navigation, route.params?.needsRefresh]);

  const onRefresh = () => {
    setRefreshing(true);
    loadData(true); // Siempre forzar refresco en pull-to-refresh
  };

  const handleOwnerPress = (owner) => {
    navigation.navigate('OwnerDetail', { 
      dueño: owner, 
      mascotas: pets.filter(pet => pet.dueño === owner.id) 
    });
  };

  const handleAddOwner = () => {
    navigation.navigate('OwnerForm');
  };

  if (loading && !refreshing) {
    return (
      <View style={styles.centeredContainer}>
        <ActivityIndicator size="large" color="#0066cc" />
        <Text style={styles.loadingText}>Cargando perfiles...</Text>
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.centeredContainer}>
        <Text style={styles.errorText}>{error}</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <FlatList
        data={owners}
        renderItem={({ item }) => <OwnerCard owner={item} onPress={handleOwnerPress} />}
        keyExtractor={(item) => item.id.toString()}
        contentContainerStyle={styles.listContent}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyText}>No hay dueños registrados</Text>
          </View>
        }
      />
      
      <TouchableOpacity style={styles.fab} onPress={handleAddOwner}>
        <Icon name="plus" size={24} color="#fff" />
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
    padding: 10,
  },
  centeredContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
  },
  listContent: {
    paddingBottom: 80, // Para dejar espacio para el botón flotante
  },
  loadingText: {
    marginTop: 10,
    fontSize: 16,
    color: '#555',
  },
  errorText: {
    fontSize: 16,
    color: '#d32f2f',
    textAlign: 'center',
  },
  emptyContainer: {
    padding: 20,
    alignItems: 'center',
  },
  emptyText: {
    fontSize: 16,
    color: '#666',
  },
  fab: {
    position: 'absolute',
    width: 56,
    height: 56,
    alignItems: 'center',
    justifyContent: 'center',
    right: 20,
    bottom: 20,
    backgroundColor: '#00bf97',
    borderRadius: 28,
    elevation: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 3,
  },
}); 