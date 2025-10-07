import { Injectable } from '@angular/core';
import { GoogleGenAI } from '@google/genai';

@Injectable({
  providedIn: 'root'
})
export class GeminiService {
  private ai: GoogleGenAI | null = null;

  constructor() {
    // IMPORTANT: The API key is injected via environment variables and should not be hardcoded.
    // In this sandboxed environment, we assume `process.env.API_KEY` is available.
    const apiKey = (process as any).env.API_KEY;
    if (apiKey) {
      this.ai = new GoogleGenAI({ apiKey });
    } else {
      console.error('Gemini API Key not found. Please set the API_KEY environment variable.');
    }
  }

  async generateProductDescription(productName: string, category: string): Promise<string> {
    if (!this.ai) {
      return Promise.reject('Gemini AI client is not initialized.');
    }

    const prompt = `Write a compelling and brief product description for an e-commerce site. The product is a "${productName}" in the "${category}" category. The description should be one or two sentences long.`;

    try {
      const response = await this.ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: prompt,
      });

      return response.text.trim();
    } catch (error) {
      console.error('Error generating product description:', error);
      return 'Could not generate a description at this time. Please try again later.';
    }
  }
}
