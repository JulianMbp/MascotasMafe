import { StyleSheet, Text, View } from 'react-native';

export default function Pets() {
  return (
    <View style={styles.container}>
      <Text>Mis Mascotas</Text>
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