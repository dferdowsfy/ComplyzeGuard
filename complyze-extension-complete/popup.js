/**
 * Complyze AI Guard - Popup Interface
 * Handles user interface interactions and extension configuration
 */

class PopupManager {
  constructor() {
    this.storage = chrome.storage.local;
    this.isLoading = false;
    
    this.initializeUI();
    this.loadSettings();
    this.checkAuthentication();
    this.loadStatistics();
  }
  
  async initializeUI() {
    // Toggle switches
    this.bindToggleSwitch('extension-toggle', 'extensionEnabled');
    this.bindToggleSwitch('pii-toggle', 'piiDetectionEnabled');
    this.bindToggleSwitch('modal-toggle', 'modalWarningsEnabled');
    this.bindToggleSwitch('sync-toggle', 'dashboardSyncEnabled');
    
    // Action buttons
    document.getElementById('refresh-auth').addEventListener('click', () => {
      this.refreshAuthentication();
    });
    
    document.getElementById('open-dashboard').addEventListener('click', () => {
      this.openDashboard();
    });
    
    console.log('Popup UI initialized');
  }
  
  bindToggleSwitch(elementId, storageKey) {
    const toggle = document.getElementById(elementId);
    if (!toggle) return;
    
    toggle.addEventListener('click', async () => {
      const isActive = toggle.classList.contains('active');
      toggle.classList.toggle('active');
      
      await this.storage.set({ [storageKey]: !isActive });
      
      // Send message to content scripts to update their state
      this.notifyContentScripts('SETTINGS_UPDATED', { [storageKey]: !isActive });
      
      // Show feedback
      this.showMessage(!isActive ? 'Setting enabled' : 'Setting disabled', 'success');
    });
  }
  
  async loadSettings() {
    try {
      const settings = await this.storage.get([
        'extensionEnabled',
        'piiDetectionEnabled',
        'modalWarningsEnabled',
        'dashboardSyncEnabled'
      ]);
      
      // Update toggle switches based on stored settings
      this.updateToggle('extension-toggle', settings.extensionEnabled !== false);
      this.updateToggle('pii-toggle', settings.piiDetectionEnabled !== false);
      this.updateToggle('modal-toggle', settings.modalWarningsEnabled !== false);
      this.updateToggle('sync-toggle', settings.dashboardSyncEnabled !== false);
      
    } catch (error) {
      console.error('Error loading settings:', error);
      this.showMessage('Error loading settings', 'error');
    }
  }
  
  updateToggle(elementId, isActive) {
    const toggle = document.getElementById(elementId);
    if (toggle) {
      toggle.classList.toggle('active', isActive);
    }
  }
  
  async checkAuthentication() {
    const authStatus = document.getElementById('auth-status');
    const authIndicator = document.getElementById('auth-indicator');
    const uuidDisplay = document.getElementById('uuid-display');
    const authError = document.getElementById('auth-error');
    
    try {
      authStatus.textContent = 'Checking...';
      authIndicator.className = 'status-indicator';
      
      // Get UUID from background script
      const response = await chrome.runtime.sendMessage({ type: 'GET_USER_UUID' });
      
      if (response.success && response.uuid) {
        authStatus.textContent = 'Authenticated';
        authIndicator.className = 'status-indicator';
        uuidDisplay.textContent = response.uuid;
        uuidDisplay.style.display = 'block';
        authError.style.display = 'none';
        
        // Validate authentication
        const validateResponse = await chrome.runtime.sendMessage({ type: 'VALIDATE_AUTH' });
        if (validateResponse.success && validateResponse.isValid) {
          authStatus.textContent = 'Connected & Verified';
        } else {
          authStatus.textContent = 'Connected (Unverified)';
          authIndicator.className = 'status-indicator warning';
        }
        
      } else {
        authStatus.textContent = 'Not Connected';
        authIndicator.className = 'status-indicator error';
        uuidDisplay.style.display = 'none';
        authError.textContent = 'No valid UUID found. Please visit complyze.co/dashboard to authenticate.';
        authError.style.display = 'block';
      }
      
    } catch (error) {
      console.error('Authentication check failed:', error);
      authStatus.textContent = 'Connection Error';
      authIndicator.className = 'status-indicator error';
      authError.textContent = `Error: ${error.message}`;
      authError.style.display = 'block';
    }
  }
  
  async refreshAuthentication() {
    const refreshBtn = document.getElementById('refresh-auth');
    refreshBtn.disabled = true;
    refreshBtn.textContent = '🔄 Refreshing...';
    
    try {
      await this.checkAuthentication();
      this.showMessage('Authentication refreshed', 'success');
    } catch (error) {
      this.showMessage('Failed to refresh authentication', 'error');
    } finally {
      refreshBtn.disabled = false;
      refreshBtn.textContent = '🔄 Refresh';
    }
  }
  
