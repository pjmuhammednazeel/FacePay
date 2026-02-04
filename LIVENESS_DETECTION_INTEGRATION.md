# Liveness Detection Integration Guide

## Overview

This guide shows how to integrate liveness detection into your existing FacePay screens.

## Quick Start (3 Steps)

### Step 1: Import Liveness Detection Utilities

```javascript
import { 
  verifyLiveness,
  extractEmbeddingWithLiveness,
  getLivenessDescription,
  formatLivenessDetails 
} from '../utils/livenessDetection';
```

### Step 2: Add Liveness Check Before Processing

```javascript
// Before extracting embedding or processing face
const livenessResult = await verifyLiveness(imageUri, 0.5);

if (!livenessResult.verified) {
  Alert.alert('Spoofing Detected', getLivenessDescription(livenessResult.liveness_score));
  return;
}
```

### Step 3: Use Safe Embedding Extraction

```javascript
// Use combined method that includes liveness check
const embeddingResult = await extractEmbeddingWithLiveness(imageUri, 0.5);

if (embeddingResult.success) {
  const embedding = embeddingResult.embedding;
  // Continue with face matching/payment...
}
```

## Integration Examples

### Example 1: PaymentScreen Integration

**Current Code**:
```javascript
const captureFace = async () => {
  try {
    const photo = await cameraRef.current.takePictureAsync();
    const faceEmbedding = await extractFaceEmbeddingArcFace(photo.uri);
    
    // Send to server...
  } catch (error) {
    Alert.alert('Error', error.message);
  }
};
```

**Updated with Liveness**:
```javascript
import { verifyLiveness, extractEmbeddingWithLiveness } from '../utils/livenessDetection';

const captureFace = async () => {
  try {
    const photo = await cameraRef.current.takePictureAsync();
    
    // NEW: Verify liveness first
    setLoading(true);
    Alert.alert('Checking', 'Verifying face is live...');
    
    const livenessResult = await verifyLiveness(photo.uri, 0.5);
    
    if (!livenessResult.verified) {
      Alert.alert(
        'Spoofing Detected',
        `This does not appear to be a live person.\n\n` +
        `Score: ${(livenessResult.liveness_score * 100).toFixed(0)}%\n\n` +
        `Please use a real face, not a photo or screen.`
      );
      setLoading(false);
      return;
    }
    
    // Now extract embedding safely
    const embeddingResult = await extractEmbeddingWithLiveness(photo.uri, 0.5);
    
    if (!embeddingResult.success) {
      Alert.alert('Error', 'Failed to process face');
      setLoading(false);
      return;
    }
    
    const faceEmbedding = embeddingResult.embedding;
    
    // Send to server...
    
  } catch (error) {
    Alert.alert('Error', error.message);
  } finally {
    setLoading(false);
  }
};
```

### Example 2: RegisterScreen Integration

**Updated Registration with Liveness**:
```javascript
import { verifyLiveness, extractEmbeddingWithLiveness } from '../utils/livenessDetection';

const pickFaceImage = async () => {
  try {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsEditing: true,
      aspect: [1, 1],
      quality: 1,
    });

    if (!result.canceled) {
      // NEW: Verify liveness before extracting embedding
      setExtractingEmbedding(true);
      Alert.alert('Checking', 'Verifying face...');
      
      const livenessCheck = await verifyLiveness(result.assets[0].uri, 0.5);
      
      if (!livenessCheck.verified) {
        Alert.alert(
          'Live Face Required',
          `Please provide a photo of yourself, not a printed picture or screen.\n\n` +
          `Quality Score: ${(livenessCheck.liveness_score * 100).toFixed(0)}%`
        );
        setExtractingEmbedding(false);
        return;
      }
      
      // Extract embedding with liveness guarantee
      const embeddingResult = await extractEmbeddingWithLiveness(result.assets[0].uri, 0.5);
      
      if (embeddingResult.success) {
        setFormData(prev => ({
          ...prev,
          faceImage: result.assets[0].uri,
          faceEmbedding: embeddingResult.embedding
        }));
      }
      
      setExtractingEmbedding(false);
    }
  } catch (error) {
    Alert.alert('Error', error.message);
    setExtractingEmbedding(false);
  }
};
```

