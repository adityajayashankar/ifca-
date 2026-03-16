const axios = require('axios');

class VideoGenerationService {
  constructor() {
    this.providers = {
      runwayml: {
        apiKey: process.env.RUNWAYML_API_KEY,
        apiUrl: process.env.RUNWAYML_API_URL || 'https://api.runwayml.com/v1/video/generate'
      },
      pikabots: {
        apiKey: process.env.PIKA_API_KEY,
        apiUrl: process.env.PIKA_API_URL || 'https://api.pikabots.com/v1/video/generate'
      }
    };
  }

  async generateVideo(script, options = {}) {
    const provider = options.provider || 'runwayml';
    const config = this.providers[provider];
    
    if (!config || !config.apiKey) {
      console.warn(`Video provider ${provider} not configured. Using placeholder.`);
      // Return placeholder for development/testing
      return {
        videoUrl: null,
        provider: provider,
        duration: options.duration || 120,
        script: script,
        placeholder: true,
        message: `Video generation requires ${provider} API key configuration`
      };
    }

    try {
      // Generate video using text-to-video API
      const response = await axios.post(
        config.apiUrl,
        {
          prompt: script,
          duration: options.duration || 120, // 2 minutes
          style: options.style || 'cinematic'
        },
        {
          headers: {
            'Authorization': `Bearer ${config.apiKey}`,
            'Content-Type': 'application/json'
          },
          timeout: 30000 // 30 second timeout
        }
      );

      // Poll for video completion
      const videoUrl = await this.pollVideoStatus(response.data.taskId || response.data.id, provider);
      
      return {
        videoUrl,
        provider,
        duration: options.duration || 120,
        script
      };
    } catch (error) {
      console.error(`Video generation failed with ${provider}:`, error.message);
      // Return placeholder instead of throwing error
      return {
        videoUrl: null,
        provider: provider,
        duration: options.duration || 120,
        script: script,
        placeholder: true,
        error: error.message
      };
    }
  }

  async pollVideoStatus(taskId, provider, maxAttempts = 60) {
    const config = this.providers[provider];
    if (!config || !config.apiKey) {
      throw new Error(`Video provider ${provider} not configured`);
    }

    let attempts = 0;

    while (attempts < maxAttempts) {
      try {
        const response = await axios.get(
          `${config.apiUrl}/status/${taskId}`,
          {
            headers: { 'Authorization': `Bearer ${config.apiKey}` },
            timeout: 10000
          }
        );

        if (response.data.status === 'completed') {
          return response.data.videoUrl;
        }

        if (response.data.status === 'failed') {
          throw new Error('Video generation failed');
        }

        // Wait 5 seconds before next poll
        await new Promise(resolve => setTimeout(resolve, 5000));
        attempts++;
      } catch (error) {
        if (error.response && error.response.status === 404) {
          // Task not found, might need to wait longer
          await new Promise(resolve => setTimeout(resolve, 5000));
          attempts++;
          continue;
        }
        throw error;
      }
    }

    throw new Error('Video generation timeout');
  }
}

module.exports = new VideoGenerationService();
