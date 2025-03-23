import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View
} from 'react-native';
import { createMascota, fetchDueños, updateMascota } from '../services/api';

const PetForm = ({ navigation, route }) => {
  // Verificar si estamos editando una mascota existente
  const isEditing = route.params?.pet ? true : false;
  const existingPet = route.params?.pet;

  const [nombre, setNombre] = useState(isEditing ? existingPet.nombre : '');
  const [especie, setEspecie] = useState(isEditing ? existingPet.especie : '');
  const [raza, setRaza] = useState(isEditing ? existingPet.raza : '');
  const [edad, setEdad] = useState(isEditing ? existingPet.edad.toString() : '');
  const [peso, setPeso] = useState(isEditing ? existingPet.peso.toString() : '');
  const [imagen, setImagen] = useState(isEditing ? (existingPet.imagen || '') : '');
  const [dueños, setDueños] = useState([]);
  const [selectedDueño, setSelectedDueño] = useState(isEditing ? existingPet.dueño : null);
  const [loading, setLoading] = useState(false);
  const [dueñosLoading, setDueñosLoading] = useState(true);

  useEffect(() => {
    const loadDueños = async () => {
      try {
        const data = await fetchDueños();
        setDueños(data);
      } catch (error) {
        Alert.alert('Error', 'No se pudieron cargar los dueños');
      } finally {
        setDueñosLoading(false);
      }
    };
    
    loadDueños();
  }, []);

  const handleSubmit = async () => {
    if (!nombre || !especie || !raza || !edad || !peso || !selectedDueño) {
      Alert.alert('Error', 'Por favor, completa todos los campos obligatorios');
      return;
    }

    try {
      setLoading(true);
      const mascotaData = {
        nombre,
        especie,
        raza,
        edad: parseInt(edad),
        peso: parseFloat(peso),
        imagen: imagen || null,
        dueño: selectedDueño
      };

      if (isEditing) {
        await updateMascota(existingPet.id, mascotaData);
        Alert.alert('Éxito', 'Mascota actualizada correctamente', [
          { 
            text: 'OK', 
            onPress: () => navigation.goBack() 
          }
        ]);
      } else {
        await createMascota(mascotaData);
        Alert.alert('Éxito', 'Mascota registrada correctamente', [
          { 
            text: 'OK', 
            onPress: () => navigation.goBack() 
          }
        ]);
      }
    } catch (error) {
      console.error('Error al procesar mascota:', error);
      Alert.alert('Error', `No se pudo ${isEditing ? 'actualizar' : 'registrar'} la mascota`);
    } finally {
      setLoading(false);
    }
  };

  if (dueñosLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#0066cc" />
        <Text style={styles.loadingText}>Cargando dueños...</Text>
      </View>
    );
  }

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={styles.container}
    >
      <ScrollView style={styles.formContainer}>
        <Text style={styles.title}>
          {isEditing ? 'Editar Mascota' : 'Registrar Nueva Mascota'}
        </Text>
        
        <View style={styles.inputContainer}>
          <Text style={styles.label}>Nombre *</Text>
          <TextInput
            style={styles.input}
            value={nombre}
            onChangeText={setNombre}
            placeholder="Nombre de la mascota"
          />
        </View>

        <View style={styles.inputContainer}>
          <Text style={styles.label}>Especie *</Text>
          <TextInput
            style={styles.input}
            value={especie}
            onChangeText={setEspecie}
            placeholder="Ej: Perro, Gato, etc."
          />
        </View>

        <View style={styles.inputContainer}>
          <Text style={styles.label}>Raza *</Text>
          <TextInput
            style={styles.input}
            value={raza}
            onChangeText={setRaza}
            placeholder="Raza de la mascota"
          />
        </View>

        <View style={styles.inputContainer}>
          <Text style={styles.label}>Edad (años) *</Text>
          <TextInput
            style={styles.input}
            value={edad}
            onChangeText={setEdad}
            placeholder="Edad en años"
            keyboardType="numeric"
          />
        </View>

        <View style={styles.inputContainer}>
          <Text style={styles.label}>Peso (kg) *</Text>
          <TextInput
            style={styles.input}
            value={peso}
            onChangeText={setPeso}
            placeholder="Peso en kilogramos"
            keyboardType="numeric"
          />
        </View>

        <View style={styles.inputContainer}>
          <Text style={styles.label}>URL de imagen (opcional)</Text>
          <TextInput
            style={styles.input}
            value={imagen}
            onChangeText={setImagen}
            placeholder="URL de la imagen"
          />
        </View>

        <View style={styles.inputContainer}>
          <Text style={styles.label}>Dueño *</Text>
          <ScrollView style={styles.dueñosContainer}>
            {dueños.length > 0 ? (
              dueños.map((dueño) => (
                <TouchableOpacity
                  key={dueño.id}
                  style={[
                    styles.dueñoItem,
                    selectedDueño === dueño.id && styles.selectedDueño
                  ]}
                  onPress={() => setSelectedDueño(dueño.id)}
                >
                  <Text style={styles.dueñoName}>
                    {dueño.nombre} {dueño.apellido}
                  </Text>
                  <Text style={styles.dueñoInfo}>
                    {dueño.email} • {dueño.telefono}
                  </Text>
                </TouchableOpacity>
              ))
            ) : (
              <Text style={styles.noDueños}>
                No hay dueños registrados. Por favor, registra un dueño primero.
              </Text>
            )}
          </ScrollView>
        </View>

        <TouchableOpacity
          style={[styles.submitButton, dueños.length === 0 && styles.disabledButton]}
          onPress={handleSubmit}
          disabled={dueños.length === 0 || loading}
        >
          {loading ? (
            <ActivityIndicator color="#fff" size="small" />
          ) : (
            <Text style={styles.submitButtonText}>
              {isEditing ? 'Actualizar Mascota' : 'Registrar Mascota'}
            </Text>
          )}
        </TouchableOpacity>
      </ScrollView>
    </KeyboardAvoidingView>
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
  },
  loadingText: {
    marginTop: 10,
    fontSize: 16,
    color: '#555',
  },
  formContainer: {
    flex: 1,
    padding: 20,
  },
  title: {
    fontSize: 22,
    fontWeight: 'bold',
    marginBottom: 20,
    color: '#333',
    textAlign: 'center',
  },
  inputContainer: {
    marginBottom: 15,
  },
  label: {
    fontSize: 16,
    color: '#555',
    marginBottom: 5,
  },
  input: {
    backgroundColor: 'white',
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#ddd',
    fontSize: 16,
  },
  dueñosContainer: {
    maxHeight: 200,
    backgroundColor: 'white',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#ddd',
  },
  dueñoItem: {
    padding: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  selectedDueño: {
    backgroundColor: '#e6f7ff',
    borderColor: '#1890ff',
  },
  dueñoName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
  },
  dueñoInfo: {
    fontSize: 14,
    color: '#666',
    marginTop: 2,
  },
  noDueños: {
    padding: 15,
    textAlign: 'center',
    color: '#999',
  },
  submitButton: {
    backgroundColor: '#00bf97',
    padding: 15,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 20,
    marginBottom: 30,
  },
  disabledButton: {
    backgroundColor: '#ccc',
  },
  submitButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
  },
});

export default PetForm; 