const { GoogleGenerativeAI } = require('@google/generative-ai');

class GeminiService {
  constructor() {
    if (!process.env.GOOGLE_GEMINI_API_KEY) {
      console.warn('GOOGLE_GEMINI_API_KEY not set. Gemini service will not be available.');
      this.client = null;
    } else {
      this.client = new GoogleGenerativeAI(process.env.GOOGLE_GEMINI_API_KEY);
    }
  }

  async generateText(prompt, options = {}) {
    if (!this.client) {
      throw new Error('Gemini API key not configured');
    }

    try {
      // Use gemini-1.5-flash as default (faster and more available than gemini-pro)
      // Fallback to gemini-1.5-pro if flash is not available
      const modelName = options.model || 'gemini-1.5-flash';
      const model = this.client.getGenerativeModel({ 
        model: modelName
      });
      
      const result = await model.generateContent({
        contents: [{ role: 'user', parts: [{ text: prompt }] }],
        generationConfig: {
          temperature: options.temperature || 0.7,
          maxOutputTokens: options.max_tokens || 1000
        }
      });
      
      return {
        text: result.response.text(),
        content: result.response.text(), // Alias for consistency
        provider: 'gemini',
        model: modelName
      };
    } catch (error) {
      console.error('Gemini text generation error:', error);
      
      // If the model is not found, try fallback models
      if (error.message && error.message.includes('not found')) {
        const fallbackModels = ['gemini-1.5-pro', 'gemini-2.5-flash', 'gemini-2.5-pro'];
        const currentModel = options.model || 'gemini-1.5-flash';
        
        for (const fallbackModel of fallbackModels) {
          if (fallbackModel !== currentModel) {
            try {
              console.log(`Trying fallback model: ${fallbackModel}`);
              const model = this.client.getGenerativeModel({ model: fallbackModel });
              const result = await model.generateContent({
                contents: [{ role: 'user', parts: [{ text: prompt }] }],
                generationConfig: {
                  temperature: options.temperature || 0.7,
                  maxOutputTokens: options.max_tokens || 1000
                }
              });
              
              return {
                text: result.response.text(),
                content: result.response.text(),
                provider: 'gemini',
                model: fallbackModel
              };
            } catch (fallbackError) {
              console.error(`Fallback model ${fallbackModel} also failed:`, fallbackError.message);
              continue;
            }
          }
        }
      }
      
      throw error;
    }
  }
}

module.exports = new GeminiService();
