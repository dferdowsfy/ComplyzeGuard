# 🚀 OpenRouter Integration & AI-Powered Prompt Optimization

## Overview

Complyze AI Guard now includes intelligent prompt optimization using OpenRouter API. Instead of simple redaction with placeholder text, you can use AI to intelligently rewrite prompts while preserving their intent and removing sensitive information.

## 🔑 Setup Instructions

### 1. Get OpenRouter API Key

1. Visit [openrouter.ai/keys](https://openrouter.ai/keys)
2. Create an account or sign in
3. Click "Create Key" 
4. Copy your API key (starts with `sk-or-`)

### 2. Configure in Extension

1. Click the Complyze extension icon
2. Click "⚙️ Configure API Keys"
3. Enter your OpenRouter API key
4. Select your preferred model:
   - **Free Models** (No cost, rate limited):
     - Llama 3.1 8B Instruct
     - Gemma 2 9B IT
     - Phi-3 Mini 128k
   - **Paid Models** (Higher quality, faster):
     - Llama 3.1 70B Instruct
     - Claude 3.5 Sonnet
     - GPT-4o Mini
5. Enable "AI-powered prompt optimization"
6. Click "🧪 Test" to verify connection
7. Save configuration

## 🧠 How It Works

### Basic Redaction (Without OpenRouter)
```
Input:  "My email is john.doe@company.com and my credit card is 4532-1234-5678-9012"
Output: "My email is [EMAIL_REDACTED] and my credit card is [CREDIT_CARD_REDACTED]"
```

### AI-Powered Optimization (With OpenRouter)
```
Input:  "My email is john.doe@company.com and my credit card is 4532-1234-5678-9012"
Output: "My email address and payment method information"
```

### Advanced Example
```
Input:  "I need help debugging an API issue. My API key is sk-abc123def456 and the server is at 192.168.1.100"
Output: "I need help debugging an API issue with my authentication credentials and server connection"
```

## 💰 Cost Management

### Free Models
- No direct cost (OpenRouter provides free tier)
- Rate limited (typically 10-20 requests/hour)
- Perfect for personal use

### Paid Models
- High quality optimization
- Costs typically $0.0001 - $0.001 per optimization
- Real-time processing
- Recommended for business use

### Cost Tracking
- All optimization costs are logged to Supabase
- Track spending in your Complyze dashboard
- Set usage alerts and limits

## 📊 Supabase Integration

All prompt events are automatically synced to the `prompt_events` table with:

```json
{
  "event_type": "prompt_optimization",
  "original_text": "[Original prompt]",
  "optimized_text": "[AI-optimized version]", 
  "method": "ai_optimization",
  "model": "meta-llama/llama-3.1-8b-instruct:free",
  "cost": 0.0003,
  "detected_pii": ["EMAIL", "CREDIT_CARD"],
  "platform": "ChatGPT",
  "timestamp": "2024-01-15T10:30:00Z"
}
```

## 🔧 Technical Details

### Fallback System
1. **Primary**: AI optimization via OpenRouter
2. **Fallback**: Basic pattern-based redaction
3. **Error Handling**: Graceful degradation with user notification

### Supported PII Types
- ✅ Credit Cards, SSN, Phone Numbers
- ✅ Email Addresses, Names, Addresses  
- ✅ API Keys, OAuth Tokens, SSH Keys
- ✅ Medical Records, Financial Data
- ✅ Jailbreak Patterns, Prompt Injections
- ✅ IP Addresses, Passport Numbers

### Security Features
- API keys stored locally in browser
- No sensitive data sent to unauthorized servers
- End-to-end encryption for API communications
- Automatic retry with basic redaction on API failures

## 🎛️ Configuration Options

### Available Models

| Model | Type | Cost | Speed | Quality |
|-------|------|------|-------|---------|
| Llama 3.1 8B | Free | $0 | Fast | Good |
| Gemma 2 9B | Free | $0 | Fast | Good |
| Phi-3 Mini | Free | $0 | Fast | Good |
| Llama 3.1 70B | Paid | Low | Fast | Excellent |
| Claude 3.5 Sonnet | Paid | Medium | Medium | Excellent |
| GPT-4o Mini | Paid | Low | Fast | Excellent |

### Model Selection Tips
- **Development/Personal**: Use free models
- **Production/Business**: Use paid models for consistency
- **High Volume**: Llama 3.1 70B for best cost/performance
- **Highest Quality**: Claude 3.5 Sonnet for complex prompts

## 🛠️ Troubleshooting

### Common Issues

**1. "API key not configured" error**
- Solution: Set up OpenRouter API key in extension settings

**2. "Connection failed" error**  
- Check API key is valid
- Verify internet connection
- Try a different model

**3. "Falling back to basic redaction"**
- API quota exceeded (free tier)
- Network connectivity issues
- Model temporarily unavailable

**4. High costs**
- Switch to free models
- Reduce prompt frequency
- Set usage alerts

### Debug Commands

Open browser console on any AI platform and run:

```javascript
// Test prompt optimizer
window.PromptOptimizer && new PromptOptimizer().testConnection()

// Check current settings
chrome.storage.local.get(['openRouterApiKey', 'openRouterModel'])

// Force sidebar refresh
window.complyzeSidebar && window.complyzeSidebar.initialize()
```

## 📈 Benefits

### For Users
- ✅ Preserve prompt intent while removing PII
- ✅ Natural language output vs obvious redaction
- ✅ Learn privacy best practices through examples
- ✅ Maintain conversational flow with AI

### For Organizations  
- ✅ Comprehensive audit trail in Supabase
- ✅ Cost tracking and optimization
- ✅ Compliance reporting
- ✅ Advanced threat detection

## 🚀 Next Steps

1. **Set up your API key** using the configuration modal
2. **Test with sample data** using the "🧪 Test Detection" button
3. **Monitor costs** in your Complyze dashboard
4. **Adjust models** based on usage patterns
5. **Review optimization logs** in Supabase

## 🔗 Resources

- [OpenRouter Documentation](https://openrouter.ai/docs)
- [Complyze Dashboard](https://complyze.co/dashboard)
- [Privacy Best Practices](https://complyze.co/privacy)
- [API Usage Guidelines](https://complyze.co/api-usage)

---

*Need help? Contact support at [support@complyze.co](mailto:support@complyze.co)* 