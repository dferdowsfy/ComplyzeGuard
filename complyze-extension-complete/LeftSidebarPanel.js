/**
 * Complyze Guard - Left Sidebar Panel
 * Vanilla JavaScript implementation for Chrome extension content script
 */

class LeftSidebarPanel {
  constructor() {
    this.isOpen = false;
    this.expandedSections = {};
    this.element = null;
    this.isAuthenticated = false;
    this.userEmail = null;
    this.userUUID = null;
    
    // Redaction mode state
    this.redactionMode = 'structured_redact'; // Default to structured redact
    this.redactionSectionCollapsed = false; // Track if redaction section is collapsed
    
    // State for all toggle items - organized by section
    this.toggleStates = {
      pii: {
        name: true,
        email: true,
        phoneNumber: true,
        address: true,
        ssn: true,
        passportNumber: true,
        ipAddress: true,
      },
      credentials: {
        apiKeys: true,
        oauthTokens: true,
        sshKeys: true,
        vaultPaths: true,
        accessTokens: true,
        passwords: true,
      },
      companyInternal: {
        internalUrls: false,
        projectCodenames: false,
        internalTools: false,
        systemIpRanges: false,
        internalMemos: false,
        strategicPlans: true,
        proprietaryData: true,
        technicalDesigns: true,
        rdArtifacts: true,
      },
      aiModel: {
        modelNames: true,
        trainingDataRefs: true,
        finetunedLogic: true,
        privateWeights: true,
      },
      regulated: {
        phi: true,
        financialRecords: true,
        exportControlled: true,
        whistleblowerIds: true,
        biometricData: true,
      },
      jailbreak: {
        ignorePrevious: true,
        promptInjection: true,
        jailbreakWorkarounds: true,
      },
    };

    this.sections = [
      {
        id: 'pii',
        title: 'PII',
        icon: '👤',
        items: [
          { key: 'name', label: 'Name' },
          { key: 'email', label: 'Email' },
          { key: 'phoneNumber', label: 'Phone Number' },
          { key: 'address', label: 'Address' },
          { key: 'ssn', label: 'SSN' },
          { key: 'passportNumber', label: 'Passport Number' },
          { key: 'ipAddress', label: 'IP Address' },
        ],
      },
      {
        id: 'credentials',
        title: 'Credentials & Secrets',
        icon: '🔐',
        items: [
          { key: 'apiKeys', label: 'API Keys' },
          { key: 'oauthTokens', label: 'OAuth Tokens' },
          { key: 'sshKeys', label: 'SSH Keys' },
          { key: 'vaultPaths', label: 'Vault Paths' },
          { key: 'accessTokens', label: 'Access Tokens' },
          { key: 'passwords', label: 'Passwords & Access Codes' },
        ],
      },
      {
        id: 'companyInternal',
        title: 'Company Internal',
        icon: '🏢',
        items: [
          { key: 'internalUrls', label: 'Internal URLs' },
          { key: 'projectCodenames', label: 'Project Codenames' },
          { key: 'internalTools', label: 'Internal Tools' },
          { key: 'systemIpRanges', label: 'System IP Ranges' },
          { key: 'internalMemos', label: 'Internal Memos' },
          { key: 'strategicPlans', label: 'Strategic Plans' },
          { key: 'proprietaryData', label: 'Proprietary Business Data' },
          { key: 'technicalDesigns', label: 'Technical Designs' },
          { key: 'rdArtifacts', label: 'R&D Artifacts' },
        ],
      },
      {
        id: 'aiModel',
        title: 'AI Model & Dataset Leakage',
        icon: '🤖',
        items: [
          { key: 'modelNames', label: 'Model Names' },
          { key: 'trainingDataRefs', label: 'Training Data References' },
          { key: 'finetunedLogic', label: 'Fine-tuned Logic' },
          { key: 'privateWeights', label: 'Private Weights or Output' },
        ],
      },
      {
        id: 'regulated',
        title: 'Regulated Info',
        icon: '⚖️',
        items: [
          { key: 'phi', label: 'PHI (HIPAA)' },
          { key: 'financialRecords', label: 'Financial Records' },
          { key: 'exportControlled', label: 'Export-Controlled Terms (ITAR)' },
          { key: 'whistleblowerIds', label: 'Whistleblower IDs' },
          { key: 'biometricData', label: 'Biometric Data' },
        ],
      },
      {
        id: 'jailbreak',
        title: 'Jailbreak Patterns',
        icon: '🚫',
        items: [
          { key: 'ignorePrevious', label: 'Ignore Previous Instructions' },
          { key: 'promptInjection', label: 'Prompt Injection Patterns' },
          { key: 'jailbreakWorkarounds', label: 'Jailbreak Workarounds' },
        ],
      },
    ];

    this.create();
    this.attachEventListeners();
    this.checkAuthStatus();
    this.loadRedactionMode();
    
    // Set up periodic authentication check every 30 seconds
    this.authCheckInterval = setInterval(() => {
      this.checkAuthStatus();
    }, 30000);
    
    // Listen for storage changes to keep auth status in sync
    if (typeof chrome !== 'undefined' && chrome.storage) {
      chrome.storage.onChanged.addListener((changes, namespace) => {
        if (namespace === 'local') {
          if (changes.complyzeUserEmail || changes.complyzeUserUUID || changes.complyzeAuthToken) {
            console.log('🔄 Auth credentials changed, refreshing status');
            this.checkAuthStatus();
          }
        }
      });
    }
    
    // Also check auth status periodically to maintain session
    setInterval(() => {
      this.checkAuthStatus();
    }, 30000); // Check every 30 seconds
  }