### Example 3: Custom Liveness Detection Screen

```javascript
import React, { useState } from 'react';
import { View, Text, Button, Alert } from 'react-native';
import { CameraView } from 'expo-camera';
import { 
  detectLiveness, 
  getLivenessDescription,
  formatLivenessDetails 
} from '../utils/livenessDetection';

export default function LivenessCheckScreen() {
  const [livenessScore, setLivenessScore] = useState(null);
  const [loading, setLoading] = useState(false);
  const [details, setDetails] = useState(null);

  const checkLiveness = async (imageUri) => {
    try {
      setLoading(true);
      const result = await detectLiveness(imageUri, 0.5);
      
      setLivenessScore(result.liveness_score);
      setDetails(result.details);
      
      Alert.alert(
        'Liveness Check Result',
        `Score: ${(result.liveness_score * 100).toFixed(0)}%\n\n` +
        `${getLivenessDescription(result.liveness_score)}`
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={{ flex: 1 }}>
      {livenessScore && (
        <View style={{ padding: 20 }}>
          <Text style={{ fontSize: 24, fontWeight: 'bold' }}>
            Liveness Score: {(livenessScore * 100).toFixed(0)}%
          </Text>
          <Text style={{ marginTop: 10 }}>
            {getLivenessDescription(livenessScore)}
          </Text>
          {details && (
            <Text style={{ marginTop: 10, fontSize: 12 }}>
              {formatLivenessDetails(details)}
            </Text>
          )}
        </View>
      )}
      <Button
        title="Check Liveness"
        onPress={() => checkLiveness('image_uri_here')}
        disabled={loading}
      />
    </View>
  );
}
```

## API Endpoint Integration

### Method 1: Direct API Calls

```javascript
// Check liveness via API
const checkLivenessViaAPI = async (base64Image) => {
  const response = await fetch('http://your-server/api/detect-liveness', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ image: base64Image })
  });
  
  return await response.json();
};

// Verify with threshold via API
const verifyLivenessViaAPI = async (base64Image, threshold) => {
  const response = await fetch('http://your-server/api/verify-liveness', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ 
      image: base64Image,
      threshold: threshold 
    })
  });
  
  return await response.json();
};

// Extract embedding with liveness check via API
const extractEmbeddingWithLivenessViaAPI = async (base64Image, threshold) => {
  const response = await fetch('http://your-server/api/extract-embedding-with-liveness', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ 
      image: base64Image,
      liveness_threshold: threshold 
    })
  });
  
  return await response.json();
};
```

### Method 2: Use Provided Utilities

```javascript
// These handle base64 conversion and API calls automatically
import { 
  detectLiveness,
  verifyLiveness,
  extractEmbeddingWithLiveness 
} from '../utils/livenessDetection';

// Just pass image URI, utilities handle the rest
const result = await verifyLiveness(imageUri, 0.5);
```

## Error Handling

### Liveness Detection Failed

```javascript
const result = await verifyLiveness(imageUri, 0.5);

if (!result.success) {
  // Network or server error
  Alert.alert(
    'Error',
    'Failed to check face liveness. Please try again.',
    error: result.error
  );
  return;
}

if (!result.verified) {
  // Face exists but not live
  Alert.alert(
    'Not a Live Face',
    `This image appears to be a photo or not a real person.\n` +
    `Score: ${(result.liveness_score * 100).toFixed(0)}%\n\n` +
    `Please try with a real person.`
  );
  return;
}

// Success - face is live
console.log('Face verified as live:', result.liveness_score);
```

## Threshold Selection

### For Different Screens

**LoginScreen** (medium security):
```javascript
await verifyLiveness(imageUri, 0.5);  // Default threshold
```

**PaymentScreen** (high security):
```javascript
await verifyLiveness(imageUri, 0.6);  // Stricter
```

**RegisterScreen** (initial verification):
```javascript
await verifyLiveness(imageUri, 0.5);  // Default
```

**LargePaymentScreen** (maximum security):
```javascript
await verifyLiveness(imageUri, 0.7);  // Very strict
```

