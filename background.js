/**
 * Complyze AI Guard - Background Service Worker
 * Handles UUID authentication, storage management, and inter-script communication
 */

// Configuration
const CONFIG = {
  API_BASE: 'https://complyze.co/api',
  INGEST_ENDPOINT: 'https://complyze.co/api/ingest',
  OPENROUTER_API: 'https://openrouter.ai/api/v1/chat/completions',
  OPENROUTER_MODEL: 'google/gemini-2.5-flash-preview-05-20',
  UUID_REGEX: /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
};

// UUID Authentication System
class AuthManager {
  static async extractUUIDFromDashboard() {
    try {
      // Get all tabs with complyze.co/dashboard
      const tabs = await chrome.tabs.query({
        url: "*://complyze.co/dashboard*"
      });
      
      for (const tab of tabs) {
        try {
          // Extract UUID from URL path
          const url = new URL(tab.url);
          const pathParts = url.pathname.split('/');
          
          for (const part of pathParts) {
            if (CONFIG.UUID_REGEX.test(part)) {
              console.log('UUID extracted from dashboard URL:', part);
              return part;
            }
          }
          
          // Try to extract from URL fragments or query params
          const hash = url.hash.substring(1);
          const searchParams = new URLSearchParams(url.search);
          
          if (CONFIG.UUID_REGEX.test(hash)) {
            return hash;
          }
          
          for (const [key, value] of searchParams) {
            if (CONFIG.UUID_REGEX.test(value)) {
              return value;
            }
          }
          
          // Execute content script to extract from page content
          const results = await chrome.scripting.executeScript({
            target: { tabId: tab.id },
            func: () => {
              // Look for UUID in page content, data attributes, etc.
              const uuidRegex = /[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}/i;
              
              // Check meta tags
              const metaTags = document.querySelectorAll('meta[name*="user"], meta[data-user]');
              for (const meta of metaTags) {
                const content = meta.getAttribute('content') || meta.getAttribute('data-user');
                if (content && uuidRegex.test(content)) {
                  return content.match(uuidRegex)[0];
                }
              }
              
              // Check data attributes
              const elements = document.querySelectorAll('[data-user-id], [data-uuid], [data-user]');
              for (const element of elements) {
                const attrs = ['data-user-id', 'data-uuid', 'data-user'];
                for (const attr of attrs) {
                  const value = element.getAttribute(attr);
                  if (value && uuidRegex.test(value)) {
                    return value.match(uuidRegex)[0];
                  }
                }
              }
              
              // Check localStorage and sessionStorage
              try {
                const storageKeys = ['userId', 'user_id', 'uuid', 'userUuid', 'auth_user'];
                for (const key of storageKeys) {
                  const value = localStorage.getItem(key) || sessionStorage.getItem(key);
                  if (value && uuidRegex.test(value)) {
                    return value.match(uuidRegex)[0];
                  }
                }
              } catch (e) {
                console.warn('Cannot access storage:', e);
              }
              
              return null;
            }
          });
          
          if (results[0]?.result) {
            console.log('UUID extracted from page content:', results[0].result);
            return results[0].result;
          }
          
        } catch (error) {
          console.warn('Error extracting UUID from tab:', tab.id, error);
        }
      }
      
      return null;
    } catch (error) {
      console.error('Error in extractUUIDFromDashboard:', error);
      return null;
    }
  }
  
  static async getCurrentUserUUID() {
    try {
      // Try to get from storage first
      const result = await chrome.storage.local.get(['userUUID', 'userUUIDTimestamp']);
      
      // Check if we have a valid cached UUID (valid for 1 hour)
      if (result.userUUID && result.userUUIDTimestamp) {
        const hourAgo = Date.now() - (60 * 60 * 1000);
        if (result.userUUIDTimestamp > hourAgo && CONFIG.UUID_REGEX.test(result.userUUID)) {
          console.log('Using cached UUID:', result.userUUID);
          return result.userUUID;
        }
      }
      
      // Extract fresh UUID from dashboard
      const extractedUUID = await this.extractUUIDFromDashboard();
      
      if (extractedUUID) {
        // Cache the UUID with timestamp
        await chrome.storage.local.set({
          userUUID: extractedUUID,
          userUUIDTimestamp: Date.now()
        });
        return extractedUUID;
      }
      
      // Fallback: return cached UUID even if expired
      if (result.userUUID && CONFIG.UUID_REGEX.test(result.userUUID)) {
        console.warn('Using expired cached UUID as fallback:', result.userUUID);
        return result.userUUID;
      }
      
      return null;
    } catch (error) {
      console.error('Error getting user UUID:', error);
      return null;
    }
  }
  
