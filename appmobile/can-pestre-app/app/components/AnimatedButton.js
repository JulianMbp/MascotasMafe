import React, { useRef } from 'react';
import { Animated, StyleSheet, Text, TouchableWithoutFeedback } from 'react-native';

/**
 * Componente de botón animado reutilizable
 * 
 * @param {Object} props - Propiedades del componente
 * @param {Function} props.onPress - Función a ejecutar al presionar el botón
 * @param {String} props.text - Texto del botón
 * @param {Object} props.style - Estilos adicionales para el botón
 * @param {Object} props.textStyle - Estilos adicionales para el texto
 * @param {React.ReactNode} props.children - Elementos hijos (para personalización avanzada)
 * @param {String} props.animationType - Tipo de animación: 'scale', 'bounce', 'rotate', 'pulse'
 * @param {Number} props.delay - Retraso en ms antes de ejecutar onPress
 */
const AnimatedButton = ({ 
  onPress, 
  text, 
  style, 
  textStyle,
  children,
  animationType = 'scale',
  delay = 150
}) => {
  const animatedValue = useRef(new Animated.Value(1)).current;
  const animatedRotateValue = useRef(new Animated.Value(0)).current;

  // Función que maneja las diferentes animaciones
  const animateButton = () => {
    switch (animationType) {
      case 'bounce':
        Animated.sequence([
          Animated.timing(animatedValue, {
            toValue: 0.9,
            duration: 100,
            useNativeDriver: true,
          }),
          Animated.spring(animatedValue, {
            toValue: 1,
            friction: 3,
            tension: 40,
            useNativeDriver: true,
          })
        ]).start();
        break;
        
      case 'rotate':
        Animated.timing(animatedRotateValue, {
          toValue: 1,
          duration: 200,
          useNativeDriver: true,
        }).start(() => {
          animatedRotateValue.setValue(0);
        });
        break;
        
      case 'pulse':
        Animated.sequence([
          Animated.timing(animatedValue, {
            toValue: 1.1,
            duration: 100,
            useNativeDriver: true,
          }),
          Animated.timing(animatedValue, {
            toValue: 1,
            duration: 100,
            useNativeDriver: true,
          })
        ]).start();
        break;
        
      case 'scale':
      default:
        Animated.sequence([
          Animated.timing(animatedValue, {
            toValue: 0.9,
            duration: 100,
            useNativeDriver: true,
          }),
          Animated.timing(animatedValue, {
            toValue: 1,
            duration: 100,
            useNativeDriver: true,
          })
        ]).start();
        break;
    }
  };

  // Manejar el evento de presionar
  const handlePress = () => {
    animateButton();
    
    if (onPress) {
      setTimeout(() => {
        onPress();
      }, delay);
    }
  };

  // Calcular transformaciones según el tipo de animación
  const getAnimatedStyle = () => {
    const baseStyle = { transform: [{ scale: animatedValue }] };
    
    if (animationType === 'rotate') {
      const spin = animatedRotateValue.interpolate({
        inputRange: [0, 1],
        outputRange: ['0deg', '360deg']
      });
      
      return {
        ...baseStyle,
        transform: [...baseStyle.transform, { rotate: spin }]
      };
    }
    
    return baseStyle;
  };

  return (
    <TouchableWithoutFeedback onPress={handlePress}>
      <Animated.View style={[styles.button, style, getAnimatedStyle()]}>
        {children || (
          <Text style={[styles.buttonText, textStyle]}>{text}</Text>
        )}
      </Animated.View>
    </TouchableWithoutFeedback>
  );
};

const styles = StyleSheet.create({
  button: {
    backgroundColor: '#00bf97',
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  buttonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
  },
});

export default AnimatedButton; 