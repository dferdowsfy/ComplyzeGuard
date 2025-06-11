/**
 * Comprehensive OpenRouter API Debug Script
 * Run this in the browser console to diagnose Smart Rewrite issues
 */

console.log('🔍 Starting Comprehensive OpenRouter Debug...');

// Test 1: Check if PromptOptimizer is available
console.log('\n=== TEST 1: PromptOptimizer Availability ===');
console.log('PromptOptimizer class available:', typeof PromptOptimizer !== 'undefined');
if (typeof PromptOptimizer === 'undefined') {
  console.error('❌ PromptOptimizer class not found. Check if promptOptimizer.js is loaded.');
}

// Test 2: Check Chrome Storage for API settings
console.log('\n=== TEST 2: Chrome Storage Settings ===');
async function checkStorageSettings() {
  try {
    const settings = await chrome.storage.local.get([
      'openRouterApiKey', 
      'openRouterModel',
      'promptOptimizationEnabled',
      'redactionMode'
    ]);
    
    console.log('📋 Storage settings:', {
      hasApiKey: !!settings.openRouterApiKey,
      apiKeyPreview: settings.openRouterApiKey ? 
        settings.openRouterApiKey.substring(0, 8) + '...' : 'None',
      model: settings.openRouterModel || 'Not set',
      optimizationEnabled: settings.promptOptimizationEnabled !== false,
      redactionMode: settings.redactionMode || 'Not set'
    });
    
    return settings;
  } catch (error) {
    console.error('❌ Failed to read storage:', error);
    return null;
  }
}

// Test 3: Test direct API call to OpenRouter
console.log('\n=== TEST 3: Direct API Test ===');
async function testDirectAPI(apiKey, model) {
  const testApiKey = apiKey || 'sk-or-v1-a40a8b7c4a68decedb3dce0d9e9aa358d2f203d9f';
  const testModel = model || 'meta-llama/llama-3.1-8b-instruct:free';
  
  console.log('🔑 Testing with API key:', testApiKey.substring(0, 8) + '...');
  console.log('🤖 Testing with model:', testModel);
  
  try {
    // Test 1: Check /models endpoint
    console.log('📡 Testing /models endpoint...');
    const modelsResponse = await fetch('https://openrouter.ai/api/v1/models', {
      headers: {
        'Authorization': `Bearer ${testApiKey}`,
        'Content-Type': 'application/json'
      }
    });
    
    console.log('Models endpoint status:', modelsResponse.status);
    
    if (!modelsResponse.ok) {
      const errorText = await modelsResponse.text();
      console.error('❌ Models endpoint failed:', errorText);
      return false;
    }
    
    const modelsData = await modelsResponse.json();
    console.log('✅ Models endpoint successful. Found models:', modelsData.data?.length || 0);
    
    // Check if our target model exists
    const targetModel = modelsData.data?.find(m => m.id === testModel);
    if (targetModel) {
      console.log('✅ Target model found:', {
        id: targetModel.id,
        pricing: targetModel.pricing
      });
    } else {
      console.warn('⚠️ Target model not found in available models');
      console.log('Available models matching "llama":', 
        modelsData.data?.filter(m => m.id.includes('llama')).map(m => m.id).slice(0, 5)
      );
    }
    
    // Test 2: Try a simple chat completion
    console.log('📡 Testing chat completion...');
    const chatResponse = await fetch('https://openrouter.ai/api/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${testApiKey}`,
        'Content-Type': 'application/json',
        'HTTP-Referer': 'https://complyze.co',
        'X-Title': 'Complyze Debug Test'
      },
      body: JSON.stringify({
        model: testModel,
        messages: [
          {
            role: 'system',
            content: 'You are a helpful assistant. Respond with exactly "TEST SUCCESSFUL" if you can understand this message.'
          },
          {
            role: 'user',
            content: 'Please confirm you received this test message.'
          }
        ],
        temperature: 0.1,
        max_tokens: 50,
        stream: false
      })
    });
    
    console.log('Chat completion status:', chatResponse.status);
    
    if (!chatResponse.ok) {
      const errorText = await chatResponse.text();
      console.error('❌ Chat completion failed:', errorText);
      return false;
    }
    
    const chatData = await chatResponse.json();
    console.log('✅ Chat completion successful:', {
      message: chatData.choices?.[0]?.message?.content,
      usage: chatData.usage,
      model: chatData.model
    });
    
    return true;
    
  } catch (error) {
    console.error('❌ Direct API test failed:', error);
    return false;
  }
}