  async loadStatistics() {
    try {
      const stats = await this.storage.get([
        'todayPromptsScanned',
        'todayThreatsBlocked',
        'todayPlatformsActive',
        'todayCostSaved',
        'lastStatsUpdate'
      ]);
      
      // Check if we need to reset daily stats
      const today = new Date().toDateString();
      const lastUpdate = stats.lastStatsUpdate ? new Date(stats.lastStatsUpdate).toDateString() : null;
      
      if (lastUpdate !== today) {
        // Reset daily stats
        await this.storage.set({
          todayPromptsScanned: 0,
          todayThreatsBlocked: 0,
          todayPlatformsActive: 0,
          todayCostSaved: 0,
          lastStatsUpdate: new Date().toISOString()
        });
        
        // Update display
        this.updateStatistics(0, 0, 0, 0);
      } else {
        // Update display with existing stats
        this.updateStatistics(
          stats.todayPromptsScanned || 0,
          stats.todayThreatsBlocked || 0,
          stats.todayPlatformsActive || 0,
          stats.todayCostSaved || 0
        );
      }
      
      // Get active platforms count from tabs
      const activePlatforms = await this.getActivePlatformsCount();
      document.getElementById('platforms-active').textContent = activePlatforms;
      
    } catch (error) {
      console.error('Error loading statistics:', error);
    }
  }
  
  updateStatistics(prompts, threats, platforms, cost) {
    document.getElementById('prompts-scanned').textContent = prompts;
    document.getElementById('threats-blocked').textContent = threats;
    document.getElementById('platforms-active').textContent = platforms;
    document.getElementById('cost-saved').textContent = `$${cost.toFixed(2)}`;
  }
  
  async getActivePlatformsCount() {
    try {
      const tabs = await chrome.tabs.query({
        url: [
          "*://chatgpt.com/*",
          "*://claude.ai/*",
          "*://gemini.google.com/*"
        ]
      });
      
      const uniquePlatforms = new Set();
      tabs.forEach(tab => {
        if (tab.url.includes('chatgpt.com')) uniquePlatforms.add('ChatGPT');
        if (tab.url.includes('claude.ai')) uniquePlatforms.add('Claude');
        if (tab.url.includes('gemini.google.com')) uniquePlatforms.add('Gemini');
      });
      
      return uniquePlatforms.size;
    } catch (error) {
      console.error('Error getting active platforms:', error);
      return 0;
    }
  }
  
  async openDashboard() {
    try {
      await chrome.tabs.create({
        url: 'https://complyze.co/dashboard',
        active: true
      });
    } catch (error) {
      console.error('Error opening dashboard:', error);
      this.showMessage('Error opening dashboard', 'error');
    }
  }
  


  
  async notifyContentScripts(type, data) {
    try {
      const tabs = await chrome.tabs.query({
        url: [
          "*://chatgpt.com/*",
          "*://claude.ai/*",
          "*://gemini.google.com/*"
        ]
      });
      
      for (const tab of tabs) {
        try {
          await chrome.tabs.sendMessage(tab.id, { type, data });
        } catch (error) {
          // Tab might not have content script loaded
          console.warn('Could not send message to tab:', tab.id, error);
        }
      }
    } catch (error) {
      console.error('Error notifying content scripts:', error);
    }
  }
  
  showMessage(message, type) {
    const container = document.getElementById('message-container');
    const messageEl = document.createElement('div');
    messageEl.className = type === 'error' ? 'error-message' : 'success-message';
    messageEl.textContent = message;
    
    container.appendChild(messageEl);
    
    // Auto-remove after 3 seconds
    setTimeout(() => {
      if (messageEl.parentNode) {
        messageEl.parentNode.removeChild(messageEl);
      }
    }, 3000);
  }
}

// Initialize popup when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
  new PopupManager();
});

// Listen for messages from background script
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  console.log('Popup received message:', message);
  
  switch (message.type) {
    case 'UPDATE_STATS':
      // Update statistics display
      if (message.data) {
        const { prompts, threats, cost } = message.data;
        document.getElementById('prompts-scanned').textContent = prompts || 0;
        document.getElementById('threats-blocked').textContent = threats || 0;
        document.getElementById('cost-saved').textContent = `$${(cost || 0).toFixed(2)}`;
      }
      break;
      
    case 'AUTH_STATUS_CHANGED':
      // Refresh authentication display
      const popup = window.popupManager;
      if (popup) {
        popup.checkAuthentication();
      }
      break;
      
    default:
      console.warn('Unknown message type in popup:', message.type);
  }
  
  sendResponse({ success: true });
});

console.log('Complyze AI Guard popup script loaded'); 