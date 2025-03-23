import { StyleSheet, Text, View } from 'react-native';

export default function LiveTracking() {
  return (
    <View style={styles.container}>
      <Text>Rastreo en Vivo</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
}); 