import * as FileSystem from 'expo-file-system/legacy';
import API_URL from '../config/api';

/**
 * Liveness Detection Utilities for Mobile App
 * Detects if a face is from a live person or spoofed
 */

/**
 * Check if a face image is from a live person
 * @param {string} imageUri - Local file URI of the image
 * @param {number} threshold - Liveness threshold (0-1), default 0.5
 * @returns {Promise<Object>} - Liveness detection result
 */
export const detectLiveness = async (imageUri, threshold = 0.5) => {
  try {
    // Read the image as base64
    const base64 = await FileSystem.readAsStringAsync(imageUri, {
      encoding: FileSystem.EncodingType.Base64,
    });

    console.log(`Sending liveness detection request to: ${API_URL}/detect-liveness`);
    
    const response = await fetch(`${API_URL}/detect-liveness`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        image: base64,
      }),
    });

    const data = await response.json();

    if (data.success) {
      console.log(`Liveness detection completed: score=${data.liveness_score.toFixed(2)}, is_live=${data.is_live}`);
      return {
        success: true,
        is_live: data.is_live,
        liveness_score: data.liveness_score,
        confidence: data.confidence,
        details: data.details,
        message: data.message
      };
    } else {
      console.warn('Liveness detection failed:', data.message);
      return {
        success: false,
        is_live: false,
        message: data.message
      };
    }
  } catch (error) {
    console.error('Error detecting liveness:', error);
    return {
      success: false,
      is_live: false,
      error: error.message
    };
  }
};

/**
 * Verify liveness with a specific threshold
 * @param {string} imageUri - Local file URI of the image
 * @param {number} threshold - Liveness threshold (0-1), default 0.5
 * @returns {Promise<Object>} - Verification result
 */
export const verifyLiveness = async (imageUri, threshold = 0.5) => {
  try {
    // Read the image as base64
    const base64 = await FileSystem.readAsStringAsync(imageUri, {
      encoding: FileSystem.EncodingType.Base64,
    });

    console.log(`Sending liveness verification request to: ${API_URL}/verify-liveness`);
    
    const response = await fetch(`${API_URL}/verify-liveness`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        image: base64,
        threshold: threshold,
      }),
    });

    const data = await response.json();

    if (data.success) {
      console.log(`Liveness verification completed: verified=${data.verified}, score=${data.liveness_score.toFixed(2)}`);
      return {
        success: true,
        verified: data.verified,
        liveness_score: data.liveness_score,
        confidence: data.confidence,
        details: data.details,
        message: data.message,
        threshold: data.threshold
      };
    } else {
      console.warn('Liveness verification failed:', data.message);
      return {
        success: false,
        verified: false,
        message: data.message
      };
    }
  } catch (error) {
    console.error('Error verifying liveness:', error);
    return {
      success: false,
      verified: false,
      error: error.message
    };
  }
};

/**
 * Extract face embedding with liveness verification
 * Ensures the face is live before extracting embedding
 * @param {string} imageUri - Local file URI of the image
 * @param {number} liveness_threshold - Liveness threshold (0-1), default 0.5
 * @returns {Promise<Object>} - Embedding and liveness result
 */
export const extractEmbeddingWithLiveness = async (imageUri, liveness_threshold = 0.5) => {
  try {
    // Read the image as base64
    const base64 = await FileSystem.readAsStringAsync(imageUri, {
      encoding: FileSystem.EncodingType.Base64,
    });

    console.log(`Sending extract-embedding-with-liveness request to: ${API_URL}/extract-embedding-with-liveness`);
    
    const response = await fetch(`${API_URL}/extract-embedding-with-liveness`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        image: base64,
        liveness_threshold: liveness_threshold,
      }),
    });

    const data = await response.json();

    if (data.success && data.embedding) {
      console.log(`Successfully extracted embedding with liveness verification (${data.embedding.length} dimensions)`);
      return {
        success: true,
        embedding: data.embedding,
        liveness_verified: data.liveness_verified,
        liveness_score: data.liveness_score,
        liveness_details: data.liveness_details,
        message: data.message
      };
    } else {
      console.warn('Embedding extraction with liveness failed:', data.message);
      return {
        success: false,
        embedding: null,
        liveness_verified: false,
        message: data.message
      };
    }
  } catch (error) {
    console.error('Error extracting embedding with liveness:', error);
    return {
      success: false,
      embedding: null,
      liveness_verified: false,
      error: error.message
    };
  }
};

/**
 * Get liveness description for score
 * @param {number} score - Liveness score (0-1)
 * @returns {string} - Human readable description
 */
export const getLivenessDescription = (score) => {
  if (score >= 0.8) return 'Highly likely to be a live person';
  if (score >= 0.6) return 'Likely to be a live person';
  if (score >= 0.4) return 'Uncertain - may be spoofed';
  if (score >= 0.2) return 'Likely spoofed';
  return 'Highly likely to be spoofed or not a live person';
};

/**
 * Format liveness details for display
 * @param {Object} details - Details object from liveness detection
 * @returns {string} - Formatted string
 */
export const formatLivenessDetails = (details) => {
  if (!details) return 'No details available';
  
  const {
    eye_blink_score = 0,
    texture_score = 0,
    frequency_score = 0,
    color_score = 0,
    expression_score = 0
  } = details;

  return `
    Eye Blink Detection: ${(eye_blink_score * 100).toFixed(0)}%
    Texture Quality: ${(texture_score * 100).toFixed(0)}%
    Display Detection: ${(frequency_score * 100).toFixed(0)}%
    Color Distribution: ${(color_score * 100).toFixed(0)}%
    Expression Detection: ${(expression_score * 100).toFixed(0)}%
  `.trim();
};
