const axios = require('axios');

/**
 * InsightFace ArcFace Service
 * This service handles face detection and embedding extraction using InsightFace
 * Now uses persistent Python server for 10x faster face recognition
 */

class InsightFaceService {
  constructor() {
    this.pythonServerUrl = 'http://127.0.0.1:5001';
    this.modelReady = false;
    this.checkServerHealth();
  }

  /**
   * Check if Python server is healthy and ready
   */
  async checkServerHealth() {
    try {
      const response = await axios.get(`${this.pythonServerUrl}/health`, { timeout: 2000 });
      this.modelReady = response.data.status === 'ready';
      if (this.modelReady) {
        console.log('✓ InsightFace server is ready');
      }
    } catch (error) {
      console.warn('⚠ InsightFace server not responding. Make sure insightface_server.py is running.');
      this.modelReady = false;
    }
  }

  /**
   * Extract face embedding using ArcFace model from InsightFace
   * @param {string} base64Image - Base64 encoded image
   * @returns {Promise<Array<number>>} - 512-dimensional face embedding
   */
  async extractEmbedding(base64Image) {
    try {
      // Send image to persistent Python server
      const response = await axios.post(
        `${this.pythonServerUrl}/extract-embedding`,
        { image: base64Image },
        { 
          timeout: 10000,
          headers: { 'Content-Type': 'application/json' }
        }
      );

      if (response.data.success && response.data.embedding) {
        return response.data.embedding;
      } else {
        throw new Error(response.data.error || 'Failed to extract embedding');
      }
    } catch (error) {
      if (error.code === 'ECONNREFUSED') {
        console.error('InsightFace server is not running. Start it with: python insightface_server.py');
        throw new Error('Face recognition service unavailable. Please contact administrator.');
      }
      console.error('InsightFace extraction error:', error.message);
      throw error;
    }
  }

  /**
   * Calculate cosine similarity between two embeddings
   * @param {Array<number>} embedding1 
   * @param {Array<number>} embedding2 
   * @returns {number} - Similarity score between -1 and 1
   */
  calculateSimilarity(embedding1, embedding2) {
    if (embedding1.length !== embedding2.length) {
      throw new Error('Embeddings must have the same length');
    }

    const dotProduct = embedding1.reduce((sum, a, i) => sum + a * embedding2[i], 0);
    const magnitude1 = Math.sqrt(embedding1.reduce((sum, a) => sum + a * a, 0));
    const magnitude2 = Math.sqrt(embedding2.reduce((sum, a) => sum + a * a, 0));

    if (magnitude1 === 0 || magnitude2 === 0) {
      return 0;
    }

    return dotProduct / (magnitude1 * magnitude2);
  }

  /**
   * Find best match from a list of stored embeddings
   * @param {Array<number>} queryEmbedding 
   * @param {Array<{id: number, embedding: Array<number>}>} storedEmbeddings 
   * @param {number} threshold - Minimum similarity threshold (default: 0.4)
   * @returns {Object} - Best match with id and similarity score
   */
  findBestMatch(queryEmbedding, storedEmbeddings, threshold = 0.4) {
    let bestMatch = null;
    let highestSimilarity = threshold;

    for (const stored of storedEmbeddings) {
      try {
        // Parse embedding if it's a string or array format from database
        let embedding = stored.embedding;
        if (typeof embedding === 'string') {
          // Remove curly braces if present (PostgreSQL array format)
          embedding = embedding.replace(/[{}]/g, '').split(',').map(x => parseFloat(x));
        } else if (Array.isArray(embedding) && embedding.length === 1 && typeof embedding[0] === 'string') {
          // Handle case where it's wrapped in another array
          embedding = embedding[0].replace(/[{}]/g, '').split(',').map(x => parseFloat(x));
        }
        
        // Skip if embedding is invalid
        if (!Array.isArray(embedding) || embedding.length === 0) {
          console.warn(`Skipping user ${stored.id}: invalid embedding format`);
          continue;
        }
        
        const similarity = this.calculateSimilarity(queryEmbedding, embedding);
        
        if (similarity > highestSimilarity) {
          highestSimilarity = similarity;
          bestMatch = {
            ...stored,
            similarity: similarity
          };
        }
      } catch (error) {
        console.warn(`Error comparing with user ${stored.id}:`, error.message);
        continue;
      }
    }

    return bestMatch;
  }
}

// Singleton instance
const insightFaceService = new InsightFaceService();

module.exports = insightFaceService;
