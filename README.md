# Complyze AI Guard - Chrome Extension

![Version](https://img.shields.io/badge/version-2.0.9-blue)
![Manifest](https://img.shields.io/badge/manifest-v3-green)
![License](https://img.shields.io/badge/license-MIT-blue)

Secure AI prompts across ChatGPT, Claude, and Gemini with real-time PII detection and compliance monitoring.

## 🚀 Features

- **Real-time PII Detection**: Monitors text input for sensitive data including credit cards, SSNs, emails, phone numbers, and API keys
- **Smart Warning Modals**: Shows contextual warnings positioned 140px above text input when sensitive data is detected
- **AI Prompt Optimization**: Optional integration with OpenRouter API for intelligent prompt security optimization
- **Dashboard Sync**: Automatically syncs flagged prompts to Supabase `prompt_events` table
- **Multi-Platform Support**: Works seamlessly on ChatGPT, Claude, and Gemini
- **UUID Authentication**: Secure authentication system using user UUIDs from `complyze.co/dashboard`

## 🔧 Installation

### Method 1: Load as Unpacked Extension (Development)

1. **Download/Clone the Extension**
   ```bash
   git clone <repository-url>
   cd complyze-extension
   ```

2. **Open Chrome Extensions Page**
   - Navigate to `chrome://extensions/`
   - Enable "Developer mode" (toggle in top-right corner)

3. **Load the Extension**
   - Click "Load unpacked"
   - Select the `complyze-extension` folder
   - The extension should now appear in your extensions list

4. **Pin the Extension**
   - Click the puzzle piece icon in Chrome toolbar
   - Pin "Complyze AI Guard" for easy access

### Method 2: Install from Chrome Web Store

*Coming soon - extension will be published to Chrome Web Store*

## ⚙️ Configuration

### 1. Authentication Setup

1. **Visit Complyze Dashboard**
   - Navigate to `https://complyze.co/dashboard`
   - Log in to your account
   - The extension will automatically detect your UUID

2. **Verify Authentication**
   - Click the Complyze AI Guard extension icon
   - Check that "Authentication" shows "Connected & Verified"
   - If not connected, click "🔄 Refresh"

### 2. Optional: OpenRouter API Configuration

For enhanced prompt optimization features:

1. **Get OpenRouter API Key**
   - Sign up at [OpenRouter.ai](https://openrouter.ai)
   - Generate an API key

2. **Configure in Extension**
   - Click the extension icon
   - Click "⚙️ Configure API Keys"
   - Enter your OpenRouter API key
   - Click OK to save

## 🎯 Usage

### Automatic Protection

The extension automatically monitors your AI interactions:

1. **Visit Supported Platforms**
   - ChatGPT (chatgpt.com)
   - Claude (claude.ai)
   - Gemini (gemini.google.com)

2. **Type Sensitive Data**
   - Credit card numbers (e.g., `4532-1234-5678-9012`)
   - Social Security Numbers (e.g., `123-45-6789`)
   - Email addresses (e.g., `user@example.com`)
   - Phone numbers (e.g., `(555) 123-4567`)
   - API keys (e.g., `sk-...`)

3. **Warning Modal Appears**
   - Modal shows 140px above text input
   - Lists detected sensitive information
   - Provides options:
     - **🔒 View Safe Version**: Get AI-optimized secure prompt
     - **Send Anyway**: Proceed with original prompt

### Manual Testing

Test the detection system:

1. Click the extension icon
2. Click "🧪 Test Detection"
3. Navigate to ChatGPT, Claude, or Gemini
4. Test data will be automatically inserted
5. Warning modal should appear

### Dashboard Monitoring

All flagged prompts are automatically synced to your Complyze dashboard:

1. Visit `https://complyze.co/dashboard`
2. View prompt events in the `prompt_events` table
3. Monitor compliance metrics and risk levels

## 🛡️ Security Features

### PII Detection Patterns

The extension detects:

| Type | Pattern | Risk Level | Example |
|------|---------|------------|---------|
| Credit Card | Visa, MasterCard, Amex, etc. | High | `4532-1234-5678-9012` |
| SSN | XXX-XX-XXXX format | High | `123-45-6789` |
| Email | Standard email format | Medium | `user@example.com` |
| Phone | US phone numbers | Medium | `(555) 123-4567` |
| IP Address | IPv4 addresses | Low | `192.168.1.1` |
| API Key | Common API key patterns | High | `sk-1234567890abcdef` |
| Medical | Healthcare-related terms | High | `patient diagnosis` |

### Risk Assessment

- **Integrity Score**: 0-100 based on detected PII
- **Risk Level**: Low, Medium, High
- **Control Mapping**: NIST and HIPAA framework compliance

### Data Sync Structure

Synced to Supabase `prompt_events` table:

```json
{
  "user_id": "uuid",
  "model": "detected-model",
  "usd_cost": 0.005,
  "prompt_tokens": 150,
  "completion_tokens": 0,
  "integrity_score": 75,
  "risk_type": "financial",
  "risk_level": "high",
  "platform": "ChatGPT",
  "metadata": {
    "platform": "ChatGPT",
    "detected_pii": ["CREDIT_CARD", "EMAIL"],
    "mapped_controls": [...],
    "flagged": true
  }
}
```

## 🔧 Extension Controls

### Toggle Settings

Access via extension popup:

- **Extension Enabled**: Master on/off switch
- **PII Detection**: Enable/disable sensitive data detection
- **Modal Warnings**: Show/hide warning modals
- **Dashboard Sync**: Enable/disable Supabase sync

### Statistics Tracking

Monitor daily activity:

- **Prompts Scanned**: Total prompts analyzed
- **Threats Blocked**: Sensitive data detections
- **Platforms Active**: Currently monitored platforms
- **Cost Saved**: Estimated savings from prevention

## 🚨 Troubleshooting

### Common Issues

1. **Authentication Failed**
   - Ensure you're logged into `complyze.co/dashboard`
   - Click "🔄 Refresh" in extension popup
   - Check browser console for errors

2. **Detection Not Working**
   - Verify extension is enabled in popup
   - Check that PII Detection is turned on
   - Try the test detection feature

3. **Modal Not Appearing**
   - Ensure Modal Warnings are enabled
   - Check for conflicts with other extensions
   - Refresh the AI platform page

4. **Dashboard Sync Issues**
   - Verify authentication is working
   - Check Dashboard Sync toggle is enabled
   - Monitor browser console for API errors

### Browser Console Debugging

Enable debugging by opening browser console (F12):

```javascript
// Check extension status
console.log('Complyze status:', window.complyzeMonitor);

// Test PII detection
console.log('PII test:', window.complyzeDetectPII?.('test@example.com'));
```

## 🔗 API Endpoints

### Production Configuration

- **API Base**: `https://complyze.co/api`
- **Ingest Endpoint**: `https://complyze.co/api/ingest`
- **Auth Validation**: `https://complyze.co/api/auth/validate`
- **OpenRouter API**: `https://openrouter.ai/api/v1/chat/completions`
- **Model**: `google/gemini-2.5-flash-preview-05-20`

## 📝 Development

### File Structure

```
complyze-extension/
├── manifest.json          # Extension manifest
├── background.js          # Service worker
├── content.js            # Content script for AI platforms
├── popup.html            # Extension popup interface
├── popup.js              # Popup functionality
├── injectUI.js           # Web accessible resources
├── icons/                # Extension icons
│   ├── icon16.png
│   ├── icon24.png
│   ├── icon32.png
│   ├── icon48.png
│   ├── icon64.png
│   └── icon128.png
└── README.md             # This file
```

### Key Components

- **Background Script**: UUID authentication and Supabase sync
- **Content Script**: Real-time monitoring and PII detection
- **Popup Interface**: Settings and status management
- **Injectable UI**: Enhanced warning modals and indicators

## 📄 License

MIT License - see LICENSE file for details

## 🤝 Support

For support and bug reports:

1. Check the troubleshooting section above
2. Review browser console for errors
3. Contact support at [support@complyze.co](mailto:support@complyze.co)
4. Visit [complyze.co](https://complyze.co) for documentation

## 🔄 Updates

The extension automatically checks for updates. To manually update:

1. Visit `chrome://extensions/`
2. Click "Update" button
3. Or reload the unpacked extension in developer mode

---

**⚠️ Important**: This extension is designed for enterprise compliance and security. Always review and understand your organization's data policies before using AI platforms with sensitive information. 