## Display Results to Users

### Show Liveness Score

```javascript
const livenessResult = await verifyLiveness(imageUri, 0.5);

const scorePercentage = (livenessResult.liveness_score * 100).toFixed(0);
const description = getLivenessDescription(livenessResult.liveness_score);

Alert.alert(
  'Face Analysis',
  `Quality Score: ${scorePercentage}%\n${description}`
);
```

### Show Detailed Breakdown

```javascript
const livenessResult = await verifyLiveness(imageUri, 0.5);

const details = formatLivenessDetails(livenessResult.details);

Alert.alert(
  'Face Analysis Details',
  details
);
```

### Show Pass/Fail

```javascript
const livenessResult = await verifyLiveness(imageUri, 0.5);

if (livenessResult.verified) {
  Alert.alert('✅ Face Verified', 'This appears to be a real person.');
} else {
  Alert.alert('❌ Face Not Verified', 'This does not appear to be a real person.');
}
```

## Best Practices

### 1. Provide User Feedback

```javascript
// Show progress while checking
Alert.alert('Processing', 'Verifying face liveness...');
const result = await verifyLiveness(imageUri, 0.5);
Alert.alert('Result', result.verified ? '✅ Verified' : '❌ Not verified');
```

### 2. Handle Network Errors

```javascript
try {
  const result = await verifyLiveness(imageUri, 0.5);
  // Use result...
} catch (error) {
  if (error.message.includes('Network')) {
    Alert.alert('Network Error', 'Please check your connection');
  } else if (error.message.includes('timeout')) {
    Alert.alert('Timeout', 'Server took too long to respond');
  } else {
    Alert.alert('Error', error.message);
  }
}
```

### 3. Retry Logic

```javascript
const verifyWithRetry = async (imageUri, maxRetries = 3) => {
  for (let i = 0; i < maxRetries; i++) {
    try {
      return await verifyLiveness(imageUri, 0.5);
    } catch (error) {
      if (i === maxRetries - 1) throw error;
      await new Promise(r => setTimeout(r, 1000)); // Wait before retry
    }
  }
};
```

### 4. User-Friendly Error Messages

```javascript
const handleLivenessError = (result) => {
  if (!result.success) {
    return 'Could not analyze face. Please try again.';
  }
  
  if (!result.verified) {
    const score = result.liveness_score;
    if (score < 0.2) return 'This appears to be a photo, not a real person.';
    if (score < 0.4) return 'Quality too low. Please try again with better lighting.';
    if (score < 0.6) return 'Unclear result. Please try again.';
  }
  
  return null;
};
```

## Testing Checklist

- [ ] Test with real face (should pass)
- [ ] Test with printed photo (should fail)
- [ ] Test with video screenshot (should fail)
- [ ] Test with poor lighting (may fail - expected)
- [ ] Test with face at extreme angle (may fail - expected)
- [ ] Test network error handling
- [ ] Test timeout handling
- [ ] Verify threshold changes work
- [ ] Check error messages display correctly

## Deployment Checklist

- [ ] Import utilities in all screens that need liveness
- [ ] Add liveness checks before critical operations
- [ ] Test all error scenarios
- [ ] Adjust thresholds for your use case
- [ ] Add user-friendly error messages
- [ ] Document changes for team
- [ ] Deploy to testing environment
- [ ] Gather user feedback
- [ ] Deploy to production
- [ ] Monitor fraud metrics

## File References

- **Mobile Utilities**: `FacePayMobile/utils/livenessDetection.js`
- **Backend Service**: `FacePayBackend/livenessDetectionService.js`
- **Python Engine**: `FacePayBackend/liveness_detector.py`
- **Backend API**: `FacePayBackend/server.js`
- **Full Docs**: `LIVENESS_DETECTION.md`
- **Quick Start**: `LIVENESS_DETECTION_QUICKSTART.md`

## Support

For issues or questions:
1. Check error messages in app
2. Review server logs for backend errors
3. Test Python script independently
4. Consult LIVENESS_DETECTION.md
5. Adjust thresholds if needed

---

**Next Step**: Choose one of the integration examples above that matches your use case and implement it!
