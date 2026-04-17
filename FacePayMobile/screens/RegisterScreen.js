import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Alert,
  ActivityIndicator,
  Image,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import * as ImagePicker from 'expo-image-picker';
import { generateFaceEmbeddingFromImage, extractFaceEmbeddingArcFace } from '../utils/faceEmbedding';
import API_URL from '../config/api';

export default function RegisterScreen({ navigation }) {
  const [formData, setFormData] = useState({
    phoneNumber: '',
    accountNumber: '',
    bankName: '',
    password: '',
    confirmPassword: '',
    faceImage: null,
    faceEmbedding: null,
  });
  const [loading, setLoading] = useState(false);
  const [extractingEmbedding, setExtractingEmbedding] = useState(false);

  const handleInputChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const takePhoto = async () => {
    const permissionResult = await ImagePicker.requestCameraPermissionsAsync();
    if (permissionResult.granted === false) {
      Alert.alert('Permission Required', 'Camera permission is required to take a photo');
      return;
    }
    const result = await ImagePicker.launchCameraAsync({
      mediaTypes: ['images'],
      allowsEditing: true,
      aspect: [1, 1],
      quality: 1,
      cameraType: ImagePicker.CameraType.front,
    });
    if (!result.canceled) {
      const imageUri = result.assets[0].uri;
      setFormData(prev => ({ ...prev, faceImage: imageUri }));
      await extractEmbedding(imageUri);
    }
  };

  const pickFaceImage = async () => {
    const permissionResult = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (permissionResult.granted === false) {
      Alert.alert('Permission Required', 'Gallery permission is required to select a photo');
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsEditing: true,
      aspect: [1, 1],
      quality: 1,
    });
    if (!result.canceled) {
      const imageUri = result.assets[0].uri;
      setFormData(prev => ({ ...prev, faceImage: imageUri }));
      await extractEmbedding(imageUri);
    }
  };


  const extractEmbedding = async (imageUri) => {
    setExtractingEmbedding(true);
    try {
      const embedding = await extractFaceEmbeddingArcFace(imageUri);
      setFormData(prev => ({ ...prev, faceEmbedding: embedding }));
      Alert.alert('Success', 'Face embedding extracted successfully using ArcFace');
    } catch (error) {
      Alert.alert('Error', 'Failed to extract face embedding. Please try another image.');
    } finally {
      setExtractingEmbedding(false);
    }
  };

  const validateForm = () => {
    if (!formData.phoneNumber || !formData.accountNumber || !formData.bankName || !formData.password) {
      Alert.alert('Error', 'All fields are required');
      return false;
    }
    if (!formData.faceImage) {
      Alert.alert('Error', 'Please select a face image');
      return false;
    }
    if (!formData.faceEmbedding) {
      Alert.alert('Error', 'Please extract face embedding first');
      return false;
    }
    if (formData.phoneNumber.length < 10) {
      Alert.alert('Error', 'Please enter a valid phone number');
      return false;
    }
    if (formData.password.length < 6) {
      Alert.alert('Error', 'Password must be at least 6 characters');
      return false;
    }
    if (formData.password !== formData.confirmPassword) {
      Alert.alert('Error', 'Passwords do not match');
      return false;
    }
    return true;
  };

  const handleRegister = async () => {
    if (!validateForm()) return;
    setLoading(true);
    try {
      const response = await fetch(`${API_URL}/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          phoneNumber: formData.phoneNumber,
          accountNumber: formData.accountNumber,
          bankName: formData.bankName,
          password: formData.password,
          faceEmbedding: formData.faceEmbedding,
        }),
      });
      const data = await response.json();
      if (data.success) {
        const accountHolder = data.accountHolder ? `\n\nAccount Holder: ${data.accountHolder}` : '';
        Alert.alert(
          'Success',
          `Registration successful! Your account has been verified with your bank.${accountHolder}`,
          [{ text: 'OK', onPress: () => navigation.navigate('Login') }]
        );
      } else {
        const errorMessage = data.bankValidation === false
          ? `Bank Validation Failed: ${data.message}\n\nPlease ensure your phone number and account number match your bank records.`
          : data.message || 'Registration failed';
        Alert.alert('Error', errorMessage);
      }
    } catch (error) {
      Alert.alert('Error', 'Could not connect to server. Make sure the backend is running.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Text style={styles.backButton}>← Back</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Register</Text>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent} keyboardShouldPersistTaps="handled">
        <Text style={styles.title}>Create Account</Text>
        <Text style={styles.subtitle}>Secure registration with face ID</Text>

        {/* Face Upload */}
        <View style={styles.faceSection}>
          <Text style={styles.sectionLabel}>Identity Verification</Text>
          {formData.faceImage ? (
            <View style={styles.imageContainer}>
              <Image source={{ uri: formData.faceImage }} style={styles.faceImage} />
              {formData.faceEmbedding && (
                <View style={styles.embeddingStatus}>
                  <Text style={styles.embeddingStatusText}>✓ Face Verified</Text>
                </View>
              )}
              {extractingEmbedding && (
                <ActivityIndicator size="large" color="#6366f1" style={{ marginTop: 12 }} />
              )}
              <TouchableOpacity
                style={styles.changeFaceButton}
                onPress={pickFaceImage}
                disabled={extractingEmbedding}
              >
                <Text style={styles.changeFaceButtonText}>Change Photo</Text>
              </TouchableOpacity>
            </View>
          ) : (
            <View style={styles.faceButtonRow}>
              <TouchableOpacity style={styles.faceOptionButton} onPress={takePhoto}>
                <Text style={styles.faceOptionIcon}>📷</Text>
                <Text style={styles.faceOptionText}>Take Photo</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.faceOptionButton} onPress={pickFaceImage}>
                <Text style={styles.faceOptionIcon}>🖼️</Text>
                <Text style={styles.faceOptionText}>Gallery</Text>
              </TouchableOpacity>
            </View>
          )}
        </View>

        {/* Form Fields */}
        <View style={styles.inputGroup}>
          <Text style={styles.label}>Phone Number</Text>
          <TextInput
            style={styles.input}
            placeholder="e.g. +1 234 567 890"
            placeholderTextColor="#a5b4fc"
            value={formData.phoneNumber}
            onChangeText={(v) => handleInputChange('phoneNumber', v)}
            keyboardType="phone-pad"
            maxLength={15}
          />
        </View>

        <View style={styles.inputGroup}>
          <Text style={styles.label}>Account Number</Text>
          <TextInput
            style={styles.input}
            placeholder="Enter 10-12 digit number"
            placeholderTextColor="#a5b4fc"
            value={formData.accountNumber}
            onChangeText={(v) => handleInputChange('accountNumber', v)}
            keyboardType="numeric"
          />
        </View>

        <View style={styles.inputGroup}>
          <Text style={styles.label}>Bank Name</Text>
          <TextInput
            style={styles.input}
            placeholder="e.g. Global Bank"
            placeholderTextColor="#a5b4fc"
            value={formData.bankName}
            onChangeText={(v) => handleInputChange('bankName', v)}
          />
        </View>

        <View style={styles.inputGroup}>
          <Text style={styles.label}>Password</Text>
          <TextInput
            style={styles.input}
            placeholder="Min 6 characters"
            placeholderTextColor="#a5b4fc"
            value={formData.password}
            onChangeText={(v) => handleInputChange('password', v)}
            secureTextEntry
          />
        </View>

        <View style={styles.inputGroup}>
          <Text style={styles.label}>Confirm Password</Text>
          <TextInput
            style={styles.input}
            placeholder="Confirm your password"
            placeholderTextColor="#a5b4fc"
            value={formData.confirmPassword}
            onChangeText={(v) => handleInputChange('confirmPassword', v)}
            secureTextEntry
          />
        </View>

        <TouchableOpacity
          style={[styles.registerButton, (loading || extractingEmbedding) && styles.disabledButton]}
          onPress={handleRegister}
          disabled={loading || extractingEmbedding}
        >
          {loading ? (
            <ActivityIndicator color="#ffffff" />
          ) : (
            <Text style={styles.registerButtonText}>Complete Registration →</Text>
          )}
        </TouchableOpacity>

        <TouchableOpacity style={styles.loginLink} onPress={() => navigation.navigate('Login')}>
          <Text style={styles.loginLinkText}>
            Already have an account? <Text style={styles.loginLinkBold}>Login</Text>
          </Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8fafc',
  },
  header: {
    padding: 20,
    backgroundColor: '#6366f1',
    flexDirection: 'row',
    alignItems: 'center',
  },
  backButton: {
    color: '#fff',
    fontSize: 16,
    marginRight: 15,
    fontWeight: '600',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#fff',
  },
  scrollContent: {
    padding: 24,
    paddingBottom: 40,
  },
  title: {
    fontSize: 26,
    fontWeight: '700',
    color: '#1e293b',
    marginTop: 8,
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 15,
    color: '#64748b',
    marginBottom: 24,
  },
  faceSection: {
    marginBottom: 24,
  },
  sectionLabel: {
    fontSize: 15,
    fontWeight: '600',
    color: '#1e293b',
    marginBottom: 12,
    textAlign: 'center',
  },
  faceButtonRow: {
    flexDirection: 'row',
    gap: 16,
    justifyContent: 'center',
  },
  faceOptionButton: {
    flex: 1,
    backgroundColor: '#ffffff',
    borderWidth: 2,
    borderColor: '#e0e7ff',
    borderRadius: 14,
    paddingVertical: 20,
    alignItems: 'center',
    gap: 8,
  },
  faceOptionIcon: {
    fontSize: 28,
  },
  faceOptionText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#6366f1',
  },
  imageContainer: {
    alignItems: 'center',
    gap: 12,
  },
  faceImage: {
    width: 130,
    height: 130,
    borderRadius: 65,
    borderWidth: 3,
    borderColor: '#6366f1',
  },
  embeddingStatus: {
    backgroundColor: '#dcfce7',
    borderColor: '#22c55e',
    borderWidth: 1,
    borderRadius: 8,
    paddingVertical: 6,
    paddingHorizontal: 14,
  },
  embeddingStatusText: {
    color: '#16a34a',
    fontSize: 14,
    fontWeight: '600',
  },
  changeFaceButton: {
    backgroundColor: '#ffffff',
    borderWidth: 2,
    borderColor: '#6366f1',
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 8,
  },
  changeFaceButtonText: {
    color: '#6366f1',
    fontSize: 14,
    fontWeight: '600',
  },
  inputGroup: {
    marginBottom: 18,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1e293b',
    marginBottom: 8,
  },
  input: {
    backgroundColor: '#ffffff',
    borderWidth: 2,
    borderColor: '#e0e7ff',
    borderRadius: 12,
    paddingVertical: 14,
    paddingHorizontal: 16,
    fontSize: 16,
    color: '#1e293b',
  },
  registerButton: {
    backgroundColor: '#6366f1',
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
    marginTop: 8,
    shadowColor: '#6366f1',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 6,
    elevation: 5,
  },
  registerButtonText: {
    color: '#ffffff',
    fontSize: 17,
    fontWeight: '700',
  },
  disabledButton: {
    opacity: 0.6,
  },
  loginLink: {
    marginTop: 20,
    alignItems: 'center',
  },
  loginLinkText: {
    color: '#64748b',
    fontSize: 15,
  },
  loginLinkBold: {
    fontWeight: '700',
    color: '#6366f1',
  },
});
