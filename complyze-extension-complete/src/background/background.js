// Constants and utilities defined inline to avoid ES6 module issues
const SUPPORTED_PLATFORMS = {
  'chat.openai.com': 'ChatGPT',
  'chatgpt.com': 'ChatGPT',
  'claude.ai': 'Claude',
  'gemini.google.com': 'Gemini',
  'bard.google.com': 'Bard',
  'poe.com': 'Poe',
  'character.ai': 'Character.AI'
};

const PROMPT_STATUS = {
  PENDING: 'pending',
  FLAGGED: 'flagged',
  OPTIMIZED: 'optimized',
  ALLOWED: 'allowed'
};

const RISK_LEVELS = {
  LOW: 'low',
  MEDIUM: 'medium',
  HIGH: 'high',
  CRITICAL: 'critical'
};

const STORAGE_KEYS = {
  ACCESS_TOKEN: 'complyze_access_token',
  USER_ID: 'complyze_user_id',
  USER_EMAIL: 'complyze_user_email',
  SETTINGS: 'complyze_settings'
};

const API_ENDPOINTS = {
  PROMPT_INGEST: 'https://complyze.co/api/prompts/ingest',
  AUTH_LOGIN: 'https://complyze.co/api/auth/login',
  AUTH_SIGNUP: 'https://complyze.co/api/auth/signup',
  AUTH_CHECK: 'https://complyze.co/api/auth/check'
};

// Inline utility functions
async function getUserId() {
  return new Promise((resolve) => {
    chrome.storage.local.get([STORAGE_KEYS.USER_ID], (result) => {
      resolve(result[STORAGE_KEYS.USER_ID] || null);
    });
  });
}

async function getAuthToken() {
  return new Promise((resolve) => {
    chrome.storage.local.get([STORAGE_KEYS.ACCESS_TOKEN], (result) => {
      resolve(result[STORAGE_KEYS.ACCESS_TOKEN] || null);
    });
  });
}

async function checkAuth() {
  try {
    // Check for demo user first
    const demoUser = await getDemoUser();
    if (demoUser) {
      return { authenticated: true, demo: true };
    }

    const token = await getAuthToken();
    
    if (!token) {
      return { authenticated: false };
    }

    const response = await fetch(API_ENDPOINTS.AUTH_CHECK, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });

    if (response.ok) {
      const data = await response.json();
      return { authenticated: true, ...data };
    } else {
      return { authenticated: false };
    }
  } catch (error) {
    console.error('Auth check error:', error);
    // Check for demo user as fallback
    const demoUser = await getDemoUser();
    if (demoUser) {
      return { authenticated: true, demo: true };
    }
    return { authenticated: false };
  }
}

async function getDemoUser() {
  return new Promise((resolve) => {
    chrome.storage.local.get(['demo_user'], (result) => {
      resolve(result.demo_user || null);
    });
  });
}

async function sendPromptEvent(promptData) {
  try {
    const token = await getAuthToken();
    
    if (!token) {
      throw new Error('User not authenticated');
    }

    const response = await fetch(API_ENDPOINTS.PROMPT_INGEST, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(promptData)
    });

    if (!response.ok) {
      throw new Error(`Failed to send prompt event: ${response.statusText}`);
    }

    return { success: true, data: await response.json() };
  } catch (error) {
    console.error('Failed to send to production API:', error);
    return { 
      success: false, 
      error: error.message,
      shouldRetry: true 
    };
  }
}

// OpenRouter API Configuration
const OPENROUTER_CONFIG = {
  API_KEY: 'sk-or-v1-a40a8b7c4a68decedb3dce0d9e9aa358d2f203d9f',
  BASE_URL: 'https://openrouter.ai/api/v1',
  MODEL: 'google/gemini-2.5-flash-preview'
};

// Master system prompt for optimization
const OPTIMIZATION_SYSTEM_PROMPT = `You are an AI prompt optimization specialist. Your task is to:

1. REDACT all sensitive information that has been marked with [REDACTED] tags
2. OPTIMIZE the prompt for clarity, efficiency, and effectiveness
3. MAINTAIN the original intent and context while removing sensitive data
4. ENSURE the optimized prompt is safe for AI processing

Guidelines:
- Keep the core request intact
- Remove or replace sensitive information with generic placeholders
- Improve clarity and structure
- Make the prompt more efficient while preserving meaning
- Ensure compliance with data protection regulations

IMPORTANT: Remove all brackets like [EMAIL_REDACTED] and replace with natural language placeholders.

Return ONLY the optimized prompt without explanations or metadata.`;

