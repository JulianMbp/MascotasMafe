import axios from 'axios';

// URL base de la API - Asegúrate de cambiar esto según tu configuración local
const API_URL = 'https://81da-186-99-161-251.ngrok-free.app';  // cambiar por url de ngrok

// Creando una instancia de axios con la URL base
const apiClient = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Funciones para mascotas
export const fetchMascotas = async () => {
  try {
    const response = await apiClient.get('mascotas/mascotas_list');
    return response.data;
  } catch (error) {
    console.error('Error al obtener mascotas:', error);
    throw error;
  }
};

export const fetchMascotaById = async (id) => {
  try {
    const response = await apiClient.get(`mascotas/mascotas_id/${id}`);
    return response.data;
  } catch (error) {
    console.error(`Error al obtener mascota con ID ${id}:`, error);
    throw error;
  }
};

export const createMascota = async (mascotaData) => {
  try {
    const response = await apiClient.post('mascotas/mascotas_create', mascotaData);
    return response.data;
  } catch (error) {
    console.error('Error al crear mascota:', error);
    throw error;
  }
};

export const updateMascota = async (id, mascotaData) => {
  try {
    const response = await apiClient.put(`mascotas/mascotas_update/${id}`, mascotaData);
    return response.data;
  } catch (error) {
    console.error(`Error al actualizar mascota con ID ${id}:`, error);
    throw error;
  }
};

export const deleteMascota = async (id) => {
  try {
    const response = await apiClient.delete(`mascotas/mascotas_delete/${id}`);
    return response.data;
  } catch (error) {
    console.error(`Error al eliminar mascota con ID ${id}:`, error);
    throw error;
  }
};

// Funciones para dueños
export const fetchDueños = async () => {
  try {
    const response = await apiClient.get('dueño/dueños_list');
    return response.data;
  } catch (error) {
    console.error('Error al obtener dueños:', error);
    throw error;
  }
};

export const fetchDueñoById = async (id) => {
  try {
    const response = await apiClient.get(`dueño/dueños_id/${id}`);
    return response.data;
  } catch (error) {
    console.error(`Error al obtener dueño con ID ${id}:`, error);
    throw error;
  }
};

export const createDueño = async (dueñoData) => {
  try {
    const response = await apiClient.post('dueño/dueños_create', dueñoData);
    return response.data;
  } catch (error) {
    console.error('Error al crear dueño:', error);
    throw error;
  }
};

export const updateDueño = async (id, dueñoData) => {
  try {
    const response = await apiClient.put(`dueño/dueños_update/${id}`, dueñoData);
    return response.data;
  } catch (error) {
    console.error(`Error al actualizar dueño con ID ${id}:`, error);
    throw error;
  }
};

export const deleteDueño = async (id) => {
  try {
    const response = await apiClient.delete(`dueño/dueños_delete/${id}`);
    return response.data;
  } catch (error) {
    console.error(`Error al eliminar dueño con ID ${id}:`, error);
    throw error;
  }
}; 