import React from 'react';
import { SafeAreaView, View, Text, StyleSheet, TouchableOpacity } from 'react-native';

export default function HomeScreen({ navigation }) {
  const handleLogin = () => {
    navigation.navigate('Login');
  };

  const handleRegister = () => {
    navigation.navigate('Register');
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.content}>
        <Text style={styles.title}>FacePay</Text>
        <Text style={styles.subtitle}>Home</Text>
        <Text style={styles.body}>Welcome to the FacePay homepage.</Text>
        
        <View style={styles.buttonContainer}>
          <TouchableOpacity style={styles.loginButton} onPress={handleLogin}>
            <Text style={styles.buttonText}>Login</Text>
          </TouchableOpacity>
          
          <TouchableOpacity style={styles.registerButton} onPress={handleRegister}>
            <Text style={styles.registerButtonText}>Register</Text>
          </TouchableOpacity>
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f0fdf4',
  },
  content: {
    flex: 1,
    padding: 24,
    justifyContent: 'center',
  },
  title: {
    color: '#14532d',
    fontSize: 32,
    fontWeight: '700',
    marginBottom: 8,
  },
  subtitle: {
    color: '#16a34a',
    fontSize: 20,
    fontWeight: '600',
    marginBottom: 16,
  },
  body: {
    color: '#15803d',
    fontSize: 16,
    marginBottom: 32,
  },
  buttonContainer: {
    width: '100%',
    gap: 12,
  },
  loginButton: {
    backgroundColor: '#16a34a',
    paddingVertical: 16,
    paddingHorizontal: 32,
    borderRadius: 12,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  registerButton: {
    backgroundColor: '#ffffff',
    paddingVertical: 16,
    paddingHorizontal: 32,
    borderRadius: 12,
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#16a34a',
  },
  buttonText: {
    color: '#ffffff',
    fontSize: 18,
    fontWeight: '600',
  },
  registerButtonText: {
    color: '#16a34a',
    fontSize: 18,
    fontWeight: '600',
  },
});
