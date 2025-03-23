import { BottomTabBarProps } from '@react-navigation/bottom-tabs';
import React, { useRef } from 'react';
import { Animated, Dimensions, StyleSheet, TouchableOpacity, View } from 'react-native';

const { width } = Dimensions.get('window');

/**
 * TabBar personalizado con animaciones al cambiar de pestaña
 * 
 * @param {BottomTabBarProps} props - Props del BottomTabBar
 * @returns {React.ReactNode} Componente renderizado
 */
function AnimatedTabBar({ state, descriptors, navigation }) {
  // Referencia para mantener las animaciones por cada ruta
  const animatedValues = useRef(
    state.routes.map((_, index) => new Animated.Value(index === state.index ? 1 : 0))
  ).current;

  return (
    <View style={styles.tabBarContainer}>
      {state.routes.map((route, index) => {
        const { options } = descriptors[route.key];
        const label = options.tabBarLabel || options.title || route.name;
        const isFocused = state.index === index;

        // Obtener el icono desde las opciones
        const TabBarIcon = options.tabBarIcon;
        
        // Animaciones para el ícono activo
        const iconScale = animatedValues[index].interpolate({
          inputRange: [0, 0.5, 1],
          outputRange: [1, 1.2, 1.1],
        });
        
        const iconOpacity = animatedValues[index].interpolate({
          inputRange: [0, 1],
          outputRange: [0.7, 1],
        });

        // Indicador de pestaña activa
        const indicatorPosition = animatedValues[index].interpolate({
          inputRange: [0, 1],
          outputRange: [20, 0],
        });

        const indicatorOpacity = animatedValues[index].interpolate({
          inputRange: [0, 1],
          outputRange: [0, 1],
        });

        // Animar cuando cambia el foco
        React.useEffect(() => {
          Animated.timing(animatedValues[index], {
            toValue: isFocused ? 1 : 0,
            duration: 250,
            useNativeDriver: true,
          }).start();
        }, [isFocused, index]);

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

        const onLongPress = () => {
          navigation.emit({
            type: 'tabLongPress',
            target: route.key,
          });
        };

        return (
          <TouchableOpacity
            key={route.key}
            accessibilityRole="button"
            accessibilityState={isFocused ? { selected: true } : {}}
            accessibilityLabel={options.tabBarAccessibilityLabel}
            testID={options.tabBarTestID}
            onPress={onPress}
            onLongPress={onLongPress}
            style={styles.tabItem}
          >
            <View style={styles.itemContainer}>
              {/* Ícono animado */}
              <Animated.View
                style={[
                  styles.iconContainer,
                  {
                    transform: [{ scale: iconScale }],
                    opacity: iconOpacity,
                  },
                ]}
              >
                {TabBarIcon && TabBarIcon({
                  focused: isFocused,
                  color: isFocused ? '#00bf97' : '#95a5a6',
                  size: 24,
                })}
              </Animated.View>

              {/* Etiqueta */}
              <Animated.Text
                style={[
                  styles.tabLabel,
                  {
                    color: isFocused ? '#00bf97' : '#95a5a6',
                    opacity: iconOpacity,
                  },
                ]}
              >
                {label}
              </Animated.Text>

              {/* Indicador de pestaña activa */}
              {isFocused && (
                <Animated.View
                  style={[
                    styles.activeIndicator,
                    {
                      transform: [{ translateY: indicatorPosition }],
                      opacity: indicatorOpacity,
                    },
                  ]}
                />
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
    height: 80,
    backgroundColor: 'white',
    borderTopWidth: 1,
    borderTopColor: '#f2f2f2',
    paddingBottom: 3,
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
    marginBottom: 4,
  },
  tabLabel: {
    fontSize: 12,
    fontWeight: '500',
    textAlign: 'center',
  },
  activeIndicator: {
    position: 'absolute',
    bottom: -8,
    width: 4,
    height: 4,
    borderRadius: 2,
    backgroundColor: '#00bf97',
  },
});

export default AnimatedTabBar; 