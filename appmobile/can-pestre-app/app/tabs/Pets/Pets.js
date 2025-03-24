import { useNavigation } from '@react-navigation/native';
import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  RefreshControl,
  StyleSheet,
  Text,
  TouchableOpacity,
  View
} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import PetCard from '../../components/PetCard';
import { fetchMascotas } from '../../services/api';

export default function Pets({ route }) {
  const [pets, setPets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState(null);
  const navigation = useNavigation();

  // Verificar si hay parametros de needsRefresh en la ruta
  const needsRefresh = route?.params?.needsRefresh || false;

  const loadPets = async (forceRefresh = false) => {
    try {
      if (!forceRefresh && !refreshing) {
        setLoading(true);
      }
      setError(null);
      const data = await fetchMascotas(forceRefresh);
      setPets(data);
    } catch (err) {
      console.error('Error al cargar mascotas:', err);
      setError('No se pudieron cargar las mascotas. Por favor, intenta nuevamente.');
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
    // Cargar mascotas con caché si no se requiere refresco
    loadPets(needsRefresh);

    // Listener para cuando volvemos a esta pantalla
    const unsubscribe = navigation.addListener('focus', () => {
      const focusNeedsRefresh = route.params?.needsRefresh || false;
      if (focusNeedsRefresh) {
        console.log('Forzando refresco de mascotas por needsRefresh');
        loadPets(true); // Forzar refresco si es necesario
      }
    });

    return unsubscribe;
  }, [navigation, route.params?.needsRefresh]);

  const onRefresh = () => {
    setRefreshing(true);
    loadPets(true); // Siempre forzar refresco en pull-to-refresh
  };

  const handlePetPress = (pet) => {
    navigation.navigate('PetDetail', { pet });
  };

  const handleAddPet = () => {
    navigation.navigate('PetForm');
  };

  if (loading && !refreshing) {
    return (
      <View style={styles.centeredContainer}>
        <ActivityIndicator size="large" color="#0066cc" />
        <Text style={styles.loadingText}>Cargando mascotas...</Text>
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
        data={pets}
        renderItem={({ item }) => <PetCard pet={item} onPress={handlePetPress} />}
        keyExtractor={(item) => item.id.toString()}
        contentContainerStyle={styles.listContent}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyText}>No hay mascotas registradas</Text>
          </View>
        }
      />
      
      <TouchableOpacity style={styles.fab} onPress={handleAddPet}>
        <Icon name="plus" size={24} color="#fff" />
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  centeredContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
  },
  listContent: {
    paddingVertical: 12,
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