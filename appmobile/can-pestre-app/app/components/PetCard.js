import React from 'react';
import { Image, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

const PetCard = ({ pet, onPress }) => {
  // Función para formatear correctamente la imagen base64
  const formatearImagen = (imagenData) => {
    if (!imagenData) return null;
    
    // Verificar si la cadena ya contiene el prefijo data:image
    if (imagenData.startsWith('data:image')) {
      return imagenData;
    }
    
    // Si no tiene el prefijo, añadirlo
    return `data:image/jpeg;base64,${imagenData}`;
  };

  return (
    <TouchableOpacity style={styles.card} onPress={() => onPress(pet)}>
      {pet.imagen ? (
        <Image 
          source={{ uri: formatearImagen(pet.imagen) }} 
          style={styles.image} 
          resizeMode="cover"
        />
      ) : (
        <View style={styles.imagePlaceholder}>
          <Text style={styles.placeholderText}>Sin imagen</Text>
        </View>
      )}
      <View style={styles.info}>
        <Text style={styles.name}>{pet.nombre}</Text>
        <Text style={styles.breed}>{pet.especie} - {pet.raza}</Text>
        <Text style={styles.details}>Edad: {pet.edad} años</Text>
        <Text style={styles.details}>Peso: {pet.peso} kg</Text>
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: 'white',
    borderRadius: 10,
    padding: 15,
    marginVertical: 8,
    marginHorizontal: 16,
    flexDirection: 'row',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  image: {
    width: 80,
    height: 80,
    borderRadius: 8,
  },
  imagePlaceholder: {
    width: 80,
    height: 80,
    borderRadius: 8,
    backgroundColor: '#e1e1e1',
    justifyContent: 'center',
    alignItems: 'center',
  },
  placeholderText: {
    color: '#757575',
    fontSize: 12,
  },
  info: {
    flex: 1,
    marginLeft: 15,
    justifyContent: 'center',
  },
  name: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 4,
  },
  breed: {
    fontSize: 16,
    color: '#555',
    marginBottom: 4,
  },
  details: {
    fontSize: 14,
    color: '#666',
    marginBottom: 2,
  },
});

export default PetCard; 