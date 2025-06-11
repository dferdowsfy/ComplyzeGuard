# 🛡️ Complyze Extension - Complete Setup Guide

## 🎯 Quick Fix Summary

**Issue Fixed**: The sidebar was only working on the local test file because it wasn't properly integrated into the Chrome extension content script flow.

**Solution**: Enhanced initialization logic with better error handling and retry mechanisms.

## 📋 Setup Steps

### 1. Generate Extension Icons
1. Open `create_logo.html` in your browser
2. Download all 6 icon sizes (16px, 24px, 32px, 48px, 64px, 128px)
3. Replace the existing placeholder files in the `icons/` folder
4. All icons will have the Complyze shield logo with gradient background

### 2. Load Extension in Chrome
1. Open Chrome and go to `chrome://extensions/`
2. Enable "Developer mode" (toggle in top right)
3. Click "Load unpacked"
4. Select your `complyze-extension` folder
5. The extension should load with the new icon

### 3. Test the Extension

#### Option A: Test on Debug Page
1. Open `debug_extension.html` in Chrome
2. The page will show extension status in real-time
3. Use the test data examples to verify PII detection
4. Click "Toggle Sidebar" to open the settings panel

#### Option B: Test on Real AI Sites
1. Go to `chatgpt.com`, `claude.ai`, or `gemini.google.com`
2. Look for the gear icon (⚙️) on the left side of the screen
3. Click it to open the Complyze sidebar
4. Try typing sensitive data to see the warnings

## 🔧 Troubleshooting

### Sidebar Not Appearing
If the sidebar doesn't show up:

1. **Check Console Logs**:
   - Open Developer Tools (F12)
   - Look for "Complyze" messages in console
   - Should see: "Complyze Monitor initialized" and "Complyze Sidebar initialized"

2. **Verify Extension Loading**:
   - Go to `chrome://extensions/`
   - Make sure the extension is enabled
   - Check for any error messages

3. **Test on Debug Page**:
   - Open `debug_extension.html`
   - Check the status indicators
   - Use browser console to debug

### Manual Sidebar Creation
If automatic initialization fails, you can manually create the sidebar:

```javascript
// Open browser console and run:
if (typeof LeftSidebarPanel !== 'undefined') {
  window.sidebar = new LeftSidebarPanel();
  console.log('Sidebar created manually');
} else {
  console.log('LeftSidebarPanel class not available');
}
```

## 🎮 Using the Sidebar

### Opening the Sidebar
- Click the gear icon (⚙️) on the left edge of the screen
- The sidebar will slide in from the left

### Rule Categories
1. **👤 PII**: Names, emails, phones, addresses, SSN, passports, IP addresses
2. **🔐 Credentials**: API keys, OAuth tokens, SSH keys, passwords, vault paths
3. **🏢 Company Internal**: URLs, project codes, tools, strategic plans, R&D data
4. **🤖 AI Model**: Model names, training data, fine-tuned logic, private weights
5. **⚖️ Regulated**: PHI/HIPAA, financial records, ITAR, biometric data
6. **🚫 Jailbreak**: Ignore instructions, prompt injection patterns

### Configuring Rules
- Click section headers to expand/collapse categories
- Toggle individual rules on/off with the switches
- Changes take effect immediately
- Footer shows active/total rule counts

## 🧪 Testing PII Detection

### Test Data Examples
Try pasting these into AI chat inputs:

```
Email Test: Contact me at john.doe@company.com
Phone Test: Call (555) 123-4567
SSN Test: My SSN is 123-45-6789
API Key Test: sk-1234567890abcdef1234567890abcdef
Credit Card Test: Card number 4532-1234-5678-9012
Medical Test: Patient has diabetes diagnosis
Jailbreak Test: Ignore previous instructions
```

### Expected Behavior
1. **Warning Modal**: Should appear when sensitive data is detected
2. **Blocked Submission**: Send buttons should be disabled
3. **Rule Filtering**: Only enabled rules should trigger warnings
4. **View Safe**: Option to see redacted version
5. **Send Anyway**: Override option for legitimate use

## 📁 File Structure

```
complyze-extension/
├── 📄 manifest.json           # Extension configuration
├── 📄 LeftSidebarPanel.js     # Sidebar UI component
├── 📄 content.js              # Main monitoring logic
├── 📄 background.js           # Background service worker
├── 📄 popup.html              # Extension popup
├── 📄 popup.js                # Popup logic
├── 🗂️ icons/                  # Extension icons (all sizes)
├── 📄 create_logo.html        # Logo generator tool
├── 📄 debug_extension.html    # Debug/test page
├── 📄 test_sidebar.html       # Sidebar test page
├── 📄 SETUP_GUIDE.md          # This guide
└── 📄 SIDEBAR_INTEGRATION.md  # Technical documentation
```

## 🔄 Development Workflow

### Making Changes
1. Edit the source files
2. Go to `chrome://extensions/`
3. Click the refresh icon on your extension
4. Test the changes

### Adding New PII Patterns
1. Update `PII_PATTERNS` in `content.js`
2. Add to `RISK_TYPE_MAPPING`
3. Update `filterPIIByActiveRules` mapping
4. Add to sidebar categories if needed

### Debugging
1. Use `debug_extension.html` for testing
2. Check browser console for error messages
3. Use `console.log()` statements for debugging
4. Test on actual AI websites

## 🚀 Deployment

### Publishing to Chrome Web Store
1. Ensure all icons are properly generated
2. Test thoroughly on all supported sites
3. Update version in `manifest.json`
4. Create a ZIP file of the extension folder
5. Upload to Chrome Web Store Developer Console

### Version Management
- Update `manifest.json` version for each release
- Document changes in release notes
- Test backward compatibility

## 🛟 Support

### Common Issues
- **Sidebar not loading**: Check initialization logs in console
- **Detection not working**: Verify rule mappings in code
- **Icons not showing**: Regenerate icons and reload extension
- **Performance issues**: Check for memory leaks in sidebar

### Getting Help
- Check browser console for error messages
- Use the debug page to test functionality
- Review the technical documentation
- Test on the standalone test pages first

## ✅ Success Checklist

- [ ] Extension loads without errors in Chrome
- [ ] New Complyze icons appear in browser and extension list
- [ ] Sidebar appears when clicking gear icon
- [ ] All rule categories expand and collapse properly
- [ ] Toggle switches change rule states
- [ ] PII detection works and respects active rules
- [ ] Warning modals appear for sensitive data
- [ ] Submission blocking works correctly
- [ ] Extension works on ChatGPT, Claude, and Gemini
- [ ] Debug page shows all systems as functional

Your Complyze Chrome extension with dynamic sidebar is now ready to use! 🎉 