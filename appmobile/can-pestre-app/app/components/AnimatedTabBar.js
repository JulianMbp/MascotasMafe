import React, { memo, useEffect, useRef } from 'react';
import { Animated, Platform, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

/**
 * TabBar personalizado con animaciones simplificadas
 */
function AnimatedTabBar({ state, descriptors, navigation }) {
  // Creamos una animación para cada ruta
  const animatedValues = useRef({});
  
  // Aseguramos que cada ruta tenga su valor animado
  state.routes.forEach((route, index) => {
    if (animatedValues.current[route.key] === undefined) {
      animatedValues.current[route.key] = new Animated.Value(
        index === state.index ? 1 : 0
      );
    }
  });

  // Manejar animaciones cuando cambia el foco
  useEffect(() => {
    state.routes.forEach((route, index) => {
      const isFocused = state.index === index;
      Animated.timing(animatedValues.current[route.key], {
        toValue: isFocused ? 1 : 0,
        duration: 200,
        useNativeDriver: true,
      }).start();
    });
  }, [state.index, state.routes]);

  return (
    <View style={styles.tabBarContainer}>
      {state.routes.map((route, index) => {
        const { options } = descriptors[route.key];
        const label = options.tabBarLabel || options.title || route.name;
        const isFocused = state.index === index;
        
        // Obtener el icono desde las opciones
        const TabBarIcon = options.tabBarIcon;

        const onPress = () => {
          const event = navigation.emit({
            type: 'tabPress',
            target: route.key,
            canPreventDefault: true,
          });

          if (!isFocused && !event.defaultPrevented) {
            navigation.navigate(route.name);
          }
        };

        return (
          <TouchableOpacity
            key={route.key}
            accessibilityRole="button"
            accessibilityState={isFocused ? { selected: true } : {}}
            accessibilityLabel={options.tabBarAccessibilityLabel}
            testID={options.tabBarTestID}
            onPress={onPress}
            style={styles.tabItem}
            activeOpacity={0.7}
          >
            <View style={styles.itemContainer}>
              {/* Ícono */}
              <View style={styles.iconContainer}>
                {TabBarIcon && TabBarIcon({
                  focused: isFocused,
                  color: isFocused ? '#00bf97' : '#95a5a6',
                  size: 24,
                })}
              </View>

              {/* Etiqueta */}
              <Text
                style={[
                  styles.tabLabel,
                  {
                    color: isFocused ? '#00bf97' : '#95a5a6',
                  },
                ]}
                numberOfLines={1}
              >
                {label}
              </Text>

              {/* Indicador simplificado de pestaña activa */}
              {isFocused && (
                <View style={styles.activeIndicator} />
              )}
            </View>
          </TouchableOpacity>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  tabBarContainer: {
    flexDirection: 'row',
    height: Platform.OS === 'android' ? 60 : 80,
    backgroundColor: 'white',
    borderTopWidth: 1,
    borderTopColor: '#f2f2f2',
    paddingBottom: Platform.OS === 'android' ? 5 : 20,
    paddingTop: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 5,
  },
  tabItem: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  itemContainer: {
    justifyContent: 'center',
    alignItems: 'center',
    height: '100%',
  },
  iconContainer: {
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 2,
  },
  tabLabel: {
    fontSize: 12,
    fontWeight: '500',
    textAlign: 'center',
  },
  activeIndicator: {
    position: 'absolute',
    bottom: -4,
    width: 4,
    height: 4,
    borderRadius: 2,
    backgroundColor: '#00bf97',
  },
});

// Usar memo para evitar rerenderizados innecesarios
export default memo(AnimatedTabBar); 