  static async validateAndRefreshAuth() {
    const uuid = await this.getCurrentUserUUID();
    if (!uuid) {
      console.warn('No valid UUID found for authentication');
      return false;
    }
    
    try {
      // Test API connectivity with the UUID
      const response = await fetch(`${CONFIG.API_BASE}/auth/validate`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${uuid}`
        },
        body: JSON.stringify({ user_id: uuid })
      });
      
      if (response.ok) {
        console.log('UUID authentication validated');
        return true;
      } else {
        console.warn('UUID authentication failed, response status:', response.status);
        return false;
      }
    } catch (error) {
      console.warn('UUID validation request failed:', error);
      // Don't fail completely on network errors
      return true;
    }
  }
}

// Supabase API Manager
class SupabaseManager {
  static async ingestPromptEvent(eventData) {
    try {
      // Enhanced authentication check with multiple fallbacks
      let userUUID = null;
      let userEmail = null;
      
      // First try to get UUID from sidebar authentication (most reliable)
      const storage = await chrome.storage.local.get(['complyzeUserUUID', 'complyzeUserEmail', 'complyzeAuthToken']);
      
      if (storage.complyzeUserUUID && storage.complyzeUserEmail) {
        userUUID = storage.complyzeUserUUID;
        userEmail = storage.complyzeUserEmail;
        console.log('🆔 Using authenticated user from sidebar storage:', {
          email: userEmail,
          uuid: userUUID.substring(0, 8) + '...'
        });
      } else {
        // Fallback to dashboard UUID extraction if available
        userUUID = await AuthManager.getCurrentUserUUID();
        
        if (!userUUID) {
          console.error('❌ No authenticated user found. Please login through the Complyze sidebar.');
          console.error('💡 Visit https://supabase.com/dashboard/project/likskioavtpnskrfxbqa/auth/users to check user table');
          throw new Error('User authentication required. Please login through the sidebar.');
        }
      }
      
      // Prepare the payload for Supabase
      // Using the standard prompt_events table structure
      const payload = {
        user_id: userUUID,
        model: eventData.model || 'unknown',
        usd_cost: eventData.usd_cost || 0,
        prompt_tokens: eventData.prompt_tokens || 0,
        completion_tokens: eventData.completion_tokens || 0,
        integrity_score: eventData.integrity_score || 100,
        risk_type: eventData.risk_type || 'low',
        risk_level: eventData.risk_level || 'low',
        platform: eventData.platform || 'unknown',
        metadata: {
          ...eventData.metadata,
          user_email: userEmail, // Include email in metadata for reference
          authenticated_via: storage.complyzeUserUUID ? 'sidebar' : 'dashboard',
          extension_version: '1.0.0',
          sync_timestamp: new Date().toISOString()
        },
        created_at: new Date().toISOString()
      };
      
      console.log('📤 Sending to Supabase prompt_events table:', {
        ...payload,
        user_id: payload.user_id.substring(0, 8) + '...' // Hide full UUID in logs
      });
      
      // Updated endpoint to use proper Supabase REST API
      const supabaseUrl = 'https://likskioavtpnskrfxbqa.supabase.co';
      // Use service role key for write operations to prompt_events table
      const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imxpa3NraW9hdnRwbnNrcmZ4YnFhIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc0NzMyMjY5MiwiZXhwIjoyMDYyODk4NjkyfQ.O_qkgrEHKI5QOG9UidDtieEb-kEzu-3su9Ge2XdXPSw';
      
      const response = await fetch(`${supabaseUrl}/rest/v1/prompt_events`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'apikey': supabaseKey,
          'Authorization': `Bearer ${supabaseKey}`,
          'Prefer': 'return=minimal'
        },
        body: JSON.stringify(payload)
      });
      
      if (!response.ok) {
        const errorText = await response.text();
        console.error('❌ Supabase API error:', {
          status: response.status,
          statusText: response.statusText,
          error: errorText
        });
        
        // Try to handle specific Supabase errors
        if (response.status === 401) {
          throw new Error('Supabase authentication failed - check API key');
        } else if (response.status === 400) {
          throw new Error('Invalid data format for Supabase - check table schema');
        } else if (response.status === 409) {
          throw new Error('Data conflict in Supabase - possible duplicate entry');
        } else {
          throw new Error(`Supabase API error: ${response.status} - ${errorText}`);
        }
      }
      
      console.log('✅ Successfully synced to Supabase prompt_events table');
      
      // Also try to ensure user exists in auth.users table
      await this.ensureUserExists(userUUID, userEmail);
      
      return { success: true, table: 'prompt_events', user_id: userUUID };
      
    } catch (error) {
      console.error('❌ Error syncing to Supabase:', error);
      console.error('💡 Check Supabase project: https://supabase.com/dashboard/project/likskioavtpnskrfxbqa');
      throw error;
    }
  }

  // Ensure user exists in Supabase auth.users table
  static async ensureUserExists(userUUID, userEmail) {
    try {
      if (!userEmail) {
        console.log('⚠️ No email provided, skipping user creation');
        return;
      }

      console.log('🔍 Ensuring user exists in Supabase auth.users table...');
      
      const supabaseUrl = 'https://likskioavtpnskrfxbqa.supabase.co';
      // Use service role key for users table operations
      const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imxpa3NraW9hdnRwbnNrcmZ4YnFhIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc0NzMyMjY5MiwiZXhwIjoyMDYyODk4NjkyfQ.O_qkgrEHKI5QOG9UidDtieEb-kEzu-3su9Ge2XdXPSw';
      
      // Try to create/update user in a custom users table (since auth.users is protected)
      const userPayload = {
        id: userUUID,
        email: userEmail,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        extension_version: '1.0.0',
        last_sync: new Date().toISOString()
      };
      
      const response = await fetch(`${supabaseUrl}/rest/v1/users`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'apikey': supabaseKey,
          'Authorization': `Bearer ${supabaseKey}`,
          'Prefer': 'return=minimal'
        },
        body: JSON.stringify(userPayload)
      });
      
      if (response.ok) {
        console.log('✅ User record created/updated in users table');
      } else if (response.status === 409) {
        console.log('✅ User already exists in users table');
      } else {
        console.warn('⚠️ Could not create user record:', response.status, response.statusText);
      }
      
    } catch (error) {
      console.warn('⚠️ Error ensuring user exists:', error);
      // Don't throw here as this is optional
    }
  }
}

// Message handling for communication with content scripts
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  console.log('Background received message:', message);
  
  switch (message.type) {
    case 'GET_USER_UUID':
      AuthManager.getCurrentUserUUID()
        .then(uuid => sendResponse({ success: true, uuid }))
        .catch(error => sendResponse({ success: false, error: error.message }));
      return true; // Keep message channel open for async response
      
    case 'VALIDATE_AUTH':
      AuthManager.validateAndRefreshAuth()
        .then(isValid => sendResponse({ success: true, isValid }))
        .catch(error => sendResponse({ success: false, error: error.message }));
      return true;
      
    case 'SYNC_PROMPT_EVENT':
      SupabaseManager.ingestPromptEvent(message.data)
        .then(result => sendResponse({ success: true, result }))
        .catch(error => sendResponse({ success: false, error: error.message }));
      return true;
      
    case 'OPTIMIZE_PROMPT':
      optimizePromptWithOpenRouter(message.data)
        .then(result => sendResponse({ success: true, result }))
        .catch(error => sendResponse({ success: false, error: error.message }));
      return true;
      
    case 'LOG_OPTIMIZATION_EVENT':
      SupabaseManager.ingestPromptEvent({
        ...message.data,
        event_type: 'prompt_optimization'
      })
        .then(result => sendResponse({ success: true, result }))
        .catch(error => sendResponse({ success: false, error: error.message }));
      return true;
      
    case 'OPENROUTER_CHAT':
      openRouterChat(message.requestBody)
        .then(result => sendResponse({ success: true, result }))
        .catch(error => sendResponse({ success: false, error: error.message }));
      return true;
      
    default:
      console.warn('Unknown message type:', message.type);
      sendResponse({ success: false, error: 'Unknown message type' });
  }
});

// OpenRouter API integration for prompt optimization
async function optimizePromptWithOpenRouter(promptData) {
  try {
    // Get OpenRouter API key from storage (optional feature)
    const storage = await chrome.storage.local.get(['openrouterApiKey']);
    if (!storage.openrouterApiKey) {
      throw new Error('OpenRouter API key not configured');
    }
    
    const systemPrompt = `You are a prompt security optimizer. Your task is to:
1. Remove or redact sensitive information (PII, API keys, credentials)
2. Maintain the original intent and functionality
3. Suggest security best practices
4. Return only the optimized prompt without explanation.`;
    
    const response = await fetch(CONFIG.OPENROUTER_API, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${storage.openrouterApiKey}`,
        'Content-Type': 'application/json',
        'HTTP-Referer': 'https://complyze.co',
        'X-Title': 'Complyze AI Guard'
      },
      body: JSON.stringify({
        model: CONFIG.OPENROUTER_MODEL,
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: promptData.originalPrompt }
        ],
        max_tokens: 2000,
        temperature: 0.3
      })
    });
    
    if (!response.ok) {
      throw new Error(`OpenRouter API error: ${response.status}`);
    }
    
    const result = await response.json();
    const optimizedPrompt = result.choices[0]?.message?.content;
    
    if (!optimizedPrompt) {
      throw new Error('No optimized prompt returned from API');
    }
    
    return {
      originalPrompt: promptData.originalPrompt,
      optimizedPrompt: optimizedPrompt.trim(),
      tokensUsed: result.usage?.total_tokens || 0,
      cost: calculateOpenRouterCost(result.usage)
    };
    
  } catch (error) {
    console.error('OpenRouter optimization failed:', error);
    throw error;
  }
}

