const { spawn } = require('child_process');
const path = require('path');
const fs = require('fs').promises;

/**
 * Liveness Detection Service
 * Detects if a face is from a live person or a spoofed attack
 * Uses multiple techniques: eye blink, texture analysis, frequency patterns, etc.
 */

class LivenessDetectionService {
  constructor() {
    this.pythonScript = path.join(__dirname, 'liveness_detector.py');
    this.detectorReady = false;
  }

  /**
   * Run Python liveness detection script
   * @param {string} imagePath - Path to image file
   * @returns {Promise<Object>} - Liveness detection result
   */
  runPythonScript(imagePath) {
    return new Promise((resolve, reject) => {
      const python = spawn('python', [this.pythonScript, imagePath]);
      let output = '';
      let error = '';

      python.stdout.on('data', (data) => {
        output += data.toString();
      });

      python.stderr.on('data', (data) => {
        error += data.toString();
      });

      python.on('close', (code) => {
        if (code !== 0) {
          reject(new Error(`Python script failed with code ${code}: ${error}`));
          return;
        }

        try {
          const result = JSON.parse(output);
          resolve(result);
        } catch (parseError) {
          reject(new Error(`Failed to parse Python output: ${output}`));
        }
      });

      python.on('error', (err) => {
        reject(new Error(`Failed to spawn Python process: ${err.message}`));
      });
    });
  }

  /**
   * Detect liveness from image
   * @param {string} base64Image - Base64 encoded image
   * @returns {Promise<Object>} - Liveness detection result
   */
  async detectLiveness(base64Image) {
    try {
      // Create temporary file for image
      const tempImagePath = path.join(__dirname, 'temp', `liveness_${Date.now()}.jpg`);
      
      // Ensure temp directory exists
      await fs.mkdir(path.join(__dirname, 'temp'), { recursive: true });
      
      // Write base64 image to file
      const imageBuffer = Buffer.from(base64Image, 'base64');
      await fs.writeFile(tempImagePath, imageBuffer);

      // Call Python script for liveness detection
      const result = await this.runPythonScript(tempImagePath);

      // Clean up temp file
      await fs.unlink(tempImagePath).catch(() => {});

      return result;
    } catch (error) {
      console.error('Liveness detection error:', error);
      return {
        success: false,
        error: error.message,
        liveness_score: 0.5,
        is_live: null
      };
    }
  }

  /**
   * Verify liveness with threshold
   * @param {string} base64Image - Base64 encoded image
   * @param {number} threshold - Minimum liveness score (0-1)
   * @returns {Promise<Object>} - Verification result
   */
  async verifyLiveness(base64Image, threshold = 0.5) {
    try {
      const livenessResult = await this.detectLiveness(base64Image);

      if (!livenessResult.success) {
        return {
          success: false,
          verified: false,
          error: livenessResult.error,
          message: 'Failed to perform liveness detection'
        };
      }

      const { liveness_score, is_live, confidence, details } = livenessResult;

      const verified = is_live && liveness_score >= threshold;

      return {
        success: true,
        verified,
        liveness_score,
        is_live,
        confidence,
        details,
        threshold,
        message: verified 
          ? 'Face verified as live person' 
          : 'Face may be spoofed or not a live person'
      };
    } catch (error) {
      console.error('Liveness verification error:', error);
      return {
        success: false,
        verified: false,
        error: error.message,
        message: 'Liveness verification failed'
      };
    }
  }
}

// Singleton instance
const livenessDetectionService = new LivenessDetectionService();

module.exports = livenessDetectionService;
