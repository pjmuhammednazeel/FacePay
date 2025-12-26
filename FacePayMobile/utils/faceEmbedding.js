import * as tf from '@tensorflow/tfjs';
import * as facemesh from '@tensorflow-models/facemesh';
import * as FileSystem from 'expo-file-system/legacy';

let faceMeshModel = null;

// Load the FaceMesh model
export const loadFaceMeshModel = async () => {
  if (!faceMeshModel) {
    faceMeshModel = await facemesh.load();
  }
  return faceMeshModel;
};

// Extract face landmarks and create embedding
export const extractFaceEmbedding = async (imageUri) => {
  try {
    // For React Native, we'll use a hash-based approach for now
    // In production, you'd use a proper face embedding model compatible with React Native
    const embedding = await generateHashBasedEmbedding(imageUri);
    return embedding;
  } catch (error) {
    console.error('Error extracting face embedding:', error);
    throw error;
  }
};

// Generate face embedding from image URI
export const generateFaceEmbeddingFromImage = async (imageUri) => {
  try {
    // Read the image as base64
    const base64 = await FileSystem.readAsStringAsync(imageUri, {
      encoding: FileSystem.EncodingType.Base64,
    });
    
    // Create a deterministic embedding from the image data
    const embedding = await generateEmbeddingFromBase64(base64);
    
    return embedding;
  } catch (error) {
    console.error('Error generating embedding:', error);
    // Return mock embedding as fallback
    return generateMockEmbedding();
  }
};

// Generate embedding from base64 image data
const generateEmbeddingFromBase64 = async (base64Data) => {
  // Create a 128-dimensional embedding based on image characteristics
  // This is a simplified version - in production, use a proper face recognition model
  
  const embedding = [];
  const chunkSize = Math.floor(base64Data.length / 128);
  
  for (let i = 0; i < 128; i++) {
    const start = i * chunkSize;
    const chunk = base64Data.substring(start, start + chunkSize);
    
    // Create a hash-like value from the chunk
    let hash = 0;
    for (let j = 0; j < chunk.length; j++) {
      const char = chunk.charCodeAt(j);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Convert to 32-bit integer
    }
    
    // Normalize to [-1, 1] range
    embedding.push(hash / Math.pow(2, 31));
  }
  
  return embedding;
};

// Generate hash-based embedding
const generateHashBasedEmbedding = async (imageUri) => {
  try {
    const base64 = await FileSystem.readAsStringAsync(imageUri, {
      encoding: FileSystem.EncodingType.Base64,
    });
    
    return generateEmbeddingFromBase64(base64);
  } catch (error) {
    console.error('Error generating hash-based embedding:', error);
    return generateMockEmbedding();
  }
};

// Generate mock embedding for testing
const generateMockEmbedding = () => {
  // In production, replace this with actual face embedding extraction
  // This generates a 128-dimensional vector (standard face embedding size)
  return Array.from({ length: 128 }, () => Math.random() * 2 - 1);
};

// Calculate similarity between two embeddings using cosine similarity
export const calculateFaceSimilarity = (embedding1, embedding2) => {
  if (embedding1.length !== embedding2.length) {
    throw new Error('Embeddings must have the same length');
  }

  // Cosine similarity
  const dotProduct = embedding1.reduce((sum, a, i) => sum + a * embedding2[i], 0);
  const magnitude1 = Math.sqrt(embedding1.reduce((sum, a) => sum + a * a, 0));
  const magnitude2 = Math.sqrt(embedding2.reduce((sum, a) => sum + a * a, 0));

  if (magnitude1 === 0 || magnitude2 === 0) {
    return 0;
  }

  return dotProduct / (magnitude1 * magnitude2);
};

// Check if two face embeddings match (with threshold)
export const isFaceMatch = (embedding1, embedding2, threshold = 0.6) => {
  const similarity = calculateFaceSimilarity(embedding1, embedding2);
  return similarity >= threshold;
};
