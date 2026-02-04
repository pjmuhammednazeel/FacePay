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
  Image
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
    faceEmbedding: null
  });
  const [loading, setLoading] = useState(false);
  const [extractingEmbedding, setExtractingEmbedding] = useState(false);

  const handleInputChange = (field, value) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const pickFaceImage = async () => {
    const permissionResult = await ImagePicker.requestMediaLibraryPermissionsAsync();
    
    if (permissionResult.granted === false) {
      Alert.alert('Permission Required', 'Camera roll permission is required to select a photo');
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
      setFormData(prev => ({
        ...prev,
        faceImage: imageUri
      }));
      
      // Extract embedding from the selected image
      await extractEmbedding(imageUri);
    }
  };

  const extractEmbedding = async (imageUri) => {
    setExtractingEmbedding(true);
    try {
      // Use ArcFace for better face recognition
      const embedding = await extractFaceEmbeddingArcFace(imageUri);
      setFormData(prev => ({
        ...prev,
        faceEmbedding: embedding
      }));
      Alert.alert('Success', 'Face embedding extracted successfully using ArcFace');
    } catch (error) {
      console.error('Error extracting embedding:', error);
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
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          phoneNumber: formData.phoneNumber,
          accountNumber: formData.accountNumber,
          bankName: formData.bankName,
          password: formData.password,
          faceEmbedding: formData.faceEmbedding
        }),
      });

      const data = await response.json();

      if (data.success) {
        const accountHolder = data.accountHolder ? `\n\nAccount Holder: ${data.accountHolder}` : '';
        Alert.alert(
          'Success', 
          `Registration successful! Your account has been verified with your bank.${accountHolder}`,
          [
            { 
              text: 'OK', 
              onPress: () => navigation.navigate('Login')
            }
          ]
        );
      } else {
        const errorMessage = data.bankValidation === false 
          ? `Bank Validation Failed: ${data.message}\n\nPlease ensure your phone number and account number match your bank records.`
          : data.message || 'Registration failed';
        Alert.alert('Error', errorMessage);
      }
    } catch (error) {
      console.error('Registration error:', error);
      Alert.alert('Error', 'Could not connect to server. Make sure the backend is running.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <View style={styles.content}>
          <Text style={styles.title}>Create Account</Text>
          <Text style={styles.subtitle}>Register with Facial Recognition</Text>

          <View style={styles.formContainer}>
            {/* Face Image Capture */}
            <View style={styles.faceSection}>
              <Text style={styles.label}>Facial Recognition</Text>
              {formData.faceImage ? (
                <View style={styles.imageContainer}>
                  <Image 
                    source={{ uri: formData.faceImage }} 
                    style={styles.faceImage}
                  />
                  {formData.faceEmbedding && (
                    <View style={styles.embeddingStatus}>
                      <Text style={styles.embeddingStatusText}>✓ Embedding Extracted</Text>
                    </View>
                  )}
                  {extractingEmbedding && (
                    <ActivityIndicator 
                      size="large" 
                      color="#16a34a" 
                      style={styles.extractingLoader}
                    />
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
                <TouchableOpacity 
                  style={styles.faceUploadButton} 
                  onPress={pickFaceImage}
                >
                  <Text style={styles.faceUploadButtonText}>📷 Upload Face Photo</Text>
                  <Text style={styles.faceUploadSubtext}>Select a clear photo of your face</Text>
                  <Text style={styles.faceUploadHint}>(Embedding will be extracted automatically)</Text>
                </TouchableOpacity>
              )}
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Phone Number</Text>
              <TextInput
                style={styles.input}
                placeholder="Enter your phone number"
                placeholderTextColor="#86efac"
                value={formData.phoneNumber}
                onChangeText={(value) => handleInputChange('phoneNumber', value)}
                keyboardType="phone-pad"
                maxLength={15}
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Account Number</Text>
              <TextInput
                style={styles.input}
                placeholder="Enter your account number"
                placeholderTextColor="#86efac"
                value={formData.accountNumber}
                onChangeText={(value) => handleInputChange('accountNumber', value)}
                keyboardType="numeric"
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Bank Name</Text>
              <TextInput
                style={styles.input}
                placeholder="Enter your bank name"
                placeholderTextColor="#86efac"
                value={formData.bankName}
                onChangeText={(value) => handleInputChange('bankName', value)}
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Password</Text>
              <TextInput
                style={styles.input}
                placeholder="Create a password"
                placeholderTextColor="#86efac"
                value={formData.password}
                onChangeText={(value) => handleInputChange('password', value)}
                secureTextEntry
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Confirm Password</Text>
              <TextInput
                style={styles.input}
                placeholder="Confirm your password"
                placeholderTextColor="#86efac"
                value={formData.confirmPassword}
                onChangeText={(value) => handleInputChange('confirmPassword', value)}
                secureTextEntry
              />
            </View>

            <TouchableOpacity 
              style={[styles.registerButton, loading && styles.disabledButton]} 
              onPress={handleRegister}
              disabled={loading || extractingEmbedding}
            >
              {loading ? (
                <ActivityIndicator color="#ffffff" />
              ) : (
                <Text style={styles.buttonText}>Register with Face Embedding</Text>
              )}
            </TouchableOpacity>

            <TouchableOpacity 
              style={styles.loginLink} 
              onPress={() => navigation.navigate('Login')}
            >
              <Text style={styles.loginLinkText}>
                Already have an account? <Text style={styles.loginLinkBold}>Login</Text>
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f0fdf4',
  },
  scrollContent: {
    flexGrow: 1,
  },
  content: {
    flex: 1,
    padding: 24,
    paddingTop: 40,
  },
  title: {
    color: '#14532d',
    fontSize: 32,
    fontWeight: '700',
    marginBottom: 8,
  },
  subtitle: {
    color: '#16a34a',
    fontSize: 18,
    fontWeight: '500',
    marginBottom: 32,
  },
  formContainer: {
    width: '100%',
  },
  faceSection: {
    marginBottom: 24,
  },
  imageContainer: {
    alignItems: 'center',
  },
  faceImage: {
    width: 150,
    height: 150,
    borderRadius: 75,
    borderWidth: 3,
    borderColor: '#16a34a',
    marginBottom: 12,
  },
  embeddingStatus: {
    backgroundColor: '#dcfce7',
    borderColor: '#16a34a',
    borderWidth: 1,
    borderRadius: 8,
    paddingVertical: 8,
    paddingHorizontal: 12,
    marginBottom: 12,
  },
  embeddingStatusText: {
    color: '#16a34a',
    fontSize: 14,
    fontWeight: '600',
  },
  extractingLoader: {
    marginBottom: 12,
  },
  faceUploadButton: {
    backgroundColor: '#ffffff',
    borderWidth: 2,
    borderColor: '#16a34a',
    borderStyle: 'dashed',
    borderRadius: 12,
    paddingVertical: 24,
    paddingHorizontal: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  faceUploadButtonText: {
    color: '#16a34a',
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 4,
  },
  faceUploadSubtext: {
    color: '#15803d',
    fontSize: 14,
    marginBottom: 4,
  },
  faceUploadHint: {
    color: '#22c55e',
    fontSize: 12,
    fontStyle: 'italic',
  },
  changeFaceButton: {
    backgroundColor: '#16a34a',
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 8,
  },
  changeFaceButtonText: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '600',
  },
  label: {
    color: '#15803d',
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 8,
  },
  inputGroup: {
    marginBottom: 20,
  },
  input: {
    backgroundColor: '#ffffff',
    borderWidth: 2,
    borderColor: '#bbf7d0',
    borderRadius: 12,
    paddingVertical: 14,
    paddingHorizontal: 16,
    fontSize: 16,
    color: '#14532d',
  },
  registerButton: {
    backgroundColor: '#16a34a',
    paddingVertical: 16,
    paddingHorizontal: 32,
    borderRadius: 12,
    alignItems: 'center',
    marginTop: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  disabledButton: {
    opacity: 0.6,
  },
  buttonText: {
    color: '#ffffff',
    fontSize: 18,
    fontWeight: '600',
  },
  loginLink: {
    marginTop: 20,
    alignItems: 'center',
  },
  loginLinkText: {
    color: '#15803d',
    fontSize: 16,
  },
  loginLinkBold: {
    fontWeight: '700',
    color: '#16a34a',
  },
});