  create() {
    this.element = document.createElement('div');
    this.element.id = 'complyze-sidebar-panel';
    this.element.innerHTML = this.getHTML();
    this.injectStyles();
    document.body.appendChild(this.element);
  }

  getHTML() {
    return `
      <div class="complyze-sidebar-overlay" id="complyze-sidebar-overlay"></div>
      <div class="complyze-sidebar" id="complyze-sidebar">
        <div class="complyze-sidebar-header">
          <div class="complyze-sidebar-header-content">
            <div class="complyze-sidebar-logo">
              <div class="complyze-sidebar-icon"><span>🛡️</span></div>
              <div>
                <h2 class="complyze-sidebar-title">Complyze Guard</h2>
                <p class="complyze-sidebar-subtitle">AI Security Settings</p>
              </div>
            </div>
            <button class="complyze-sidebar-close" id="complyze-sidebar-close">✕</button>
          </div>
          
          <!-- Redaction Style Controls -->
          <div class="complyze-redaction-controls">
            <div class="complyze-redaction-header" id="complyze-redaction-header">
              <div class="complyze-redaction-header-left">
                <span class="complyze-redaction-icon">🔺</span>
                <h4 class="complyze-redaction-title">Redaction Style</h4>
              </div>
              <div class="complyze-redaction-current">
                ${this.getRedactionModeDisplay()}
              </div>
              <button class="complyze-redaction-expand ${this.redactionSectionCollapsed ? 'collapsed' : 'expanded'}" 
                      id="complyze-redaction-expand">
                <span class="complyze-expand-arrow ${this.redactionSectionCollapsed ? '' : 'rotated'}">▼</span>
              </button>
            </div>
            <div class="complyze-redaction-toggle ${this.redactionSectionCollapsed ? 'collapsed' : 'expanded'}" 
                 id="complyze-redaction-toggle">
              <button class="complyze-redaction-option ${this.redactionMode === 'structured_redact' ? 'active' : ''}" 
                      id="structured-redact" data-mode="structured_redact">
                <span class="complyze-radio ${this.redactionMode === 'structured_redact' ? 'checked' : ''}"></span>
                <div class="complyze-redaction-label">
                  <span class="complyze-redaction-name">Structured Redact</span>
                  <span class="complyze-redaction-desc">Fast regex-based [REDACTED] tags</span>
                </div>
              </button>
              <button class="complyze-redaction-option ${this.redactionMode === 'smart_rewrite' ? 'active' : ''}" 
                      id="smart-rewrite" data-mode="smart_rewrite">
                <span class="complyze-radio ${this.redactionMode === 'smart_rewrite' ? 'checked' : ''}"></span>
                <div class="complyze-redaction-label">
                  <span class="complyze-redaction-name">Smart Rewrite</span>
                  <span class="complyze-redaction-desc">LLM-powered natural rewrites</span>
                </div>
              </button>
            </div>
          </div>
        </div>
        <div class="complyze-sidebar-content">
          ${this.sections.map(section => this.getSectionHTML(section)).join('')}
        </div>
              <div class="complyze-sidebar-footer">
        <div id="complyze-auth-section" class="complyze-auth-section">
          <div id="complyze-login-form" class="complyze-login-form">
            <h4 style="color: white; margin-bottom: 12px; font-size: 14px;">🔐 Complyze Account</h4>
            <input 
              type="email" 
              id="complyze-email" 
              placeholder="Email" 
              style="width: 100%; padding: 8px; margin-bottom: 8px; border: 1px solid #475569; 
                     border-radius: 4px; background: #374151; color: white; font-size: 12px;"
            />
            <input 
              type="password" 
              id="complyze-password" 
              placeholder="Password" 
              style="width: 100%; padding: 8px; margin-bottom: 12px; border: 1px solid #475569; 
                     border-radius: 4px; background: #374151; color: white; font-size: 12px;"
            />
            <button 
              id="complyze-login-btn" 
              style="width: 100%; padding: 8px; background: #ea580c; color: white; border: none; 
                     border-radius: 4px; cursor: pointer; font-size: 12px; font-weight: 500;"
            >
              Login & Sync
            </button>
            <div id="complyze-auth-status" style="margin-top: 8px; font-size: 11px; text-align: center;"></div>
          </div>
          
          <div id="complyze-user-info" class="complyze-user-info" style="display: none;">
            <div style="display: flex; align-items: center; justify-content: space-between; margin-bottom: 12px;">
              <div>
                <div style="color: #10b981; font-size: 12px; font-weight: 500;">✅ Logged In</div>
                <div id="complyze-user-email" style="color: #cbd5e1; font-size: 10px;"></div>
              </div>
              <button 
                id="complyze-logout-btn"
                style="padding: 4px 8px; background: #ef4444; color: white; border: none; 
                       border-radius: 4px; cursor: pointer; font-size: 10px;"
              >
                Logout
              </button>
            </div>
            <div class="complyze-sidebar-stats">
              <div>
                <div class="complyze-stat-value" id="complyze-active-rules">${this.getTotalActiveRules()}</div>
                <div class="complyze-stat-label">Active Rules</div>
              </div>
              <div>
                <div class="complyze-stat-value">${this.getTotalRules()}</div>
                <div class="complyze-stat-label">Total Rules</div>
              </div>
            </div>
          </div>
        </div>
      </div>
      </div>
      <button class="complyze-sidebar-toggle" id="complyze-sidebar-toggle">
        <span>⚙️</span>
      </button>
    `;
  }

