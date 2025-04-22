import React from 'react';
import { Image, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { generateColorFromString } from '../utils/colors';
import { formatearImagen } from '../utils/formatImage';

const PetCard = ({ pet, onPress }) => {
  // Generar un color único basado en la especie y raza de la mascota
  const petIdentifier = `${pet.especie}${pet.raza}`;
  const petColor = generateColorFromString(petIdentifier);

  return (
    <TouchableOpacity style={styles.card} onPress={() => onPress(pet)}>
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
    justifyContent: 'center',
    alignItems: 'center',
  },
  placeholderText: {
    color: '#fff',
    fontSize: 24,
    fontWeight: 'bold',
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