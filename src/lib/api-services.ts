// API service utilities for Replicate and Gemini AI

// CORS Note: For Electron builds, you can disable web security to bypass CORS:
// In your Electron main process, set: webSecurity: false in BrowserWindow options
// Or use: --disable-web-security flag when launching Electron

// Web Speech API type declarations
declare global {
  interface Window {
    SpeechRecognition: any;
    webkitSpeechRecognition: any;
  }
}

export interface ReplicateSettings {
  apiKey: string;
  model: string;
}

export interface GeminiSettings {
  apiKey: string;
  model: string;
}

export interface TranscriptionResult {
  transcription: string;
  language?: string;
}

export interface AIResponse {
  response: string;
}

// Replicate API Service for Whisper transcription
export class ReplicateService {
  private apiKey: string;
  private model: string;

  constructor(settings: ReplicateSettings) {
    this.apiKey = settings.apiKey;
    this.model = settings.model;
  }

  async transcribeAudio(audioBlob: Blob): Promise<TranscriptionResult> {
    try {
      console.log('Starting Replicate API transcription...');
      
      // Convert blob to base64 data URL for Replicate
      const audioDataUrl = await this.blobToDataUrl(audioBlob);
      
      // Create prediction on Replicate
      const response = await fetch('https://api.replicate.com/v1/predictions', {
        method: 'POST',
        headers: {
          'Authorization': `Token ${this.apiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          version: this.model,
          input: {
            audio: audioDataUrl,
            model: 'large-v3',
            translate: false,
            temperature: 0,
            suppress_tokens: '-1',
            logprob_threshold: -1.0,
            no_speech_threshold: 0.6,
            condition_on_previous_text: true
          }
        })
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error('Replicate API request failed:', response.status, errorText);
        throw new Error(`Replicate API request failed: ${response.status} ${response.statusText}`);
      }

      const prediction = await response.json();
      console.log('Replicate prediction created:', prediction.id);

      // Poll for completion
      return await this.pollForCompletion(prediction.urls.get);
      
    } catch (error) {
      console.error('Replicate transcription error:', error);
      throw error;
    }
  }

  private async blobToDataUrl(blob: Blob): Promise<string> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = reject;
      reader.readAsDataURL(blob);
    });
  }

  private async pollForCompletion(url: string): Promise<TranscriptionResult> {
    const maxAttempts = 30; // 5 minutes max
    let attempts = 0;

    console.log('Starting to poll for Replicate transcription completion...');

    while (attempts < maxAttempts) {
      await new Promise(resolve => setTimeout(resolve, 2000)); // Wait 2 seconds
      
      try {
        const response = await fetch(url, {
          headers: {
            'Authorization': `Token ${this.apiKey}`,
          },
        });

        if (!response.ok) {
          const errorText = await response.text();
          console.error(`Replicate polling error: ${response.status} ${response.statusText}`, errorText);
          throw new Error(`Polling error: ${response.status} ${response.statusText}`);
        }

        const result = await response.json();
        console.log(`Replicate polling attempt ${attempts + 1}: status = ${result.status}`);

        if (result.status === 'succeeded') {
          console.log('Replicate transcription completed successfully');
          const transcription = result.output?.transcription || result.output || '';
          const language = result.output?.language;
          
          console.log('Transcription result:', { transcription, language });
          
          return {
            transcription,
            language
          };
        }

        if (result.status === 'failed') {
          console.error('Replicate transcription failed:', result.error);
          throw new Error(`Transcription failed: ${result.error}`);
        }

        attempts++;
      } catch (error) {
        console.error(`Replicate polling attempt ${attempts + 1} failed:`, error);
        throw error;
      }
    }

    console.error('Replicate transcription timed out after maximum attempts');
    throw new Error('Transcription timeout - exceeded maximum polling attempts');
  }
}

// Gemini AI Service
export class GeminiService {
  private apiKey: string;
  private model: string;

  constructor(settings: GeminiSettings) {
    this.apiKey = settings.apiKey;
    this.model = settings.model;
  }

  async generateResponse(transcription: string): Promise<AIResponse> {
    const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${this.model}:generateContent?key=${this.apiKey}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        contents: [{
          parts: [{
            text: `You are a helpful AI assistant. Please respond to the following user input in a natural and helpful way. If the user spoke in a language other than English, please respond in the same language. User input: "${transcription}"`
          }]
        }],
        generationConfig: {
          temperature: 0.7,
          topK: 40,
          topP: 0.95,
          maxOutputTokens: 1024,
        }
      })
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(`Gemini API error: ${errorData.error?.message || response.statusText}`);
    }

    const result = await response.json();
    
    if (!result.candidates || result.candidates.length === 0) {
      throw new Error('No response generated from Gemini AI');
    }

    const responseText = result.candidates[0].content?.parts?.[0]?.text;
    if (!responseText) {
      throw new Error('Invalid response format from Gemini AI');
    }

    return {
      response: responseText
    };
  }
}

// Web Speech API Service (Browser-based transcription)
export class WebSpeechService {
  private recognition: any = null;

  constructor() {
    if ('SpeechRecognition' in window || 'webkitSpeechRecognition' in window) {
      const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
      this.recognition = new SpeechRecognition();
      this.setupRecognition();
    }
  }

  private setupRecognition() {
    if (!this.recognition) return;
    
    this.recognition.continuous = false;
    this.recognition.interimResults = false;
    this.recognition.maxAlternatives = 1;
    this.recognition.lang = 'auto'; // Will use browser's default language
  }

  async transcribeAudioBlob(audioBlob: Blob): Promise<TranscriptionResult> {
    if (!this.recognition) {
      throw new Error('Speech Recognition not supported in this browser');
    }

    // For Web Speech API, we need to play the audio while listening
    // This is a workaround since we can't directly process audio blobs
    return new Promise((resolve, reject) => {
      if (!this.recognition) {
        reject(new Error('Speech Recognition not available'));
        return;
      }

      // Create audio element to play the recorded audio
      const audio = new Audio();
      const audioURL = URL.createObjectURL(audioBlob);
      audio.src = audioURL;

      this.recognition.onresult = (event) => {
        const transcript = event.results[0][0].transcript;
        const confidence = event.results[0][0].confidence;
        
        URL.revokeObjectURL(audioURL);
        resolve({
          transcription: transcript,
          language: this.recognition?.lang || 'en-US'
        });
      };

      this.recognition.onerror = (event) => {
        URL.revokeObjectURL(audioURL);
        reject(new Error(`Speech recognition error: ${event.error}`));
      };

      this.recognition.onend = () => {
        URL.revokeObjectURL(audioURL);
      };

      // Start recognition and play audio
      try {
        this.recognition.start();
        audio.play().catch(e => {
          this.recognition?.stop();
          reject(new Error('Failed to play audio for transcription'));
        });
      } catch (error) {
        reject(new Error('Failed to start speech recognition'));
      }
    });
  }

  // Live transcription method for real-time recording
  async transcribeLive(): Promise<TranscriptionResult> {
    if (!this.recognition) {
      throw new Error('Speech Recognition not supported in this browser');
    }

    return new Promise((resolve, reject) => {
      if (!this.recognition) {
        reject(new Error('Speech Recognition not available'));
        return;
      }

      this.recognition.onresult = (event) => {
        const transcript = event.results[0][0].transcript;
        resolve({
          transcription: transcript,
          language: this.recognition?.lang || 'en-US'
        });
      };

      this.recognition.onerror = (event) => {
        reject(new Error(`Speech recognition error: ${event.error}`));
      };

      this.recognition.start();
    });
  }

  isSupported(): boolean {
    return 'SpeechRecognition' in window || 'webkitSpeechRecognition' in window;
  }

  stop() {
    if (this.recognition) {
      this.recognition.stop();
    }
  }
}

// Text-to-Speech Service
export class TextToSpeechService {
  private synth: SpeechSynthesis;

  constructor() {
    this.synth = window.speechSynthesis;
  }

  speak(text: string, language: string = 'en-US'): Promise<void> {
    return new Promise((resolve, reject) => {
      // Cancel any ongoing speech
      this.synth.cancel();

      const utterance = new SpeechSynthesisUtterance(text);
      utterance.lang = language;
      utterance.rate = 0.9;
      utterance.pitch = 1;
      utterance.volume = 1;

      utterance.onend = () => resolve();
      utterance.onerror = (event) => reject(new Error(`Speech synthesis error: ${event.error}`));

      this.synth.speak(utterance);
    });
  }

  stop() {
    this.synth.cancel();
  }

  isSupported(): boolean {
    return 'speechSynthesis' in window;
  }
}