  getSectionHTML(section) {
    const activeCount = this.getActiveCount(section.id);
    const totalCount = this.getTotalCount(section.id);
    const isExpanded = this.expandedSections[section.id];

    return `
      <div class="complyze-section">
        <button class="complyze-section-header" data-section="${section.id}">
          <div class="complyze-section-header-left">
            <span class="complyze-section-icon">${section.icon}</span>
            <div class="complyze-section-info">
              <h3>${section.title}</h3>
              <p>${activeCount}/${totalCount} active</p>
            </div>
          </div>
          <div class="complyze-section-header-right">
            <div class="complyze-section-badge">${activeCount}</div>
            <span class="complyze-section-arrow ${isExpanded ? 'expanded' : ''}">▼</span>
          </div>
        </button>
        <div class="complyze-section-items ${isExpanded ? 'expanded' : ''}">
          <div class="complyze-section-items-content">
            ${section.items.map(item => this.getItemHTML(section.id, item)).join('')}
          </div>
        </div>
      </div>
    `;
  }

  getItemHTML(sectionId, item) {
    const isToggled = this.toggleStates[sectionId][item.key];
    return `
      <div class="complyze-toggle-item">
        <span class="complyze-toggle-label">${item.label}</span>
        <button class="complyze-toggle-switch ${isToggled ? 'active' : ''}" 
                data-section="${sectionId}" 
                data-item="${item.key}">
        </button>
      </div>
    `;
  }