function calculateOpenRouterCost(usage) {
  if (!usage) return 0;
  
  // Gemini 2.5 Flash pricing (example rates)
  const inputCostPer1k = 0.0005;
  const outputCostPer1k = 0.0015;
  
  const inputCost = (usage.prompt_tokens || 0) * inputCostPer1k / 1000;
  const outputCost = (usage.completion_tokens || 0) * outputCostPer1k / 1000;
  
  return inputCost + outputCost;
}

// Helper: generic OpenRouter chat/completions fetch (bypasses CORS)
async function openRouterChat(requestBody) {
  try {
    const storage = await chrome.storage.local.get(['openRouterApiKey']);
    let apiKey = storage.openRouterApiKey || storage.openrouterApiKey || CONFIG?.OPENROUTER_API_KEY || (typeof OPENROUTER_CONFIG !== 'undefined' ? OPENROUTER_CONFIG.key : null);
    if (!apiKey) {
      // Fallback hard-coded dev key (content script uses same)
      apiKey = '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';
      console.warn('⚠️ Using fallback OpenRouter API key in background');
    }
    console.log('🛰️ BG OpenRouterChat', { model: requestBody?.model, apiKeyPrefix: apiKey.substring(0,8)+'...', promptLen: requestBody?.messages?.[1]?.content?.length });

    const response = await fetch(`${CONFIG.OPENROUTER_API}`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
        'HTTP-Referer': 'https://complyze.co',
        'X-Title': 'Complyze AI Guard (BG)'
      },
      body: JSON.stringify(requestBody)
    });

    if (!response.ok) {
      const errTxt = await response.text();
      throw new Error(`OpenRouter error ${response.status}: ${errTxt}`);
    }

    return await response.json();
  } catch (err) {
    console.error('OpenRouter chat error (BG):', err);
    throw err;
  }
}

