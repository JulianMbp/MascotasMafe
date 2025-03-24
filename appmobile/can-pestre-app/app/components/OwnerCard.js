import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { generateColorFromString } from '../utils/colors';

const OwnerCard = ({ owner, onPress }) => {
  // Generar un color único basado en el nombre y apellido del dueño
  const ownerFullName = `${owner.nombre}${owner.apellido}`;
  const avatarColor = generateColorFromString(ownerFullName);
  
  return (
    <TouchableOpacity style={styles.card} onPress={() => onPress(owner)}>
      <View style={[styles.avatar, { backgroundColor: avatarColor }]}>
        <Text style={styles.avatarText}>
          {owner.nombre.charAt(0)}{owner.apellido.charAt(0)}
        </Text>
      </View>
      <View style={styles.info}>
        <Text style={styles.name}>{owner.nombre} {owner.apellido}</Text>
        <Text style={styles.contact}>{owner.email}</Text>
        <Text style={styles.contact}>{owner.telefono}</Text>
        <Text style={styles.address}>{owner.direccion}, {owner.ciudad}</Text>
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#fff',
    borderRadius: 8,
    padding: 16,
    marginBottom: 12,
    flexDirection: 'row',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  avatar: {
    width: 50,
    height: 50,
    borderRadius: 25,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  avatarText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
  },
  info: {
    flex: 1,
  },
  name: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  contact: {
    fontSize: 14,
    color: '#555',
    marginBottom: 2,
  },
  address: {
    fontSize: 14,
    color: '#777',
    marginTop: 4,
  },
});

export default OwnerCard; 