  injectStyles() {
    if (document.getElementById('complyze-sidebar-styles')) return;
    const styles = document.createElement('style');
    styles.id = 'complyze-sidebar-styles';
    styles.textContent = `
      #complyze-sidebar-panel {
        font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
        position: fixed; top: 0; left: 0; z-index: 999999;
      }
      .complyze-sidebar-overlay {
        position: fixed; inset: 0; background: rgba(0, 0, 0, 0.5); z-index: 999997; display: none;
      }
      .complyze-sidebar-overlay.visible { display: block; }
      .complyze-sidebar {
        position: fixed; top: 0; left: 0; height: 100vh; width: 320px;
        background: linear-gradient(135deg, #334155 0%, #1e293b 100%);
        box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.25); z-index: 999998;
        transform: translateX(-100%); transition: transform 0.3s ease-in-out;
      }
      .complyze-sidebar.open { transform: translateX(0); }
      .complyze-sidebar-header {
        background: linear-gradient(90deg, #ea580c 0%, #dc2626 100%);
        padding: 16px; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
      }
      .complyze-sidebar-header-content {
        display: flex; align-items: center; justify-content: space-between;
      }
      .complyze-sidebar-logo { display: flex; align-items: center; gap: 12px; }
      .complyze-sidebar-icon {
        width: 32px; height: 32px; background: white; border-radius: 8px;
        display: flex; align-items: center; justify-content: center; font-size: 18px;
      }
      .complyze-sidebar-title {
        color: white; font-weight: 700; font-size: 18px; margin: 0;
      }
      .complyze-sidebar-subtitle {
        color: #fed7aa; font-size: 12px; margin: 0;
      }
      .complyze-sidebar-close {
        background: none; border: none; color: white; cursor: pointer;
        padding: 8px; border-radius: 8px; transition: background-color 0.2s;
        font-size: 18px;
      }
      .complyze-sidebar-close:hover { background: rgba(220, 38, 38, 0.2); }
      
      /* Redaction Controls */
      .complyze-redaction-controls {
        margin-top: 16px; padding-top: 16px; border-top: 1px solid rgba(255, 255, 255, 0.1);
      }
      .complyze-redaction-header {
        display: flex; align-items: center; justify-content: space-between; 
        margin-bottom: 12px; cursor: pointer; padding: 8px 0;
        border-radius: 6px; transition: all 0.2s ease;
      }
      .complyze-redaction-header:hover {
        background: rgba(255, 255, 255, 0.1);
      }
      .complyze-redaction-header-left {
        display: flex; align-items: center; gap: 8px;
      }
      .complyze-redaction-current {
        flex: 1; text-align: center;
      }
      .complyze-mode-badge {
        font-size: 12px; padding: 4px 8px; border-radius: 12px; font-weight: 600;
      }
      .complyze-mode-badge.smart {
        background: rgba(34, 197, 94, 0.2); color: #22c55e; border: 1px solid #22c55e;
      }
      .complyze-mode-badge.structured {
        background: rgba(59, 130, 246, 0.2); color: #3b82f6; border: 1px solid #3b82f6;
      }
      .complyze-redaction-expand {
        background: none; border: none; color: white; cursor: pointer;
        padding: 4px 8px; border-radius: 4px; transition: all 0.2s ease;
      }
      .complyze-redaction-expand:hover {
        background: rgba(255, 255, 255, 0.15);
      }
      .complyze-expand-arrow {
        transition: transform 0.2s ease; font-size: 12px;
      }
      .complyze-expand-arrow.rotated {
        transform: rotate(180deg);
      }
      .complyze-redaction-icon { font-size: 16px; }
      .complyze-redaction-title {
        color: white; font-weight: 600; font-size: 14px; margin: 0;
      }
      .complyze-redaction-toggle {
        display: flex; flex-direction: column; gap: 10px;
        max-height: 200px; opacity: 1; overflow: hidden;
        transition: all 0.3s ease-in-out;
      }
      .complyze-redaction-toggle.collapsed {
        max-height: 0; opacity: 0; margin-top: 0;
      }
      .complyze-redaction-option {
        display: flex; align-items: center; gap: 12px; padding: 14px;
        background: rgba(15, 23, 42, 0.8); border: 2px solid rgba(71, 85, 105, 0.6);
        border-radius: 8px; cursor: pointer; transition: all 0.2s ease; color: white;
        text-align: left; font-weight: 500;
      }
      .complyze-redaction-option:hover {
        background: rgba(30, 41, 59, 0.9); border-color: rgba(100, 116, 139, 0.8);
        transform: translateY(-1px); box-shadow: 0 4px 8px rgba(0, 0, 0, 0.3);
      }
      .complyze-redaction-option.active {
        background: rgba(255, 255, 255, 0.95); border-color: white; color: #dc2626;
        box-shadow: 0 2px 8px rgba(0, 0, 0, 0.2);
      }
      .complyze-radio {
        width: 18px; height: 18px; border: 2px solid rgba(203, 213, 225, 0.8);
        border-radius: 50%; position: relative; transition: all 0.2s ease;
        background: rgba(51, 65, 85, 0.5); flex-shrink: 0;
      }
      .complyze-radio.checked {
        border-color: #f97316; background: #f97316; box-shadow: 0 0 0 1px rgba(249, 115, 22, 0.3);
      }
      .complyze-radio.checked::after {
        content: ''; position: absolute; top: 50%; left: 50%;
        transform: translate(-50%, -50%); width: 8px; height: 8px;
        background: white; border-radius: 50%;
      }
      .complyze-redaction-option.active .complyze-radio {
        border-color: #dc2626; background: #dc2626;
      }
      .complyze-redaction-option.active .complyze-radio::after {
        background: white;
      }
      .complyze-redaction-label {
        flex: 1;
      }
      .complyze-redaction-name {
        display: block; font-weight: 600; font-size: 14px; margin-bottom: 3px;
        line-height: 1.2;
      }
      .complyze-redaction-desc {
        display: block; font-size: 12px; color: rgba(255, 255, 255, 0.8);
        line-height: 1.3;
      }
      .complyze-redaction-option.active .complyze-redaction-name {
        color: #dc2626; font-weight: 700;
      }
      .complyze-redaction-option.active .complyze-redaction-desc {
        color: #ea580c; opacity: 0.9;
      }
      
      .complyze-sidebar-content {
        height: calc(100vh - 240px); overflow-y: auto; background: #334155; padding: 16px;
        margin-top: 4px;
      }
      .complyze-section {
        background: #475569; border-radius: 8px; overflow: hidden; margin-bottom: 12px;
      }
      .complyze-section-header {
        width: 100%; padding: 16px; background: none; border: none; color: white;
        cursor: pointer; display: flex; align-items: center; justify-content: space-between;
        transition: background-color 0.2s;
      }
      .complyze-section-header:hover { background: #3f4756; }
      .complyze-section-header-left { display: flex; align-items: center; gap: 12px; }
      .complyze-section-icon { font-size: 20px; }
      .complyze-section-info h3 {
        font-size: 14px; font-weight: 600; margin: 0; text-align: left;
      }
      .complyze-section-info p {
        font-size: 12px; color: #cbd5e1; margin: 0; text-align: left;
      }
      .complyze-section-header-right { display: flex; align-items: center; gap: 8px; }
      .complyze-section-badge {
        background: #ea580c; color: white; font-size: 12px;
        padding: 4px 8px; border-radius: 12px; font-weight: 500;
      }
      .complyze-section-arrow {
        color: #cbd5e1; transition: transform 0.2s;
      }
      .complyze-section-arrow.expanded { transform: rotate(180deg); }
      .complyze-section-items {
        max-height: 0; overflow: hidden; opacity: 0; transition: all 0.3s ease-in-out;
      }
      .complyze-section-items.expanded { max-height: 400px; opacity: 1; }
      .complyze-section-items-content { padding: 0 16px 16px; }
      .complyze-toggle-item {
        display: flex; align-items: center; justify-content: space-between;
        padding: 12px; background: #3f4756; border-radius: 8px; margin-bottom: 8px;
        transition: background-color 0.2s;
      }
      .complyze-toggle-item:hover { background: #374151; }
      .complyze-toggle-label { color: #f1f5f9; font-size: 14px; font-weight: 500; }
      .complyze-toggle-switch {
        position: relative; display: inline-flex; height: 24px; width: 44px;
        align-items: center; border-radius: 12px; transition: background-color 0.2s;
        cursor: pointer; background: #6b7280;
      }
      .complyze-toggle-switch.active { background: #ea580c; }
      .complyze-toggle-switch::after {
        content: ''; position: absolute; top: 2px; left: 2px; width: 20px; height: 20px;
        background: white; border-radius: 50%; box-shadow: 0 2px 4px rgba(0, 0, 0, 0.2);
        transform: translateX(0); transition: transform 0.2s;
      }
      .complyze-toggle-switch.active::after { transform: translateX(20px); }
      .complyze-sidebar-footer {
        position: absolute; bottom: 0; left: 0; right: 0; background: #1e293b;
        padding: 16px; border-top: 1px solid #475569;
      }
      .complyze-sidebar-stats {
        display: grid; grid-template-columns: 1fr 1fr; gap: 16px; text-align: center;
      }
      .complyze-stat-value {
        color: #fb923c; font-weight: 700; font-size: 18px; margin-bottom: 4px;
      }
      .complyze-stat-label { color: #cbd5e1; font-size: 12px; }
      .complyze-sidebar-toggle {
        position: fixed !important; 
        top: 50% !important; 
        left: 0 !important; 
        transform: translateY(-50%) !important; 
        z-index: 2147483647 !important;
        background: linear-gradient(90deg, #ea580c 0%, #dc2626 100%) !important; 
        color: white !important;
        padding: 12px !important; 
        border: none !important; 
        border-radius: 0 8px 8px 0 !important;
        box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1) !important; 
        cursor: pointer !important;
        transition: all 0.3s ease-in-out !important;
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
      }
      .complyze-sidebar-toggle:hover {
        background: linear-gradient(90deg, #dc2626 0%, #b91c1c 100%) !important;
      }
      .complyze-sidebar-toggle.sidebar-open { 
        transform: translateY(-50%) translateX(320px) !important; 
      }
    `;
    document.head.appendChild(styles);
  }

