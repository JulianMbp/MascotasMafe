import { StyleSheet, Text, View } from 'react-native';

export default function Location() {
  return (
    <View style={styles.container}>
      <Text>Ubicaciones</Text>
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