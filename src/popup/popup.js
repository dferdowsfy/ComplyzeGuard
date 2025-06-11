// API functions and constants need to be loaded via script tags in popup.html
// or defined inline due to Chrome extension restrictions on ES6 modules

// Storage Keys
const STORAGE_KEYS = {
  ACCESS_TOKEN: 'complyze_access_token',
  USER_ID: 'complyze_user_id',
  USER_EMAIL: 'complyze_user_email',
  SETTINGS: 'complyze_settings'
};

// API Endpoints
const API_BASE_URL = 'https://complyze.co/api';
const API_ENDPOINTS = {
  AUTH_LOGIN: `${API_BASE_URL}/auth/login`,
  AUTH_SIGNUP: `${API_BASE_URL}/auth/signup`,
  AUTH_CHECK: `${API_BASE_URL}/auth/check`
};

// API Functions
async function getAuthToken() {
  return new Promise((resolve) => {
    chrome.storage.local.get([STORAGE_KEYS.ACCESS_TOKEN], (result) => {
      resolve(result[STORAGE_KEYS.ACCESS_TOKEN] || null);
    });
  });
}

async function storeAuthData(accessToken, userId, email) {
  return new Promise((resolve) => {
    chrome.storage.local.set({
      [STORAGE_KEYS.ACCESS_TOKEN]: accessToken,
      [STORAGE_KEYS.USER_ID]: userId,
      [STORAGE_KEYS.USER_EMAIL]: email
    }, resolve);
  });
}

async function clearAuthData() {
  return new Promise((resolve) => {
    chrome.storage.local.remove([
      STORAGE_KEYS.ACCESS_TOKEN,
      STORAGE_KEYS.USER_ID,
      STORAGE_KEYS.USER_EMAIL,
      'demo_user'
    ], resolve);
  });
}

async function login(email, password) {
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
    
    // For demo purposes, allow demo login
    if (email && password) {
      await setDemoUser(email);
      return { success: true, demo: true };
    }
    
    return { success: false, error: 'Demo mode: Enter any email and password to continue' };
  }
}

async function signup(email, password) {
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
    
    // For demo purposes, allow demo signup
    if (email && password) {
      await setDemoUser(email);
      return { success: true, demo: true };
    }
    
    return { success: false, error: 'Demo mode: Enter any email and password to continue' };
  }
}