  attachEventListeners() {
    document.addEventListener('click', (e) => {
      if (e.target.closest('#complyze-sidebar-toggle')) {
        this.toggle();
      }
      if (e.target.closest('#complyze-sidebar-close') || e.target.closest('#complyze-sidebar-overlay')) {
        this.close();
      }
      if (e.target.closest('.complyze-section-header')) {
        const sectionId = e.target.closest('.complyze-section-header').dataset.section;
        this.toggleSection(sectionId);
      }
      if (e.target.closest('.complyze-toggle-switch')) {
        const button = e.target.closest('.complyze-toggle-switch');
        const sectionId = button.dataset.section;
        const itemKey = button.dataset.item;
        this.toggleItem(sectionId, itemKey);
      }
      if (e.target.closest('#complyze-login-btn')) {
        this.handleLogin();
      }
      if (e.target.closest('#complyze-logout-btn')) {
        this.handleLogout();
      }
      if (e.target.closest('.complyze-redaction-option')) {
        const option = e.target.closest('.complyze-redaction-option');
        const mode = option.dataset.mode;
        this.setRedactionMode(mode);
      }
      if (e.target.closest('#complyze-redaction-header') || e.target.closest('#complyze-redaction-expand')) {
        this.toggleRedactionSection();
      }
    });

    // Handle Enter key in password field
    document.addEventListener('keypress', (e) => {
      if (e.target.id === 'complyze-password' && e.key === 'Enter') {
        this.handleLogin();
      }
    });
  }

  toggle() { this.isOpen = !this.isOpen; this.updateUI(); }
  open() { this.isOpen = true; this.updateUI(); }
  close() { this.isOpen = false; this.updateUI(); }

