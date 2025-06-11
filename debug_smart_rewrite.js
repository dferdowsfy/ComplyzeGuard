/**
 * Smart Rewrite Debug Tool
 * Specifically for diagnosing and fixing OpenRouter API issues
 */

console.log('🤖 Loading Smart Rewrite Debug Tool...');

// Comprehensive Smart Rewrite diagnostics
window.debugSmartRewrite = async function() {
  console.log('\n🤖 DEBUGGING SMART REWRITE API');
  console.log('=' + '='.repeat(35));
  
  try {
    // Step 1: Check PromptOptimizer availability
    console.log('📋 Step 1: Checking PromptOptimizer availability...');
    
    if (!window.PromptOptimizer) {
      console.error('❌ PromptOptimizer class not available');
      console.error('💡 Make sure promptOptimizer.js is loaded');
      return false;
    }
    
    console.log('✅ PromptOptimizer class available');
    
    // Step 2: Initialize and check configuration
    console.log('\n📋 Step 2: Initializing PromptOptimizer...');
    
    const optimizer = new window.PromptOptimizer();
    await optimizer.ensureInitialized();
    
    console.log('📊 Configuration:', {
      enabled: optimizer.enabled,
      hasApiKey: !!optimizer.apiKey,
      apiKeyLength: optimizer.apiKey?.length,
      apiKeyPrefix: optimizer.apiKey?.substring(0, 12),
      model: optimizer.model,
      baseUrl: optimizer.baseUrl,
      initialized: optimizer.initialized
    });
    
    if (!optimizer.apiKey) {
      console.error('❌ No API key configured');
      console.error('💡 The hardcoded fallback key should be available');
      console.error('💡 Current key value:', optimizer.apiKey);
      return false;
    }
    
    if (!optimizer.enabled) {
      console.error('❌ PromptOptimizer is disabled');
      console.error('💡 Setting enabled to true...');
      optimizer.enabled = true;
    }
    
    console.log('✅ PromptOptimizer configuration looks good');
    
    // Step 3: Test basic API connection
    console.log('\n📋 Step 3: Testing OpenRouter API connection...');
    
    try {
      const startTime = Date.now();
      
      const response = await fetch(`${optimizer.baseUrl}/chat/completions`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${optimizer.apiKey}`,
          'Content-Type': 'application/json',
          'HTTP-Referer': 'https://complyze.co',
          'X-Title': 'Complyze AI Guard - Debug Test'
        },
        body: JSON.stringify({
          model: optimizer.model,
          messages: [
            {
              role: 'user',
              content: 'Test message - please respond with just "OK".'
            }
          ],
          max_tokens: 10,
          temperature: 0
        })
      });
      
      const responseTime = Date.now() - startTime;
      
      console.log('📡 Raw API response:', {
        status: response.status,
        statusText: response.statusText,
        responseTime: responseTime + 'ms',
        headers: {
          'content-type': response.headers.get('content-type'),
          'x-ratelimit-remaining': response.headers.get('x-ratelimit-remaining'),
          'x-ratelimit-reset': response.headers.get('x-ratelimit-reset')
        }
      });
      
      if (!response.ok) {
        const errorText = await response.text();
        console.error('❌ API connection failed:', {
          status: response.status,
          statusText: response.statusText,
          error: errorText
        });
        
        // Specific error handling
        if (response.status === 401) {
          console.error('🔑 Authentication Error:');
          console.error('   - Check API key validity');
          console.error('   - Visit: https://openrouter.ai/keys');
          console.error('   - Current key:', optimizer.apiKey?.substring(0, 12) + '...');
        } else if (response.status === 402) {
          console.error('💳 Payment Required:');
          console.error('   - Check OpenRouter billing');
          console.error('   - Visit: https://openrouter.ai/credits');
        } else if (response.status === 429) {
          console.error('🚦 Rate Limit Exceeded:');
          console.error('   - Too many requests');
          console.error('   - Wait before retrying');
        } else if (response.status === 400) {
          console.error('📝 Bad Request:');
          console.error('   - Check model name:', optimizer.model);
          console.error('   - Check request format');
        }
        
        return false;
      }
      
      const data = await response.json();
      console.log('✅ API connection successful!');
      console.log('📊 Response data:', {
        hasChoices: !!data.choices,
        choicesCount: data.choices?.length,
        responseContent: data.choices?.[0]?.message?.content,
        usage: data.usage,
        model: data.model
      });
      
    } catch (apiError) {
      console.error('❌ API connection error:', apiError);
      console.error('💡 Check network connectivity and API endpoint');
      return false;
    }
    
    // Step 4: Test Smart Rewrite functionality
    console.log('\n📋 Step 4: Testing Smart Rewrite functionality...');
    
    const testText = "Please help me with this code. My email is john.doe@company.com and I'm using API key sk-test123456789. Call me at 555-123-4567 if you have questions.";
    const testPII = [
      { type: 'EMAIL', description: 'Email Address' },
      { type: 'API_KEY', description: 'API Key' },
      { type: 'PHONE', description: 'Phone Number' }
    ];
    
    console.log('📝 Test input:', {
      text: testText,
      piiTypes: testPII.map(p => p.type),
      textLength: testText.length
    });
    
    try {
      const rewriteStartTime = Date.now();
      const rewriteResult = await optimizer.smartRewrite(testText, testPII);
      const rewriteTime = Date.now() - rewriteStartTime;
      
      console.log('✅ Smart Rewrite completed!');
      console.log('📊 Rewrite result:', {
        method: rewriteResult.method,
        originalLength: testText.length,
        rewrittenLength: rewriteResult.optimizedText?.length,
        cost: rewriteResult.cost,
        model: rewriteResult.model,
        processingTime: rewriteTime + 'ms',
        hasError: !!rewriteResult.error
      });
      
      console.log('📝 Original text:', testText);
      console.log('📝 Rewritten text:', rewriteResult.optimizedText);
      
      if (rewriteResult.method === 'smart_rewrite') {
        console.log('🎉 Smart Rewrite is working correctly!');
        
        // Check if PII was properly removed
        const outputPII = window.PIIDetector ? 
          window.PIIDetector.detectSensitiveData(rewriteResult.optimizedText) : [];
        
        if (outputPII.length === 0) {
          console.log('✅ All PII successfully removed from output');
        } else {
          console.log('⚠️ Some PII may still be present:', outputPII.map(p => p.type));
        }
        
        return true;
        
      } else if (rewriteResult.method.includes('fallback')) {
        console.error('❌ Smart Rewrite fell back to basic redaction');
        console.error('   Error:', rewriteResult.error);
        return false;
      }
      
    } catch (rewriteError) {
      console.error('❌ Smart Rewrite test failed:', rewriteError);
      return false;
    }
    
    // Step 5: Test with different models
    console.log('\n📋 Step 5: Testing with different models...');
    
    const testModels = [
      'meta-llama/llama-3.1-8b-instruct:free',
      'microsoft/wizardlm-2-8x22b:nitro',
      'google/gemini-2.0-flash-exp:free'
    ];
    
    for (const testModel of testModels) {
      console.log(`🧪 Testing model: ${testModel}`);
      
      const tempOptimizer = new window.PromptOptimizer();
      await tempOptimizer.ensureInitialized();
      tempOptimizer.model = testModel;
      
      try {
        const modelTestResult = await tempOptimizer.smartRewrite(
          "Test with my email test@example.com", 
          [{ type: 'EMAIL', description: 'Email Address' }]
        );
        
        console.log(`✅ ${testModel}: ${modelTestResult.method}`);
        
      } catch (modelError) {
        console.log(`❌ ${testModel}: Failed - ${modelError.message}`);
      }
    }
    
  } catch (error) {
    console.error('❌ Debug function failed:', error);
    return false;
  }
};

// Quick test function for Smart Rewrite
window.quickTestSmartRewrite = async function() {
  console.log('🚀 Quick Smart Rewrite Test...');
  
  try {
    if (!window.PromptOptimizer) {
      console.error('❌ PromptOptimizer not available');
      return false;
    }
    
    const optimizer = new window.PromptOptimizer();
    await optimizer.ensureInitialized();
    
    console.log('🔧 Configuration:', {
      enabled: optimizer.enabled,
      hasApiKey: !!optimizer.apiKey,
      apiKeyPrefix: optimizer.apiKey?.substring(0, 8),
      model: optimizer.model
    });
    
    const result = await optimizer.smartRewrite(
      "My email is test@company.com", 
      [{ type: 'EMAIL', description: 'Email Address' }]
    );
    
    console.log('📊 Result:', result);
    
    if (result.method === 'smart_rewrite') {
      console.log('✅ Smart Rewrite is working!');
      return true;
    } else {
      console.log('❌ Smart Rewrite not working, using fallback method:', result.method);
      return false;
    }
    
  } catch (error) {
    console.error('❌ Quick test failed:', error);
    return false;
  }
};

// Fix Smart Rewrite configuration
window.fixSmartRewrite = async function() {
  console.log('🔧 FIXING SMART REWRITE CONFIGURATION...');
  
  try {
    if (!window.PromptOptimizer) {
      console.error('❌ PromptOptimizer not available');
      return false;
    }
    
    const optimizer = new window.PromptOptimizer();
    
    // Force enable and set proper API key
    optimizer.enabled = true;
    
    if (!optimizer.apiKey) {
      const fallbackKey = 'sk-or-v1-a40a8b7c4a68decedb3dce0d9e9aa358d2f203d9f';
      optimizer.apiKey = fallbackKey;
      
      // Save to storage
      await chrome.storage.local.set({ 
        openRouterApiKey: fallbackKey,
        promptOptimizationEnabled: true 
      });
      
      console.log('✅ API key set and saved to storage');
    }
    
    // Test the fix
    const testResult = await optimizer.testConnection();
    
    if (testResult.success) {
      console.log('✅ Smart Rewrite fixed and working!');
      return true;
    } else {
      console.log('❌ Fix failed, connection test unsuccessful');
      return false;
    }
    
  } catch (error) {
    console.error('❌ Fix failed:', error);
    return false;
  }
};

// Check OpenRouter account status
window.checkOpenRouterStatus = async function() {
  console.log('💳 Checking OpenRouter Account Status...');
  
  try {
    const optimizer = new window.PromptOptimizer();
    await optimizer.ensureInitialized();
    
    if (!optimizer.apiKey) {
      console.error('❌ No API key available');
      return false;
    }
    
    // Check account info
    const response = await fetch('https://openrouter.ai/api/v1/auth/key', {
      headers: {
        'Authorization': `Bearer ${optimizer.apiKey}`
      }
    });
    
    if (response.ok) {
      const data = await response.json();
      console.log('✅ Account status:', data);
      return true;
    } else {
      const error = await response.text();
      console.error('❌ Account check failed:', response.status, error);
      return false;
    }
    
  } catch (error) {
    console.error('❌ Account check error:', error);
    return false;
  }
};

console.log('✅ Smart Rewrite Debug Tool loaded!');
console.log('');
console.log('🤖 Available debug functions:');
console.log('  - debugSmartRewrite() - Complete Smart Rewrite diagnosis');
console.log('  - quickTestSmartRewrite() - Quick functionality test');
console.log('  - fixSmartRewrite() - Attempt to fix configuration');
console.log('  - checkOpenRouterStatus() - Check API key status');
console.log('');
console.log('🚀 Run debugSmartRewrite() to diagnose the issue!'); 