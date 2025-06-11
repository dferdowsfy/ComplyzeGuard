/**
 * OpenRouter API Connection Debug Tool
 * Run this in browser console to diagnose connection issues
 */

async function debugApiConnection() {
  console.log('🔍 DEBUGGING OPENROUTER API CONNECTION');
  console.log('=====================================');
  
  const apiKey = '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';
  const model = 'meta-llama/llama-3.3-8b-instruct:free';
  const baseUrl = 'https://openrouter.ai/api/v1';
  
  console.log('📋 Configuration:');
  console.log('  - API Key:', apiKey.substring(0, 12) + '...');
  console.log('  - Model:', model);
  console.log('  - Base URL:', baseUrl);
  console.log('  - Key Length:', apiKey.length);
  console.log('  - Key Format Valid:', apiKey.startsWith('sk-or-v1-'));
  
  try {
    // Test 1: Basic fetch to models endpoint
    console.log('\n🧪 Test 1: Testing /models endpoint...');
    
    const modelsResponse = await fetch(`${baseUrl}/models`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
        'HTTP-Referer': 'https://complyze.co',
        'X-Title': 'Complyze AI Guard'
      }
    });
    
    console.log('📡 Models Response:');
    console.log('  - Status:', modelsResponse.status);
    console.log('  - Status Text:', modelsResponse.statusText);
    console.log('  - Headers:', Object.fromEntries(modelsResponse.headers.entries()));
    
    if (!modelsResponse.ok) {
      const errorText = await modelsResponse.text();
      console.error('❌ Models endpoint failed:');
      console.error('  - Error body:', errorText);
      
      // Check for common errors
      if (modelsResponse.status === 401) {
        console.error('🔑 Authentication failed - API key may be invalid');
      } else if (modelsResponse.status === 403) {
        console.error('🚫 Forbidden - API key may not have required permissions');
      } else if (modelsResponse.status === 429) {
        console.error('🚦 Rate limited - too many requests');
      } else if (modelsResponse.status === 0) {
        console.error('🌐 Network error - CORS or connectivity issue');
      }
      
      return false;
    }
    
    const modelsData = await modelsResponse.json();
    console.log('✅ Models endpoint successful');
    console.log('  - Total models:', modelsData.data?.length || 0);
    
    // Check if our target model exists
    const targetModel = modelsData.data?.find(m => m.id === model);
    if (targetModel) {
      console.log('✅ Target model found:', {
        id: targetModel.id,
        name: targetModel.name,
        pricing: targetModel.pricing
      });
    } else {
      console.warn('⚠️ Target model not found in available models');
      const freeModels = modelsData.data?.filter(m => 
        m.pricing?.prompt === "0" || 
        m.pricing?.prompt === 0 ||
        m.id.includes(':free')
      ).slice(0, 10);
      console.log('📋 Available free models:', freeModels?.map(m => m.id) || []);
    }
    
    // Test 2: Simple chat completion
    console.log('\n🧪 Test 2: Testing chat completion...');
    
    const testPayload = {
      model: model,
      messages: [
        {
          role: 'user',
          content: 'Reply with exactly: "API connection successful"'
        }
      ],
      temperature: 0.1,
      max_tokens: 20,
      stream: false
    };
    
    console.log('📤 Sending chat request:');
    console.log('  - Payload:', testPayload);
    
    const chatResponse = await fetch(`${baseUrl}/chat/completions`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
        'HTTP-Referer': 'https://complyze.co',
        'X-Title': 'Complyze AI Guard'
      },
      body: JSON.stringify(testPayload)
    });
    
    console.log('📡 Chat Response:');
    console.log('  - Status:', chatResponse.status);
    console.log('  - Status Text:', chatResponse.statusText);
    
    if (!chatResponse.ok) {
      const errorText = await chatResponse.text();
      console.error('❌ Chat completion failed:');
      console.error('  - Error body:', errorText);
      
      try {
        const errorJson = JSON.parse(errorText);
        console.error('  - Error details:', errorJson);
      } catch (e) {
        console.error('  - Raw error:', errorText);
      }
      
      return false;
    }
    
    const chatData = await chatResponse.json();
    console.log('✅ Chat completion successful');
    console.log('  - Response:', chatData.choices[0]?.message?.content);
    console.log('  - Usage:', chatData.usage);
    console.log('  - Model used:', chatData.model);
    
    // Test 3: Test with actual smart rewrite prompt
    console.log('\n🧪 Test 3: Testing smart rewrite functionality...');
    
    const smartRewritePayload = {
      model: model,
      messages: [
        {
          role: 'system',
          content: 'You are a privacy-focused AI assistant that rewrites prompts to remove sensitive information while preserving the original meaning and intent. Replace all sensitive data with natural, generic alternatives without using [REDACTED] tags.'
        },
        {
          role: 'user',
          content: 'Rewrite this prompt to remove sensitive data naturally (detected: EMAIL, API_KEY):\n\nMy email is john.doe@company.com and my API key is sk-test123. Please help me with authentication.'
        }
      ],
      temperature: 0.1,
      max_tokens: 200,
      stream: false
    };
    
    const rewriteResponse = await fetch(`${baseUrl}/chat/completions`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
        'HTTP-Referer': 'https://complyze.co',
        'X-Title': 'Complyze AI Guard - Smart Rewrite'
      },
      body: JSON.stringify(smartRewritePayload)
    });
    
    if (!rewriteResponse.ok) {
      const errorText = await rewriteResponse.text();
      console.error('❌ Smart rewrite test failed:', errorText);
      return false;
    }
    
    const rewriteData = await rewriteResponse.json();
    console.log('✅ Smart rewrite test successful');
    console.log('  - Original: My email is john.doe@company.com and my API key is sk-test123. Please help me with authentication.');
    console.log('  - Rewritten:', rewriteData.choices[0]?.message?.content);
    console.log('  - Tokens used:', rewriteData.usage?.total_tokens);
    
    console.log('\n🎉 ALL API TESTS PASSED!');
    console.log('📋 Summary:');
    console.log('  ✅ Models endpoint accessible');
    console.log('  ✅ Chat completion working');
    console.log('  ✅ Smart rewrite functional');
    console.log('  ✅ API key valid and working');
    
    return true;
    
  } catch (error) {
    console.error('❌ API test failed with error:', error);
    
    if (error.name === 'TypeError' && error.message.includes('fetch')) {
      console.error('🌐 Network error - possible CORS or connectivity issue');
      console.error('💡 Try running this test from a Chrome extension context');
    } else if (error.name === 'SyntaxError') {
      console.error('📝 JSON parsing error - API returned invalid response');
    } else {
      console.error('🔧 Unexpected error:', error.message);
    }
    
    return false;
  }
}