// Extension lifecycle events
chrome.runtime.onInstalled.addListener(async (details) => {
  console.log('Complyze AI Guard installed/updated:', details);
  
  // Initialize storage with default values
  await chrome.storage.local.set({
    extensionEnabled: true,
    piiDetectionEnabled: true,
    modalWarningsEnabled: true,
    dashboardSyncEnabled: true,
    installDate: Date.now()
  });
  
  // Try to authenticate user immediately
  try {
    await AuthManager.validateAndRefreshAuth();
  } catch (error) {
    console.warn('Initial authentication failed:', error);
  }
});

chrome.runtime.onStartup.addListener(async () => {
  console.log('Complyze AI Guard startup');
  
  // Refresh authentication on browser startup
  try {
    await AuthManager.validateAndRefreshAuth();
  } catch (error) {
    console.warn('Startup authentication failed:', error);
  }
});

// Tab event listeners for dashboard detection
chrome.tabs.onUpdated.addListener(async (tabId, changeInfo, tab) => {
  if (changeInfo.status === 'complete' && tab.url?.includes('complyze.co/dashboard')) {
    console.log('Dashboard tab detected, refreshing authentication');
    try {
      await AuthManager.validateAndRefreshAuth();
    } catch (error) {
      console.warn('Dashboard authentication refresh failed:', error);
    }
  }
});

console.log('Complyze AI Guard background script loaded'); 