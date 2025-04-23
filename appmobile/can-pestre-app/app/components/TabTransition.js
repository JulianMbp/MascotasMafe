import React, { useEffect, useMemo, useRef } from 'react';
import { Animated, Dimensions, StyleSheet } from 'react-native';

// Sacamos esta variable a nivel de módulo porque no es un hook
const { width } = Dimensions.get('window');

/**
 * Componente que aplica transiciones animadas entre pestañas (optimizado)
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
  // Usamos referencias para las animaciones para que persistan entre renderizados
  const opacity = useRef(new Animated.Value(0)).current;
  const translateX = useRef(new Animated.Value(width)).current;
  const translateY = useRef(new Animated.Value(100)).current;
  const scale = useRef(new Animated.Value(0.9)).current;

  // Optimizamos la configuración de animación con useMemo
  const animationConfig = useMemo(() => {
    return {
      timing: {
        duration: 250,
        useNativeDriver: true,
      },
      spring: {
        tension: 50,
        friction: 7,
        useNativeDriver: true,
      }
    };
  }, []);

  useEffect(() => {
    if (isFocused) {
      // Reutilizamos las animaciones para evitar recrearlas en cada cambio de foco
      let animation;
      
      switch (transitionType) {
        case 'slide':
          animation = Animated.spring(translateX, {
            toValue: 0,
            ...animationConfig.spring,
          });
          break;
        case 'slideUp':
          animation = Animated.spring(translateY, {
            toValue: 0,
            ...animationConfig.spring,
          });
          break;
        case 'zoom':
          animation = Animated.parallel([
            Animated.timing(opacity, {
              toValue: 1,
              ...animationConfig.timing,
            }),
            Animated.spring(scale, {
              toValue: 1,
              ...animationConfig.spring,
            }),
          ]);
          break;
        case 'fade':
        default:
          animation = Animated.timing(opacity, {
            toValue: 1,
            ...animationConfig.timing,
          });
          break;
      }
      
      // Iniciar la animación y limpiarla cuando se desmonte el componente
      animation.start();
      return () => animation.stop();
    } else {
      // Reiniciar valores de animación cuando pierde el foco
      // Nota: Usamos setValue para evitar animaciones adicionales al salir
      opacity.setValue(0);
      translateX.setValue(width);
      translateY.setValue(100);
      scale.setValue(0.9);
    }
  }, [isFocused, opacity, translateX, translateY, scale, transitionType, animationConfig]);

  // Determinar el estilo de transformación según el tipo de transición con useMemo
  const animatedStyle = useMemo(() => {
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
  }, [transitionType, opacity, translateX, translateY, scale]);

  // Si no está enfocado, retornamos null para no renderizar nada
  if (!isFocused) {
    return null;
  }

  // Usamos React.memo internamente para evitar rerenderizados innecesarios
  return (
    <Animated.View style={[styles.container, animatedStyle]}>
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

// Exportamos un componente memorizado para evitar rerenderizados innecesarios
export default React.memo(TabTransition); 