// Comprehensive redaction patterns
const REDACTION_PATTERNS = {
  email: /\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b/g,
  phone: /\b(?:\+?1[-.\s]?)?\(?([0-9]{3})\)?[-.\s]?([0-9]{3})[-.\s]?([0-9]{4})\b/g,
  ssn: /\b\d{3}-\d{2}-\d{4}\b/g,
  creditCard: /\b(?:4[0-9]{12}(?:[0-9]{3})?|5[1-5][0-9]{14}|3[47][0-9]{13}|3(?:0[0-5]|[68][0-9])[0-9]{11}|6(?:011|5[0-9]{2})[0-9]{12})\b/g,
  openaiKey: /\bsk-[a-zA-Z0-9]{48,64}\b/g,
  openrouterKey: /\bsk-or-v1-[a-f0-9]{64}\b/g,
  anthropicKey: /\bsk-ant-[a-zA-Z0-9\-_]{95,105}\b/g,
  googleKey: /\bAIza[a-zA-Z0-9\-_]{35}\b/g,
  awsKey: /\bAKIA[a-zA-Z0-9]{16}\b/g,
  ipAddress: /\b(?:(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.){3}(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\b/g,
  address: /\b\d+\s+[A-Za-z\s]+(?:Street|St|Avenue|Ave|Road|Rd|Boulevard|Blvd|Lane|Ln|Drive|Dr|Court|Ct|Place|Pl)\b/gi,
  zipCode: /\b\d{5}(?:-\d{4})?\b/g,
  dateOfBirth: /\b(?:0[1-9]|1[0-2])\/(?:0[1-9]|[12]\d|3[01])\/(?:19|20)\d{2}\b/g
};

// Redact sensitive information from text
function redactSensitiveData(text) {
  let redactedText = text;
  const redactedItems = [];

  Object.entries(REDACTION_PATTERNS).forEach(([type, pattern]) => {
    const matches = redactedText.match(pattern);
    if (matches) {
      matches.forEach(match => {
        redactedItems.push({
          type: type,
          original: match,
          replacement: `[${type.toUpperCase()}_REDACTED]`
        });
      });
      redactedText = redactedText.replace(pattern, `[${type.toUpperCase()}_REDACTED]`);
    }
  });

  return {
    redactedText,
    redactedItems,
    hasRedactions: redactedItems.length > 0
  };
}

// Simple prompt analysis function
function analyzePrompt(prompt, platform = 'unknown') {
  const risks = [];
  const detectedTypes = [];
  let riskLevel = RISK_LEVELS.LOW;
  
  // Check all redaction patterns
  Object.entries(REDACTION_PATTERNS).forEach(([type, pattern]) => {
    if (pattern.test(prompt)) {
      risks.push(`${type} detected`);
      detectedTypes.push(type);
      
      // Set risk level based on type
      if (['openaiKey', 'anthropicKey', 'googleKey', 'awsKey', 'ssn', 'creditCard'].includes(type)) {
        riskLevel = RISK_LEVELS.CRITICAL;
      } else if (['email', 'phone', 'address'].includes(type)) {
        riskLevel = RISK_LEVELS.MEDIUM;
      }
    }
  });
  
  return {
    flagged: risks.length > 0,
    risks,
    riskLevel,
    detectedTypes,
    analysis_metadata: {
      detection_method: 'real_time_analysis',
      detected_pii: detectedTypes,
      platform_detected: platform,
      auto_flagged: risks.length > 0,
      extension_version: '2.0.0',
      source: 'chrome_extension'
    }
  };
}

// Queue for retrying failed API calls
const retryQueue = [];
let retryInterval = null;

// Initialize extension
chrome.runtime.onInstalled.addListener((details) => {
  console.log('Complyze extension installed:', details);
  
  // Set default badge (with error handling)
  try {
    if (chrome.action && chrome.action.setBadgeBackgroundColor) {
      chrome.action.setBadgeBackgroundColor({ color: '#4CAF50' });
    }
  } catch (error) {
    console.log('Action API not available:', error);
  }
  
  // Check authentication status
  checkAuthenticationStatus();
});

// Handle messages from content scripts
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.type === 'ANALYZE_PROMPT') {
    handlePromptAnalysis(request, sender)
      .then(sendResponse)
      .catch(error => sendResponse({ success: false, error: error.message }));
    return true; // Keep channel open for async response
  }
  
  if (request.type === 'OPTIMIZE_PROMPT') {
    handlePromptOptimization(request)
      .then(sendResponse)
      .catch(error => sendResponse({ success: false, error: error.message }));
    return true; // Keep channel open for async response
  }
  
  if (request.type === 'CHECK_AUTH') {
    checkAuth()
      .then(sendResponse)
      .catch(error => sendResponse({ authenticated: false, error: error.message }));
    return true;
  }
  
  if (request.type === 'GET_PLATFORM') {
    const platform = detectPlatform(sender.tab?.url);
    sendResponse({ platform });
    return false;
  }
});

