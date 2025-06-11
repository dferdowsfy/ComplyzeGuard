# Complyze Guard - Sidebar Integration

## Overview
The Complyze Guard Chrome extension now includes a dynamic sidebar panel that allows users to configure which types of sensitive data should be monitored in real-time.

## Features

### Sidebar Panel
- **Toggle Button**: Fixed position button on the left side of the screen
- **Collapsible Sections**: Six main categories of monitoring rules
- **Real-time Statistics**: Shows active/total rules count
- **Modern UI**: Gradient backgrounds, smooth animations, responsive design

### Rule Categories

#### 1. PII (Personal Identifiable Information)
- Name detection
- Email addresses
- Phone numbers
- Street addresses
- Social Security Numbers (SSN)
- Passport numbers
- IP addresses

#### 2. Credentials & Secrets
- API keys
- OAuth tokens
- SSH private keys
- Vault paths
- Access tokens
- Passwords & access codes

#### 3. Company Internal
- Internal URLs
- Project codenames
- Internal tools
- System IP ranges
- Internal memos
- Strategic plans
- Proprietary business data
- Technical designs
- R&D artifacts

#### 4. AI Model & Dataset Leakage
- Model names
- Training data references
- Fine-tuned logic
- Private weights or output

#### 5. Regulated Information
- PHI (HIPAA protected health information)
- Financial records
- Export-controlled terms (ITAR)
- Whistleblower IDs
- Biometric data

#### 6. Jailbreak Patterns
- "Ignore previous instructions" patterns
- Prompt injection attempts
- Jailbreak workarounds

## Technical Implementation

### Architecture
1. **LeftSidebarPanel.js**: Vanilla JavaScript class for the sidebar UI
2. **content.js**: Main content script with monitoring logic
3. **Integration**: Event-driven communication between sidebar and monitor

### Key Components

#### LeftSidebarPanel Class
- Manages UI state and user interactions
- Stores toggle states for all monitoring rules
- Dispatches events when rules change
- Provides methods for programmatic control

#### ComplyzeMonitor Class
- Receives rule updates from sidebar
- Filters detected PII based on active rules
- Maintains backward compatibility when no rules are set

### Event System
```javascript
// Sidebar dispatches events when rules change
window.dispatchEvent(new CustomEvent('complyzeRuleChanged', {
  detail: { 
    section: 'pii', 
    item: 'email', 
    active: true, 
    allRules: ruleStates 
  }
}));

// Monitor listens for rule changes
window.addEventListener('complyzeRuleChanged', (event) => {
  monitor.updateRules(event.detail.allRules);
});
```

### Rule Filtering
The monitor filters detected PII based on active sidebar rules:

```javascript
filterPIIByActiveRules(detectedPII) {
  // Maps detection types to sidebar rules
  const piiToRuleMapping = {
    'EMAIL': { section: 'pii', rule: 'email' },
    'API_KEY': { section: 'credentials', rule: 'apiKeys' },
    // ... more mappings
  };
  
  // Only include PII types with active rules
  return detectedPII.filter(pii => {
    const mapping = piiToRuleMapping[pii.type];
    return this.activeRules[mapping.section][mapping.rule] === true;
  });
}
```

## Usage

### For Users
1. Click the gear icon (⚙️) on the left side of the screen
2. Expand/collapse rule categories as needed
3. Toggle individual monitoring rules on/off
4. View real-time statistics in the footer
5. Changes take effect immediately

### For Developers

#### Accessing the Sidebar
```javascript
// Sidebar is available globally
const sidebar = new LeftSidebarPanel();

// Get current rule states
const rules = sidebar.getRuleStates();

// Set a specific rule
sidebar.setRuleState('pii', 'email', false);

// Listen for changes
window.addEventListener('complyzeRuleChanged', handleRuleChange);
```

#### Extending Detection Patterns
1. Add new patterns to `PII_PATTERNS` in content.js
2. Update `RISK_TYPE_MAPPING` for Supabase integration
3. Add mapping in `filterPIIByActiveRules` method
4. Update sidebar rule categories if needed

## Testing
- Use `test_sidebar.html` to test sidebar functionality independently
- Test on actual AI platforms (ChatGPT, Claude, Gemini)
- Verify rule changes affect detection in real-time

## File Structure
```
complyze-extension/
├── LeftSidebarPanel.js    # Sidebar UI component
├── content.js             # Main monitoring logic
├── manifest.json          # Extension configuration
├── test_sidebar.html      # Standalone test page
└── SIDEBAR_INTEGRATION.md # This documentation
```

## Browser Compatibility
- Chrome Extension Manifest V3
- Modern browsers with ES6 support
- Content scripts with DOM access 