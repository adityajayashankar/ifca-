const OpenAI = require('openai');

class OpenAIService {
  constructor() {
    this._client = null;
  }

  get client() {
    if (!this._client) {
      const apiKey = process.env.OPENAI_API_KEY;
      if (!apiKey) {
        throw new Error('OPENAI_API_KEY is not set in environment variables. Please configure it in your .env file.');
      }
      this._client = new OpenAI({
        apiKey: apiKey
      });
    }
    return this._client;
  }

  async generateText(prompt, options = {}) {
    try {
      const response = await this.client.chat.completions.create({
        model: options.model || 'gpt-4',
        messages: [{ role: 'user', content: prompt }],
        temperature: options.temperature || 0.7,
        max_tokens: options.max_tokens || 1000
      });
      
      return {
        content: response.choices[0].message.content,
        provider: 'openai',
        model: options.model || 'gpt-4'
      };
    } catch (error) {
      console.error('OpenAI text generation error:', error);
      throw error;
    }
  }

  async generateImage(prompt, options = {}) {
    try {
      const response = await this.client.images.generate({
        model: options.model || 'dall-e-3',
        prompt: prompt,
        n: options.n || 1,
        size: options.size || '1024x1024',
        quality: options.quality || 'standard'
      });
      
      return {
        images: response.data.map(img => img.url),
        provider: 'openai',
        model: options.model || 'dall-e-3'
      };
    } catch (error) {
      console.error('OpenAI image generation error:', error);
      throw error;
    }
  }

  async generateMultipleImages(prompt, count = 3, options = {}) {
    // Generate images sequentially to avoid rate limits
    const images = [];
    for (let i = 0; i < count; i++) {
      try {
        const result = await this.generateImage(`${prompt} - Slide ${i + 1}`, { 
          n: 1,
          size: options.size || '1024x1024'
        });
        images.push(result.images[0]);
        // Small delay to avoid rate limits
        if (i < count - 1) {
          await new Promise(resolve => setTimeout(resolve, 2000));
        }
      } catch (error) {
        console.error(`Error generating image ${i + 1}:`, error);
        // Continue with other images even if one fails
      }
    }
    return { images, provider: 'openai' };
  }
}

// Export singleton instance - client is lazy-loaded only when needed
// This prevents crashes on module load if OPENAI_API_KEY is not set
module.exports = new OpenAIService();