// Test with current PromptOptimizer configuration
async function testPromptOptimizerConnection() {
  console.log('\n🔧 TESTING PROMPTOPTIMIZER CONNECTION');
  console.log('====================================');
  
  try {
    if (typeof PromptOptimizer === 'undefined') {
      console.error('❌ PromptOptimizer class not found');
      console.error('💡 Make sure promptOptimizer.js is loaded');
      return false;
    }
    
    const optimizer = new PromptOptimizer();
    await optimizer.ensureInitialized();
    
    console.log('📋 PromptOptimizer Configuration:');
    console.log('  - API Key:', optimizer.apiKey ? optimizer.apiKey.substring(0, 12) + '...' : 'NOT SET');
    console.log('  - Model:', optimizer.model);
    console.log('  - Enabled:', optimizer.enabled);
    console.log('  - Initialized:', optimizer.initialized);
    
    if (!optimizer.apiKey) {
      console.error('❌ No API key configured in PromptOptimizer');
      return false;
    }
    
    // Test connection using PromptOptimizer method
    console.log('\n🧪 Testing PromptOptimizer.testConnection()...');
    const connectionResult = await optimizer.testConnection();
    
    console.log('✅ PromptOptimizer connection test result:', connectionResult);
    
    // Test smart rewrite
    console.log('\n🧪 Testing PromptOptimizer.smartRewrite()...');
    const testText = "My email is test@example.com and my API key is sk-abc123";
    const testPII = [
      { type: 'EMAIL', description: 'Email Address' },
      { type: 'API_KEY', description: 'API Key' }
    ];
    
    const rewriteResult = await optimizer.smartRewrite(testText, testPII);
    
    console.log('✅ Smart rewrite result:');
    console.log('  - Method:', rewriteResult.method);
    console.log('  - Original:', testText);
    console.log('  - Rewritten:', rewriteResult.optimizedText);
    console.log('  - Cost:', rewriteResult.cost);
    
    if (rewriteResult.method === 'basic_redaction_fallback') {
      console.warn('⚠️ Fell back to basic redaction - API may not be working');
      return false;
    }
    
    console.log('\n🎉 PROMPTOPTIMIZER TESTS PASSED!');
    return true;
    
  } catch (error) {
    console.error('❌ PromptOptimizer test failed:', error);
    return false;
  }
}

