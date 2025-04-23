import React, { memo, useCallback, useEffect, useRef, useState } from 'react';
import { ActivityIndicator, Alert, AppState, BackHandler, Platform, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { WebView } from 'react-native-webview';

// Componente optimizado para evitar pantallas en blanco en producción
const LiveTracking = () => {
  const [isLoading, setIsLoading] = useState(true);
  const [hasError, setHasError] = useState(false);
  const [retryCount, setRetryCount] = useState(0);
  const [webViewHeight, setWebViewHeight] = useState(250);
  const [webViewKey, setWebViewKey] = useState(1); // Para forzar recreación del WebView
  const webViewRef = useRef(null);
  const appState = useRef(AppState.currentState);
  const loadTimeoutRef = useRef(null);
  
  // URL del video de YouTube optimizada
  const videoUrl = 'https://www.youtube.com/embed/h-Z0wCdD3dI?si=5vVDM_3CWMbgFtpl&autoplay=1&rel=0&playsinline=1&controls=1&mute=0';
  
  // Opción de respaldo por si falla la principal
  const fallbackVideoUrl = 'https://www.youtube.com/embed/h-Z0wCdD3dI?si=5vVDM_3CWMbgFtpl&autoplay=1&rel=0&playsinline=1&controls=1&mute=0&fs=0';
  
  // Script para inyectar en el WebView y mejorar el rendimiento
  const injectedJavaScript = `
    (function() {
      // Intento de prevenir memory leaks
      window.onerror = function(message, source, lineno, colno, error) {
        window.ReactNativeWebView.postMessage('ERROR:' + message);
        return true;
      };
      
      // Reducir calidad de video para prevenir problemas
      if (document.readyState === 'complete') {
        try {
          // Limitar la calidad máxima del video para reducir uso de recursos
          const ytPlayer = document.querySelector('.html5-video-player');
          if (ytPlayer) {
            ytPlayer.setPlaybackQualityRange('small', 'medium');
          }
          
          // Eliminar elementos innecesarios para mejorar rendimiento
          const elementsToRemove = [
            '.ytp-chrome-top',
            '.ytp-chrome-bottom',
            '.ytp-pause-overlay',
            '.ytp-watermark'
          ];
          elementsToRemove.forEach(selector => {
            const element = document.querySelector(selector);
            if (element) element.style.display = 'none';
          });
        } catch (e) {
          console.error('Error en script de inyección:', e);
        }
        
        // Notificar cuando el DOM esté completamente cargado
        window.ReactNativeWebView.postMessage('DOM_LOADED');
      }
      
      // Notificar cuando el video esté listo
      document.addEventListener('canplay', function() {
        window.ReactNativeWebView.postMessage('VIDEO_READY');
      }, true);
      
      // Reducir las animaciones en CSS para mejorar rendimiento
      const style = document.createElement('style');
      style.textContent = '* { transition-duration: 0s !important; animation-duration: 0s !important; }';
      document.head.appendChild(style);
      
      return true;
    })();
  `;

  // Reiniciar WebView de manera segura
  const resetWebView = useCallback(() => {
    // Limpiar cualquier timeout pendiente
    if (loadTimeoutRef.current) {
      clearTimeout(loadTimeoutRef.current);
    }
    
    // Forzar recreación del WebView cambiando su key
    setWebViewKey(prev => prev + 1);
    setHasError(false);
    setIsLoading(true);
    setRetryCount(0);
  }, []);

  // Manejar mensajes del WebView
  const handleMessage = useCallback((event) => {
    const { data } = event.nativeEvent;
    
    if (data === 'VIDEO_READY' || data === 'DOM_LOADED') {
      console.log('Contenido cargado correctamente:', data);
      setIsLoading(false);
      
      // Limpiar timeout ya que se cargó correctamente
      if (loadTimeoutRef.current) {
        clearTimeout(loadTimeoutRef.current);
        loadTimeoutRef.current = null;
      }
    } 
    else if (data.startsWith('ERROR:')) {
      console.error('Error en WebView:', data.substring(6));
      // Solo mostrar error si es grave
      if (data.includes('undefined') || data.includes('null')) {
        setHasError(true);
        setIsLoading(false);
      }
    }
  }, []);

  // Manejar cuando termina de cargar el WebView
  const handleLoadEnd = useCallback(() => {
    // Configurar un timeout que se activará si la carga toma demasiado tiempo
    loadTimeoutRef.current = setTimeout(() => {
      setIsLoading(false);
      console.log('Carga completada por timeout');
    }, 8000);
    
    // Iniciar un timeout corto para prevenir pantallas blancas eternas
    setTimeout(() => {
      if (isLoading) {
        setIsLoading(false);
      }
    }, 15000);
  }, [isLoading]);

  // Manejar errores de carga del WebView
  const handleError = useCallback((syntheticEvent) => {
    const { nativeEvent } = syntheticEvent;
    console.error('Error en WebView:', nativeEvent);
    
    setHasError(true);
    setIsLoading(false);
    
    // Limpiar timeout
    if (loadTimeoutRef.current) {
      clearTimeout(loadTimeoutRef.current);
      loadTimeoutRef.current = null;
    }
    
    if (retryCount < 2) {
      // Reintentar carga hasta 2 veces con delays progresivos
      setTimeout(() => {
        console.log(`Reintentando carga (${retryCount + 1}/2)...`);
        setRetryCount(prev => prev + 1);
        setHasError(false);
        setIsLoading(true);
        setWebViewKey(prev => prev + 1); // Recrear webview
      }, 2000 * (retryCount + 1));
    }
  }, [retryCount]);
  
  // Liberar recursos cuando el componente se desmonta
  useEffect(() => {
    return () => {
      // Limpiar cualquier timeout pendiente
      if (loadTimeoutRef.current) {
        clearTimeout(loadTimeoutRef.current);
        loadTimeoutRef.current = null;
      }
      
      // Eliminar referencia al WebView
      webViewRef.current = null;
    };
  }, []);
  
  // Gestionar el estado de la app (fondo/primer plano)
  useEffect(() => {
    const handleAppStateChange = (nextAppState) => {
      if (appState.current === 'active' && nextAppState.match(/inactive|background/)) {
        // App va a segundo plano, pausar recursos
        if (webViewRef.current) {
          webViewRef.current.injectJavaScript(`
            (function() {
              try {
                const video = document.querySelector('video');
                if (video) {
                  video.pause();
                  video.src = ''; // Liberar recurso de vídeo
                  video.load(); // Forzar liberación
                }
              } catch(e) {
                console.error('Error al pausar:', e);
              }
              return true;
            })();
          `);
        }
      } else if (appState.current.match(/inactive|background/) && nextAppState === 'active') {
        // App vuelve a primer plano, recrear WebView para evitar problemas
        resetWebView();
      }
      appState.current = nextAppState;
    };

    const subscription = AppState.addEventListener('change', handleAppStateChange);
    
    // Capturar el botón de retroceso en Android
    const backHandler = Platform.OS === 'android'
      ? BackHandler.addEventListener('hardwareBackPress', () => {
          // Si el WebView está en un estado que puede retroceder, hacerlo
          if (webViewRef.current) {
            webViewRef.current.goBack();
            return true; // Prevenir el comportamiento por defecto
          }
          return false;
        })
      : null;

    return () => {
      subscription.remove();
      if (backHandler) backHandler.remove();
    };
  }, [resetWebView]);

  // Reiniciar manualmente el WebView
  const handleManualRetry = () => {
    Alert.alert(
      "Reiniciar transmisión",
      "Se reiniciará la conexión con la cámara en vivo. ¿Continuar?",
      [
        { 
          text: "Cancelar", 
          style: "cancel" 
        },
        { 
          text: "Reiniciar", 
          onPress: resetWebView 
        }
      ]
    );
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Ionicons name="videocam" size={24} color="#e74c3c" />
        <Text style={styles.headerText}>Cámara en Vivo</Text>
        
        {/* Botón de recargar */}
        <TouchableOpacity 
          style={styles.reloadButton} 
          onPress={handleManualRetry}
          accessibilityLabel="Reiniciar transmisión"
        >
          <Ionicons name="refresh" size={22} color="#666" />
        </TouchableOpacity>
      </View>
      
      <View style={[styles.videoContainer, { height: webViewHeight }]}>
        {isLoading && (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color="#e74c3c" />
            <Text style={styles.loadingText}>
              {retryCount > 0 
                ? `Reintentando conexión (${retryCount}/2)...` 
                : 'Conectando con la cámara en vivo...'}
            </Text>
          </View>
        )}
        
        {hasError && !isLoading && (
          <View style={styles.errorContainer}>
            <Ionicons name="alert-circle" size={40} color="#e74c3c" />
            <Text style={styles.errorText}>
              No se pudo cargar el video. Por favor, comprueba tu conexión a internet.
            </Text>
            <TouchableOpacity 
              style={styles.retryButton} 
              onPress={resetWebView}
            >
              <Text style={styles.retryText}>Reintentar</Text>
            </TouchableOpacity>
          </View>
        )}
        
        {!hasError && (
          <WebView
            key={webViewKey}
            ref={webViewRef}
            source={{ uri: retryCount >= 1 ? fallbackVideoUrl : videoUrl }}
            style={styles.video}
            javaScriptEnabled={true}
            domStorageEnabled={true}
            allowsFullscreenVideo={true}
            mediaPlaybackRequiresUserAction={false}
            onLoad={handleLoadEnd}
            onLoadEnd={handleLoadEnd}
            onMessage={handleMessage}
            onError={handleError}
            allowsInlineMediaPlayback={true}
            androidLayerType={Platform.OS === 'android' ? 'hardware' : undefined}
            androidHardwareAccelerationDisabled={false}
            userAgent="Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/78.0.3904.97 Safari/537.36"
            cacheEnabled={true}
            startInLoadingState={true}
            renderLoading={() => null}
            decelerationRate={0.998}
            scrollEnabled={false}
            bounces={false}
            injectedJavaScript={injectedJavaScript}
            incognito={false} // No usar modo incógnito para permitir cacheo
            pullToRefreshEnabled={false}
            useWebView2={Platform.OS === 'android'}
            onContentSizeChange={(width, height) => {
              // Ajustar altura si es necesario
              const calculatedHeight = Math.min(height, 350);
              if (Math.abs(calculatedHeight - webViewHeight) > 50) {
                setWebViewHeight(calculatedHeight);
              }
            }}
            onShouldStartLoadWithRequest={(request) => {
              // Bloquear redireccionamientos a dominios que no sean YouTube
              if (!request.url.includes('youtube.com')) {
                return false;
              }
              return true;
            }}
          />
        )}
      </View>
      
      <View style={styles.infoContainer}>
        <Text style={styles.infoText}>Transmisión en vivo desde las instalaciones</Text>
        <View style={styles.statusBox}>
          <View style={[
            styles.statusDot, 
            {backgroundColor: hasError ? '#e74c3c' : (isLoading ? '#f39c12' : '#27ae60')}
          ]} />
          <Text style={[
            styles.statusText,
            {color: hasError ? '#e74c3c' : (isLoading ? '#f39c12' : '#27ae60')}
          ]}>
            {hasError ? 'ERROR' : (isLoading ? 'CONECTANDO' : 'EN VIVO')}
          </Text>
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f9f9f9',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    backgroundColor: '#fff',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  headerText: {
    fontSize: 18,
    fontWeight: 'bold',
    marginLeft: 8,
    color: '#333',
    flex: 1,
  },
  reloadButton: {
    padding: 8,
    borderRadius: 20,
    backgroundColor: '#f0f0f0',
  },
  videoContainer: {
    height: 250, // Altura inicial, puede cambiar dinámicamente
    backgroundColor: '#000',
    position: 'relative',
  },
  video: {
    flex: 1,
    backgroundColor: '#000',
  },
  loadingContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.7)',
    zIndex: 1,
  },
  loadingText: {
    color: 'white',
    marginTop: 10,
    textAlign: 'center',
    paddingHorizontal: 20,
  },
  errorContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.8)',
    padding: 20,
    zIndex: 2,
  },
  errorText: {
    color: 'white',
    textAlign: 'center',
    marginTop: 10,
    fontSize: 14,
    marginBottom: 15,
  },
  retryButton: {
    backgroundColor: '#e74c3c',
    paddingVertical: 8,
    paddingHorizontal: 20,
    borderRadius: 4,
    marginTop: 10,
  },
  retryText: {
    color: 'white',
    fontWeight: 'bold',
  },
  infoContainer: {
    padding: 16,
    backgroundColor: '#fff',
    margin: 16,
    borderRadius: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  infoText: {
    fontSize: 16,
    color: '#333',
    marginBottom: 12,
  },
  statusBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(231, 76, 60, 0.1)',
    padding: 8,
    borderRadius: 4,
    alignSelf: 'flex-start',
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#e74c3c',
    marginRight: 8,
  },
  statusText: {
    color: '#e74c3c',
    fontWeight: 'bold',
    fontSize: 12,
  },
});

// Usar memo para evitar rerenderizados innecesarios
export default memo(LiveTracking); 