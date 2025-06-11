// Supported AI Platforms
export const SUPPORTED_PLATFORMS = {
  'chat.openai.com': 'ChatGPT',
  'chatgpt.com': 'ChatGPT',
  'claude.ai': 'Claude',
  'gemini.google.com': 'Gemini',
  'bard.google.com': 'Bard',
  'poe.com': 'Poe',
  'character.ai': 'Character.AI'
};

// API Endpoints
export const API_BASE_URL = 'https://complyze.co/api';
export const API_ENDPOINTS = {
  PROMPT_INGEST: `${API_BASE_URL}/prompts/ingest`,
  AUTH_LOGIN: `${API_BASE_URL}/auth/login`,
  AUTH_SIGNUP: `${API_BASE_URL}/auth/signup`,
  AUTH_CHECK: `${API_BASE_URL}/auth/check`
};

// Risk Levels
export const RISK_LEVELS = {
  LOW: 'low',
  MEDIUM: 'medium',
  HIGH: 'high',
  CRITICAL: 'critical'
};

// Storage Keys
export const STORAGE_KEYS = {
  ACCESS_TOKEN: 'complyze_access_token',
  USER_ID: 'complyze_user_id',
  USER_EMAIL: 'complyze_user_email',
  SETTINGS: 'complyze_settings'
};

// Extension Version
export const EXTENSION_VERSION = '2.0.0';

// Prompt Event Status
export const PROMPT_STATUS = {
  PENDING: 'pending',
  FLAGGED: 'flagged',
  OPTIMIZED: 'optimized',
  ALLOWED: 'allowed'
}; 