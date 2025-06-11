// Prevent multiple script injections
if (window.complyzeInjected) {
  console.log('Complyze: Already injected, skipping...');
} else {
  window.complyzeInjected = true;
  console.log('Complyze: Initializing extension...');

// Platform-specific selectors for prompt inputs
const PLATFORM_SELECTORS = {
  'chat.openai.com': {
    input: 'textarea[data-id="root"]',
    sendButton: 'button[data-testid="send-button"]',
    container: 'main'
  },
  'chatgpt.com': {
    input: 'textarea[data-id="root"], textarea, [contenteditable="true"]',
    sendButton: 'button[data-testid="send-button"], button[aria-label*="Send"], button:has(svg)',
    container: 'main'
  },
  'claude.ai': {
    input: 'div[contenteditable="true"]',
    sendButton: 'button[aria-label*="Send"]',
    container: 'main'
  },
  'gemini.google.com': {
    input: 'rich-textarea textarea, .ql-editor',
    sendButton: 'button[aria-label*="Send"], button[data-test-id="send-button"]',
    container: 'main'
  },
  'bard.google.com': {
    input: 'rich-textarea textarea, .ql-editor',
    sendButton: 'button[aria-label*="Send"]',
    container: 'main'
  },
  'poe.com': {
    input: 'textarea[class*="GrowingTextArea"]',
    sendButton: 'button[class*="SendButton"]',
    container: 'main'
  },
  'character.ai': {
    input: 'textarea',
    sendButton: 'button[type="submit"]',
    container: 'main'
  }
};

// State management
let isMonitoring = false;
let currentPlatform = null;
let warningOverlay = null;
let optimizationDialog = null;

// Initialize content script
function initialize() {
  detectPlatform();
  
  if (currentPlatform) {
    console.log(`Complyze: Monitoring ${currentPlatform}`);
    setupMonitoring();
    injectStyles();
  }
}

// Detect current platform
function detectPlatform() {
  const hostname = window.location.hostname;
  
  for (const [domain, selectors] of Object.entries(PLATFORM_SELECTORS)) {
    if (hostname.includes(domain)) {
      currentPlatform = domain;
      return;
    }
  }
}

// Setup monitoring for the current platform
function setupMonitoring() {
  if (isMonitoring) return;
  
  isMonitoring = true;
  
  // Use MutationObserver to handle dynamic content
  const observer = new MutationObserver(() => {
    attachListeners();
  });
  
  observer.observe(document.body, {
    childList: true,
    subtree: true
  });
  
  // Initial attachment
  attachListeners();
}

// Attach listeners to prompt inputs
function attachListeners() {
  const selectors = PLATFORM_SELECTORS[currentPlatform];
  if (!selectors) {
    console.log('Complyze: No selectors for platform:', currentPlatform);
    return;
  }
  
  // Find all matching inputs
  const inputs = document.querySelectorAll(selectors.input);
  console.log('Complyze: Found inputs:', inputs.length, selectors.input);
  
  inputs.forEach(input => {
    // Skip if already has listener
    if (input.dataset.complyzeMonitored === 'true') return;
    
    input.dataset.complyzeMonitored = 'true';
    console.log('Complyze: Added input listener to:', input);
    
    // Monitor input changes
    if (input.tagName === 'TEXTAREA') {
      input.addEventListener('input', debounce(handleInputChange, 500));
    } else if (input.contentEditable === 'true') {
      input.addEventListener('input', debounce(handleInputChange, 500));
      input.addEventListener('DOMSubtreeModified', debounce(handleInputChange, 500));
    }
  });
  
  // Monitor send button clicks with multiple event types
  const sendButtons = document.querySelectorAll(selectors.sendButton);
  console.log('Complyze: Found send buttons:', sendButtons.length, selectors.sendButton);
  
  sendButtons.forEach(button => {
    if (button.dataset.complyzeMonitored === 'true') return;
    
    button.dataset.complyzeMonitored = 'true';
    console.log('Complyze: Added button listener to:', button);
    
    // Add multiple event listeners for comprehensive blocking
    button.addEventListener('click', handleSendClick, true);
    button.addEventListener('mousedown', handleSendClick, true);
    button.addEventListener('touchstart', handleSendClick, true);
    button.addEventListener('submit', handleSendClick, true);
  });
  
  // Monitor Enter key for submission with capture phase
  document.addEventListener('keydown', handleKeyDown, true);
  document.addEventListener('keypress', handleKeyDown, true);
  
  // Also monitor form submissions
  const forms = document.querySelectorAll('form');
  forms.forEach(form => {
    if (form.dataset.complyzeMonitored === 'true') return;
    form.dataset.complyzeMonitored = 'true';
    form.addEventListener('submit', handleFormSubmit, true);
  });
}

// Handle form submissions
async function handleFormSubmit(event) {
  const selectors = PLATFORM_SELECTORS[currentPlatform];
  const input = document.querySelector(selectors.input);
  const prompt = getPromptText(input);
  
  if (!prompt) return;
  
  // Analyze before sending
  const response = await chrome.runtime.sendMessage({
    type: 'ANALYZE_PROMPT',
    prompt: prompt,
    platform: currentPlatform
  });
  
  if (response.shouldBlock) {
    // Prevent form submission
    event.preventDefault();
    event.stopPropagation();
    event.stopImmediatePropagation();
    
    showOptimizationDialog(prompt, response.analysis);
    return false;
  }
}

// Handle input changes for real-time detection
async function handleInputChange(event) {
  const prompt = getPromptText(event.target);
  
  if (!prompt || prompt.length < 10) {
    hideWarning();
    return;
  }
  
  // Send to background for analysis
  const response = await chrome.runtime.sendMessage({
    type: 'ANALYZE_PROMPT',
    prompt: prompt,
    platform: currentPlatform
  });
  
  if (response.analysis?.flagged) {
    showWarning(response.analysis);
  } else {
    hideWarning();
  }
}

// Handle send button click
async function handleSendClick(event) {
  console.log('Complyze: Send button clicked!', event.target);
  
  const selectors = PLATFORM_SELECTORS[currentPlatform];
  const input = document.querySelector(selectors.input);
  const prompt = getPromptText(input);
  
  console.log('Complyze: Found prompt:', prompt);
  
  if (!prompt) {
    console.log('Complyze: No prompt found, allowing submission');
    return;
  }
  
  // Analyze before sending
  console.log('Complyze: Analyzing prompt...');
  const response = await chrome.runtime.sendMessage({
    type: 'ANALYZE_PROMPT',
    prompt: prompt,
    platform: currentPlatform
  });
  
  console.log('Complyze: Analysis response:', response);
  
  if (response.shouldBlock) {
    console.log('Complyze: BLOCKING submission!');
    
    // Aggressively prevent the event
    event.preventDefault();
    event.stopPropagation();
    event.stopImmediatePropagation();
    
    // Also disable the button temporarily
    const button = event.target;
    const originalDisabled = button.disabled;
    button.disabled = true;
    
    showOptimizationDialog(prompt, response.analysis);
    
    // Re-enable button after a short delay
    setTimeout(() => {
      button.disabled = originalDisabled;
    }, 1000);
    
    return false;
  } else {
    console.log('Complyze: Allowing submission');
  }
}

// Handle keyboard shortcuts (Enter to send)
async function handleKeyDown(event) {
  if (event.key === 'Enter' && !event.shiftKey) {
    const selectors = PLATFORM_SELECTORS[currentPlatform];
    const input = document.querySelector(selectors.input);
    
    if (input && document.activeElement === input) {
      const prompt = getPromptText(input);
      
      if (!prompt) return;
      
      // Analyze before sending
      const response = await chrome.runtime.sendMessage({
        type: 'ANALYZE_PROMPT',
        prompt: prompt,
        platform: currentPlatform
      });
      
      if (response.shouldBlock) {
        // Aggressively prevent the event
        event.preventDefault();
        event.stopPropagation();
        event.stopImmediatePropagation();
        
        // Blur the input to prevent any other submission attempts
        input.blur();
        
        showOptimizationDialog(prompt, response.analysis);
        
        // Refocus the input after a short delay
        setTimeout(() => {
          input.focus();
        }, 1000);
        
        return false;
      }
    }
  }
}

// Get text from various input types
function getPromptText(element) {
  if (!element) return '';
  
  if (element.tagName === 'TEXTAREA') {
    return element.value;
  } else if (element.contentEditable === 'true') {
    return element.innerText || element.textContent;
  }
  
  return '';
}

// Show warning overlay
function showWarning(analysis) {
  if (!warningOverlay) {
    warningOverlay = createWarningOverlay();
  }
  
  const riskBadge = warningOverlay.querySelector('.complyze-risk-badge');
  const riskList = warningOverlay.querySelector('.complyze-risk-list');
  
  // Update risk level
  riskBadge.textContent = analysis.riskLevel.toUpperCase();
  riskBadge.className = `complyze-risk-badge complyze-risk-${analysis.riskLevel}`;
  
  // Update risk list
  riskList.innerHTML = analysis.risks.slice(0, 3).map(risk => 
    `<li>${escapeHtml(risk)}</li>`
  ).join('');
  
  if (analysis.risks.length > 3) {
    riskList.innerHTML += `<li>...and ${analysis.risks.length - 3} more</li>`;
  }
  
  warningOverlay.style.display = 'block';
}

// Hide warning overlay
function hideWarning() {
  if (warningOverlay) {
    warningOverlay.style.display = 'none';
  }
}

// Create warning overlay element
function createWarningOverlay() {
  const overlay = document.createElement('div');
  overlay.className = 'complyze-warning-overlay';
  overlay.innerHTML = `
    <div class="complyze-warning-content">
      <div class="complyze-warning-header">
        <span class="complyze-warning-icon">⚠️</span>
        <span class="complyze-warning-title">Sensitive Data Detected</span>
        <span class="complyze-risk-badge">HIGH</span>
      </div>
      <ul class="complyze-risk-list"></ul>
      <div class="complyze-warning-footer">
        <button class="complyze-btn-optimize">Optimize Prompt</button>
        <button class="complyze-btn-dismiss">Dismiss</button>
      </div>
    </div>
  `;
  
  // Add event listeners
  overlay.querySelector('.complyze-btn-dismiss').addEventListener('click', hideWarning);
  overlay.querySelector('.complyze-btn-optimize').addEventListener('click', () => {
    const selectors = PLATFORM_SELECTORS[currentPlatform];
    const input = document.querySelector(selectors.input);
    const prompt = getPromptText(input);
    
    chrome.runtime.sendMessage({
      type: 'ANALYZE_PROMPT',
      prompt: prompt,
      platform: currentPlatform
    }).then(response => {
      if (response.analysis) {
        showOptimizationDialog(prompt, response.analysis);
      }
    });
  });
  
  document.body.appendChild(overlay);
  return overlay;
}

// Show optimization dialog
async function showOptimizationDialog(originalPrompt, analysis) {
  if (!optimizationDialog) {
    optimizationDialog = createOptimizationDialog();
  }
  
  const originalText = optimizationDialog.querySelector('.complyze-original-prompt');
  const optimizedText = optimizationDialog.querySelector('.complyze-optimized-prompt');
  const risksSummary = optimizationDialog.querySelector('.complyze-risks-summary');
  const loadingIndicator = optimizationDialog.querySelector('.complyze-loading');
  
  // Display original prompt
  originalText.textContent = originalPrompt;
  
  // Display risks
  risksSummary.innerHTML = `
    <strong>Detected Risks:</strong>
    <ul>${analysis.risks.map(risk => `<li>${escapeHtml(risk)}</li>`).join('')}</ul>
  `;
  
  // Show loading state
  optimizedText.textContent = 'Optimizing prompt...';
  if (loadingIndicator) loadingIndicator.style.display = 'block';
  
  optimizationDialog.style.display = 'flex';
  
  // Generate optimized prompt asynchronously
  try {
    const response = await chrome.runtime.sendMessage({
      type: 'OPTIMIZE_PROMPT',
      prompt: originalPrompt
    });
    
    if (loadingIndicator) loadingIndicator.style.display = 'none';
    
    if (response.success) {
      optimizedText.textContent = response.optimizedPrompt;
      
      // Show redaction summary if available
      if (response.redactedItems && response.redactedItems.length > 0) {
        const redactionSummary = document.createElement('div');
        redactionSummary.className = 'complyze-redaction-summary';
        redactionSummary.innerHTML = `
          <strong>Redacted Items:</strong>
          <ul>
            ${response.redactedItems.map(item => 
              `<li>${item.type}: ${item.original} → ${item.replacement}</li>`
            ).join('')}
          </ul>
        `;
        optimizedText.appendChild(redactionSummary);
      }
      
      if (response.wasOptimized) {
        const optimizationNote = document.createElement('div');
        optimizationNote.className = 'complyze-optimization-note';
        optimizationNote.textContent = '✨ Optimized by AI for clarity and safety';
        optimizedText.appendChild(optimizationNote);
      }
    } else {
      optimizedText.textContent = response.optimizedPrompt || 'Optimization failed. Using basic redaction.';
      if (response.fallbackUsed) {
        const fallbackNote = document.createElement('div');
        fallbackNote.className = 'complyze-fallback-note';
        fallbackNote.textContent = '⚠️ AI optimization unavailable, using basic redaction';
        optimizedText.appendChild(fallbackNote);
      }
    }
  } catch (error) {
    if (loadingIndicator) loadingIndicator.style.display = 'none';
    optimizedText.textContent = 'Optimization failed. Using basic redaction.';
    console.error('Optimization error:', error);
  }
}

// Create optimization dialog
function createOptimizationDialog() {
  const dialog = document.createElement('div');
  dialog.className = 'complyze-optimization-dialog';
  dialog.innerHTML = `
    <div class="complyze-dialog-content">
      <div class="complyze-dialog-header">
        <h2>Prompt Optimization Required</h2>
        <button class="complyze-dialog-close">×</button>
      </div>
      <div class="complyze-dialog-body">
        <div class="complyze-prompt-section">
          <h3>Original Prompt</h3>
          <div class="complyze-original-prompt"></div>
        </div>
        <div class="complyze-risks-summary"></div>
        <div class="complyze-prompt-section">
          <h3>Optimized Prompt</h3>
          <div class="complyze-optimized-prompt"></div>
          <div class="complyze-loading" style="display: none;">
            <div class="complyze-spinner"></div>
            <span>AI is optimizing your prompt...</span>
          </div>
        </div>
      </div>
      <div class="complyze-dialog-footer">
        <button class="complyze-btn-use-optimized">Use Optimized</button>
        <button class="complyze-btn-edit">Edit Manually</button>
        <button class="complyze-btn-cancel">Cancel</button>
      </div>
    </div>
  `;
  
  // Event listeners
  const closeBtn = dialog.querySelector('.complyze-dialog-close');
  const cancelBtn = dialog.querySelector('.complyze-btn-cancel');
  const useOptimizedBtn = dialog.querySelector('.complyze-btn-use-optimized');
  
  closeBtn.addEventListener('click', () => {
    dialog.style.display = 'none';
  });
  
  cancelBtn.addEventListener('click', () => {
    dialog.style.display = 'none';
  });
  
  useOptimizedBtn.addEventListener('click', () => {
    const optimizedPrompt = dialog.querySelector('.complyze-optimized-prompt').textContent;
    const selectors = PLATFORM_SELECTORS[currentPlatform];
    const input = document.querySelector(selectors.input);
    
    if (input) {
      if (input.tagName === 'TEXTAREA') {
        input.value = optimizedPrompt;
        input.dispatchEvent(new Event('input', { bubbles: true }));
      } else if (input.contentEditable === 'true') {
        input.innerText = optimizedPrompt;
        input.dispatchEvent(new Event('input', { bubbles: true }));
      }
    }
    
    dialog.style.display = 'none';
    hideWarning();
  });
  
  document.body.appendChild(dialog);
  return dialog;
}

// Generate optimized prompt using AI
async function generateOptimizedPrompt(prompt, analysis) {
  try {
    // Send message to background script to handle optimization
    const response = await chrome.runtime.sendMessage({
      type: 'OPTIMIZE_PROMPT',
      prompt: prompt
    });
    
    if (response.success) {
      return response.optimizedPrompt;
    } else {
      // Fallback to basic redaction
      return basicRedaction(prompt, analysis);
    }
  } catch (error) {
    console.error('AI optimization failed, using fallback:', error);
    return basicRedaction(prompt, analysis);
  }
}

// Basic fallback redaction
function basicRedaction(prompt, analysis) {
  let optimized = prompt;
  
  // Remove detected sensitive data
  analysis.detectedTypes.forEach(type => {
    if (type === 'email') {
      optimized = optimized.replace(/\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b/g, '[EMAIL_REDACTED]');
    } else if (type === 'ssn') {
      optimized = optimized.replace(/\b\d{3}-\d{2}-\d{4}\b/g, '[SSN_REDACTED]');
    } else if (type === 'phone') {
      optimized = optimized.replace(/\b(?:\+?1[-.\s]?)?\(?([0-9]{3})\)?[-.\s]?([0-9]{3})[-.\s]?([0-9]{4})\b/g, '[PHONE_REDACTED]');
    }
  });
  
  return optimized;
}

// Inject CSS styles
function injectStyles() {
  const link = document.createElement('link');
  link.rel = 'stylesheet';
  link.href = chrome.runtime.getURL('styles/overlay.css');
  document.head.appendChild(link);
}

// Utility functions
function debounce(func, wait) {
  let timeout;
  return function executedFunction(...args) {
    const later = () => {
      clearTimeout(timeout);
      func(...args);
    };
    clearTimeout(timeout);
    timeout = setTimeout(later, wait);
  };
}

function escapeHtml(unsafe) {
  return unsafe
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

// Initialize when DOM is ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initialize);
} else {
  initialize();
}

} // End of injection guard 