// Check browser environment and CORS
function checkEnvironment() {
  console.log('\n🌐 ENVIRONMENT CHECK');
  console.log('====================');
  
  console.log('📋 Browser Environment:');
  console.log('  - User Agent:', navigator.userAgent);
  console.log('  - Origin:', window.location.origin);
  console.log('  - Protocol:', window.location.protocol);
  console.log('  - Host:', window.location.host);
  
  console.log('📋 Available APIs:');
  console.log('  - fetch:', typeof fetch !== 'undefined');
  console.log('  - chrome:', typeof chrome !== 'undefined');
  console.log('  - chrome.storage:', typeof chrome?.storage !== 'undefined');
  console.log('  - chrome.runtime:', typeof chrome?.runtime !== 'undefined');
  
  console.log('📋 Extension Context:');
  if (typeof chrome !== 'undefined' && chrome.runtime && chrome.runtime.id) {
    console.log('  ✅ Running in Chrome extension context');
    console.log('  - Extension ID:', chrome.runtime.id);
  } else {
    console.log('  ⚠️ Not running in Chrome extension context');
    console.log('  💡 Some features may not work due to CORS restrictions');
  }
}

// Main test runner
async function runAllConnectionTests() {
  console.log('🚀 RUNNING ALL CONNECTION TESTS');
  console.log('================================');
  
  checkEnvironment();
  
  const directApiTest = await debugApiConnection();
  const promptOptimizerTest = await testPromptOptimizerConnection();
  
  console.log('\n📊 FINAL RESULTS');
  console.log('================');
  console.log('  Direct API Test:', directApiTest ? '✅ PASS' : '❌ FAIL');
  console.log('  PromptOptimizer Test:', promptOptimizerTest ? '✅ PASS' : '❌ FAIL');
  
  if (!directApiTest) {
    console.log('\n💡 TROUBLESHOOTING TIPS:');
    console.log('  1. Check your internet connection');
    console.log('  2. Verify the API key is correct');
    console.log('  3. Try running from a Chrome extension context');
    console.log('  4. Check if OpenRouter.ai is accessible from your network');
  }
  
  return { directApiTest, promptOptimizerTest };
}

// Make functions available globally
window.debugApiConnection = debugApiConnection;
window.testPromptOptimizerConnection = testPromptOptimizerConnection;
window.checkEnvironment = checkEnvironment;
window.runAllConnectionTests = runAllConnectionTests;

console.log('🔧 API Connection Debug Tool Loaded!');
console.log('📋 Available functions:');
console.log('  - debugApiConnection() - Test direct API calls');
console.log('  - testPromptOptimizerConnection() - Test PromptOptimizer');
console.log('  - checkEnvironment() - Check browser environment');
console.log('  - runAllConnectionTests() - Run all tests');
console.log('');
console.log('💡 Run runAllConnectionTests() to diagnose connection issues'); 