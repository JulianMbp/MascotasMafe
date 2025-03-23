import React, { useEffect, useRef } from 'react';
import { Animated, Dimensions, StyleSheet } from 'react-native';

const { width } = Dimensions.get('window');

/**
 * Componente que aplica transiciones animadas entre pestañas
 * 
 * @param {Object} props - Propiedades del componente
 * @param {React.ReactNode} props.children - Componente de pantalla a mostrar
 * @param {boolean} props.isFocused - Si la pestaña está actualmente enfocada
 * @param {String} props.transitionType - Tipo de transición: 'fade', 'slide', 'zoom', 'slideUp'
 */
const TabTransition = ({ 
  children, 
  isFocused, 
  transitionType = 'fade',
}) => {
  const opacity = useRef(new Animated.Value(0)).current;
  const translateX = useRef(new Animated.Value(width)).current;
  const translateY = useRef(new Animated.Value(100)).current;
  const scale = useRef(new Animated.Value(0.9)).current;

  useEffect(() => {
    if (isFocused) {
      // Animaciones cuando la pestaña gana el foco
      switch (transitionType) {
        case 'slide':
          Animated.spring(translateX, {
            toValue: 0,
            tension: 50,
            friction: 10,
            useNativeDriver: true,
          }).start();
          break;
        case 'slideUp':
          Animated.spring(translateY, {
            toValue: 0,
            tension: 50,
            friction: 10,
            useNativeDriver: true,
          }).start();
          break;
        case 'zoom':
          Animated.parallel([
            Animated.timing(opacity, {
              toValue: 1,
              duration: 250,
              useNativeDriver: true,
            }),
            Animated.spring(scale, {
              toValue: 1,
              tension: 50,
              friction: 7,
              useNativeDriver: true,
            }),
          ]).start();
          break;
        case 'fade':
        default:
          Animated.timing(opacity, {
            toValue: 1,
            duration: 300,
            useNativeDriver: true,
          }).start();
          break;
      }
    } else {
      // Reiniciar valores de animación cuando pierde el foco
      opacity.setValue(0);
      translateX.setValue(width);
      translateY.setValue(100);
      scale.setValue(0.9);
    }
  }, [isFocused, opacity, translateX, translateY, scale, transitionType]);

  // Determinar el estilo de transformación según el tipo de transición
  const getAnimatedStyle = () => {
    switch (transitionType) {
      case 'slide':
        return {
          transform: [{ translateX }],
        };
      case 'slideUp':
        return {
          transform: [{ translateY }],
        };
      case 'zoom':
        return {
          opacity,
          transform: [{ scale }],
        };
      case 'fade':
      default:
        return {
          opacity,
        };
    }
  };

  if (!isFocused) {
    // Si no está enfocado, no mostrar nada
    return null;
  }

  return (
    <Animated.View style={[styles.container, getAnimatedStyle()]}>
      {children}
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    width: '100%',
  },
});

export default TabTransition; 