async function checkAuth() {
  try {
    // First check if we have demo user
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
      await clearAuthData();
      return { authenticated: false };
    }
  } catch (error) {
    console.error('Auth check error:', error);
    // For demo purposes, if API is not available, allow demo mode
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

async function setDemoUser(email) {
  return new Promise((resolve) => {
    chrome.storage.local.set({ 
      demo_user: email,
      [STORAGE_KEYS.USER_EMAIL]: email,
      [STORAGE_KEYS.ACCESS_TOKEN]: 'demo_token',
      [STORAGE_KEYS.USER_ID]: 'demo_user_id'
    }, resolve);
  });
}

// DOM Elements
const views = {
  login: document.getElementById('login-view'),
  signup: document.getElementById('signup-view'),
  dashboard: document.getElementById('dashboard-view')
};

const forms = {
  login: document.getElementById('login-form'),
  signup: document.getElementById('signup-form')
};

const elements = {
  showSignup: document.getElementById('show-signup'),
  showLogin: document.getElementById('show-login'),
  logoutLink: document.getElementById('logout-link'),
  userEmail: document.querySelector('.user-email'),
  demoBadge: document.querySelector('.demo-badge'),
  promptsAnalyzed: document.getElementById('prompts-analyzed'),
  risksDetected: document.getElementById('risks-detected'),
  loadingOverlay: document.getElementById('loading-overlay'),
  errorMessage: document.getElementById('error-message'),
  // Settings toggles
  realtimeMonitoring: document.getElementById('realtime-monitoring'),
  autoBlock: document.getElementById('auto-block'),
  showNotifications: document.getElementById('show-notifications')
};

// Initialize popup
document.addEventListener('DOMContentLoaded', async () => {
  await checkAuthenticationStatus();
  attachEventListeners();
  loadSettings();
  loadStats();
});

// Check authentication status
async function checkAuthenticationStatus() {
  showLoading(true);
  
  try {
    const authStatus = await checkAuth();
    
    if (authStatus.authenticated) {
      showView('dashboard');
      await loadUserData();
      
      // Show demo badge if in demo mode
      if (authStatus.demo) {
        elements.demoBadge.classList.remove('hidden');
      } else {
        elements.demoBadge.classList.add('hidden');
      }
    } else {
      showView('login');
      elements.demoBadge.classList.add('hidden');
    }
  } catch (error) {
    console.error('Auth check failed:', error);
    showView('login');
    elements.demoBadge.classList.add('hidden');
  } finally {
    showLoading(false);
  }
}

// Attach event listeners
function attachEventListeners() {
  // Navigation
  elements.showSignup.addEventListener('click', (e) => {
    e.preventDefault();
    showView('signup');
  });
  
  elements.showLogin.addEventListener('click', (e) => {
    e.preventDefault();
    showView('login');
  });
  
  elements.logoutLink.addEventListener('click', async (e) => {
    e.preventDefault();
    await handleLogout();
  });
  
  // Forms
  forms.login.addEventListener('submit', handleLogin);
  forms.signup.addEventListener('submit', handleSignup);
  
  // Settings
  elements.realtimeMonitoring.addEventListener('change', saveSettings);
  elements.autoBlock.addEventListener('change', saveSettings);
  elements.showNotifications.addEventListener('change', saveSettings);
}

// Handle login
async function handleLogin(e) {
  e.preventDefault();
  showError('');
  showLoading(true);
  
  const email = forms.login.email.value;
  const password = forms.login.password.value;
  
  try {
    const result = await login(email, password);
    
    if (result.success) {
      showView('dashboard');
      await loadUserData();
      
      // Show demo badge if in demo mode
      if (result.demo) {
        elements.demoBadge.classList.remove('hidden');
      } else {
        elements.demoBadge.classList.add('hidden');
      }
    } else {
      showError(result.error || 'Login failed. Please try again.');
    }
  } catch (error) {
    showError('An unexpected error occurred. Please try again.');
  } finally {
    showLoading(false);
  }
}

// Handle signup
async function handleSignup(e) {
  e.preventDefault();
  showError('');
  showLoading(true);
  
  const email = forms.signup['signup-email'].value;
  const password = forms.signup['signup-password'].value;
  const confirm = forms.signup['signup-confirm'].value;
  
  if (password !== confirm) {
    showError('Passwords do not match');
    showLoading(false);
    return;
  }
  
  if (password.length < 8) {
    showError('Password must be at least 8 characters');
    showLoading(false);
    return;
  }
  
  try {
    const result = await signup(email, password);
    
    if (result.success) {
      showView('dashboard');
      await loadUserData();
      
      // Show demo badge if in demo mode
      if (result.demo) {
        elements.demoBadge.classList.remove('hidden');
      } else {
        elements.demoBadge.classList.add('hidden');
      }
    } else {
      showError(result.error || 'Signup failed. Please try again.');
    }
  } catch (error) {
    showError('An unexpected error occurred. Please try again.');
  } finally {
    showLoading(false);
  }
}

// Handle logout
async function handleLogout() {
  showLoading(true);
  
  try {
    await clearAuthData();
    showView('login');
    showError(''); // Clear any error messages
    
    // Clear form data
    forms.login.reset();
    forms.signup.reset();
  } catch (error) {
    showError('Logout failed. Please try again.');
  } finally {
    showLoading(false);
  }
}

// Load user data
async function loadUserData() {
  return new Promise((resolve) => {
    chrome.storage.local.get([STORAGE_KEYS.USER_EMAIL], (result) => {
      if (result[STORAGE_KEYS.USER_EMAIL]) {
        elements.userEmail.textContent = result[STORAGE_KEYS.USER_EMAIL];
      }
      resolve();
    });
  });
}

// Load settings
function loadSettings() {
  chrome.storage.local.get([STORAGE_KEYS.SETTINGS], (result) => {
    const settings = result[STORAGE_KEYS.SETTINGS] || {
      realtimeMonitoring: true,
      autoBlock: true,
      showNotifications: true
    };
    
    elements.realtimeMonitoring.checked = settings.realtimeMonitoring;
    elements.autoBlock.checked = settings.autoBlock;
    elements.showNotifications.checked = settings.showNotifications;
  });
}

// Save settings
function saveSettings() {
  const settings = {
    realtimeMonitoring: elements.realtimeMonitoring.checked,
    autoBlock: elements.autoBlock.checked,
    showNotifications: elements.showNotifications.checked
  };
  
  chrome.storage.local.set({ [STORAGE_KEYS.SETTINGS]: settings }, () => {
    // Notify background script of settings change
    chrome.runtime.sendMessage({ 
      type: 'SETTINGS_UPDATED', 
      settings 
    });
  });
}

// Load statistics
function loadStats() {
  // In a real implementation, this would fetch from local storage or API
  chrome.storage.local.get(['daily_stats'], (result) => {
    const stats = result.daily_stats || {
      promptsAnalyzed: 0,
      risksDetected: 0
    };
    
    elements.promptsAnalyzed.textContent = stats.promptsAnalyzed;
    elements.risksDetected.textContent = stats.risksDetected;
  });
}

// UI Helper Functions
function showView(viewName) {
  Object.values(views).forEach(view => {
    view.classList.add('hidden');
  });
  
  if (views[viewName]) {
    views[viewName].classList.remove('hidden');
  }
}

function showLoading(show) {
  if (show) {
    elements.loadingOverlay.classList.remove('hidden');
  } else {
    elements.loadingOverlay.classList.add('hidden');
  }
}

function showError(message) {
  if (message) {
    elements.errorMessage.textContent = message;
    elements.errorMessage.classList.remove('hidden');
  } else {
    elements.errorMessage.classList.add('hidden');
  }
}

// Listen for stats updates from background
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.type === 'STATS_UPDATE') {
    elements.promptsAnalyzed.textContent = request.stats.promptsAnalyzed;
    elements.risksDetected.textContent = request.stats.risksDetected;
  }
}); 