import { useNavigation } from '@react-navigation/native';
import React, { useState } from 'react';
import {
    ActivityIndicator,
    Alert,
    ScrollView,
    StyleSheet,
    Text,
    TouchableOpacity,
    View
} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { deleteDueño } from '../services/api';

const OwnerDetail = ({ route }) => {
  const { dueño, mascotas = [] } = route.params;
  const [loading, setLoading] = useState(false);
  const navigation = useNavigation();

  const handleEdit = () => {
    navigation.navigate('OwnerForm', { dueño });
  };

  const handleDelete = () => {
    // Si el dueño tiene mascotas, advertir al usuario
    if (mascotas.length > 0) {
      Alert.alert(
        'No se puede eliminar',
        'Este dueño tiene mascotas asociadas. Por favor, elimina o reasigna las mascotas primero.',
        [{ text: 'Entendido', style: 'cancel' }]
      );
      return;
    }

    Alert.alert(
      'Eliminar Dueño',
      `¿Estás seguro de que deseas eliminar a ${dueño.nombre} ${dueño.apellido}?`,
      [
        { text: 'Cancelar', style: 'cancel' },
        { 
          text: 'Eliminar', 
          style: 'destructive',
          onPress: async () => {
            try {
              setLoading(true);
              await deleteDueño(dueño.id);
              Alert.alert('Éxito', 'Dueño eliminado correctamente');
              navigation.goBack();
            } catch (error) {
              console.error('Error al eliminar dueño:', error);
              Alert.alert('Error', 'No se pudo eliminar el dueño');
            } finally {
              setLoading(false);
            }
          }
        }
      ]
    );
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#0066cc" />
        <Text style={styles.loadingText}>Procesando...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <ScrollView>
        <View style={styles.header}>
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>
              {dueño.nombre.charAt(0)}{dueño.apellido.charAt(0)}
            </Text>
          </View>
          <Text style={styles.name}>{dueño.nombre} {dueño.apellido}</Text>
        </View>

        <View style={styles.infoSection}>
          <Text style={styles.sectionTitle}>Información de Contacto</Text>
          
          <View style={styles.infoRow}>
            <Icon name="email" size={20} color="#555" style={styles.icon} />
            <Text style={styles.infoLabel}>Email:</Text>
            <Text style={styles.infoValue}>{dueño.email}</Text>
          </View>
          
          <View style={styles.infoRow}>
            <Icon name="phone" size={20} color="#555" style={styles.icon} />
            <Text style={styles.infoLabel}>Teléfono:</Text>
            <Text style={styles.infoValue}>{dueño.telefono}</Text>
          </View>
          
          <View style={styles.infoRow}>
            <Icon name="map-marker" size={20} color="#555" style={styles.icon} />
            <Text style={styles.infoLabel}>Dirección:</Text>
            <Text style={styles.infoValue}>{dueño.direccion}, {dueño.ciudad}</Text>
          </View>
        </View>

        {mascotas.length > 0 && (
          <View style={styles.infoSection}>
            <Text style={styles.sectionTitle}>Mascotas</Text>
            {mascotas.map(mascota => (
              <TouchableOpacity 
                key={mascota.id}
                style={styles.mascotaItem}
                onPress={() => navigation.navigate('PetDetail', { pet: mascota })}
              >
                <Icon name="paw" size={20} color="#00bf97" style={styles.icon} />
                <Text style={styles.mascotaName}>{mascota.nombre}</Text>
                <Text style={styles.mascotaInfo}>
                  {mascota.especie} • {mascota.raza}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        )}

        <View style={styles.actionsContainer}>
          <TouchableOpacity style={styles.editButton} onPress={handleEdit}>
            <Icon name="pencil" size={20} color="#fff" />
            <Text style={styles.buttonText}>Editar</Text>
          </TouchableOpacity>
          <TouchableOpacity 
            style={[
              styles.deleteButton, 
              mascotas.length > 0 && styles.disabledButton
            ]} 
            onPress={handleDelete}
            disabled={mascotas.length > 0}
          >
            <Icon name="delete" size={20} color="#fff" />
            <Text style={styles.buttonText}>Eliminar</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f9f9f9',
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
  avatar: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: '#0066cc',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 15,
  },
  avatarText: {
    color: 'white',
    fontSize: 36,
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
    alignItems: 'center',
    marginBottom: 12,
  },
  icon: {
    marginRight: 10,
  },
  infoLabel: {
    fontSize: 16,
    fontWeight: '500',
    color: '#555',
    width: '25%',
  },
  infoValue: {
    fontSize: 16,
    color: '#333',
    flex: 1,
  },
  mascotaItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  mascotaName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    marginRight: 10,
  },
  mascotaInfo: {
    fontSize: 14,
    color: '#666',
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
    backgroundColor: '#0066cc',
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
  disabledButton: {
    backgroundColor: '#aaa',
  },
  buttonText: {
    color: 'white',
    fontWeight: 'bold',
    marginLeft: 8,
  },
});

export default OwnerDetail; 