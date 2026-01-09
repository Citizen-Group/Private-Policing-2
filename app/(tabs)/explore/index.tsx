import { Text, View, StyleSheet } from 'react-native';

export default function ExploreScreen() {
  return (
    <View style={styles.container}>
      <Text style={styles.text}>Captured:</Text>
      <Text style={styles.text}>12432 all time. +345 this week. +783 this month. +45% m/m. +23% y/y</Text>
      <Text style={styles.text}>09800 all time Unique. +250 this week. +400 this month. +55% m/m. +20% y/y</Text>
      <Text style={styles.text}>Explore screen</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#25292e',
    justifyContent: 'center',
    alignItems: 'center',
  },
  text: {
    color: '#fff',
  },
});