// Analyze prompt and send to API
async function handlePromptAnalysis(request, sender) {
  const { prompt, platform: requestPlatform } = request;
  
  // Detect platform from sender URL if not provided
  const platform = requestPlatform || detectPlatform(sender.tab?.url) || 'Unknown';
  
  // Analyze prompt for sensitive data
  const analysis = analyzePrompt(prompt, platform);
  
  // Get user ID
  const userId = await getUserId();
  
  if (!userId) {
    return { 
      success: false, 
      error: 'User not authenticated',
      requiresAuth: true 
    };
  }
  
  // Only send to API if prompt is flagged
  if (analysis.flagged) {
    // Prepare payload for API
    const promptEventPayload = {
      user_id: userId,
      platform: platform.toLowerCase(),
      prompt: prompt,
      flagged: analysis.flagged,
      risk_level: analysis.riskLevel,
      risks: analysis.risks,
      timestamp: Date.now(),
      url: sender.tab?.url || '',
      status: PROMPT_STATUS.FLAGGED,
      analysis_metadata: {
        ...analysis.analysis_metadata,
        model_used: detectAIModel(sender.tab?.url) || 'unknown',
        tab_id: sender.tab?.id,
        window_id: sender.tab?.windowId
      }
    };
    
    // Send to production API
    const apiResult = await sendPromptEvent(promptEventPayload);
    
    if (!apiResult.success && apiResult.shouldRetry) {
      // Add to retry queue
      retryQueue.push(promptEventPayload);
      startRetryInterval();
    }
    
    // Update badge to show flagged status
    updateBadge(analysis.riskLevel);
    
    return {
      success: true,
      analysis,
      apiResult,
      shouldBlock: analysis.riskLevel === 'critical' || analysis.riskLevel === 'high'
    };
  }
  
  return {
    success: true,
    analysis,
    shouldBlock: false
  };
}