  updateUI() {
    const sidebar = this.element.querySelector('#complyze-sidebar');
    const overlay = this.element.querySelector('#complyze-sidebar-overlay');
    const toggle = this.element.querySelector('#complyze-sidebar-toggle');
    
    // Also check for external toggle button
    const externalToggle = document.querySelector('#complyze-sidebar-toggle');

    if (this.isOpen) {
      sidebar.classList.add('open');
      overlay.classList.add('visible');
      toggle.classList.add('sidebar-open');
      
      // Hide external toggle button when panel is open with !important styles
      if (externalToggle) {
        externalToggle.style.cssText = `
          display: none !important;
          visibility: hidden !important;
          opacity: 0 !important;
          pointer-events: none !important;
          transform: translateX(-100px) !important;
        `;
        console.log('🙈 Toggle button hidden - sidebar is open');
      }
    } else {
      sidebar.classList.remove('open');
      overlay.classList.remove('visible');
      toggle.classList.remove('sidebar-open');
      
      // Show external toggle button when panel is closed
      if (externalToggle) {
        // Re-apply the proper visible styles
        externalToggle.style.cssText = `
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
        console.log('👁️ Toggle button shown - sidebar is closed');
      }
    }
  }

  toggleSection(sectionId) {
    this.expandedSections[sectionId] = !this.expandedSections[sectionId];
    const section = this.element.querySelector(`[data-section="${sectionId}"]`).closest('.complyze-section');
    const items = section.querySelector('.complyze-section-items');
    const arrow = section.querySelector('.complyze-section-arrow');
    
    if (this.expandedSections[sectionId]) {
      items.classList.add('expanded');
      arrow.classList.add('expanded');
    } else {
      items.classList.remove('expanded');
      arrow.classList.remove('expanded');
    }
  }

  toggleItem(sectionId, itemKey) {
    this.toggleStates[sectionId][itemKey] = !this.toggleStates[sectionId][itemKey];
    const toggle = this.element.querySelector(`[data-section="${sectionId}"][data-item="${itemKey}"]`);
    
    if (this.toggleStates[sectionId][itemKey]) {
      toggle.classList.add('active');
    } else {
      toggle.classList.remove('active');
    }
    
    this.updateSectionCounts(sectionId);
    this.updateFooterStats();
    this.notifyRuleChange(sectionId, itemKey, this.toggleStates[sectionId][itemKey]);
  }

  updateSectionCounts(sectionId) {
    const activeCount = this.getActiveCount(sectionId);
    const section = this.element.querySelector(`[data-section="${sectionId}"]`).closest('.complyze-section');
    const badge = section.querySelector('.complyze-section-badge');
    const info = section.querySelector('.complyze-section-info p');
    const totalCount = this.getTotalCount(sectionId);
    
    badge.textContent = activeCount;
    info.textContent = `${activeCount}/${totalCount} active`;
  }

  updateFooterStats() {
    const activeRulesElement = this.element.querySelector('#complyze-active-rules');
    activeRulesElement.textContent = this.getTotalActiveRules();
  }

  getActiveCount(sectionId) {
    return Object.values(this.toggleStates[sectionId]).filter(Boolean).length;
  }

  getTotalCount(sectionId) {
    return Object.keys(this.toggleStates[sectionId]).length;
  }

  getTotalActiveRules() {
    return Object.values(this.toggleStates).reduce((total, section) => 
      total + Object.values(section).filter(Boolean).length, 0
    );
  }

  getTotalRules() {
    return Object.values(this.toggleStates).reduce((total, section) => 
      total + Object.keys(section).length, 0
    );
  }

  notifyRuleChange(sectionId, itemKey, isActive) {
    window.dispatchEvent(new CustomEvent('complyzeRuleChanged', {
      detail: { section: sectionId, item: itemKey, active: isActive, allRules: this.toggleStates }
    }));
  }

  getRuleStates() { return this.toggleStates; }

  setRedactionMode(mode) {
    if (mode !== 'structured_redact' && mode !== 'smart_rewrite') {
      console.warn('Invalid redaction mode:', mode);
      return;
    }
    
    this.redactionMode = mode;
    
    // Auto-collapse when Smart Rewrite is selected
    if (mode === 'smart_rewrite') {
      this.redactionSectionCollapsed = true;
    }
    
    // Update UI
    this.updateRedactionUI();
    
    // Store in chrome storage
    chrome.storage.local.set({ redactionMode: mode });
    
    // Notify content script of mode change
    window.dispatchEvent(new CustomEvent('complyzeRedactionModeChanged', {
      detail: { mode: mode }
    }));
    
    console.log('🔄 Redaction mode changed to:', mode);
  }

  toggleRedactionSection() {
    this.redactionSectionCollapsed = !this.redactionSectionCollapsed;
    this.updateRedactionUI();
  }

  getRedactionMode() {
    return this.redactionMode;
  }

  getRedactionModeDisplay() {
    if (this.redactionMode === 'smart_rewrite') {
      return '<span class="complyze-mode-badge smart">🤖 Smart Rewrite</span>';
    } else {
      return '<span class="complyze-mode-badge structured">🔒 Structured</span>';
    }
  }

  async loadRedactionMode() {
    try {
      const storage = await chrome.storage.local.get(['redactionMode']);
      if (storage.redactionMode) {
        this.redactionMode = storage.redactionMode;
        // Update UI after a short delay to ensure DOM is ready
        setTimeout(() => this.updateRedactionUI(), 100);
      }
    } catch (error) {
      console.error('Failed to load redaction mode:', error);
    }
  }

  updateRedactionUI() {
    // Update radio buttons
    const structuredOption = document.querySelector('#structured-redact');
    const smartOption = document.querySelector('#smart-rewrite');
    const structuredRadio = structuredOption?.querySelector('.complyze-radio');
    const smartRadio = smartOption?.querySelector('.complyze-radio');
    
    if (structuredOption && smartOption) {
      // Remove active classes
      structuredOption.classList.remove('active');
      smartOption.classList.remove('active');
      structuredRadio?.classList.remove('checked');
      smartRadio?.classList.remove('checked');
      
      // Add active class to selected option
      if (this.redactionMode === 'structured_redact') {
        structuredOption.classList.add('active');
        structuredRadio?.classList.add('checked');
      } else {
        smartOption.classList.add('active');
        smartRadio?.classList.add('checked');
      }
    }
    
    // Update collapse/expand state
    const toggleSection = document.querySelector('#complyze-redaction-toggle');
    const expandButton = document.querySelector('#complyze-redaction-expand');
    const expandArrow = expandButton?.querySelector('.complyze-expand-arrow');
    const currentDisplay = document.querySelector('.complyze-redaction-current');
    
    if (toggleSection) {
      if (this.redactionSectionCollapsed) {
        toggleSection.classList.add('collapsed');
        toggleSection.classList.remove('expanded');
      } else {
        toggleSection.classList.remove('collapsed');
        toggleSection.classList.add('expanded');
      }
    }
    
    if (expandArrow) {
      if (this.redactionSectionCollapsed) {
        expandArrow.classList.remove('rotated');
      } else {
        expandArrow.classList.add('rotated');
      }
    }
    
    // Update current mode display
    if (currentDisplay) {
      currentDisplay.innerHTML = this.getRedactionModeDisplay();
    }
  }

  setRuleState(sectionId, itemKey, isActive) {
    if (this.toggleStates[sectionId] && this.toggleStates[sectionId].hasOwnProperty(itemKey)) {
      this.toggleStates[sectionId][itemKey] = isActive;
      const toggle = this.element.querySelector(`[data-section="${sectionId}"][data-item="${itemKey}"]`);
      if (toggle) {
        if (isActive) {
          toggle.classList.add('active');
        } else {
          toggle.classList.remove('active');
        }
      }
      this.updateSectionCounts(sectionId);
      this.updateFooterStats();
    }
  }

  destroy() {
    if (this.element) this.element.remove();
    const styles = document.getElementById('complyze-sidebar-styles');
    if (styles) styles.remove();
    
    // Clean up auth check interval
    if (this.authCheckInterval) {
      clearInterval(this.authCheckInterval);
      this.authCheckInterval = null;
    }
  }

  // Debug method to check sidebar status
  debugStatus() {
    console.log('🔍 Complyze Sidebar Debug Status:');
    console.log('- Sidebar element exists:', !!this.element);
    console.log('- Sidebar in DOM:', !!document.querySelector('#complyze-sidebar-panel'));
    console.log('- Toggle button exists:', !!document.querySelector('#complyze-sidebar-toggle'));
    console.log('- Styles injected:', !!document.querySelector('#complyze-sidebar-styles'));
    console.log('- Is open:', this.isOpen);
    console.log('- Current URL:', window.location.href);
    
    const toggle = document.querySelector('#complyze-sidebar-toggle');
    if (toggle) {
      const rect = toggle.getBoundingClientRect();
      const computedStyle = window.getComputedStyle(toggle);
      console.log('- Toggle position:', { 
        top: rect.top, 
        left: rect.left, 
        width: rect.width, 
        height: rect.height 
      });
      console.log('- Toggle computed style:', {
        position: computedStyle.position,
        zIndex: computedStyle.zIndex,
        display: computedStyle.display,
        visibility: computedStyle.visibility,
        opacity: computedStyle.opacity
      });
    }
    
    return {
      element: !!this.element,
      inDOM: !!document.querySelector('#complyze-sidebar-panel'),
      toggle: !!document.querySelector('#complyze-sidebar-toggle'),
      styles: !!document.querySelector('#complyze-sidebar-styles'),
      isOpen: this.isOpen
    };
  }

  // Force show toggle button (only when sidebar is closed)
  forceShowToggle() {
    const toggle = document.querySelector('#complyze-sidebar-toggle');
    if (toggle) {
      // Only force show if sidebar is closed
      if (!this.isOpen) {
        // Apply aggressive styling to ensure visibility
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
        console.log('✅ Force applied styles to toggle button (sidebar closed)');
      } else {
        // Ensure it stays hidden when sidebar is open
        toggle.style.cssText = `
          display: none !important;
          visibility: hidden !important;
          opacity: 0 !important;
          pointer-events: none !important;
          transform: translateX(-100px) !important;
        `;
        console.log('🙈 Toggle button kept hidden (sidebar open)');
      }
      return true;
    } else {
      console.log('❌ Toggle button not found');
      return false;
    }
  }

  // Authentication Methods
  async checkAuthStatus() {
    try {
      const storage = await chrome.storage.local.get(['complyzeUserEmail', 'complyzeUserUUID', 'complyzeAuthToken']);
      
      console.log('🔍 Checking auth status:', {
        hasEmail: !!storage.complyzeUserEmail,
        hasUUID: !!storage.complyzeUserUUID,
        hasToken: !!storage.complyzeAuthToken,
        email: storage.complyzeUserEmail
      });
      
      if (storage.complyzeUserEmail && storage.complyzeUserUUID && storage.complyzeAuthToken) {
        this.isAuthenticated = true;
        this.userEmail = storage.complyzeUserEmail;
        this.userUUID = storage.complyzeUserUUID;
        this.updateAuthUI();
        console.log('✅ User already authenticated:', this.userEmail);
        console.log('🆔 User UUID:', this.userUUID);
      } else {
        this.isAuthenticated = false;
        this.updateAuthUI();
        console.log('❌ User not authenticated - missing credentials');
      }
    } catch (error) {
      console.error('Error checking auth status:', error);
      this.isAuthenticated = false;
      this.updateAuthUI();
    }
  }

  async handleLogin() {
    const email = document.getElementById('complyze-email')?.value;
    const password = document.getElementById('complyze-password')?.value;
    const statusEl = document.getElementById('complyze-auth-status');
    const loginBtn = document.getElementById('complyze-login-btn');

    if (!email || !password) {
      this.showAuthStatus('Please enter email and password', 'error');
      return;
    }

    loginBtn.textContent = '🔄 Logging in...';
    loginBtn.disabled = true;
    this.showAuthStatus('Authenticating...', 'info');

    try {
      // Call your Complyze authentication API
      const response = await fetch('https://complyze.co/api/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email: email,
          password: password,
        }),
      });

      const data = await response.json();
      console.log('🔍 API Response:', data);

      if (response.ok && data.success) {
        // Extract UUID from various possible response fields
        let userUUID = data.user_id || data.uuid || data.id || data.user?.id || data.user?.uuid;
        
        // If no UUID in response, generate one based on email
        if (!userUUID) {
          console.warn('⚠️ No UUID in API response, generating from email');
          userUUID = await this.generateUserUUID(email);
        }
        
        console.log('🆔 User UUID determined:', userUUID);
        
        // Store authentication data
        await chrome.storage.local.set({
          complyzeUserEmail: email,
          complyzeUserUUID: userUUID,
          complyzeAuthToken: data.token || data.access_token || 'authenticated',
        });

        this.isAuthenticated = true;
        this.userEmail = email;
        this.userUUID = userUUID;
        
        // Verify the UUID was stored correctly
        const verification = await chrome.storage.local.get(['complyzeUserUUID']);
        console.log('✅ UUID verification after storage:', verification.complyzeUserUUID);
        
        this.updateAuthUI();
        this.showAuthStatus('✅ Login successful!', 'success');
        
        console.log('✅ User authenticated successfully:', email);
        console.log('🆔 Final User UUID:', this.userUUID);

        // Test Supabase sync immediately after authentication
        await this.testSupabaseSync();

        // Clear form
        document.getElementById('complyze-email').value = '';
        document.getElementById('complyze-password').value = '';

      } else {
        throw new Error(data.message || 'Authentication failed');
      }

    } catch (error) {
      console.error('Login error:', error);
      this.showAuthStatus(`❌ ${error.message}`, 'error');
    } finally {
      loginBtn.textContent = 'Login & Sync';
      loginBtn.disabled = false;
    }
  }

  // Generate a consistent UUID based on email
  async generateUserUUID(email) {
    // Create a simple UUID v4 based on email hash
    const encoder = new TextEncoder();
    const data = encoder.encode(email + 'complyze-salt');
    const hashBuffer = await crypto.subtle.digest('SHA-256', data);
    const hashArray = new Uint8Array(hashBuffer);
    
    // Convert first 16 bytes to UUID format
    const uuid = [
      hashArray.slice(0, 4),
      hashArray.slice(4, 6),
      hashArray.slice(6, 8),
      hashArray.slice(8, 10),
      hashArray.slice(10, 16)
    ].map(arr => 
      Array.from(arr, byte => byte.toString(16).padStart(2, '0')).join('')
    ).join('-');
    
    console.log('🔧 Generated UUID for', email + ':', uuid);
    return uuid;
  }

  // Test Supabase sync after authentication
  async testSupabaseSync() {
    try {
      console.log('🧪 Testing Supabase sync with authenticated user...');
      
      const testEvent = {
        user_id: this.userUUID,
        model: 'test-model',
        usd_cost: 0.001,
        prompt_tokens: 10,
        completion_tokens: 0,
        integrity_score: 85,
        risk_type: 'test',
        risk_level: 'low',
        platform: 'test',
        metadata: {
          test: true,
          authenticated_via: 'sidebar',
          user_email: this.userEmail,
          timestamp: new Date().toISOString()
        }
      };
      
      const response = await chrome.runtime.sendMessage({
        type: 'SYNC_PROMPT_EVENT',
        data: testEvent
      });
      
      if (response.success) {
        console.log('✅ Supabase sync test successful:', response.result);
        this.showAuthStatus('✅ Supabase sync verified!', 'success');
      } else {
        console.error('❌ Supabase sync test failed:', response.error);
        this.showAuthStatus('⚠️ Supabase sync issue: ' + response.error, 'error');
      }
      
    } catch (error) {
      console.error('❌ Supabase sync test error:', error);
    }
  }

  async handleLogout() {
    try {
      // Clear stored authentication data
      await chrome.storage.local.remove(['complyzeUserEmail', 'complyzeUserUUID', 'complyzeAuthToken']);
      
      this.isAuthenticated = false;
      this.userEmail = null;
      this.userUUID = null;
      
      this.updateAuthUI();
      console.log('✅ User logged out successfully');
      
    } catch (error) {
      console.error('Logout error:', error);
    }
  }

  updateAuthUI() {
    const loginForm = document.getElementById('complyze-login-form');
    const userInfo = document.getElementById('complyze-user-info');
    const userEmailEl = document.getElementById('complyze-user-email');

    if (this.isAuthenticated) {
      loginForm.style.display = 'none';
      userInfo.style.display = 'block';
      if (userEmailEl) {
        userEmailEl.textContent = this.userEmail;
      }
    } else {
      loginForm.style.display = 'block';
      userInfo.style.display = 'none';
    }
  }

  showAuthStatus(message, type) {
    const statusEl = document.getElementById('complyze-auth-status');
    if (statusEl) {
      statusEl.textContent = message;
      statusEl.style.color = type === 'error' ? '#ef4444' : 
                            type === 'success' ? '#10b981' : '#cbd5e1';
      
      // Clear status after 3 seconds for non-error messages
      if (type !== 'error') {
        setTimeout(() => {
          statusEl.textContent = '';
        }, 3000);
      }
    }
  }

  // Public method to get authenticated user UUID
  getUserUUID() {
    return this.userUUID;
  }

  // Public method to check if user is authenticated
  isUserAuthenticated() {
    return this.isAuthenticated;
  }

  // Public method to force refresh auth status
  async refreshAuthStatus() {
    await this.checkAuthStatus();
    return this.isAuthenticated;
  }
}

window.LeftSidebarPanel = LeftSidebarPanel;
