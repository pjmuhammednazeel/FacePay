const { spawn } = require('child_process');
const path = require('path');
const fs = require('fs').promises;

/**
 * InsightFace ArcFace Service
 * This service handles face detection and embedding extraction using InsightFace
 */

class InsightFaceService {
  constructor() {
    this.pythonScript = path.join(__dirname, 'insightface_processor_simple.py');
    this.modelReady = false;
  }

  /**
   * Extract face embedding using ArcFace model from InsightFace
   * @param {string} base64Image - Base64 encoded image
   * @returns {Promise<Array<number>>} - 512-dimensional face embedding
   */
  async extractEmbedding(base64Image) {
    try {
      // Create temporary file for image
      const tempImagePath = path.join(__dirname, 'temp', `temp_${Date.now()}.jpg`);
      
      // Ensure temp directory exists
      await fs.mkdir(path.join(__dirname, 'temp'), { recursive: true });
      
      // Write base64 image to file
      const imageBuffer = Buffer.from(base64Image, 'base64');
      await fs.writeFile(tempImagePath, imageBuffer);

      // Call Python script to process with InsightFace
      const embedding = await this.runPythonScript(tempImagePath);

      // Clean up temp file
      await fs.unlink(tempImagePath).catch(() => {});

      return embedding;
    } catch (error) {
      console.error('InsightFace extraction error:', error);
      throw error;
    }
  }

  /**
   * Run Python script for face embedding extraction
   * @param {string} imagePath - Path to image file
   * @returns {Promise<Array<number>>} - Face embedding
   */
  runPythonScript(imagePath) {
    return new Promise((resolve, reject) => {
      const python = spawn('python', [this.pythonScript, imagePath]);
      let output = '';
      let errorOutput = '';

      python.stdout.on('data', (data) => {
        output += data.toString();
      });

      python.stderr.on('data', (data) => {
        errorOutput += data.toString();
      });

      python.on('close', (code) => {
        if (code !== 0) {
          reject(new Error(`Python script failed with code ${code}: ${errorOutput}`));
          return;
        }

        try {
          // Trim output and look for JSON
          const trimmedOutput = output.trim();
          
          // Try to find JSON object in the output
          let result;
          try {
            // First try direct parsing
            result = JSON.parse(trimmedOutput);
          } catch (e1) {
            // If that fails, try to extract JSON from output
            const jsonStart = trimmedOutput.indexOf('{');
            const jsonEnd = trimmedOutput.lastIndexOf('}');
            
            if (jsonStart !== -1 && jsonEnd !== -1) {
              const jsonStr = trimmedOutput.substring(jsonStart, jsonEnd + 1);
              result = JSON.parse(jsonStr);
            } else {
              throw new Error(`No JSON found. Raw output: ${trimmedOutput.substring(0, 150)}`);
            }
          }
          
          if (result.error) {
            reject(new Error(result.error));
          } else if (result.embedding) {
            resolve(result.embedding);
          } else {
            reject(new Error(`Invalid response from Python script: ${JSON.stringify(result)}`));
          }
        } catch (error) {
          reject(new Error(`Failed to parse Python output: ${error.message}`));
        }
      });
    });
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