// Handle prompt optimization requests
async function handlePromptOptimization(request) {
  const { prompt } = request;
  
  try {
    // First, redact sensitive information
    const redactionResult = redactSensitiveData(prompt);
    
    if (!redactionResult.hasRedactions) {
      // If no sensitive data, just return original
      return {
        success: true,
        optimizedPrompt: prompt,
        redactedItems: [],
        wasOptimized: false
      };
    }

    // Call OpenRouter API for optimization
    const response = await fetch(`${OPENROUTER_CONFIG.BASE_URL}/chat/completions`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${OPENROUTER_CONFIG.API_KEY}`,
        'Content-Type': 'application/json',
        'HTTP-Referer': 'https://complyze.co',
        'X-Title': 'Complyze Prompt Optimizer'
      },
      body: JSON.stringify({
        model: OPENROUTER_CONFIG.MODEL,
        messages: [
          {
            role: 'system',
            content: OPTIMIZATION_SYSTEM_PROMPT
          },
          {
            role: 'user',
            content: `Please optimize this prompt while maintaining its intent:\n\n${redactionResult.redactedText}`
          }
        ],
        temperature: 0.3,
        max_tokens: 1000
      })
    });

    if (!response.ok) {
      throw new Error(`OpenRouter API error: ${response.statusText}`);
    }

    const data = await response.json();
    let optimizedPrompt = data.choices[0]?.message?.content?.trim();

    if (!optimizedPrompt) {
      throw new Error('No optimized prompt returned from API');
    }

    // Remove any remaining bracketed placeholders gracefully
    optimizedPrompt = optimizedPrompt.replace(/\[[A-Z_]+\]/g, match => {
      // Replace with generic placeholder without brackets, e.g. "email redacted"
      return match.slice(1, -1).toLowerCase().replace(/_/g, ' ');
    });

    return {
      success: true,
      optimizedPrompt,
      redactedItems: redactionResult.redactedItems,
      wasOptimized: true,
      originalPrompt: prompt,
      redactedPrompt: redactionResult.redactedText
    };

  } catch (error) {
    console.error('Prompt optimization failed:', error);
    
    // Fallback: return redacted version without AI optimization
    const redactionResult = redactSensitiveData(prompt);
    
    return {
      success: false,
      error: error.message,
      optimizedPrompt: redactionResult.redactedText,
      redactedItems: redactionResult.redactedItems,
      wasOptimized: false,
      fallbackUsed: true
    };
  }
}

// Detect platform from URL
function detectPlatform(url) {
  if (!url) return null;
  
  try {
    const urlObj = new URL(url);
    const hostname = urlObj.hostname;
    
    for (const [domain, platform] of Object.entries(SUPPORTED_PLATFORMS)) {
      if (hostname.includes(domain)) {
        return platform;
      }
    }
  } catch (error) {
    console.error('Error parsing URL:', error);
  }
  
  return null;
}

// Detect AI model being used
function detectAIModel(url) {
  if (!url) return null;
  
  // ChatGPT models
  if (url.includes('chat.openai.com') || url.includes('chatgpt.com')) {
    // Could be enhanced to detect specific model from page content
    return 'gpt-4';
  }
  
  // Claude models
  if (url.includes('claude.ai')) {
    return 'claude-3';
  }
  
  // Gemini
  if (url.includes('gemini.google.com')) {
    return 'gemini-pro';
  }
  
  return null;
}

// Update extension badge based on risk level
function updateBadge(riskLevel) {
  try {
    if (!chrome.action) return;
    
    const badgeConfig = {
      low: { text: '!', color: '#FFC107' },
      medium: { text: '!!', color: '#FF9800' },
      high: { text: '!!!', color: '#F44336' },
      critical: { text: '!!!!', color: '#B71C1C' }
    };
    
    const config = badgeConfig[riskLevel] || { text: '', color: '#4CAF50' };
    
    if (chrome.action.setBadgeText) {
      chrome.action.setBadgeText({ text: config.text });
    }
    if (chrome.action.setBadgeBackgroundColor) {
      chrome.action.setBadgeBackgroundColor({ color: config.color });
    }
    
    // Clear badge after 5 seconds
    setTimeout(() => {
      if (chrome.action && chrome.action.setBadgeText) {
        chrome.action.setBadgeText({ text: '' });
      }
    }, 5000);
  } catch (error) {
    console.log('Badge update failed:', error);
  }
}

// Check authentication status on startup
async function checkAuthenticationStatus() {
  const authStatus = await checkAuth();
  
  try {
    if (chrome.action) {
      if (!authStatus.authenticated) {
        // Show auth required badge
        if (chrome.action.setBadgeText) {
          chrome.action.setBadgeText({ text: 'AUTH' });
        }
        if (chrome.action.setBadgeBackgroundColor) {
          chrome.action.setBadgeBackgroundColor({ color: '#FF5722' });
        }
      } else {
        if (chrome.action.setBadgeText) {
          chrome.action.setBadgeText({ text: '' });
        }
      }
    }
  } catch (error) {
    console.log('Auth status badge update failed:', error);
  }
}

// Start retry interval for failed API calls
function startRetryInterval() {
  if (retryInterval) return;
  
  retryInterval = setInterval(async () => {
    if (retryQueue.length === 0) {
      clearInterval(retryInterval);
      retryInterval = null;
      return;
    }
    
    // Try to send queued events
    const event = retryQueue.shift();
    const result = await sendPromptEvent(event);
    
    if (!result.success && result.shouldRetry) {
      // Put it back in queue
      retryQueue.push(event);
    }
  }, 30000); // Retry every 30 seconds
}

// Handle extension icon click (with error handling)
try {
  if (chrome.action && chrome.action.onClicked) {
    chrome.action.onClicked.addListener(() => {
      // Open popup (handled by manifest action)
    });
  }
} catch (error) {
  console.log('Action click listener not available:', error);
}

// Listen for tab updates to detect navigation (with error handling)
try {
  if (chrome.tabs && chrome.tabs.onUpdated) {
    chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
      if (changeInfo.status === 'complete' && detectPlatform(tab.url)) {
        // Inject content script if needed (backup for manifest injection)
        if (chrome.scripting && chrome.scripting.executeScript) {
          chrome.scripting.executeScript({
            target: { tabId: tabId },
            files: ['src/content/content.js']
          }).catch(error => {
            // Script might already be injected
            console.log('Script injection skipped:', error.message);
          });
        }
      }
    });
  }
} catch (error) {
  console.log('Tabs API not available:', error);
}

// Handle alarms for periodic tasks (with error handling)
try {
  if (chrome.alarms && chrome.alarms.create) {
    chrome.alarms.create('auth-check', { periodInMinutes: 60 });
    
    chrome.alarms.onAlarm.addListener((alarm) => {
      if (alarm.name === 'auth-check') {
        checkAuthenticationStatus();
      }
    });
  }
} catch (error) {
  console.log('Alarms API not available:', error);
}