const openaiService = require('./openai.service');
const geminiService = require('./gemini.service');

class AIService {
  async generateText(prompt, options = {}, retries = 3) {
    let lastError;
    
    for (let attempt = 0; attempt < retries; attempt++) {
      try {
        // Try OpenAI first
        return await openaiService.generateText(prompt, options);
      } catch (error) {
        lastError = error;
        console.error(`OpenAI attempt ${attempt + 1} failed:`, error.message);
        
        // If OpenAI fails and we have retries left, try Gemini as fallback
        if (attempt < retries - 1) {
          try {
            console.log('Falling back to Gemini...');
            return await geminiService.generateText(prompt, options);
          } catch (geminiError) {
            console.error('Gemini fallback also failed:', geminiError.message);
            lastError = geminiError;
          }
        }
        
        // Wait before retry (exponential backoff)
        if (attempt < retries - 1) {
          await new Promise(resolve => setTimeout(resolve, Math.pow(2, attempt) * 1000));
        }
      }
    }
    
    // If all retries failed, try Gemini one more time
    try {
      console.log('Final attempt with Gemini...');
      return await geminiService.generateText(prompt, options);
    } catch (error) {
      console.error('All AI generation attempts failed');
      throw lastError || error;
    }
  }

  async generateImage(prompt, options = {}) {
    try {
      return await openaiService.generateImage(prompt, options);
    } catch (error) {
      console.error('Image generation failed:', error);
      // Return a structured error response instead of throwing
      // This allows activities to handle the failure gracefully
      const errorMessage = error?.message || error?.error?.message || 'Image generation failed';
      return {
        images: [],
        error: errorMessage,
        provider: 'openai',
        failed: true
      };
    }
  }

  async generateMultipleImages(prompt, count = 3, options = {}) {
    try {
      return await openaiService.generateMultipleImages(prompt, count, options);
    } catch (error) {
      console.error('Multiple image generation failed:', error);
      // Return partial results if some images were generated
      const errorMessage = error?.message || error?.error?.message || 'Image generation failed';
      return {
        images: [],
        error: errorMessage,
        provider: 'openai',
        failed: true
      };
    }
  }
}

module.exports = new AIService();