// Test 4: Test PromptOptimizer initialization and methods
console.log('\n=== TEST 4: PromptOptimizer Integration ===');
async function testPromptOptimizer() {
  if (typeof PromptOptimizer === 'undefined') {
    console.error('❌ PromptOptimizer not available');
    return false;
  }
  
  try {
    console.log('🔧 Creating PromptOptimizer instance...');
    const optimizer = new PromptOptimizer();
    
    console.log('⏳ Loading settings...');
    await optimizer.loadSettings();
    
    console.log('📋 Optimizer state:', {
      hasApiKey: !!optimizer.apiKey,
      model: optimizer.model,
      enabled: optimizer.enabled,
      initialized: optimizer.initialized
    });
    
    // Test connection
    console.log('🔗 Testing connection...');
    const connectionResult = await optimizer.testConnection();
    console.log('Connection result:', connectionResult);
    
    if (!connectionResult.success) {
      console.error('❌ Connection test failed:', connectionResult.error);
      return false;
    }
    
    // Test smart rewrite with sample data
    console.log('🤖 Testing smartRewrite method...');
    const testText = 'My email is john.doe@company.com and my API key is sk-test123';
    const testPII = [
      { type: 'EMAIL', description: 'Email Address' },
      { type: 'API_KEY', description: 'API Key' }
    ];
    
    const rewriteResult = await optimizer.smartRewrite(testText, testPII);
    console.log('Smart rewrite result:', rewriteResult);
    
    if (rewriteResult.method === 'basic_redaction_fallback') {
      console.error('❌ Smart rewrite fell back to basic redaction');
      if (rewriteResult.error) {
        console.error('Error details:', rewriteResult.error);
      }
      return false;
    }
    
    console.log('✅ Smart rewrite successful!');
    return true;
    
  } catch (error) {
    console.error('❌ PromptOptimizer test failed:', error);
    return false;
  }
}

// Test 5: Check content script integration
console.log('\n=== TEST 5: Content Script Integration ===');
function testContentScriptIntegration() {
  console.log('Monitor available:', !!window.complyzeMonitor);
  console.log('Sidebar available:', !!window.complyzeSidebar);
  
  if (window.complyzeMonitor) {
    console.log('Current redaction mode:', window.complyzeMonitor.getRedactionMode());
  }
  
  if (window.complyzeSidebar) {
    console.log('Sidebar authenticated:', window.complyzeSidebar.isUserAuthenticated());
  }
}

// Test 6: Manual Smart Rewrite Test
console.log('\n=== TEST 6: Manual Smart Rewrite ===');
async function testManualSmartRewrite() {
  if (typeof PromptOptimizer === 'undefined') {
    console.error('❌ PromptOptimizer not available for manual test');
    return;
  }
  
  const testPrompt = "Hi, I'm John Smith and my email is john.smith@acme-corp.com. I need help with our API that uses key sk-abc123def456 to connect to our server at 192.168.1.100. Can you help debug why it's not working?";
  
  console.log('📝 Original prompt:', testPrompt);
  
  try {
    const optimizer = new PromptOptimizer();
    await optimizer.loadSettings();
    
    const mockPII = [
      { type: 'NAME', description: 'Personal Name' },
      { type: 'EMAIL', description: 'Email Address' },
      { type: 'API_KEY', description: 'API Key' },
      { type: 'IP_ADDRESS', description: 'IP Address' }
    ];
    
    const result = await optimizer.smartRewrite(testPrompt, mockPII);
    
    console.log('🤖 Smart rewrite result:');
    console.log('Method:', result.method);
    console.log('Optimized text:', result.optimizedText);
    console.log('Cost:', result.cost);
    console.log('Error:', result.error || 'None');
    
  } catch (error) {
    console.error('❌ Manual test failed:', error);
  }
}

// Run all tests
async function runAllTests() {
  console.log('🚀 Running comprehensive OpenRouter debug tests...\n');
  
  // Test storage settings first
  const settings = await checkStorageSettings();
  
  // Test direct API
  await testDirectAPI(settings?.openRouterApiKey, settings?.openRouterModel);
  
  // Test PromptOptimizer
  await testPromptOptimizer();
  
  // Test content script integration
  testContentScriptIntegration();
  
  // Manual test
  await testManualSmartRewrite();
  
  console.log('\n🏁 All tests completed. Check results above for issues.');
}

// Set up global functions for manual testing
window.debugOpenRouter = {
  runAllTests,
  checkStorageSettings,
  testDirectAPI,
  testPromptOptimizer,
  testContentScriptIntegration,
  testManualSmartRewrite,
  
  // Quick fix functions
  async setTestApiKey() {
    await chrome.storage.local.set({ 
      openRouterApiKey: 'sk-or-v1-a40a8b7c4a68decedb3dce0d9e9aa358d2f203d9f',
      openRouterModel: 'meta-llama/llama-3.1-8b-instruct:free',
      promptOptimizationEnabled: true,
      redactionMode: 'smart_rewrite'
    });
    console.log('✅ Test settings applied to storage');
  },
  
  async clearSettings() {
    await chrome.storage.local.remove([
      'openRouterApiKey', 
      'openRouterModel',
      'promptOptimizationEnabled'
    ]);
    console.log('🗑️ Settings cleared from storage');
  }
};

// Auto-run tests
runAllTests();

console.log('\n💡 Available debug functions:');
console.log('- debugOpenRouter.runAllTests()');
console.log('- debugOpenRouter.setTestApiKey()');
console.log('- debugOpenRouter.testDirectAPI()');
console.log('- debugOpenRouter.testPromptOptimizer()');
console.log('- debugOpenRouter.clearSettings()'); 