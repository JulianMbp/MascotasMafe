import React, { useState } from 'react';
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
import { createDueño, updateDueño } from '../services/api';

const OwnerForm = ({ navigation, route }) => {
  // Verificar si estamos editando un dueño existente
  const isEditing = route.params?.dueño ? true : false;
  const existingDueño = route.params?.dueño;

  const [nombre, setNombre] = useState(isEditing ? existingDueño.nombre : '');
  const [apellido, setApellido] = useState(isEditing ? existingDueño.apellido : '');
  const [email, setEmail] = useState(isEditing ? existingDueño.email : '');
  const [telefono, setTelefono] = useState(isEditing ? existingDueño.telefono : '');
  const [direccion, setDireccion] = useState(isEditing ? existingDueño.direccion : '');
  const [ciudad, setCiudad] = useState(isEditing ? existingDueño.ciudad : '');
  const [loading, setLoading] = useState(false);

  const validateEmail = (email) => {
    const regex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return regex.test(email);
  };

  const navigateBackWithRefresh = () => {
    console.log('Navegando de vuelta con needsRefresh=true');
    navigation.navigate('Profile', { needsRefresh: true });
  };

  const handleSubmit = async () => {
    if (!nombre || !apellido || !email || !telefono || !direccion || !ciudad) {
      Alert.alert('Error', 'Por favor, completa todos los campos');
      return;
    }

    if (!validateEmail(email)) {
      Alert.alert('Error', 'Por favor, ingresa un email válido');
      return;
    }

    try {
      setLoading(true);
      const dueñoData = {
        nombre,
        apellido,
        email,
        telefono,
        direccion,
        ciudad
      };

      if (isEditing) {
        await updateDueño(existingDueño.id, dueñoData);
        Alert.alert('Éxito', 'Dueño actualizado correctamente', [
          { 
            text: 'OK', 
            onPress: () => navigateBackWithRefresh()
          }
        ]);
      } else {
        await createDueño(dueñoData);
        Alert.alert('Éxito', 'Dueño registrado correctamente', [
          { 
            text: 'OK', 
            onPress: () => navigateBackWithRefresh()
          }
        ]);
      }
    } catch (error) {
      console.error('Error al procesar dueño:', error);
      Alert.alert('Error', `No se pudo ${isEditing ? 'actualizar' : 'registrar'} el dueño`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={styles.container}
    >
      <ScrollView style={styles.formContainer}>
        <Text style={styles.title}>
          {isEditing ? 'Editar Dueño' : 'Registrar Nuevo Dueño'}
        </Text>
        
        <View style={styles.inputContainer}>
          <Text style={styles.label}>Nombre *</Text>
          <TextInput
            style={styles.input}
            value={nombre}
            onChangeText={setNombre}
            placeholder="Nombre del dueño"
          />
        </View>

        <View style={styles.inputContainer}>
          <Text style={styles.label}>Apellido *</Text>
          <TextInput
            style={styles.input}
            value={apellido}
            onChangeText={setApellido}
            placeholder="Apellido del dueño"
          />
        </View>

        <View style={styles.inputContainer}>
          <Text style={styles.label}>Email *</Text>
          <TextInput
            style={styles.input}
            value={email}
            onChangeText={setEmail}
            placeholder="correo@ejemplo.com"
            keyboardType="email-address"
            autoCapitalize="none"
          />
        </View>

        <View style={styles.inputContainer}>
          <Text style={styles.label}>Teléfono *</Text>
          <TextInput
            style={styles.input}
            value={telefono}
            onChangeText={setTelefono}
            placeholder="Número de teléfono"
            keyboardType="phone-pad"
          />
        </View>

        <View style={styles.inputContainer}>
          <Text style={styles.label}>Dirección *</Text>
          <TextInput
            style={styles.input}
            value={direccion}
            onChangeText={setDireccion}
            placeholder="Dirección"
          />
        </View>

        <View style={styles.inputContainer}>
          <Text style={styles.label}>Ciudad *</Text>
          <TextInput
            style={styles.input}
            value={ciudad}
            onChangeText={setCiudad}
            placeholder="Ciudad"
          />
        </View>

        <TouchableOpacity
          style={styles.submitButton}
          onPress={handleSubmit}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator color="#fff" size="small" />
          ) : (
            <Text style={styles.submitButtonText}>
              {isEditing ? 'Actualizar Dueño' : 'Registrar Dueño'}
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
  submitButton: {
    backgroundColor: '#0066cc',
    padding: 15,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 20,
    marginBottom: 30,
  },
  submitButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
  },
});

export default OwnerForm; 