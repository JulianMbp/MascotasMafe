import { useNavigation } from '@react-navigation/native';
import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Image,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View
} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { deleteMascota, fetchDueñoById } from '../services/api';
import { generateColorFromString } from '../utils/colors';
import { formatearImagen } from '../utils/formatImage';

const PetDetail = ({ route }) => {
  const { pet } = route.params;
  const [dueño, setDueño] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const navigation = useNavigation();
  
  // Generar un color único basado en la especie y raza de la mascota
  const petIdentifier = `${pet.especie}${pet.raza}`;
  const petColor = generateColorFromString(petIdentifier);

  useEffect(() => {
    const loadDueñoData = async () => {
      try {
        setLoading(true);
        const dueñoData = await fetchDueñoById(pet.dueño);
        setDueño(dueñoData);
        setLoading(false);
      } catch (err) {
        setError('Error al cargar los datos del dueño');
        setLoading(false);
        console.error('Error al cargar los datos del dueño:', err);
      }
    };

    loadDueñoData();
  }, [pet.dueño]);

  const navigateBackWithRefresh = () => {
    console.log('Navegando de vuelta con needsRefresh=true después de eliminar mascota');
    navigation.navigate('Pets', { needsRefresh: true });
  };

  const handleDelete = () => {
    Alert.alert(
      'Eliminar Mascota',
      `¿Estás seguro de que deseas eliminar a ${pet.nombre}?`,
      [
        { text: 'Cancelar', style: 'cancel' },
        { 
          text: 'Eliminar', 
          style: 'destructive',
          onPress: async () => {
            try {
              await deleteMascota(pet.id);
              Alert.alert('Éxito', 'Mascota eliminada correctamente', [
                {
                  text: 'OK',
                  onPress: () => navigateBackWithRefresh()
                }
              ]);
            } catch (error) {
              console.error('Error al eliminar mascota:', error);
              Alert.alert('Error', 'No se pudo eliminar la mascota');
            }
          }
        }
      ]
    );
  };

  const handleEdit = () => {
    navigation.navigate('PetForm', { pet });
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#0066cc" />
        <Text style={styles.loadingText}>Cargando información...</Text>
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.errorContainer}>
        <Text style={styles.errorText}>{error}</Text>
      </View>
    );
  }

  return (
    <View style={styles.mainContainer}>
      <ScrollView style={styles.container}>
        <View style={styles.header}>
          {pet.imagen ? (
            <Image 
              source={{ uri: formatearImagen(pet.imagen) }} 
              style={styles.image} 
              resizeMode="cover"
            />
          ) : (
            <View style={[styles.imagePlaceholder, { backgroundColor: petColor }]}>
              <Text style={styles.placeholderText}>{pet.nombre.charAt(0)}</Text>
            </View>
          )}
          <Text style={styles.name}>{pet.nombre}</Text>
        </View>

        <View style={styles.infoSection}>
          <Text style={styles.sectionTitle}>Información de la Mascota</Text>
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Especie:</Text>
            <Text style={styles.infoValue}>{pet.especie}</Text>
          </View>
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Raza:</Text>
            <Text style={styles.infoValue}>{pet.raza}</Text>
          </View>
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Edad:</Text>
            <Text style={styles.infoValue}>{pet.edad} años</Text>
          </View>
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Peso:</Text>
            <Text style={styles.infoValue}>{pet.peso} kg</Text>
          </View>
          {pet.fecha_nacimiento && (
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Fecha de Nacimiento:</Text>
              <Text style={styles.infoValue}>{new Date(pet.fecha_nacimiento).toLocaleDateString()}</Text>
            </View>
          )}
        </View>

        {dueño && (
          <View style={styles.infoSection}>
            <Text style={styles.sectionTitle}>Información del Dueño</Text>
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Nombre:</Text>
              <Text style={styles.infoValue}>{dueño.nombre} {dueño.apellido}</Text>
            </View>
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Email:</Text>
              <Text style={styles.infoValue}>{dueño.email}</Text>
            </View>
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Teléfono:</Text>
              <Text style={styles.infoValue}>{dueño.telefono}</Text>
            </View>
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Dirección:</Text>
              <Text style={styles.infoValue}>{dueño.direccion}, {dueño.ciudad}</Text>
            </View>
          </View>
        )}

        <View style={styles.actionsContainer}>
          <TouchableOpacity style={styles.editButton} onPress={handleEdit}>
            <Icon name="pencil" size={20} color="#fff" />
            <Text style={styles.buttonText}>Editar</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.deleteButton} onPress={handleDelete}>
            <Icon name="delete" size={20} color="#fff" />
            <Text style={styles.buttonText}>Eliminar</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  mainContainer: {
    flex: 1,
    backgroundColor: '#f9f9f9',
  },
  container: {
    flex: 1,
  },
  header: {
    alignItems: 'center',
    padding: 20,
    backgroundColor: 'white',
    borderBottomLeftRadius: 15,
    borderBottomRightRadius: 15,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  image: {
    width: 150,
    height: 150,
    borderRadius: 75,
    marginBottom: 15,
  },
  imagePlaceholder: {
    width: 150,
    height: 150,
    borderRadius: 75,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 15,
  },
  placeholderText: {
    color: '#fff',
    fontSize: 48,
    fontWeight: 'bold',
  },
  name: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
  },
  infoSection: {
    margin: 20,
    backgroundColor: 'white',
    borderRadius: 10,
    padding: 15,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 2,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
    paddingBottom: 8,
  },
  infoRow: {
    flexDirection: 'row',
    marginBottom: 10,
  },
  infoLabel: {
    fontSize: 16,
    fontWeight: '500',
    color: '#555',
    width: '40%',
  },
  infoValue: {
    fontSize: 16,
    color: '#333',
    flex: 1,
  },
  actionsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    margin: 20,
    marginTop: 5,
    marginBottom: 30,
  },
  editButton: {
    backgroundColor: '#00bf97',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 12,
    borderRadius: 8,
    flex: 1,
    marginRight: 10,
  },
  deleteButton: {
    backgroundColor: '#e53935',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 12,
    borderRadius: 8,
    flex: 1,
    marginLeft: 10,
  },
  buttonText: {
    color: 'white',
    fontWeight: 'bold',
    marginLeft: 8,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f9f9f9',
  },
  loadingText: {
    marginTop: 10,
    fontSize: 16,
    color: '#555',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f9f9f9',
    padding: 20,
  },
  errorText: {
    fontSize: 16,
    color: '#d32f2f',
    textAlign: 'center',
  },
});

export default PetDetail; 