import { StatusBar } from 'expo-status-bar';
import { SafeAreaView, View, Text, StyleSheet } from 'react-native';

export default function App() {
  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.content}>
        <Text style={styles.title}>FacePay</Text>
        <Text style={styles.subtitle}>Home</Text>
        <Text style={styles.body}>Welcome to the FacePay homepage.</Text>
      </View>
      <StatusBar style="auto" />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0f172a',
  },
  content: {
    flex: 1,
    padding: 24,
    justifyContent: 'center',
  },
  title: {
    color: '#ffffff',
    fontSize: 32,
    fontWeight: '700',
    marginBottom: 8,
  },
  subtitle: {
    color: '#93c5fd',
    fontSize: 20,
    fontWeight: '600',
    marginBottom: 16,
  },
  body: {
    color: '#e5e7eb',
    fontSize: 16,
  },
});
