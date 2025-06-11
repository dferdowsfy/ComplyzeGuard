import { API_ENDPOINTS, STORAGE_KEYS } from './constants.js';

// Get stored authentication token
export async function getAuthToken() {
  return new Promise((resolve) => {
    chrome.storage.local.get([STORAGE_KEYS.ACCESS_TOKEN], (result) => {
      resolve(result[STORAGE_KEYS.ACCESS_TOKEN] || null);
    });
  });
}

// Store authentication data
export async function storeAuthData(accessToken, userId, email) {
  return new Promise((resolve) => {
    chrome.storage.local.set({
      [STORAGE_KEYS.ACCESS_TOKEN]: accessToken,
      [STORAGE_KEYS.USER_ID]: userId,
      [STORAGE_KEYS.USER_EMAIL]: email
    }, resolve);
  });
}

// Clear authentication data
export async function clearAuthData() {
  return new Promise((resolve) => {
    chrome.storage.local.remove([
      STORAGE_KEYS.ACCESS_TOKEN,
      STORAGE_KEYS.USER_ID,
      STORAGE_KEYS.USER_EMAIL
    ], resolve);
  });
}

// Login user
export async function login(email, password) {
  try {
    const response = await fetch(API_ENDPOINTS.AUTH_LOGIN, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ email, password })
    });

    if (!response.ok) {
      throw new Error(`Login failed: ${response.statusText}`);
    }

    const data = await response.json();
    
    if (data.access_token && data.user_id) {
      await storeAuthData(data.access_token, data.user_id, email);
      return { success: true, data };
    } else {
      throw new Error('Invalid response from server');
    }
  } catch (error) {
    console.error('Login error:', error);
    return { success: false, error: error.message };
  }
}

// Signup user
export async function signup(email, password) {
  try {
    const response = await fetch(API_ENDPOINTS.AUTH_SIGNUP, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ email, password })
    });

    if (!response.ok) {
      throw new Error(`Signup failed: ${response.statusText}`);
    }

    const data = await response.json();
    
    if (data.access_token && data.user_id) {
      await storeAuthData(data.access_token, data.user_id, email);
      return { success: true, data };
    } else {
      throw new Error('Invalid response from server');
    }
  } catch (error) {
    console.error('Signup error:', error);
    return { success: false, error: error.message };
  }
}

// Check authentication status
export async function checkAuth() {
  try {
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
      // Token might be expired, clear it
      await clearAuthData();
      return { authenticated: false };
    }
  } catch (error) {
    console.error('Auth check error:', error);
    return { authenticated: false };
  }
}

// Send prompt event to production API
export async function sendPromptEvent(promptData) {
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
    
    // NEVER fallback to localhost in production
    // Queue for retry instead
    return { 
      success: false, 
      error: error.message,
      shouldRetry: true 
    };
  }
}

// Batch send multiple prompt events
export async function sendPromptEventBatch(events) {
  try {
    const token = await getAuthToken();
    
    if (!token) {
      throw new Error('User not authenticated');
    }

    const response = await fetch(`${API_ENDPOINTS.PROMPT_INGEST}/batch`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ events })
    });

    if (!response.ok) {
      throw new Error(`Failed to send batch: ${response.statusText}`);
    }

    return { success: true, data: await response.json() };
  } catch (error) {
    console.error('Failed to send batch to production API:', error);
    return { 
      success: false, 
      error: error.message,
      shouldRetry: true 
    };
  }
}

// Get user ID from storage
export async function getUserId() {
  return new Promise((resolve) => {
    chrome.storage.local.get([STORAGE_KEYS.USER_ID], (result) => {
      resolve(result[STORAGE_KEYS.USER_ID] || null);
    });
  });
} 