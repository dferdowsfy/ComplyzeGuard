/**
 * Complyze AI Guard - Content Script
 * Real-time monitoring of AI platforms for sensitive data detection
 */

(function() {
  'use strict';
  
  // Configuration and Platform Detection
  const PLATFORM_CONFIGS = {
    'chatgpt.com': {
      name: 'ChatGPT',
      promptInput: '#prompt-textarea, div[contenteditable="true"][data-id="root"]',
      submitButton: '[data-testid="send-button"], button[aria-label="Send prompt"], button[aria-label="Send message"], form button[type="submit"]',
      loginCheck: '[data-testid="profile-button"], [data-headlessui-state]',
      fallbackPromptInput: 'textarea[placeholder*="message"], div[contenteditable="true"]',
      fallbackSubmitButton: 'button:has(svg), .absolute.bottom-0 button, textarea + button, form button'
    },
    'claude.ai': {
      name: 'Claude',
      promptInput: 'div[contenteditable="true"].ProseMirror, div[contenteditable="true"][role="textbox"]',
      submitButton: 'button[aria-label="Send Message"], button[type="submit"], button:has(svg[data-icon="send"])',
      loginCheck: '[data-testid="user-menu"], .user-menu',
      fallbackPromptInput: 'div[contenteditable="true"], textarea',
      fallbackSubmitButton: 'form button, button:has(svg), [data-testid*="send"]'
    },
    'gemini.google.com': {
      name: 'Gemini',
      promptInput: 'rich-textarea div[contenteditable="true"], div[contenteditable="true"][role="textbox"]',
      submitButton: 'button[aria-label="Send message"], button[data-testid="send-button"], button:has(svg[data-icon="send"])',
      loginCheck: '.gb_d, [data-ogsr-up], .user-info',
      fallbackPromptInput: 'div[contenteditable="true"], textarea',
      fallbackSubmitButton: 'button:has(svg), form button, [data-testid*="send"]'
    },
    'meta.ai': {
      name: 'Meta AI',
      promptInput: 'div[contenteditable="true"], textarea[placeholder*="Ask"]',
      submitButton: 'button[aria-label="Send"], button[type="submit"]',
      loginCheck: '[data-testid="user-menu"], .user-menu',
      fallbackPromptInput: 'div[contenteditable="true"], textarea',
      fallbackSubmitButton: 'button:has(svg), form button'
    }
  };
  
  // PII Detection Patterns
  const PII_PATTERNS = {
    CREDIT_CARD: {
      pattern: /\b(?:4[0-9]{12}(?:[0-9]{3})?|5[1-5][0-9]{14}|3[47][0-9]{13}|3[0-9]{13}|6(?:011|5[0-9]{2})[0-9]{12})\b/g,
      description: 'Credit Card Number',
      riskLevel: 'high',
      riskType: 'financial'
    },
    SSN: {
      pattern: /\b(?:\d{3}-?\d{2}-?\d{4})\b/g,
      description: 'Social Security Number',
      riskLevel: 'high',
      riskType: 'personal_id'
    },
    EMAIL: {
      pattern: /\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b/g,
      description: 'Email Address',
      riskLevel: 'medium',
      riskType: 'contact'
    },
    PHONE: {
      pattern: /\b(?:\+?1[-.\s]?)?\(?([0-9]{3})\)?[-.\s]?([0-9]{3})[-.\s]?([0-9]{4})\b/g,
      description: 'Phone Number',
      riskLevel: 'medium',
      riskType: 'contact'
    },
    IP_ADDRESS: {
      pattern: /\b(?:(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.){3}(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\b/g,
      description: 'IP Address',
      riskLevel: 'low',
      riskType: 'technical'
    },
    NAME: {
      pattern: /\b(?:my name is|i am|i'm|call me)\s+([A-Z][a-z]+(?:\s+[A-Z][a-z]+)+)\b/gi,
      description: 'Personal Name',
      riskLevel: 'medium',
      riskType: 'personal_id'
    },
    ADDRESS: {
      pattern: /\b\d+\s+[A-Za-z0-9\s]+(?:Street|St|Avenue|Ave|Road|Rd|Drive|Dr|Lane|Ln|Boulevard|Blvd|Court|Ct),?\s*[A-Za-z\s]+,?\s*[A-Z]{2}\s+\d{5}(?:-\d{4})?\b/g,
      description: 'Street Address',
      riskLevel: 'medium',
      riskType: 'personal_id'
    },
    PASSPORT: {
      pattern: /\b(?:passport|passport number|passport #)\s*:?\s*([A-Z0-9]{6,9})\b/gi,
      description: 'Passport Number',
      riskLevel: 'high',
      riskType: 'personal_id'
    },
    API_KEY: {
      pattern: /\b(?:sk-|pk_|rk_|ak_|ey_|key_)[a-zA-Z0-9]{20,50}\b/g,
      description: 'API Key',
      riskLevel: 'high',
      riskType: 'security'
    },
    OAUTH_TOKEN: {
      pattern: /\b(?:Bearer\s+|token\s*[:=]\s*)[a-zA-Z0-9._-]{20,500}\b/g,
      description: 'OAuth Token',
      riskLevel: 'high',
      riskType: 'security'
    },
    SSH_KEY: {
      pattern: /-----BEGIN (?:RSA|DSA|EC|OPENSSH) PRIVATE KEY-----/g,
      description: 'SSH Private Key',
      riskLevel: 'high',
      riskType: 'security'
    },
    PASSWORD: {
      pattern: /\b(?:password|pwd|pass)\s*[:=]\s*[^\s\n]{6,}\b/gi,
      description: 'Password/Access Code',
      riskLevel: 'high',
      riskType: 'security'
    },
    MEDICAL: {
      pattern: /\b(?:patient|diagnosis|prescription|medical record|health insurance|medicaid|medicare|PHI|protected health information)\b/gi,
      description: 'Medical Information (PHI)',
      riskLevel: 'high',
      riskType: 'medical'
    },
    FINANCIAL_RECORD: {
      pattern: /\b(?:bank account|routing number|account number|IBAN|swift code|tax id|ein)\s*:?\s*[A-Z0-9-]{5,20}\b/gi,
      description: 'Financial Records',
      riskLevel: 'high',
      riskType: 'financial'
    },
    BIOMETRIC: {
      pattern: /\b(?:fingerprint|retina|iris|facial recognition|biometric|dna)\b/gi,
      description: 'Biometric Data',
      riskLevel: 'high',
      riskType: 'biometric'
    },
    JAILBREAK_IGNORE: {
      pattern: /\b(?:ignore previous instructions|ignore the above|forget the above|disregard previous|override previous)\b/gi,
      description: 'Ignore Previous Instructions',
      riskLevel: 'medium',
      riskType: 'jailbreak'
    },
    JAILBREAK_INJECTION: {
      pattern: /\b(?:prompt injection|system prompt|you are now|pretend you are|act as if|role play)\b/gi,
      description: 'Prompt Injection Pattern',
      riskLevel: 'medium',
      riskType: 'jailbreak'
    },
    
    // Additional Credentials & Secrets
    VAULT_PATH: {
      pattern: /\b(?:vault|secret)[\/\:][\w\-\/]+/gi,
      description: 'Vault Paths',
      riskLevel: 'high',
      riskType: 'security'
    },
    ACCESS_TOKEN: {
      pattern: /\b(?:access[_\-]?token|auth[_\-]?token)\s*[:=]\s*[a-zA-Z0-9._-]{20,100}\b/gi,
      description: 'Access Tokens',
      riskLevel: 'high',
      riskType: 'security'
    },
    
    // Company Internal Data
    INTERNAL_URL: {
      pattern: /\b(?:internal|intranet|corp|company)[.\-][\w\-\.]+\.(?:com|net|org|local)\b/gi,
      description: 'Internal URLs',
      riskLevel: 'medium',
      riskType: 'company_internal'
    },
    PROJECT_CODENAME: {
      pattern: /\b(?:project|codename|operation)\s+[A-Z][a-zA-Z]{3,15}\b/gi,
      description: 'Project Codenames',
      riskLevel: 'medium',
      riskType: 'company_internal'
    },
    INTERNAL_TOOL: {
      pattern: /\b(?:jenkins|jira|confluence|gitlab|slack|teams|notion|monday|asana)\s*[:\/][\w\-\/\.]+/gi,
      description: 'Internal Tools',
      riskLevel: 'medium',
      riskType: 'company_internal'
    },
    SYSTEM_IP: {
      pattern: /\b(?:10|172\.16|192\.168)\.[\d\.]+\b/g,
      description: 'System IP Ranges',
      riskLevel: 'medium',
      riskType: 'company_internal'
    },
    INTERNAL_MEMO: {
      pattern: /\b(?:confidential memo|internal memo|company memo|executive briefing)\b/gi,
      description: 'Internal Memos',
      riskLevel: 'medium',
      riskType: 'company_internal'
    },
    STRATEGIC_PLAN: {
      pattern: /\b(?:strategic plan|business plan|roadmap|acquisition|merger|ipo)\b/gi,
      description: 'Strategic Plans',
      riskLevel: 'high',
      riskType: 'company_internal'
    },
    PROPRIETARY_DATA: {
      pattern: /\b(?:proprietary|confidential|trade secret|nda|non[_\-]?disclosure)\b/gi,
      description: 'Proprietary Business Data',
      riskLevel: 'high',
      riskType: 'company_internal'
    },
    TECHNICAL_DESIGN: {
      pattern: /\b(?:architecture|technical spec|design document|system design|api spec)\b/gi,
      description: 'Technical Designs',
      riskLevel: 'medium',
      riskType: 'company_internal'
    },
    RD_ARTIFACT: {
      pattern: /\b(?:research data|prototype|patent|invention|r&d|research and development)\b/gi,
      description: 'R&D Artifacts',
      riskLevel: 'high',
      riskType: 'company_internal'
    },
    
    // AI Model & Dataset Leakage
    MODEL_NAME: {
      pattern: /\b(?:gpt-[45]|claude|palm|bert|transformer|neural network|deep learning model)\b/gi,
      description: 'Model Names',
      riskLevel: 'medium',
      riskType: 'ai_model'
    },
    TRAINING_DATA: {
      pattern: /\b(?:training data|dataset|corpus|fine[_\-]?tuning data|model weights)\b/gi,
      description: 'Training Data References',
      riskLevel: 'high',
      riskType: 'ai_model'
    },
    FINETUNED_LOGIC: {
      pattern: /\b(?:fine[_\-]?tuned|custom model|proprietary algorithm|model logic)\b/gi,
      description: 'Fine-tuned Logic',
      riskLevel: 'high',
      riskType: 'ai_model'
    },
    PRIVATE_WEIGHTS: {
      pattern: /\b(?:model weights|private weights|model parameters|checkpoint)\b/gi,
      description: 'Private Weights or Output',
      riskLevel: 'high',
      riskType: 'ai_model'
    },
    
    // Additional Regulated Information
    EXPORT_CONTROLLED: {
      pattern: /\b(?:itar|export control|dual[_\-]?use|controlled technology|munitions)\b/gi,
      description: 'Export-Controlled Terms (ITAR)',
      riskLevel: 'high',
      riskType: 'regulated'
    },
    WHISTLEBLOWER: {
      pattern: /\b(?:whistleblower|complaint|violation report|ethics report)\b/gi,
      description: 'Whistleblower IDs',
      riskLevel: 'high',
      riskType: 'regulated'
    },
    
    // Additional Jailbreak Patterns
    JAILBREAK_WORKAROUND: {
      pattern: /\b(?:bypass|circumvent|work around|ignore safety|remove restrictions|unlock)\b/gi,
      description: 'Jailbreak Workarounds',
      riskLevel: 'medium',
      riskType: 'jailbreak'
    }
  };
  
  // Risk Type Mapping for Supabase
  const RISK_TYPE_MAPPING = {
    'CREDIT_CARD': 'financial',
    'SSN': 'personal_id',
    'EMAIL': 'contact',
    'PHONE': 'contact',
    'IP_ADDRESS': 'technical',
    'NAME': 'personal_id',
    'ADDRESS': 'personal_id',
    'PASSPORT': 'personal_id',
    'API_KEY': 'security',
    'OAUTH_TOKEN': 'security',
    'SSH_KEY': 'security',
    'VAULT_PATH': 'security',
    'ACCESS_TOKEN': 'security',
    'PASSWORD': 'security',
    'INTERNAL_URL': 'company_internal',
    'PROJECT_CODENAME': 'company_internal',
    'INTERNAL_TOOL': 'company_internal',
    'SYSTEM_IP': 'company_internal',
    'INTERNAL_MEMO': 'company_internal',
    'STRATEGIC_PLAN': 'company_internal',
    'PROPRIETARY_DATA': 'company_internal',
    'TECHNICAL_DESIGN': 'company_internal',
    'RD_ARTIFACT': 'company_internal',
    'MODEL_NAME': 'ai_model',
    'TRAINING_DATA': 'ai_model',
    'FINETUNED_LOGIC': 'ai_model',
    'PRIVATE_WEIGHTS': 'ai_model',
    'MEDICAL': 'medical',
    'FINANCIAL_RECORD': 'financial',
    'EXPORT_CONTROLLED': 'regulated',
    'WHISTLEBLOWER': 'regulated',
    'BIOMETRIC': 'biometric',
    'JAILBREAK_IGNORE': 'jailbreak',
    'JAILBREAK_INJECTION': 'jailbreak',
    'JAILBREAK_WORKAROUND': 'jailbreak'
  };
  
  // Platform Detection
  function detectPlatform() {
    const hostname = window.location.hostname;
    for (const [domain, config] of Object.entries(PLATFORM_CONFIGS)) {
      if (hostname.includes(domain.replace('.com', ''))) {
        console.log('Detected platform:', config.name);
        return config;
      }
    }
    return null;
  }
  
  // PII Detection Engine
  class PIIDetector {
    static detectSensitiveData(text) {
      if (!text || text.length < 3) return [];
      
      const detectedPII = [];
      
      for (const [type, config] of Object.entries(PII_PATTERNS)) {
        const matches = text.match(config.pattern);
        if (matches) {
          detectedPII.push({
            type: type,
            description: config.description,
            riskLevel: config.riskLevel,
            riskType: config.riskType,
            matches: matches.slice(0, 5), // Limit to 5 matches to avoid overwhelming
            count: matches.length
          });
        }
      }
      
      return detectedPII;
    }
    
    static calculateIntegrityScore(text, detectedPII) {
      if (detectedPII.length === 0) return 100;
      
      let score = 100;
      const textLength = text.length;
      
      for (const pii of detectedPII) {
        let penalty = 0;
        switch (pii.riskLevel) {
          case 'high':
            penalty = 30;
            break;
          case 'medium':
            penalty = 15;
            break;
          case 'low':
            penalty = 5;
            break;
        }
        
        // Additional penalty for multiple occurrences
        penalty += (pii.count - 1) * 5;
        score -= penalty;
      }
      
      return Math.max(0, Math.min(100, score));
    }
    
    static getHighestRiskLevel(detectedPII) {
      if (detectedPII.length === 0) return 'low';
      
      const riskLevels = ['low', 'medium', 'high'];
      let highestRisk = 'low';
      
      for (const pii of detectedPII) {
        const currentRiskIndex = riskLevels.indexOf(pii.riskLevel);
        const highestRiskIndex = riskLevels.indexOf(highestRisk);
        if (currentRiskIndex > highestRiskIndex) {
          highestRisk = pii.riskLevel;
        }
      }
      
      return highestRisk;
    }
  }
  
  // Modal Warning System
  class WarningModal {
    constructor(platform, detectedPII, inputElement) {
      this.platform = platform;
      this.detectedPII = detectedPII;
      this.inputElement = inputElement;
      this.modalElement = null;
      this.isVisible = false;
    }
    
    show(originalPrompt) {
      if (this.isVisible) {
        this.hide();
      }
      
      this.createModal(originalPrompt);
      this.positionModal();
      this.bindEvents();
      this.isVisible = true;
      
      // Auto-update position on scroll/resize
      this.positionUpdateHandler = () => this.positionModal();
      window.addEventListener('scroll', this.positionUpdateHandler, true);
      window.addEventListener('resize', this.positionUpdateHandler);
    }
    
    hide() {
      if (this.modalElement) {
        this.modalElement.remove();
        this.modalElement = null;
      }
      
      if (this.positionUpdateHandler) {
        window.removeEventListener('scroll', this.positionUpdateHandler, true);
        window.removeEventListener('resize', this.positionUpdateHandler);
        this.positionUpdateHandler = null;
      }
      
      this.isVisible = false;
    }
    
    createModal(originalPrompt) {
      const riskLevel = PIIDetector.getHighestRiskLevel(this.detectedPII);
      const riskColor = {
        'low': '#f59e0b',
        'medium': '#f97316', 
        'high': '#dc2626'
      }[riskLevel];
      
      const piiList = this.detectedPII.map(pii => 
        `<li>🔍 ${pii.description} (${pii.count} found)</li>`
      ).join('');
      
      this.modalElement = document.createElement('div');
      this.modalElement.id = 'complyze-warning-modal';
      this.modalElement.innerHTML = `
        <div style="
          position: fixed;
          background: linear-gradient(135deg, ${riskColor} 0%, ${this.darkenColor(riskColor)} 100%);
          color: white;
          padding: 20px;
          border-radius: 12px;
          box-shadow: 0 20px 40px rgba(0,0,0,0.3);
          z-index: 999999;
          max-width: 400px;
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', system-ui, sans-serif;
          font-size: 14px;
          line-height: 1.4;
          border: 2px solid rgba(255,255,255,0.2);
        ">
          <div style="display: flex; align-items: center; margin-bottom: 12px;">
            <span style="font-size: 24px; margin-right: 10px;">⚠️</span>
            <h3 style="margin: 0; font-size: 16px; font-weight: 600;">
              Sensitive Data Detected
            </h3>
          </div>
          
          <p style="margin: 0 0 12px 0; opacity: 0.95;">
            We found potentially sensitive information in your ${this.platform.name} prompt:
          </p>
          
          <ul style="margin: 0 0 16px 0; padding-left: 20px; opacity: 0.9;">
            ${piiList}
          </ul>
          
          <div style="display: flex; gap: 10px; margin-top: 16px;">
            <button id="complyze-view-safe" style="
              flex: 1;
              background: rgba(255,255,255,0.2);
              border: 1px solid rgba(255,255,255,0.3);
              color: white;
              padding: 10px 16px;
              border-radius: 6px;
              cursor: pointer;
              font-size: 13px;
              font-weight: 500;
              transition: all 0.2s ease;
            " onmouseover="this.style.background='rgba(255,255,255,0.3)'" 
               onmouseout="this.style.background='rgba(255,255,255,0.2)'">
              ${this.getRedactionButtonText()}
            </button>
            
            <button id="complyze-send-anyway" style="
              flex: 1;
              background: rgba(0,0,0,0.2);
              border: 1px solid rgba(255,255,255,0.3);
              color: white;
              padding: 10px 16px;
              border-radius: 6px;
              cursor: pointer;
              font-size: 13px;
              font-weight: 500;
              transition: all 0.2s ease;
            " onmouseover="this.style.background='rgba(0,0,0,0.3)'" 
               onmouseout="this.style.background='rgba(0,0,0,0.2)'">
              Send Anyway
            </button>
          </div>
          
          <button id="complyze-close-modal" style="
            position: absolute;
            top: 8px;
            right: 8px;
            background: none;
            border: none;
            color: white;
            cursor: pointer;
            font-size: 18px;
            width: 24px;
            height: 24px;
            display: flex;
            align-items: center;
            justify-content: center;
            border-radius: 4px;
            opacity: 0.7;
            transition: opacity 0.2s ease;
          " onmouseover="this.style.opacity='1'" 
             onmouseout="this.style.opacity='0.7'">
            ×
          </button>
        </div>
      `;
      
      document.body.appendChild(this.modalElement);
    }
    
    positionModal() {
      if (!this.modalElement || !this.inputElement) return;
      
      try {
        const rect = this.inputElement.getBoundingClientRect();
        const modalRect = this.modalElement.firstElementChild.getBoundingClientRect();
        const viewportHeight = window.innerHeight;
        
        // Calculate optimal position to keep chat box visible
        // Position the modal much higher up to ensure input remains visible
        let top = Math.max(20, rect.top - 300); // Much larger distance from input
        
        // If modal would go too high, position it in the upper area
        if (top < 20) {
          top = 20;
        }
        
        // If input is in lower half of screen, position modal in upper third
        if (rect.top > viewportHeight * 0.5) {
          top = Math.min(viewportHeight * 0.15, rect.top - 350);
        }
        
        // Ensure there's always significant space above the input
        const minSpaceAboveInput = 250;
        if (rect.top - top < minSpaceAboveInput) {
          top = Math.max(20, rect.top - minSpaceAboveInput);
        }
        
        // Center horizontally relative to input
        let left = rect.left + (rect.width / 2) - (modalRect.width / 2);
        
        // Ensure modal stays within viewport horizontally
        const margin = 20;
        if (left < margin) left = margin;
        if (left + modalRect.width > window.innerWidth - margin) {
          left = window.innerWidth - modalRect.width - margin;
        }
        
        const modalContainer = this.modalElement.firstElementChild;
        modalContainer.style.top = `${top}px`;
        modalContainer.style.left = `${left}px`;
        
      } catch (error) {
        console.warn('Error positioning modal:', error);
      }
    }
    
    bindEvents() {
      const viewSafeBtn = this.modalElement.querySelector('#complyze-view-safe');
      const sendAnywayBtn = this.modalElement.querySelector('#complyze-send-anyway');
      const closeBtn = this.modalElement.querySelector('#complyze-close-modal');
      
      viewSafeBtn?.addEventListener('click', () => {
        this.handleViewSafe();
      });
      
      sendAnywayBtn?.addEventListener('click', () => {
        this.handleSendAnyway();
      });
      
      closeBtn?.addEventListener('click', () => {
        this.hide();
      });
      
      // Close on click outside
      this.modalElement.addEventListener('click', (e) => {
        if (e.target === this.modalElement) {
          this.hide();
        }
      });
    }
    
    async handleViewSafe() {
      try {
        const originalPrompt = this.getInputText();
        
        // Show loading state
        const viewSafeBtn = document.querySelector('#complyze-view-safe');
        const originalBtnText = viewSafeBtn.textContent;
        viewSafeBtn.textContent = '🔄 Optimizing...';
        viewSafeBtn.disabled = true;
        
        // Get redaction mode from monitor
        const redactionMode = window.complyzeMonitor?.getRedactionMode() || 'structured_redact';
        console.log('🔧 Using redaction mode:', redactionMode);
        console.log('🔧 PromptOptimizer available:', !!window.PromptOptimizer);
        console.log('🔧 Original prompt length:', originalPrompt.length);
        console.log('🔧 Detected PII:', this.detectedPII);
        
        // Debug: Check if we have the right conditions for smart rewrite
        if (redactionMode === 'smart_rewrite') {
          if (!window.PromptOptimizer) {
            console.warn('⚠️ Smart Rewrite selected but PromptOptimizer not available. Using structured redaction.');
          } else {
            console.log('✅ Smart Rewrite mode active with PromptOptimizer available');
          }
        }
        
        let optimizedText;
        let optimizationResult = null;
        
        if (redactionMode === 'smart_rewrite' && window.PromptOptimizer) {
          // Use AI-powered smart rewrite (no redaction tags)
          console.log('🤖 Attempting Smart Rewrite...');
          const optimizer = new window.PromptOptimizer();
          
          // Debug optimizer state
          console.log('🔧 Optimizer created:', {
            enabled: optimizer.enabled,
            hasApiKey: !!optimizer.apiKey,
            model: optimizer.model,
            baseUrl: optimizer.baseUrl
          });
          
          // Check if optimizer is properly configured
          await optimizer.loadSettings();
          console.log('🔑 PromptOptimizer settings loaded');
          
          // Debug optimizer state after loading settings
          console.log('🔧 Optimizer after loadSettings:', {
            enabled: optimizer.enabled,
            hasApiKey: !!optimizer.apiKey,
            apiKeyPrefix: optimizer.apiKey ? optimizer.apiKey.substring(0, 8) + '...' : 'None',
            model: optimizer.model,
            baseUrl: optimizer.baseUrl
          });
          
          // Force enable if we have an API key
          if (optimizer.apiKey && !optimizer.enabled) {
            console.log('🔧 Forcing optimizer to enabled state');
            optimizer.enabled = true;
          }
          
          optimizationResult = await optimizer.smartRewrite(originalPrompt, this.detectedPII);
          
          console.log('🤖 Smart rewrite result:', optimizationResult);
          console.log('🔧 Result method:', optimizationResult.method);
          console.log('🔧 Result optimizedText length:', optimizationResult.optimizedText?.length);
          
          // If smart rewrite failed and fell back to basic redaction, use structured redaction instead
          if (optimizationResult.method === 'basic_redaction_fallback' || 
              optimizationResult.method === 'structured_redaction_fallback') {
            console.warn('⚠️ Smart rewrite failed with API error. Falling back to structured redaction.');
            console.log('🔄 Error details:', optimizationResult.error);
            
            // Fall back to structured redaction
            optimizedText = this.redactSensitiveData(originalPrompt);
            optimizationResult = {
              optimizedText,
              method: 'structured_redaction_fallback',
              cost: 0,
              originalError: optimizationResult.error
            };
            
            console.log('🔒 Using structured redaction as fallback');
            
            // Show a brief, non-blocking notification about the fallback
            this.showFallbackNotification();
          } else if (optimizationResult.method === 'smart_rewrite') {
            // Successful smart rewrite
            optimizedText = optimizationResult.optimizedText;
            console.log('✅ Smart rewrite successful!');
            console.log('📝 Original text preview:', originalPrompt.substring(0, 100) + '...');
            console.log('📝 Optimized text preview:', optimizedText.substring(0, 100) + '...');
          } else {
            // Unexpected result, fall back to structured redaction
            console.warn('⚠️ Unexpected smart rewrite result method:', optimizationResult.method);
            optimizedText = this.redactSensitiveData(originalPrompt);
            optimizationResult = {
              optimizedText,
              method: 'structured_redaction_fallback',
              cost: 0
            };
          }
        } else if (redactionMode === 'smart_rewrite' && !window.PromptOptimizer) {
          // PromptOptimizer not available, show error
          alert('Smart Rewrite requires PromptOptimizer to be loaded. Please check your setup.');
          console.error('❌ Smart Rewrite mode selected but PromptOptimizer not available');
          return;
        } else if (redactionMode === 'structured_redact') {
          // Use structured redaction with tags
          console.log('🔒 Applying Structured Redaction...');
          console.log('🔍 Detected PII types:', this.detectedPII.map(pii => pii.type));
          optimizedText = this.redactSensitiveData(originalPrompt);
          optimizationResult = {
            optimizedText,
            method: 'structured_redaction',
            cost: 0
          };
          
          console.log('🔒 Structured redaction applied');
          console.log('📝 Original length:', originalPrompt.length, 'Redacted length:', optimizedText.length);
        } else {
          // Fallback to basic redaction
          optimizedText = this.redactSensitiveData(originalPrompt);
          optimizationResult = {
            optimizedText,
            method: 'fallback_redaction',
            cost: 0
          };
        }
        
        this.setInputText(optimizedText);
        this.hide();
        
        // Mark this text as safe to prevent re-blocking
        if (window.complyzeMonitor) {
          window.complyzeMonitor.lastPromptText = optimizedText;
          window.complyzeMonitor.safeTextInserted = true;
          window.complyzeMonitor.unblockSubmission();
          
          // Clear the safe flag after a short delay to allow normal monitoring to resume
          setTimeout(() => {
            if (window.complyzeMonitor) {
              window.complyzeMonitor.safeTextInserted = false;
            }
          }, 3000);
        }
        
        // Log optimization to Supabase if it was AI-optimized
        if (optimizationResult && (optimizationResult.method === 'ai_optimization' || optimizationResult.method === 'smart_rewrite')) {
          this.logOptimizationEvent(originalPrompt, optimizedText, optimizationResult);
        }
        
        // Reset button
        viewSafeBtn.textContent = originalBtnText;
        viewSafeBtn.disabled = false;
        
      } catch (error) {
        console.error('Error creating safe version:', error);
        alert('Failed to create safe version. Please try again.');
        
        // Reset button on error
        const viewSafeBtn = document.querySelector('#complyze-view-safe');
        if (viewSafeBtn) {
          viewSafeBtn.textContent = '🔒 View Safe Version';
          viewSafeBtn.disabled = false;
        }
      }
    }
    
    async logOptimizationEvent(originalPrompt, optimizedText, optimizationResult) {
      try {
        // Check if user is authenticated
        let isAuthenticated = false;
        if (window.complyzeSidebar && window.complyzeSidebar.isUserAuthenticated()) {
          isAuthenticated = true;
        } else {
          const storage = await chrome.storage.local.get(['complyzeUserUUID', 'complyzeUserEmail']);
          isAuthenticated = !!(storage.complyzeUserUUID && storage.complyzeUserEmail);
        }

        if (!isAuthenticated) {
          console.warn('⚠️ User not authenticated. Optimization events will not be logged. Please login through the Complyze sidebar.');
          return;
        }

        const eventData = {
          type: 'prompt_optimization',
          original_text: originalPrompt,
          optimized_text: optimizedText,
          method: optimizationResult.method,
          model: optimizationResult.model,
          cost: optimizationResult.cost,
          usage: optimizationResult.usage,
          detected_pii: this.detectedPII.map(pii => pii.type),
          platform: this.platform.name,
          timestamp: new Date().toISOString()
        };
        
        console.log('📤 Sending optimization event to background (authenticated user):', eventData);
        
        await chrome.runtime.sendMessage({
          type: 'LOG_OPTIMIZATION_EVENT',
          data: eventData
        });
        
      } catch (error) {
        console.error('Failed to log optimization event:', error);
      }
    }
    
    handleSendAnyway() {
      this.hide();
      
      // Temporarily unblock submission to allow sending
      if (window.complyzeMonitor && window.complyzeMonitor.unblockSubmission) {
        window.complyzeMonitor.unblockSubmission();
        
        // Re-enable blocking after a short delay
        setTimeout(() => {
          if (window.complyzeMonitor && window.complyzeMonitor.blockSubmission) {
            const currentText = window.complyzeMonitor.getInputText();
            const detectedPII = PIIDetector.detectSensitiveData(currentText);
            if (detectedPII.length > 0) {
              window.complyzeMonitor.blockSubmission();
            }
          }
        }, 2000);
      }
      
      // Let the user proceed with their original prompt
      console.log('User chose to send message anyway');
    }
    
    redactSensitiveData(text) {
      let redactedText = text;
      
      console.log('🔍 Starting structured redaction on text:', text.substring(0, 100) + '...');
      
      for (const [type, config] of Object.entries(PII_PATTERNS)) {
        const beforeLength = redactedText.length;
        redactedText = redactedText.replace(config.pattern, (match) => {
          console.log(`🎯 Found ${type}: ${match}`);
          switch (type) {
            case 'CREDIT_CARD':
              return '[CREDIT_CARD_REDACTED]';
            case 'SSN':
              return '[SSN_REDACTED]';
            case 'EMAIL':
              return '[EMAIL_REDACTED]';
            case 'PHONE':
              return '[PHONE_REDACTED]';
            case 'IP_ADDRESS':
              return '[IP_REDACTED]';
            case 'API_KEY':
              return '[API_KEY_REDACTED]';
            case 'OAUTH_TOKEN':
              return '[TOKEN_REDACTED]';
            case 'SSH_KEY':
              return '[SSH_KEY_REDACTED]';
            case 'PASSWORD':
              return '[PASSWORD_REDACTED]';
            case 'NAME':
              return '[NAME_REDACTED]';
            case 'ADDRESS':
              return '[ADDRESS_REDACTED]';
            case 'PASSPORT':
              return '[PASSPORT_REDACTED]';
            case 'MEDICAL':
              return '[MEDICAL_INFO_REDACTED]';
            case 'FINANCIAL_RECORD':
              return '[FINANCIAL_REDACTED]';
            case 'BIOMETRIC':
              return '[BIOMETRIC_REDACTED]';
            case 'JAILBREAK_IGNORE':
              return '[INSTRUCTION_REDACTED]';
            case 'JAILBREAK_INJECTION':
              return '[INJECTION_REDACTED]';
            default:
              return '[REDACTED]';
          }
        });
        
        if (redactedText.length !== beforeLength) {
          console.log(`✅ Applied ${type} redaction`);
        }
      }
      
      console.log('🔒 Structured redaction complete');
      return redactedText;
    }
    
    getInputText() {
      if (this.inputElement.tagName === 'TEXTAREA') {
        return this.inputElement.value;
      } else {
        return this.inputElement.textContent || this.inputElement.innerText || '';
      }
    }
    
    setInputText(text) {
      if (this.inputElement.tagName === 'TEXTAREA') {
        this.inputElement.value = text;
        this.inputElement.dispatchEvent(new Event('input', { bubbles: true }));
      } else {
        this.inputElement.textContent = text;
        this.inputElement.dispatchEvent(new Event('input', { bubbles: true }));
      }
    }
    
    getRedactionButtonText() {
      const redactionMode = window.complyzeMonitor?.getRedactionMode() || 'structured_redact';
      if (redactionMode === 'smart_rewrite') {
        return '🤖 Create Smart Rewrite';
      } else {
        return '🔒 Apply Structured Redact';
      }
    }
    
    darkenColor(color) {
      // Simple color darkening function
      const hex = color.replace('#', '');
      const r = Math.max(0, parseInt(hex.substr(0, 2), 16) - 30);
      const g = Math.max(0, parseInt(hex.substr(2, 2), 16) - 30);
      const b = Math.max(0, parseInt(hex.substr(4, 2), 16) - 30);
      return `#${r.toString(16).padStart(2, '0')}${g.toString(16).padStart(2, '0')}${b.toString(16).padStart(2, '0')}`;
    }
    
    showFallbackNotification() {
      // Create a temporary notification about the fallback
      const notification = document.createElement('div');
      notification.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        background: linear-gradient(135deg, #f59e0b 0%, #f97316 100%);
        color: white;
        padding: 12px 16px;
        border-radius: 8px;
        box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
        z-index: 999999;
        font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', system-ui, sans-serif;
        font-size: 14px;
        max-width: 300px;
        animation: slideIn 0.3s ease-out;
      `;
      
      notification.innerHTML = `
        <div style="display: flex; align-items: center; gap: 8px;">
          <span>⚠️</span>
          <span>Smart Rewrite unavailable - using Structured Redaction instead</span>
        </div>
      `;
      
      // Add animation styles
      const style = document.createElement('style');
      style.textContent = `
        @keyframes slideIn {
          from {
            transform: translateX(100%);
            opacity: 0;
          }
          to {
            transform: translateX(0);
            opacity: 1;
          }
        }
        @keyframes slideOut {
          from {
            transform: translateX(0);
            opacity: 1;
          }
          to {
            transform: translateX(100%);
            opacity: 0;
          }
        }
      `;
      document.head.appendChild(style);
      
      document.body.appendChild(notification);
      
      // Auto-remove after 4 seconds
      setTimeout(() => {
        notification.style.animation = 'slideOut 0.3s ease-in';
        setTimeout(() => {
          if (notification.parentNode) {
            notification.parentNode.removeChild(notification);
          }
          if (style.parentNode) {
            style.parentNode.removeChild(style);
          }
        }, 300);
      }, 4000);
    }
  }
  
  // Main Monitoring System
  class ComplyzeMonitor {
    constructor() {
      this.platform = detectPlatform();
      this.inputElement = null;
      this.submitButtons = [];
      this.lastPromptText = '';
      this.checkInterval = null;
      this.buttonObserver = null;
      this.warningModal = null;
      this.isEnabled = true;
      this.isBlocked = false;
      this.originalButtonStates = new Map();
      this.keydownHandler = null;
      this.redactionMode = 'structured_redact'; // Default mode
      this.safeTextInserted = false; // Flag to prevent blocking safe text
      
      if (this.platform) {
        this.initialize();
      }
      
      // Load redaction mode and listen for changes
      this.loadRedactionMode();
      this.setupRedactionModeListener();
    }
    
    async initialize() {
      console.log('Initializing Complyze AI Guard on', this.platform.name);
      
      // Check if extension is enabled
      const settings = await chrome.storage.local.get(['extensionEnabled', 'piiDetectionEnabled']);
      this.isEnabled = settings.extensionEnabled !== false && settings.piiDetectionEnabled !== false;
      
      if (!this.isEnabled) {
        console.log('Complyze AI Guard is disabled');
        return;
      }
      
      this.findInputElement();
      this.startMonitoring();
    }
    
    findInputElement() {
      // Try primary selector
      let element = document.querySelector(this.platform.promptInput);
      
      // Try fallback selector if primary fails
      if (!element && this.platform.fallbackPromptInput) {
        element = document.querySelector(this.platform.fallbackPromptInput);
      }
      
      // Advanced fallback: find contenteditable divs or textareas
      if (!element) {
        const candidates = [
          ...document.querySelectorAll('div[contenteditable="true"]'),
          ...document.querySelectorAll('textarea'),
          ...document.querySelectorAll('[role="textbox"]')
        ];
        
        // Find the most likely prompt input (largest, visible, not in header/nav)
        element = candidates.find(el => {
          const rect = el.getBoundingClientRect();
          const isVisible = rect.width > 100 && rect.height > 20;
          const notInNav = !el.closest('nav, header, .nav, .header');
          return isVisible && notInNav;
        });
      }
      
      if (element) {
        this.inputElement = element;
        console.log('Found input element:', element);
        this.findSubmitButtons();
        this.setupButtonObserver();
      } else {
        console.warn('Could not find prompt input element for', this.platform.name);
        // Retry after a delay
        setTimeout(() => this.findInputElement(), 2000);
      }
    }

    findSubmitButtons() {
      this.submitButtons = [];
      
      // Try primary selectors
      const primaryButtons = document.querySelectorAll(this.platform.submitButton);
      this.submitButtons.push(...primaryButtons);
      console.log('🔍 Primary buttons found:', primaryButtons.length, 'with selector:', this.platform.submitButton);
      
      // Try fallback selectors if configured
      if (this.platform.fallbackSubmitButton && this.submitButtons.length === 0) {
        const fallbackButtons = document.querySelectorAll(this.platform.fallbackSubmitButton);
        this.submitButtons.push(...fallbackButtons);
        console.log('🔍 Fallback buttons found:', fallbackButtons.length, 'with selector:', this.platform.fallbackSubmitButton);
      }
      
      // Advanced fallback: find buttons near the input
      if (this.submitButtons.length === 0 && this.inputElement) {
        console.log('🔍 No buttons found with selectors, searching near input element...');
        const parentForm = this.inputElement.closest('form');
        const container = parentForm || this.inputElement.closest('div');
        
        if (container) {
          const candidateButtons = container.querySelectorAll('button, [role="button"]');
          console.log('🔍 Found', candidateButtons.length, 'candidate buttons in container');
          
          // Filter for likely submit buttons
          const likelyButtons = Array.from(candidateButtons).filter(btn => {
            const text = btn.textContent?.toLowerCase() || '';
            const ariaLabel = btn.getAttribute('aria-label')?.toLowerCase() || '';
            const hasIcon = btn.querySelector('svg, .icon') !== null;
            const dataTestId = btn.getAttribute('data-testid')?.toLowerCase() || '';
            
            const isLikelySubmit = (
              text.includes('send') || 
              text.includes('submit') || 
              ariaLabel.includes('send') || 
              ariaLabel.includes('submit') ||
              dataTestId.includes('send') ||
              (hasIcon && !text.includes('cancel') && !text.includes('clear') && !text.includes('delete'))
            );
            
            if (isLikelySubmit) {
              console.log('🎯 Identified submit button:', {
                text: text,
                ariaLabel: ariaLabel,
                dataTestId: dataTestId,
                hasIcon: hasIcon,
                element: btn
              });
            }
            
            return isLikelySubmit;
          });
          
          this.submitButtons.push(...likelyButtons);
        }
      }
      
      // Final fallback: look for any button with send-related attributes globally
      if (this.submitButtons.length === 0) {
        console.log('🔍 Still no buttons found, doing global search...');
        const globalButtons = document.querySelectorAll(
          'button[aria-label*="send" i], button[aria-label*="submit" i], ' +
          'button[data-testid*="send" i], button[data-testid*="submit" i], ' +
          'button:has(svg[data-icon*="send" i]), ' +
          'form button[type="submit"]'
        );
        
        if (globalButtons.length > 0) {
          this.submitButtons.push(...globalButtons);
          console.log('🎯 Global search found', globalButtons.length, 'buttons');
        }
      }
      
      console.log('📊 Total submit buttons found:', this.submitButtons.length);
      this.submitButtons.forEach((btn, index) => {
        console.log(`  ${index + 1}. Button:`, {
          text: btn.textContent?.substring(0, 50),
          ariaLabel: btn.getAttribute('aria-label'),
          dataTestId: btn.getAttribute('data-testid'),
          disabled: btn.disabled,
          element: btn
        });
      });
    }

    setupButtonObserver() {
      // Use MutationObserver to watch for button changes
      if (this.buttonObserver) {
        this.buttonObserver.disconnect();
      }
      
      this.buttonObserver = new MutationObserver((mutations) => {
        let shouldRefindButtons = false;
        
        mutations.forEach((mutation) => {
          if (mutation.type === 'childList') {
            // Check if any added nodes contain buttons
            mutation.addedNodes.forEach((node) => {
              if (node.nodeType === Node.ELEMENT_NODE) {
                const hasButtons = node.matches && node.matches('button, [role="button"]') ||
                                 node.querySelector && node.querySelector('button, [role="button"]');
                if (hasButtons) {
                  shouldRefindButtons = true;
                }
              }
            });
          }
        });
        
        if (shouldRefindButtons) {
          setTimeout(() => {
            this.findSubmitButtons();
            if (this.isBlocked) {
              this.blockSubmission();
            }
          }, 100);
        }
      });
      
      // Observe the entire document for button changes
      this.buttonObserver.observe(document.body, {
        childList: true,
        subtree: true
      });
    }

    blockSubmission() {
      if (this.isBlocked) return;
      
      this.isBlocked = true;
      console.log('🚫 BLOCKING form submission due to sensitive data');
      console.log('🔒 Disabling', this.submitButtons.length, 'submit buttons');
      
      // Block all submit buttons
      this.submitButtons.forEach((button, index) => {
        if (!this.originalButtonStates.has(button)) {
          this.originalButtonStates.set(button, {
            disabled: button.disabled,
            textContent: button.textContent,
            innerHTML: button.innerHTML,
            onclick: button.onclick,
            style: button.style.cssText,
            className: button.className
          });
        }
        
        console.log(`🔒 Blocking button ${index + 1}:`, {
          wasDisabled: button.disabled,
          text: button.textContent?.substring(0, 30),
          ariaLabel: button.getAttribute('aria-label')
        });
        
        // Disable the button with multiple approaches
        button.disabled = true;
        button.setAttribute('disabled', 'true');
        button.setAttribute('aria-disabled', 'true');
        
        // Change button appearance and text
        button.style.opacity = '0.5';
        button.style.cursor = 'not-allowed';
        button.style.pointerEvents = 'none';
        button.style.filter = 'grayscale(1)';
        
        // Add visual blocked class
        if (!button.classList.contains('complyze-blocked')) {
          button.classList.add('complyze-blocked');
        }
        
        // Update button text if it's text-based
        if (button.textContent && !button.querySelector('svg')) {
          button.textContent = '🛑 Blocked by Complyze';
        } else if (button.querySelector('svg')) {
          // For icon buttons, add a blocked indicator
          const indicator = document.createElement('span');
          indicator.textContent = '🛑';
          indicator.style.cssText = `
            position: absolute;
            top: -5px;
            right: -5px;
            font-size: 12px;
            z-index: 999999;
            background: red;
            color: white;
            border-radius: 50%;
            width: 18px;
            height: 18px;
            display: flex;
            align-items: center;
            justify-content: center;
            font-size: 10px;
          `;
          indicator.classList.add('complyze-block-indicator');
          
          if (!['relative', 'absolute'].includes(button.style.position)) {
            button.style.position = 'relative';
          }
          
          if (!button.querySelector('.complyze-block-indicator')) {
            button.appendChild(indicator);
          }
        }
        
        // Override click handlers completely
        button.onclick = (e) => {
          e.preventDefault();
          e.stopPropagation();
          e.stopImmediatePropagation();
          console.log('🚫 Button click blocked by Complyze');
          return false;
        };
        
        // Add event listeners to block clicks at multiple levels
        button.addEventListener('click', this.preventClick, true);
        button.addEventListener('mousedown', this.preventClick, true);
        button.addEventListener('mouseup', this.preventClick, true);
        button.addEventListener('keydown', this.preventClick, true);
        button.addEventListener('keyup', this.preventClick, true);
        
        // Additional attributes to make it clear the button is blocked
        button.setAttribute('data-complyze-blocked', 'true');
        button.setAttribute('title', 'Blocked by Complyze - Sensitive data detected');
      });
      
      // Block Enter key in input fields
      this.keydownHandler = (e) => {
        if (e.key === 'Enter' && !e.shiftKey) {
          const activeElement = document.activeElement;
          if (activeElement === this.inputElement || 
              activeElement.closest('form') === this.inputElement.closest('form')) {
            e.preventDefault();
            e.stopPropagation();
            e.stopImmediatePropagation();
            console.log('🚫 Blocked Enter key submission');
            return false;
          }
        }
      };
      
      document.addEventListener('keydown', this.keydownHandler, true);
      
      // Block form submission
      const form = this.inputElement.closest('form');
      if (form) {
        form.addEventListener('submit', this.preventSubmit, true);
      }
      
      console.log('✅ Submit blocking applied successfully');
    }

    unblockSubmission() {
      if (!this.isBlocked) return;
      
      this.isBlocked = false;
      console.log('🔓 UNBLOCKING form submission');
      console.log('🔓 Restoring', this.submitButtons.length, 'submit buttons');
      
      // Restore submit buttons
      this.submitButtons.forEach((button, index) => {
        const originalState = this.originalButtonStates.get(button);
        if (originalState) {
          console.log(`🔓 Restoring button ${index + 1}:`, {
            originalDisabled: originalState.disabled,
            text: button.textContent?.substring(0, 30)
          });
          
          button.disabled = originalState.disabled;
          button.textContent = originalState.textContent;
          button.innerHTML = originalState.innerHTML;
          button.onclick = originalState.onclick;
          button.style.cssText = originalState.style;
          button.className = originalState.className;
          
          // Remove Complyze-specific attributes
          button.removeAttribute('disabled');
          if (!originalState.disabled) {
            button.removeAttribute('aria-disabled');
          }
          button.removeAttribute('data-complyze-blocked');
          button.removeAttribute('title');
          
          // Remove block indicators
          const indicator = button.querySelector('.complyze-block-indicator');
          if (indicator) {
            indicator.remove();
          }
          
          // Remove blocked class
          button.classList.remove('complyze-blocked');
        } else {
          console.log(`🔓 No original state for button ${index + 1}, using defaults`);
          // If no original state, just remove blocking attributes
          button.disabled = false;
          button.removeAttribute('disabled');
          button.removeAttribute('aria-disabled');
          button.removeAttribute('data-complyze-blocked');
          button.removeAttribute('title');
          button.style.opacity = '';
          button.style.cursor = '';
          button.style.pointerEvents = '';
          button.style.filter = '';
          button.classList.remove('complyze-blocked');
          
          const indicator = button.querySelector('.complyze-block-indicator');
          if (indicator) {
            indicator.remove();
          }
        }
        
        // Remove event listeners
        button.removeEventListener('click', this.preventClick, true);
        button.removeEventListener('mousedown', this.preventClick, true);
        button.removeEventListener('mouseup', this.preventClick, true);
        button.removeEventListener('keydown', this.preventClick, true);
        button.removeEventListener('keyup', this.preventClick, true);
      });
      
      this.originalButtonStates.clear();
      
      // Remove keydown handler
      if (this.keydownHandler) {
        document.removeEventListener('keydown', this.keydownHandler, true);
        this.keydownHandler = null;
      }
      
      // Remove form submission blocker
      const form = this.inputElement.closest('form');
      if (form) {
        form.removeEventListener('submit', this.preventSubmit, true);
      }
      
      console.log('✅ Submit unblocking completed successfully');
    }

    preventClick = (e) => {
      e.preventDefault();
      e.stopPropagation();
      e.stopImmediatePropagation();
      console.log('Prevented button click due to sensitive data');
      return false;
    }

    preventSubmit = (e) => {
      e.preventDefault();
      e.stopPropagation();
      console.log('Prevented form submission due to sensitive data');
      return false;
    }
    
    startMonitoring() {
      if (!this.inputElement) {
        setTimeout(() => this.startMonitoring(), 1000);
        return;
      }
      
      // Monitor for text changes
      this.checkInterval = setInterval(() => {
        this.checkForSensitiveData();
      }, 500);
      
      // Also monitor input events for immediate response
      this.inputElement.addEventListener('input', () => {
        setTimeout(() => this.checkForSensitiveData(), 100);
      });
      
      this.inputElement.addEventListener('paste', () => {
        setTimeout(() => this.checkForSensitiveData(), 100);
      });
      
      console.log('Started monitoring for sensitive data on', this.platform.name);
    }
    
    checkForSensitiveData() {
      if (!this.inputElement || !this.isEnabled) return;
      
      const currentText = this.getInputText();
      if (currentText === this.lastPromptText || currentText.length < 3) {
        // If text is cleared or very short, unblock submission
        if (currentText.length < 3 && this.isBlocked) {
          this.unblockSubmission();
          this.hideWarning();
        }
        return;
      }
      
      // Don't block if safe text was just inserted
      if (this.safeTextInserted) {
        console.log('🟢 Safe text detected, skipping PII check temporarily');
        this.unblockSubmission();
        this.hideWarning();
        return;
      }
      
      this.lastPromptText = currentText;
      
      const allDetectedPII = PIIDetector.detectSensitiveData(currentText);
      
      // Filter detected PII based on active rules from sidebar
      const filteredPII = this.filterPIIByActiveRules(allDetectedPII);
      
      if (filteredPII.length > 0) {
        console.log('Sensitive data detected (filtered by active rules):', filteredPII);
        this.blockSubmission();
        this.showWarning(filteredPII, currentText);
        this.syncToSupabase(currentText, filteredPII);
      } else {
        this.unblockSubmission();
        this.hideWarning();
      }
    }
    
    filterPIIByActiveRules(detectedPII) {
      console.log('🔍 Filtering PII by active rules...');
      console.log('📋 Detected PII:', detectedPII.map(p => p.type));
      console.log('⚙️ Active rules:', this.activeRules);
      
      // If no active rules configured, return all detections to block submission (safer default)
      if (!this.activeRules) {
        console.log('⚠️ No active rules configured, allowing all detections to trigger blocking (waiting for sidebar)');
        return detectedPII;
      }
      
      // Mapping from PII_PATTERNS types to sidebar rule categories
      const piiToRuleMapping = {
        // PII section
        'NAME': { section: 'pii', rule: 'name' },
        'EMAIL': { section: 'pii', rule: 'email' },
        'PHONE': { section: 'pii', rule: 'phoneNumber' },
        'ADDRESS': { section: 'pii', rule: 'address' },
        'SSN': { section: 'pii', rule: 'ssn' },
        'PASSPORT': { section: 'pii', rule: 'passportNumber' },
        'IP_ADDRESS': { section: 'pii', rule: 'ipAddress' },
        
        // Credentials section
        'API_KEY': { section: 'credentials', rule: 'apiKeys' },
        'OAUTH_TOKEN': { section: 'credentials', rule: 'oauthTokens' },
        'SSH_KEY': { section: 'credentials', rule: 'sshKeys' },
        'VAULT_PATH': { section: 'credentials', rule: 'vaultPaths' },
        'ACCESS_TOKEN': { section: 'credentials', rule: 'accessTokens' },
        'PASSWORD': { section: 'credentials', rule: 'passwords' },
        'CREDIT_CARD': { section: 'credentials', rule: 'passwords' }, // Treating as sensitive credential
        
        // Company Internal section
        'INTERNAL_URL': { section: 'companyInternal', rule: 'internalUrls' },
        'PROJECT_CODENAME': { section: 'companyInternal', rule: 'projectCodenames' },
        'INTERNAL_TOOL': { section: 'companyInternal', rule: 'internalTools' },
        'SYSTEM_IP': { section: 'companyInternal', rule: 'systemIpRanges' },
        'INTERNAL_MEMO': { section: 'companyInternal', rule: 'internalMemos' },
        'STRATEGIC_PLAN': { section: 'companyInternal', rule: 'strategicPlans' },
        'PROPRIETARY_DATA': { section: 'companyInternal', rule: 'proprietaryData' },
        'TECHNICAL_DESIGN': { section: 'companyInternal', rule: 'technicalDesigns' },
        'RD_ARTIFACT': { section: 'companyInternal', rule: 'rdArtifacts' },
        
        // AI Model section
        'MODEL_NAME': { section: 'aiModel', rule: 'modelNames' },
        'TRAINING_DATA': { section: 'aiModel', rule: 'trainingDataRefs' },
        'FINETUNED_LOGIC': { section: 'aiModel', rule: 'finetunedLogic' },
        'PRIVATE_WEIGHTS': { section: 'aiModel', rule: 'privateWeights' },
        
        // Regulated section
        'MEDICAL': { section: 'regulated', rule: 'phi' },
        'FINANCIAL_RECORD': { section: 'regulated', rule: 'financialRecords' },
        'EXPORT_CONTROLLED': { section: 'regulated', rule: 'exportControlled' },
        'WHISTLEBLOWER': { section: 'regulated', rule: 'whistleblowerIds' },
        'BIOMETRIC': { section: 'regulated', rule: 'biometricData' },
        
        // Jailbreak section
        'JAILBREAK_IGNORE': { section: 'jailbreak', rule: 'ignorePrevious' },
        'JAILBREAK_INJECTION': { section: 'jailbreak', rule: 'promptInjection' },
        'JAILBREAK_WORKAROUND': { section: 'jailbreak', rule: 'jailbreakWorkarounds' }
      };
      
      const filteredPII = detectedPII.filter(pii => {
        const mapping = piiToRuleMapping[pii.type];
        if (!mapping) {
          // If no mapping found, allow detection (for future compatibility)
          console.log(`✅ ${pii.type}: No mapping found, allowing`);
          return true;
        }
        
        const sectionRules = this.activeRules[mapping.section];
        if (!sectionRules) {
          // If section doesn't exist, allow detection
          console.log(`✅ ${pii.type}: Section ${mapping.section} doesn't exist, allowing`);
          return true;
        }
        
        // Only include this PII type if the corresponding rule is active
        const isActive = sectionRules[mapping.rule] === true;
        console.log(`${isActive ? '✅' : '❌'} ${pii.type}: Rule ${mapping.section}.${mapping.rule} = ${sectionRules[mapping.rule]} (${isActive ? 'ALLOWED' : 'BLOCKED'})`);
        return isActive;
      });
      
      console.log('📋 Filtered PII result:', filteredPII.map(p => p.type));
      return filteredPII;
    }
    
    showWarning(detectedPII, promptText) {
      if (!this.warningModal) {
        this.warningModal = new WarningModal(this.platform, detectedPII, this.inputElement);
      }
      this.warningModal.show(promptText);
    }
    
    hideWarning() {
      if (this.warningModal) {
        this.warningModal.hide();
      }
    }
    
    async syncToSupabase(promptText, detectedPII) {
      try {
        // Primary authentication check: sidebar authentication first
        let isAuthenticated = false;
        let userUUID = null;
        let userEmail = null;
        
        // Check sidebar authentication first (most reliable)
        if (window.complyzeSidebar && window.complyzeSidebar.isUserAuthenticated()) {
          isAuthenticated = true;
          userUUID = window.complyzeSidebar.userUUID;
          userEmail = window.complyzeSidebar.userEmail;
          console.log('✅ Using sidebar authentication:', { userEmail, userUUID: userUUID?.substring(0, 8) + '...' });
        } else {
          // Fallback: check storage directly
          const storage = await chrome.storage.local.get(['complyzeUserUUID', 'complyzeUserEmail']);
          if (storage.complyzeUserUUID && storage.complyzeUserEmail) {
            isAuthenticated = true;
            userUUID = storage.complyzeUserUUID;
            userEmail = storage.complyzeUserEmail;
            console.log('✅ Using storage authentication:', { userEmail, userUUID: userUUID?.substring(0, 8) + '...' });
          } else {
            // Last resort: try background script UUID extraction
            const response = await chrome.runtime.sendMessage({ type: 'GET_USER_UUID' });
            if (response.success && response.uuid) {
              isAuthenticated = true;
              userUUID = response.uuid;
              console.log('✅ Using background script UUID:', userUUID?.substring(0, 8) + '...');
            }
          }
        }

        if (!isAuthenticated || !userUUID) {
          console.warn('⚠️ User not authenticated. Prompt events will not be logged.');
          console.warn('💡 Please login through the Complyze sidebar (gear icon ⚙️) to enable event logging.');
          console.warn('🔗 Or visit https://supabase.com/dashboard/project/likskioavtpnskrfxbqa/auth/users to verify your account.');
          return;
        }
        
        const integrityScore = PIIDetector.calculateIntegrityScore(promptText, detectedPII);
        const riskLevel = PIIDetector.getHighestRiskLevel(detectedPII);
        const primaryRiskType = detectedPII.length > 0 ? RISK_TYPE_MAPPING[detectedPII[0].type] : 'low';
        
        // Estimate token counts (rough approximation)
        const promptTokens = Math.ceil(promptText.length / 4);
        const completionTokens = 0; // No completion yet
        
        // Calculate estimated cost (example rates)
        const inputCost = promptTokens * 0.0005 / 1000;
        const outputCost = 0;
        const totalCost = inputCost + outputCost;
        
        const eventData = {
          user_id: userUUID, // Ensure user_id is set for Supabase
          model: this.detectModel(),
          usd_cost: totalCost,
          prompt_tokens: promptTokens,
          completion_tokens: completionTokens,
          integrity_score: integrityScore,
          risk_type: primaryRiskType,
          risk_level: riskLevel,
          platform: this.platform.name,
          metadata: {
            platform: this.platform.name,
            detected_pii: detectedPII.map(pii => pii.type),
            mapped_controls: this.getMappedControls(detectedPII),
            cost_breakdown: {
              input: inputCost,
              output: outputCost
            },
            flagged: true,
            url: window.location.href,
            timestamp: new Date().toISOString(),
            user_email: userEmail // Additional context
          }
        };
        
        console.log('📤 Sending PII detection event to Supabase:', {
          ...eventData,
          user_id: userUUID?.substring(0, 8) + '...' // Hide full UUID in logs
        });
        
        const response = await chrome.runtime.sendMessage({
          type: 'SYNC_PROMPT_EVENT',
          data: eventData
        });
        
        if (response.success) {
          console.log('✅ Successfully synced to Supabase:', response.result);
        } else {
          console.warn('❌ Failed to sync to Supabase:', response.error);
          console.warn('💡 Check if user exists in: https://supabase.com/dashboard/project/likskioavtpnskrfxbqa/auth/users');
        }
        
      } catch (error) {
        console.error('Error syncing to Supabase:', error);
        console.warn('💡 Ensure you are logged in via the Complyze sidebar and your account exists in Supabase.');
      }
    }
    
    detectModel() {
      // Try to detect the specific model being used
      const url = window.location.href;
      
      if (url.includes('chatgpt.com')) {
        if (url.includes('gpt-4')) return 'gpt-4';
        if (url.includes('gpt-3.5')) return 'gpt-3.5-turbo';
        return 'gpt-3.5-turbo'; // Default
      } else if (url.includes('claude.ai')) {
        return 'claude-3-sonnet';
      } else if (url.includes('gemini.google.com')) {
        return 'gemini-pro';
      }
      
      return 'unknown';
    }
    
    getMappedControls(detectedPII) {
      const controls = [];
      const addedControls = new Set();
      
      for (const pii of detectedPII) {
        let controlId, description;
        
        switch (pii.type) {
          case 'CREDIT_CARD':
            controlId = 'NIST-PII-001';
            description = 'PII Detection and Redaction - Financial Data';
            break;
          case 'SSN':
            controlId = 'NIST-PII-002';
            description = 'PII Detection and Redaction - Personal Identifiers';
            break;
          case 'EMAIL':
          case 'PHONE':
            controlId = 'NIST-PII-003';
            description = 'PII Detection and Redaction - Contact Information';
            break;
          case 'API_KEY':
            controlId = 'NIST-SEC-001';
            description = 'Security Token Detection and Protection';
            break;
          case 'MEDICAL':
            controlId = 'HIPAA-001';
            description = 'Medical Information Protection';
            break;
          default:
            controlId = 'NIST-PII-000';
            description = 'General PII Detection and Redaction';
        }
        
        if (!addedControls.has(controlId)) {
          controls.push({
            id: controlId,
            description: description,
            framework: controlId.startsWith('HIPAA') ? 'HIPAA' : 'NIST'
          });
          addedControls.add(controlId);
        }
      }
      
      return controls;
    }
    
    getInputText() {
      if (!this.inputElement) return '';
      
      if (this.inputElement.tagName === 'TEXTAREA') {
        return this.inputElement.value || '';
      } else {
        return this.inputElement.textContent || this.inputElement.innerText || '';
      }
    }
    
    updateRules(ruleStates) {
      // Store the updated rule states for use in detection
      this.activeRules = ruleStates;
      console.log('📝 Monitoring rules updated:', this.activeRules);
      
      // Show specific rule states for debugging
      if (this.activeRules && this.activeRules.pii) {
        console.log('🔍 PII Rules:', {
          name: this.activeRules.pii.name,
          email: this.activeRules.pii.email,
          phoneNumber: this.activeRules.pii.phoneNumber,
          address: this.activeRules.pii.address
        });
      }
      
      // Force a recheck of current input with new rules
      if (this.inputElement) {
        this.checkForSensitiveData();
      }
    }
    
    destroy() {
      if (this.checkInterval) {
        clearInterval(this.checkInterval);
      }
      
      if (this.buttonObserver) {
        this.buttonObserver.disconnect();
      }
      
      if (this.warningModal) {
        this.warningModal.hide();
      }
      
      // Unblock any blocked submissions
      this.unblockSubmission();
      
      console.log('Complyze AI Guard monitoring stopped');
    }
    
    async loadRedactionMode() {
      try {
        const storage = await chrome.storage.local.get(['redactionMode']);
        this.redactionMode = storage.redactionMode || 'structured_redact';
        console.log('📝 Loaded redaction mode:', this.redactionMode);
      } catch (error) {
        console.error('Failed to load redaction mode:', error);
      }
    }
    
    setupRedactionModeListener() {
      window.addEventListener('complyzeRedactionModeChanged', (event) => {
        this.redactionMode = event.detail.mode;
        console.log('🔄 Redaction mode updated from sidebar:', this.redactionMode);
      });
    }
    
    getRedactionMode() {
      return this.redactionMode;
    }
  }
  
  // Initialize the monitor
  let monitor = null;
  let sidebar = null;
  
  function initializeMonitor() {
    if (monitor) {
      monitor.destroy();
    }
    monitor = new ComplyzeMonitor();
    
    // Make monitor globally accessible for modal interactions
    window.complyzeMonitor = monitor;
    
    console.log('Complyze Monitor initialized');
  }
  
  function initializeSidebar() {
    console.log('Attempting to initialize sidebar...');
    console.log('LeftSidebarPanel available:', typeof LeftSidebarPanel !== 'undefined');
    console.log('Sidebar already created:', !!sidebar);
    
    // Initialize sidebar if LeftSidebarPanel is available and not already created
    if (typeof LeftSidebarPanel !== 'undefined' && !sidebar) {
      try {
        console.log('Creating new LeftSidebarPanel instance...');
        sidebar = new LeftSidebarPanel();
        console.log('✅ Complyze Sidebar initialized successfully');
        
        // Make sidebar globally accessible for debugging
        window.complyzeSidebar = sidebar;
        
        // Force show toggle button after a brief delay to ensure DOM is ready
        setTimeout(() => {
          if (sidebar && sidebar.forceShowToggle) {
            sidebar.forceShowToggle();
            console.log('🔧 Force-applied toggle button visibility');
          }
        }, 100);
        
        // Additional safety check after 1 second
        setTimeout(() => {
          const toggle = document.querySelector('#complyze-sidebar-toggle');
          if (!toggle || toggle.getBoundingClientRect().width === 0) {
            console.warn('⚠️ Sidebar toggle not visible, attempting recovery...');
            if (sidebar && sidebar.forceShowToggle) {
              sidebar.forceShowToggle();
            }
          }
        }, 1000);
        
        // Listen for rule changes from sidebar
        window.addEventListener('complyzeRuleChanged', (event) => {
          console.log('🔄 Rule changed:', event.detail);
          console.log('📋 All rules:', event.detail.allRules);
          // Update monitoring rules based on sidebar settings
          if (monitor && monitor.updateRules) {
            monitor.updateRules(event.detail.allRules);
          }
        });
        
        // Initialize monitor with current sidebar rules
        setTimeout(() => {
          if (sidebar && sidebar.getRuleStates && monitor && monitor.updateRules) {
            const currentRules = sidebar.getRuleStates();
            console.log('🔧 Initializing monitor with current sidebar rules:', currentRules);
            monitor.updateRules(currentRules);
          }
        }, 500);
        
        // Additional initialization attempts
        setTimeout(() => {
          if (sidebar && sidebar.getRuleStates && monitor && monitor.updateRules) {
            const currentRules = sidebar.getRuleStates();
            console.log('🔧 Second attempt: Initializing monitor with current sidebar rules:', currentRules);
            monitor.updateRules(currentRules);
          }
        }, 1500);
        
        setTimeout(() => {
          if (sidebar && sidebar.getRuleStates && monitor && monitor.updateRules) {
            const currentRules = sidebar.getRuleStates();
            console.log('🔧 Third attempt: Initializing monitor with current sidebar rules:', currentRules);
            monitor.updateRules(currentRules);
          }
        }, 3000);
        
        return true; // Success
        
      } catch (error) {
        console.error('❌ Failed to initialize Complyze Sidebar:', error);
        console.error('Error details:', error.stack);
      }
    } else if (!sidebar) {
      console.log('⏳ LeftSidebarPanel not available yet, will retry in 500ms...');
      // Retry after a short delay, but limit retries
      if (!window.sidebarRetryCount) window.sidebarRetryCount = 0;
      if (window.sidebarRetryCount < 10) {
        window.sidebarRetryCount++;
        setTimeout(initializeSidebar, 500);
      } else {
        console.error('❌ Failed to initialize sidebar after 10 retries');
        
        // Last resort: try to manually create toggle button
        if (typeof LeftSidebarPanel !== 'undefined') {
          console.log('🚨 Last resort: Attempting manual sidebar creation...');
          try {
            sidebar = new LeftSidebarPanel();
            window.complyzeSidebar = sidebar;
            if (sidebar.forceShowToggle) {
              sidebar.forceShowToggle();
            }
          } catch (e) {
            console.error('❌ Last resort failed:', e);
          }
        }
      }
    } else {
      console.log('✅ Sidebar already initialized');
    }
    return false;
  }
  
  // Start monitoring when DOM is ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
      initializeMonitor();
      initializeSidebar();
    });
  } else {
    initializeMonitor();
    initializeSidebar();
  }
  
  // Re-initialize on navigation (for SPAs)
  let lastUrl = location.href;
  new MutationObserver(() => {
    const url = location.href;
    if (url !== lastUrl) {
      lastUrl = url;
      setTimeout(() => {
        initializeMonitor();
        initializeSidebar();
      }, 1000); // Delay to allow page to load
    }
  }).observe(document, { subtree: true, childList: true });
  
  // Cleanup on page unload
  window.addEventListener('beforeunload', () => {
    if (monitor) {
      monitor.destroy();
    }
    if (sidebar) {
      sidebar.destroy();
    }
  });
  
  console.log('Complyze AI Guard content script loaded');
  
  // Manual initialization function for debugging
  window.forceInitializeComplyzeSidebar = function() {
    console.log('🔧 Manual sidebar initialization requested...');
    
    if (typeof LeftSidebarPanel === 'undefined') {
      console.error('❌ LeftSidebarPanel class not found');
      return false;
    }
    
    if (sidebar) {
      console.log('⚠️ Sidebar already exists, destroying old one...');
      sidebar.destroy();
      sidebar = null;
    }
    
    try {
      sidebar = new LeftSidebarPanel();
      window.complyzeSidebar = sidebar;
      
      // Force show toggle immediately
      setTimeout(() => {
        if (sidebar.forceShowToggle) {
          sidebar.forceShowToggle();
        }
      }, 100);
      
      console.log('✅ Manual sidebar initialization successful');
      return true;
    } catch (error) {
      console.error('❌ Manual sidebar initialization failed:', error);
      return false;
    }
  };

  // Set user UUID for Supabase logging
  window.setSupabaseUUID = function(uuid) {
    return chrome.storage.local.set({ testUserUUID: uuid }).then(() => {
      console.log('✅ Supabase UUID set:', uuid);
      return true;
    }).catch(error => {
      console.error('❌ Failed to set UUID:', error);
      return false;
    });
  };

  // Force sync sidebar rules to monitor
  window.forceSyncRules = function() {
    console.log('🔄 Force syncing sidebar rules to monitor...');
    if (sidebar && sidebar.getRuleStates) {
      const rules = sidebar.getRuleStates();
      console.log('📋 Current sidebar rules:', rules);
      if (monitor && monitor.updateRules) {
        monitor.updateRules(rules);
        console.log('✅ Rules synced to monitor');
        return true;
      } else {
        console.log('❌ Monitor not available');
        return false;
      }
    } else {
      console.log('❌ Sidebar not available');
      return false;
    }
  };

  // Emergency toggle button creator
  window.createEmergencyToggle = function() {
    console.log('🚨 Creating emergency toggle button...');
    
    // Remove existing toggle if any
    const existingToggle = document.querySelector('#complyze-sidebar-toggle');
    if (existingToggle) existingToggle.remove();
    
    // Create emergency toggle
    const toggle = document.createElement('button');
    toggle.id = 'complyze-sidebar-toggle';
    toggle.innerHTML = '<span>⚙️</span>';
    toggle.style.cssText = `
      position: fixed !important;
      top: 50% !important;
      left: 0px !important;
      transform: translateY(-50%) !important;
      z-index: 2147483647 !important;
      background: linear-gradient(90deg, #ea580c 0%, #dc2626 100%) !important;
      color: white !important;
      padding: 12px !important;
      border: none !important;
      border-radius: 0 8px 8px 0 !important;
      box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1) !important;
      cursor: pointer !important;
      font-size: 16px !important;
      line-height: 1 !important;
      display: block !important;
      visibility: visible !important;
      opacity: 1 !important;
      width: auto !important;
      height: auto !important;
      min-width: 44px !important;
      min-height: 44px !important;
      pointer-events: auto !important;
    `;
    
    // Add click handler
    toggle.addEventListener('click', () => {
      if (sidebar) {
        sidebar.toggle();
      } else {
        console.log('Creating sidebar on demand...');
        window.forceInitializeComplyzeSidebar();
      }
    });
    
    document.body.appendChild(toggle);
    console.log('✅ Emergency toggle button created');
    return true;
  };
  
  // Debug function to check extension status
  window.debugComplyzeExtension = function() {
    console.log('🔍 Complyze Extension Debug Info:');
    console.log('- Monitor initialized:', !!monitor);
    console.log('- Sidebar initialized:', !!sidebar);
    console.log('- LeftSidebarPanel available:', typeof LeftSidebarPanel !== 'undefined');
    console.log('- PromptOptimizer available:', !!window.PromptOptimizer);
    console.log('- Content script loaded:', true);
    console.log('- Current URL:', window.location.href);
    console.log('- Sidebar element exists:', !!document.querySelector('#complyze-sidebar-panel'));
    console.log('- Toggle button exists:', !!document.querySelector('#complyze-sidebar-toggle'));
    
    if (monitor) {
      console.log('- Current redaction mode:', monitor.getRedactionMode());
      console.log('- Monitor enabled:', monitor.isEnabled);
      console.log('- Currently blocked:', monitor.isBlocked);
      console.log('- Submit buttons found:', monitor.submitButtons.length);
      console.log('- Input element found:', !!monitor.inputElement);
    }
    
    if (sidebar && sidebar.debugStatus) {
      console.log('📊 Detailed sidebar status:');
      sidebar.debugStatus();
    }
    
    if (typeof LeftSidebarPanel !== 'undefined') {
      console.log('✅ Available commands:');
      console.log('  - forceInitializeComplyzeSidebar()');
      console.log('  - forceSyncRules() // sync sidebar rules to monitor');
      console.log('  - createEmergencyToggle() // if all else fails');
      console.log('  - testRedactionModes() // test both redaction modes');
      console.log('  - testSubmitButtonBlocking() // test button blocking');
      console.log('  - testAuthenticationFlow() // test auth system');
      console.log('  - testOpenRouterAPI() // test smart rewrite API');
      console.log('  - runAllComplyzeTests() // run comprehensive test suite');
      console.log('  - debugSmartRewrite() // detailed smart rewrite debugging');
      console.log('  - setRedactionMode("smart_rewrite" | "structured_redact")');
      console.log('  - setOpenRouterKey("sk-...") // set API key for testing');
      console.log('  - window.complyzeSidebar.forceShowToggle() // if sidebar exists');
      console.log('  - window.complyzeSidebar.debugStatus() // if sidebar exists');
    }
  };

  // Test function for submit button blocking
  window.testSubmitButtonBlocking = function() {
    console.log('🧪 Testing Submit Button Blocking...');
    
    if (!monitor) {
      console.error('❌ Monitor not initialized');
      return false;
    }
    
    // First, find buttons
    monitor.findSubmitButtons();
    
    // Insert test PII
    const testText = "My email is john.doe@company.com and my API key is sk-test123456789";
    
    if (monitor.inputElement) {
      if (monitor.inputElement.tagName === 'TEXTAREA') {
        monitor.inputElement.value = testText;
      } else {
        monitor.inputElement.textContent = testText;
      }
      
      // Trigger input event
      monitor.inputElement.dispatchEvent(new Event('input', { bubbles: true }));
      
      // Check after a delay
      setTimeout(() => {
        console.log('📊 Test Results:');
        console.log('- Buttons found:', monitor.submitButtons.length);
        console.log('- Currently blocked:', monitor.isBlocked);
        console.log('- Disabled buttons:', monitor.submitButtons.filter(btn => btn.disabled).length);
        
        monitor.submitButtons.forEach((btn, i) => {
          console.log(`  Button ${i+1}:`, {
            disabled: btn.disabled,
            text: btn.textContent?.substring(0, 30),
            hasBlockedClass: btn.classList.contains('complyze-blocked'),
            hasBlockedAttribute: btn.hasAttribute('data-complyze-blocked')
          });
        });
        
        if (monitor.isBlocked && monitor.submitButtons.length > 0) {
          console.log('✅ Submit button blocking working correctly');
        } else {
          console.error('❌ Submit button blocking failed');
        }
      }, 1000);
      
      return true;
    } else {
      console.error('❌ No input element found');
      return false;
    }
  };

  // Test function for authentication flow
  window.testAuthenticationFlow = async function() {
    console.log('🔐 Testing Authentication Flow...');
    
    try {
      // Check sidebar authentication
      if (sidebar && sidebar.isUserAuthenticated()) {
        console.log('✅ Sidebar authentication active');
        console.log('- Email:', sidebar.userEmail);
        console.log('- UUID:', sidebar.userUUID?.substring(0, 8) + '...');
      } else {
        console.log('❌ Sidebar not authenticated');
      }
      
      // Check storage authentication
      const storage = await chrome.storage.local.get(['complyzeUserUUID', 'complyzeUserEmail']);
      if (storage.complyzeUserUUID && storage.complyzeUserEmail) {
        console.log('✅ Storage authentication active');
        console.log('- Email:', storage.complyzeUserEmail);
        console.log('- UUID:', storage.complyzeUserUUID?.substring(0, 8) + '...');
      } else {
        console.log('❌ Storage authentication missing');
      }
      
      // Check background script UUID
      const response = await chrome.runtime.sendMessage({ type: 'GET_USER_UUID' });
      if (response.success && response.uuid) {
        console.log('✅ Background script UUID available');
        console.log('- UUID:', response.uuid?.substring(0, 8) + '...');
      } else {
        console.log('❌ Background script UUID not available');
      }
      
      // Test Supabase sync (with dummy data)
      if (monitor) {
        console.log('🔄 Testing Supabase sync...');
        await monitor.syncToSupabase('test prompt', []);
      }
      
    } catch (error) {
      console.error('❌ Authentication test failed:', error);
    }
  };

  // Test function for OpenRouter API
  window.testOpenRouterAPI = async function() {
    console.log('🤖 Testing OpenRouter API...');
    
    if (!window.PromptOptimizer) {
      console.error('❌ PromptOptimizer not available');
      return false;
    }
    
    try {
      const optimizer = new window.PromptOptimizer();
      await optimizer.ensureInitialized();
      
      // Debug configuration
      await optimizer.debugConfiguration();
      
      // Test connection
      console.log('🔍 Testing API connection...');
      const connectionTest = await optimizer.testConnection();
      console.log('✅ Connection test result:', connectionTest);
      
      // Test smart rewrite
      console.log('🔍 Testing smart rewrite...');
      const testText = "My email is john.doe@company.com";
      const testPII = [{ type: 'EMAIL', description: 'Email Address' }];
      
      const result = await optimizer.smartRewrite(testText, testPII);
      console.log('✅ Smart rewrite result:', result);
      
      return true;
      
    } catch (error) {
      console.error('❌ OpenRouter API test failed:', error);
      console.error('💡 Check your API key and OpenRouter account status');
      return false;
    }
  };

  // Test function for redaction modes
  window.testRedactionModes = function() {
    const testText = "can you review this Python script? It connects to our internal repo at git.acme-corp.local, uses the API key sk-test-9843ghfs73, and sends a notification to julia.roberts@acme-corp.com. The server IP is 192.168.10.42, and our vault path is /secrets/prod/token";
    
    console.log('🧪 Testing Redaction Modes');
    console.log('📝 Original text:', testText);
    console.log('');
    
    // Test PII detection
    const detectedPII = PIIDetector.detectSensitiveData(testText);
    console.log('🔍 Detected PII:', detectedPII);
    console.log('');
    
    // Test structured redaction
    console.log('🔒 Testing Structured Redaction:');
    const modal = new WarningModal(monitor?.platform || {name: 'Test'}, detectedPII, null);
    const structuredResult = modal.redactSensitiveData(testText);
    console.log('📤 Structured result:', structuredResult);
    console.log('');
    
    // Test smart rewrite (if available)
    if (window.PromptOptimizer) {
      console.log('🤖 Testing Smart Rewrite:');
      const optimizer = new window.PromptOptimizer();
      optimizer.smartRewrite(testText, detectedPII).then(result => {
        console.log('📤 Smart rewrite result:', result);
      }).catch(error => {
        console.error('❌ Smart rewrite failed:', error);
      });
    } else {
      console.log('⚠️ PromptOptimizer not available for Smart Rewrite test');
    }
  };

  // Comprehensive test suite
  window.runAllComplyzeTests = async function() {
    console.log('🚀 Running Comprehensive Complyze Test Suite...');
    console.log('='.repeat(50));
    
    const results = {};
    
    try {
      // Test 1: Extension status
      console.log('\n1️⃣ Extension Status Check');
      window.debugComplyzeExtension();
      results.extensionStatus = true;
      
      // Test 2: Submit button blocking
      console.log('\n2️⃣ Submit Button Blocking Test');
      results.submitBlocking = window.testSubmitButtonBlocking();
      
      // Wait a bit for blocking test to complete
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      // Test 3: Authentication flow
      console.log('\n3️⃣ Authentication Flow Test');
      await window.testAuthenticationFlow();
      results.authentication = true;
      
      // Test 4: OpenRouter API
      console.log('\n4️⃣ OpenRouter API Test');
      results.openRouterAPI = await window.testOpenRouterAPI();
      
      // Test 5: Redaction modes
      console.log('\n5️⃣ Redaction Modes Test');
      window.testRedactionModes();
      results.redactionModes = true;
      
      // Summary
      console.log('\n📊 TEST SUITE SUMMARY');
      console.log('='.repeat(30));
      Object.entries(results).forEach(([test, passed]) => {
        console.log(`${passed ? '✅' : '❌'} ${test}: ${passed ? 'PASSED' : 'FAILED'}`);
      });
      
      const passedCount = Object.values(results).filter(Boolean).length;
      const totalCount = Object.keys(results).length;
      console.log(`\n🎯 Overall: ${passedCount}/${totalCount} tests passed`);
      
      if (passedCount === totalCount) {
        console.log('🎉 All tests passed! Complyze is working correctly.');
      } else {
        console.log('⚠️ Some tests failed. Check the logs above for details.');
      }
      
    } catch (error) {
      console.error('❌ Test suite failed:', error);
    }
  };

  // Test Smart Rewrite specifically with detailed debugging
  window.debugSmartRewrite = async function() {
    console.log('🤖 DEBUG: Testing Smart Rewrite in Detail...');
    console.log('='.repeat(50));
    
    // Test text with multiple PII types
    const testText = "can you review this Python script? It connects to our internal repo at git.acme-corp.local, uses the API key sk-test-9843ghfs73, and sends a notification to julia.roberts@acme-corp.com. The server IP is 192.168.10.42, and our vault path is /secrets/prod/token";
    
    console.log('📝 Test text:', testText);
    console.log('📏 Text length:', testText.length);
    
    // Detect PII
    const detectedPII = PIIDetector.detectSensitiveData(testText);
    console.log('🔍 Detected PII:', detectedPII);
    console.log('📊 PII count:', detectedPII.length);
    
    // Check PromptOptimizer availability
    if (!window.PromptOptimizer) {
      console.error('❌ PromptOptimizer not available');
      return false;
    }
    console.log('✅ PromptOptimizer available');
    
    try {
      // Create and initialize optimizer
      console.log('\n🔧 Creating PromptOptimizer instance...');
      const optimizer = new window.PromptOptimizer();
      
      console.log('🔧 Initial optimizer state:', {
        enabled: optimizer.enabled,
        hasApiKey: !!optimizer.apiKey,
        apiKeyLength: optimizer.apiKey ? optimizer.apiKey.length : 0,
        model: optimizer.model,
        baseUrl: optimizer.baseUrl
      });
      
      // Load settings
      console.log('\n🔧 Loading settings...');
      await optimizer.loadSettings();
      
      console.log('🔧 After loadSettings:', {
        enabled: optimizer.enabled,
        hasApiKey: !!optimizer.apiKey,
        apiKeyPrefix: optimizer.apiKey ? optimizer.apiKey.substring(0, 12) + '...' : 'None',
        apiKeyLength: optimizer.apiKey ? optimizer.apiKey.length : 0,
        model: optimizer.model,
        baseUrl: optimizer.baseUrl
      });
      
      // Ensure initialized
      console.log('\n🔧 Ensuring initialization...');
      await optimizer.ensureInitialized();
      
      console.log('🔧 After ensureInitialized:', {
        enabled: optimizer.enabled,
        hasApiKey: !!optimizer.apiKey,
        model: optimizer.model,
        baseUrl: optimizer.baseUrl
      });
      
      // Debug configuration
      console.log('\n🔧 Running debug configuration...');
      await optimizer.debugConfiguration();
      
      // Test connection first
      console.log('\n🔧 Testing connection...');
      const connectionResult = await optimizer.testConnection();
      console.log('📡 Connection test result:', connectionResult);
      
      if (!connectionResult.success) {
        console.error('❌ Connection test failed:', connectionResult);
        return false;
      }
      
      // Try smart rewrite
      console.log('\n🤖 Attempting Smart Rewrite...');
      console.log('📤 Calling smartRewrite with:', {
        textLength: testText.length,
        piiCount: detectedPII.length,
        piiTypes: detectedPII.map(p => p.type)
      });
      
      const result = await optimizer.smartRewrite(testText, detectedPII);
      
      console.log('\n✅ Smart Rewrite Result:');
      console.log('🔧 Method:', result.method);
      console.log('💰 Cost:', result.cost);
      console.log('📊 Usage:', result.usage);
      console.log('🤖 Model:', result.model);
      console.log('📝 Original length:', testText.length);
      console.log('📝 Result length:', result.optimizedText?.length);
      console.log('🔍 Original preview:', testText.substring(0, 150) + '...');
      console.log('🔍 Result preview:', result.optimizedText?.substring(0, 150) + '...');
      
      if (result.method === 'smart_rewrite') {
        console.log('🎉 Smart Rewrite SUCCESS!');
        
        // Check if sensitive data was actually removed
        const stillHasPII = PIIDetector.detectSensitiveData(result.optimizedText);
        console.log('🔍 Remaining PII after rewrite:', stillHasPII);
        
        if (stillHasPII.length === 0) {
          console.log('✅ All PII successfully removed by Smart Rewrite');
        } else {
          console.warn('⚠️ Some PII still remains after Smart Rewrite:', stillHasPII.map(p => p.type));
        }
        
        return true;
      } else {
        console.error('❌ Smart Rewrite failed, fell back to:', result.method);
        if (result.error) {
          console.error('🔧 Error details:', result.error);
        }
        return false;
      }
      
    } catch (error) {
      console.error('❌ Smart Rewrite debug failed:', error);
      console.error('🔧 Error stack:', error.stack);
      return false;
    }
  };

  // Quick function to set the redaction mode for testing
  window.setRedactionMode = async function(mode) {
    if (!['structured_redact', 'smart_rewrite'].includes(mode)) {
      console.error('❌ Invalid mode. Use "structured_redact" or "smart_rewrite"');
      return false;
    }
    
    try {
      await chrome.storage.local.set({ redactionMode: mode });
      
      // Update monitor if available
      if (window.complyzeMonitor) {
        window.complyzeMonitor.redactionMode = mode;
        console.log('✅ Redaction mode set to:', mode);
        
        // Trigger the change event
        window.dispatchEvent(new CustomEvent('complyzeRedactionModeChanged', {
          detail: { mode: mode }
        }));
        
        return true;
      } else {
        console.warn('⚠️ Monitor not available, mode saved to storage only');
        return true;
      }
    } catch (error) {
      console.error('❌ Failed to set redaction mode:', error);
      return false;
    }
  };

  // Quick API key setter for testing
  window.setOpenRouterKey = async function(apiKey) {
    if (!apiKey || !apiKey.startsWith('sk-')) {
      console.error('❌ Invalid API key format. Should start with "sk-"');
      return false;
    }
    
    try {
      await chrome.storage.local.set({ 
        openRouterApiKey: apiKey,
        promptOptimizationEnabled: true 
      });
      
      console.log('✅ OpenRouter API key set:', apiKey.substring(0, 12) + '...');
      console.log('💡 Now try: await debugSmartRewrite()');
      
      return true;
    } catch (error) {
      console.error('❌ Failed to set API key:', error);
      return false;
    }
  };
})(); 