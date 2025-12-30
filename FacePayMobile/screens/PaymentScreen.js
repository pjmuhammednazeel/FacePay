import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  SafeAreaView,
  Alert,
  ActivityIndicator,
  TextInput,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
} from 'react-native';
import { CameraView, useCameraPermissions } from 'expo-camera';
import * as ImagePicker from 'expo-image-picker';
import { extractFaceEmbeddingArcFace } from '../utils/faceEmbedding';
import API_URL from '../config/api';

export default function PaymentScreen({ navigation, route }) {
  const [permission, requestPermission] = useCameraPermissions();
  const [cameraReady, setCameraReady] = useState(false);
  const [loading, setLoading] = useState(false);
  const [receiverInfo, setReceiverInfo] = useState(null);
  const [amount, setAmount] = useState('');
  const cameraRef = useRef(null);
  const user = route.params?.user || {};

  useEffect(() => {
    if (permission === null) {
      requestPermission();
    }
  }, [permission]);

  // Safely parse JSON; throw with raw text if parsing fails
  const parseJsonSafe = async (response) => {
    const text = await response.text();
    try {
      return JSON.parse(text);
    } catch (err) {
      throw new Error(`Non-JSON response (status ${response.status}): ${text.slice(0, 200)}`);
    }
  };

  const handleCameraReady = () => {
    setCameraReady(true);
  };

  const captureFace = async () => {
    if (!cameraRef.current || !cameraReady) {
      Alert.alert('Error', 'Camera not ready');
      return;
    }

    setLoading(true);
    try {
      // Take photo
      const photo = await cameraRef.current.takePictureAsync({
        quality: 0.8,
        base64: true,
      });

      // Extract face embedding using ArcFace
      const faceEmbedding = await extractFaceEmbeddingArcFace(photo.uri);

      if (!faceEmbedding || faceEmbedding.length === 0) {
        Alert.alert('Error', 'No face detected. Please ensure the receiver\'s face is clearly visible.');
        setLoading(false);
        return;
      }

      // Send to server to identify receiver
      const response = await fetch(`${API_URL}/identify-receiver`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          faceEmbedding,
          senderId: user.id,
        }),
      });

      const data = await parseJsonSafe(response);

      if (data.success) {
        setReceiverInfo(data.receiver);
        Alert.alert(
          'Receiver Identified',
          `Receiver: ${data.receiver.name}\nAccount: ${data.receiver.accountNumber}\n\nPlease enter the payment amount.`
        );
      } else {
        Alert.alert('Error', data.message || 'Failed to identify receiver');
      }
    } catch (error) {
      console.error('Face capture error:', error);
      Alert.alert('Error', 'Failed to process face. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const pickImageFromGallery = async () => {
    const permissionResult = await ImagePicker.requestMediaLibraryPermissionsAsync();

    if (permissionResult.granted === false) {
      Alert.alert('Permission Required', 'Camera roll permission is required to select photos');
      return;
    }

    setLoading(true);
    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.8,
      });

      if (!result.canceled) {
        const faceEmbedding = await extractFaceEmbeddingArcFace(result.assets[0].uri);

        if (!faceEmbedding || faceEmbedding.length === 0) {
          Alert.alert('Error', 'No face detected in the image.');
          setLoading(false);
          return;
        }

        // Send to server to identify receiver
        const response = await fetch(`${API_URL}/identify-receiver`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            faceEmbedding,
            senderId: user.id,
          }),
        });

        const data = await parseJsonSafe(response);

        if (data.success) {
          setReceiverInfo(data.receiver);
          Alert.alert(
            'Receiver Identified',
            `Receiver: ${data.receiver.name}\nAccount: ${data.receiver.accountNumber}\n\nPlease enter the payment amount.`
          );
        } else {
          Alert.alert('Error', data.message || 'Failed to identify receiver');
        }
      }
    } catch (error) {
      console.error('Image picker error:', error);
      Alert.alert('Error', 'Failed to process image. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleMakePayment = async () => {
    if (!user?.id) {
      Alert.alert('Error', 'User info missing. Please log in again.');
      return;
    }

    if (!receiverInfo?.id) {
      Alert.alert('Error', 'Please scan receiver\'s face first');
      return;
    }

    const amountValue = parseFloat(amount);
    if (!amount || Number.isNaN(amountValue) || amountValue <= 0) {
      Alert.alert('Error', 'Please enter a valid amount');
      return;
    }

    setLoading(true);
    try {
      const response = await fetch(`${API_URL}/make-payment`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          senderId: receiverInfo.id,
          receiverId: user.id,
          amount: amountValue,
        }),
      });

      const data = await parseJsonSafe(response);

      if (data.success) {
        Alert.alert(
          'Payment Successful',
          `₹${amount} sent to ${receiverInfo.name}`,
          [
            {
              text: 'OK',
              onPress: () => navigation.goBack(),
            },
          ]
        );
        setReceiverInfo(null);
        setAmount('');
      } else {
        Alert.alert('Error', data.message || 'Payment failed');
      }
    } catch (error) {
      console.error('Payment error:', error);
      Alert.alert('Error', 'Failed to process payment. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  if (permission === null) {
    return (
      <View style={styles.container}>
        <ActivityIndicator size="large" color="#6366f1" />
      </View>
    );
  }

  if (!permission?.granted) {
    return (
      <View style={styles.container}>
        <Text style={styles.permissionText}>Camera permission is required</Text>
        <TouchableOpacity style={styles.button} onPress={requestPermission}>
          <Text style={styles.buttonText}>Grant Permission</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.button} onPress={() => navigation.goBack()}>
          <Text style={styles.buttonText}>Go Back</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={80}
      >
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
        >
          <View style={styles.header}>
            <TouchableOpacity onPress={() => navigation.goBack()}>
              <Text style={styles.backButton}>← Back</Text>
            </TouchableOpacity>
            <Text style={styles.title}>Scan Receiver's Face</Text>
          </View>

          <View style={styles.cameraContainer}>
            <CameraView
              ref={cameraRef}
              style={styles.camera}
              facing="front"
              onCameraReady={handleCameraReady}
            >
              <View style={styles.overlay}>
                <View style={styles.faceFrame} />
              </View>
            </CameraView>
          </View>

          {receiverInfo && (
            <View style={styles.receiverInfoContainer}>
              <Text style={styles.receiverInfoTitle}>Receiver Identified ✓</Text>
              <Text style={styles.receiverName}>{receiverInfo.name}</Text>
              <Text style={styles.receiverDetails}>
                Account: {receiverInfo.accountNumber}
              </Text>
              <Text style={styles.receiverDetails}>
                Bank: {receiverInfo.bankName}
              </Text>
              <Text style={styles.receiverDetails}>
                Confidence: {(receiverInfo.similarity * 100).toFixed(1)}%
              </Text>
            </View>
          )}

          {receiverInfo && (
            <View style={styles.amountContainer}>
              <Text style={styles.amountLabel}>Enter Amount:</Text>
              <TextInput
                style={styles.amountInput}
                placeholder="0.00"
                value={amount}
                onChangeText={setAmount}
                keyboardType="decimal-pad"
              />
            </View>
          )}

          <View style={styles.buttonContainer}>
            {!receiverInfo ? (
              <>
                <TouchableOpacity
                  style={[styles.captureButton, loading && styles.disabledButton]}
                  onPress={captureFace}
                  disabled={loading || !cameraReady}
                >
                  {loading ? (
                    <ActivityIndicator color="#fff" />
                  ) : (
                    <Text style={styles.captureButtonText}>📸 Capture Face</Text>
                  )}
                </TouchableOpacity>

                <TouchableOpacity
                  style={[styles.galleryButton, loading && styles.disabledButton]}
                  onPress={pickImageFromGallery}
                  disabled={loading}
                >
                  <Text style={styles.galleryButtonText}>🖼️ Choose from Gallery</Text>
                </TouchableOpacity>
              </>
            ) : (
              <>
                <TouchableOpacity
                  style={[styles.paymentButton, loading && styles.disabledButton]}
                  onPress={handleMakePayment}
                  disabled={loading}
                >
                  {loading ? (
                    <ActivityIndicator color="#fff" />
                  ) : (
                    <Text style={styles.captureButtonText}>💳 Make Payment</Text>
                  )}
                </TouchableOpacity>

                <TouchableOpacity
                  style={[styles.resetButton, loading && styles.disabledButton]}
                  onPress={() => {
                    setReceiverInfo(null);
                    setAmount('');
                  }}
                  disabled={loading}
                >
                  <Text style={styles.resetButtonText}>🔄 Scan Again</Text>
                </TouchableOpacity>
              </>
            )}
          </View>

          <Text style={styles.instructionText}>
            {!receiverInfo
              ? 'Position the receiver\'s face within the frame and capture'
              : 'Enter amount and complete payment'}
          </Text>
        </ScrollView>
      </KeyboardAvoidingView>
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
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#fff',
  },
  cameraContainer: {
    height: 400,
    margin: 20,
    borderRadius: 15,
    overflow: 'hidden',
    backgroundColor: '#000',
  },
  camera: {
    flex: 1,
  },
  overlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  faceFrame: {
    width: 250,
    height: 300,
    borderWidth: 3,
    borderColor: '#6366f1',
    borderRadius: 150,
    backgroundColor: 'transparent',
  },
  receiverInfoContainer: {
    margin: 20,
    padding: 20,
    backgroundColor: '#22c55e',
    borderRadius: 15,
  },
  receiverInfoTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 10,
  },
  receiverName: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 5,
  },
  receiverDetails: {
    fontSize: 14,
    color: '#fff',
    marginTop: 3,
    opacity: 0.9,
  },
  amountContainer: {
    marginHorizontal: 20,
    marginBottom: 10,
  },
  amountLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1e293b',
    marginBottom: 8,
  },
  amountInput: {
    backgroundColor: '#fff',
    borderWidth: 2,
    borderColor: '#6366f1',
    borderRadius: 10,
    padding: 15,
    fontSize: 24,
    fontWeight: 'bold',
    textAlign: 'center',
  },
  buttonContainer: {
    paddingHorizontal: 20,
    marginTop: 10,
    paddingBottom: 32, // extra bottom space so buttons are fully visible on devices with gesture bars
  },
  scrollContent: {
    paddingBottom: 40,
  },
  captureButton: {
    backgroundColor: '#6366f1',
    padding: 18,
    borderRadius: 12,
    alignItems: 'center',
    marginBottom: 10,
  },
  captureButtonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
  },
  galleryButton: {
    backgroundColor: '#fff',
    padding: 18,
    borderRadius: 12,
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#6366f1',
  },
  galleryButtonText: {
    color: '#6366f1',
    fontSize: 16,
    fontWeight: '600',
  },
  paymentButton: {
    backgroundColor: '#22c55e',
    padding: 18,
    borderRadius: 12,
    alignItems: 'center',
    marginBottom: 10,
  },
  resetButton: {
    backgroundColor: '#fff',
    padding: 18,
    borderRadius: 12,
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#6366f1',
  },
  resetButtonText: {
    color: '#6366f1',
    fontSize: 16,
    fontWeight: '600',
  },
  disabledButton: {
    opacity: 0.5,
  },
  instructionText: {
    textAlign: 'center',
    color: '#64748b',
    fontSize: 14,
    paddingHorizontal: 20,
    marginTop: 10,
    marginBottom: 20,
  },
  permissionText: {
    fontSize: 18,
    color: '#64748b',
    textAlign: 'center',
    marginBottom: 20,
  },
  button: {
    backgroundColor: '#6366f1',
    padding: 15,
    borderRadius: 10,
    marginHorizontal: 20,
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
    textAlign: 'center',
  },
});
