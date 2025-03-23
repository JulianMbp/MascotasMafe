import { Dimensions, Easing } from 'react-native';

const { width, height } = Dimensions.get('window');

// Configuraciones de transiciones para usar con React Navigation
export const transitionSpecs = {
  // Transición suave con timing
  smooth: {
    animation: 'timing',
    config: {
      duration: 500,
      easing: Easing.ease,
    },
  },
  // Transición de rebote
  bounce: {
    animation: 'spring',
    config: {
      stiffness: 1000,
      damping: 500,
      mass: 3,
      overshootClamping: false,
      restDisplacementThreshold: 0.01,
      restSpeedThreshold: 0.01,
    },
  },
  // Transición rápida
  fast: {
    animation: 'timing',
    config: {
      duration: 300,
      easing: Easing.out(Easing.quad),
    },
  },
};

// Efectos de transición disponibles

// Efecto de desvanecimiento
export const fadeInTransition = {
  transitionSpec: transitionSpecs.smooth,
  screenInterpolator: ({ position, scene }) => {
    const { index } = scene;
    
    const opacity = position.interpolate({
      inputRange: [index - 1, index, index + 1],
      outputRange: [0, 1, 0],
    });
    
    return { opacity };
  },
};

// Deslizamiento horizontal
export const slideHorizontalTransition = {
  transitionSpec: transitionSpecs.bounce,
  screenInterpolator: ({ position, scene }) => {
    const { index } = scene;
    
    const translateX = position.interpolate({
      inputRange: [index - 1, index, index + 1],
      outputRange: [width, 0, -width],
    });
    
    return { transform: [{ translateX }] };
  },
};

// Efecto de zoom
export const zoomTransition = {
  transitionSpec: transitionSpecs.smooth,
  screenInterpolator: ({ position, scene }) => {
    const { index } = scene;
    
    const scale = position.interpolate({
      inputRange: [index - 1, index, index + 1],
      outputRange: [0.8, 1, 0.8],
    });
    
    const opacity = position.interpolate({
      inputRange: [index - 1, index, index + 1],
      outputRange: [0, 1, 0],
    });
    
    return { opacity, transform: [{ scale }] };
  },
};

// Efecto de giro 3D
export const flipTransition = {
  transitionSpec: transitionSpecs.smooth,
  screenInterpolator: ({ position, scene }) => {
    const { index } = scene;
    
    const rotateY = position.interpolate({
      inputRange: [index - 1, index, index + 1],
      outputRange: ['90deg', '0deg', '-90deg'],
    });
    
    return { 
      transform: [
        { perspective: 1000 },
        { rotateY }
      ],
      backfaceVisibility: 'hidden',
    };
  },
};

// Objeto que contiene todas las transiciones para fácil acceso
export const transitions = {
  fade: fadeInTransition,
  slide: slideHorizontalTransition,
  zoom: zoomTransition,
  flip: flipTransition,
};

// Configuraciones personalizadas para React Navigation 6
export const screenOptions = {
  // Transición de desvanecimiento para navBar
  fadeTransition: {
    cardStyleInterpolator: ({ current }) => ({
      cardStyle: {
        opacity: current.progress,
      },
    }),
  },
  // Deslizar desde abajo
  slideFromBottomTransition: {
    cardStyleInterpolator: ({ current, layouts }) => ({
      cardStyle: {
        transform: [
          {
            translateY: current.progress.interpolate({
              inputRange: [0, 1],
              outputRange: [layouts.screen.height, 0],
            }),
          },
        ],
      },
    }),
  },
  // Deslizar desde la derecha (predeterminado pero personalizado)
  slideFromRightTransition: {
    cardStyleInterpolator: ({ current, layouts }) => ({
      cardStyle: {
        transform: [
          {
            translateX: current.progress.interpolate({
              inputRange: [0, 1],
              outputRange: [layouts.screen.width, 0],
            }),
          },
        ],
      },
    }),
  },
  // Transición de zoom
  zoomInTransition: {
    cardStyleInterpolator: ({ current }) => ({
      cardStyle: {
        transform: [
          {
            scale: current.progress.interpolate({
              inputRange: [0, 1],
              outputRange: [0.8, 1],
            }),
          },
        ],
        opacity: current.progress.interpolate({
          inputRange: [0, 1],
          outputRange: [0, 1],
        }),
      },
    }),
  },
}; 