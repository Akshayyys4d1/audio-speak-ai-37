// Settings management with localStorage persistence

export interface AppSettings {
  replicateApiKey: string;
  replicateModel: string;
  geminiApiKey: string;
  geminiModel: string;
}

export const defaultSettings: AppSettings = {
  replicateApiKey: '',
  replicateModel: 'openai/whisper:cdd97b257f93cb89dede1c7584e3f3dfc969571b357dbcee08e793740bedd854',
  geminiApiKey: '',
  geminiModel: 'gemini-2.0-flash'
};

const SETTINGS_KEY = 'atlas-ai-settings';

export const loadSettings = (): AppSettings => {
  try {
    const stored = localStorage.getItem(SETTINGS_KEY);
    if (stored) {
      const parsed = JSON.parse(stored);
      return { ...defaultSettings, ...parsed };
    }
  } catch (error) {
    console.error('Error loading settings:', error);
  }
  return defaultSettings;
};

export const saveSettings = (settings: AppSettings): void => {
  try {
    localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings));
  } catch (error) {
    console.error('Error saving settings:', error);
  }
};

export const validateSettings = (settings: AppSettings): string[] => {
  const errors: string[] = [];
  
  if (!settings.replicateApiKey.trim()) {
    errors.push('Replicate API Key is required');
  }
  
  if (!settings.geminiApiKey.trim()) {
    errors.push('Gemini API Key is required');
  }
  
  if (!settings.replicateModel.trim()) {
    errors.push('Replicate Model is required');
  }
  
  if (!settings.geminiModel.trim()) {
    errors.push('Gemini Model is required');
  }
  
  return errors;
};