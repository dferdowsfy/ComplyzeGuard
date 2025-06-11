/**
 * OpenRouter Debug and Fix Script
 * 
 * This script will:
 * 1. Check and fix PromptOptimizer configuration
 * 2. Test and validate OpenRouter API connection
 * 3. Set proper storage values
 * 4. Fix any identified issues
 */

console.log('🔧 Starting OpenRouter Debug and Fix...');

// Enhanced PromptOptimizer configuration
async function fixPromptOptimizerConfiguration() {
  console.log('\n=== FIXING PROMPTOPTIMIZER CONFIGURATION ===');
  
  try {
    // 1. Ensure proper storage configuration
    const requiredSettings = {
      openRouterApiKey: 'sk-or-v1-a40a8b7c4a68decedb3dce0d9e9aa358d2f203d9f',
      openRouterModel: 'meta-llama/llama-3.1-8b-instruct:free',
      promptOptimizationEnabled: true,
      redactionMode: 'smart_rewrite'
    };
    
    console.log('💾 Setting Chrome storage values...');
    await chrome.storage.local.set(requiredSettings);
    console.log('✅ Storage values set:', requiredSettings);
    
    // 2. Test if PromptOptimizer class is available
    if (typeof PromptOptimizer === 'undefined') {
      console.error('❌ PromptOptimizer class not found. This suggests promptOptimizer.js is not loaded.');
      return false;
    }
    
    // 3. Create and configure PromptOptimizer instance
    console.log('🔧 Creating PromptOptimizer instance...');
    window.debugOptimizer = new PromptOptimizer();
    
    // 4. Force load settings (sometimes storage isn't immediately available)
    console.log('📝 Force loading settings...');
    await window.debugOptimizer.loadSettings();
    
    // 5. If settings didn't load properly, set them manually
    if (!window.debugOptimizer.apiKey) {
      console.log('⚠️ API key not loaded from storage, setting manually...');
      window.debugOptimizer.apiKey = requiredSettings.openRouterApiKey;
      window.debugOptimizer.model = requiredSettings.openRouterModel;
      window.debugOptimizer.enabled = true;
      window.debugOptimizer.initialized = true;
    }
    
    console.log('📋 Final optimizer state:', {
      hasApiKey: !!window.debugOptimizer.apiKey,
      apiKeyPreview: window.debugOptimizer.apiKey ? 
        window.debugOptimizer.apiKey.substring(0, 12) + '...' : 'None',
      model: window.debugOptimizer.model,
      enabled: window.debugOptimizer.enabled,
      initialized: window.debugOptimizer.initialized
    });
    
    return true;
    
  } catch (error) {
    console.error('❌ Failed to fix PromptOptimizer configuration:', error);
    return false;
  }
}

// Test direct OpenRouter API with multiple models
async function testOpenRouterAPI() {
  console.log('\n=== TESTING OPENROUTER API ===');
  
  const apiKey = 'sk-or-v1-a40a8b7c4a68decedb3dce0d9e9aa358d2f203d9f';
  const testModels = [
    'meta-llama/llama-3.1-8b-instruct:free',
    'meta-llama/llama-3.2-3b-instruct:free',
    'google/gemma-2-9b-it:free',
    'microsoft/phi-3-mini-128k-instruct:free'
  ];
  
  console.log('🔑 Using API key:', apiKey.substring(0, 12) + '...');
  
  try {
    // Test 1: Check models endpoint
    console.log('📡 Testing /models endpoint...');
    const modelsResponse = await fetch('https://openrouter.ai/api/v1/models', {
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json'
      }
    });
    
    if (!modelsResponse.ok) {
      const errorText = await modelsResponse.text();
      console.error('❌ Models endpoint failed:', {
        status: modelsResponse.status,
        statusText: modelsResponse.statusText,
        error: errorText
      });
      return false;
    }
    
    const modelsData = await modelsResponse.json();
    console.log('✅ Models endpoint successful. Total models:', modelsData.data?.length || 0);
    
    // Find available free models
    const freeModels = modelsData.data?.filter(model => 
      model.pricing?.prompt === "0" || 
      model.pricing?.prompt === 0 ||
      model.id.includes(':free')
    ) || [];
    
    console.log('🆓 Free models available:', freeModels.length);
    console.log('Top 5 free models:', freeModels.slice(0, 5).map(m => m.id));
    
    // Test 2: Try chat completion with each test model
    for (const model of testModels) {
      console.log(`\n🤖 Testing model: ${model}`);
      
      try {
        const chatResponse = await fetch('https://openrouter.ai/api/v1/chat/completions', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${apiKey}`,
            'Content-Type': 'application/json',
            'HTTP-Referer': 'https://complyze.co',
            'X-Title': 'Complyze Debug Test'
          },
          body: JSON.stringify({
            model: model,
            messages: [
              {
                role: 'system',
                content: 'You are a helpful assistant. Respond with exactly "TEST SUCCESSFUL" and nothing else.'
              },
              {
                role: 'user',
                content: 'Test message'
              }
            ],
            temperature: 0.1,
            max_tokens: 20,
            stream: false
          })
        });
        
        if (chatResponse.ok) {
          const chatData = await chatResponse.json();
          console.log(`✅ ${model} - SUCCESS:`, {
            response: chatData.choices?.[0]?.message?.content,
            usage: chatData.usage
          });
          return model; // Return first working model
        } else {
          const errorText = await chatResponse.text();
          console.log(`❌ ${model} - FAILED:`, {
            status: chatResponse.status,
            error: errorText
          });
        }
        
      } catch (error) {
        console.log(`❌ ${model} - ERROR:`, error.message);
      }
    }
    
    return false;
    
  } catch (error) {
    console.error('❌ OpenRouter API test failed:', error);
    return false;
  }
}

// Test Smart Rewrite functionality end-to-end
async function testSmartRewriteEndToEnd() {
  console.log('\n=== TESTING SMART REWRITE END-TO-END ===');
  
  if (!window.debugOptimizer) {
    console.error('❌ No debugOptimizer instance available');
    return false;
  }
  
  const testPrompt = "Hi, I'm Sarah Johnson from Acme Corp (sarah.johnson@acme.com). Our API key sk-1234567890abcdef is not working with your service. Can you help? My phone is 555-123-4567.";
  const testPII = [
    { type: 'NAME', description: 'Personal Name' },
    { type: 'EMAIL', description: 'Email Address' },
    { type: 'API_KEY', description: 'API Key' },
    { type: 'PHONE', description: 'Phone Number' }
  ];
  
  console.log('📝 Original prompt:', testPrompt);
  console.log('🔍 Detected PII types:', testPII.map(p => p.type));
  
  try {
    console.log('🤖 Testing smartRewrite method...');
    const result = await window.debugOptimizer.smartRewrite(testPrompt, testPII);
    
    console.log('📤 Smart rewrite result:', {
      method: result.method,
      optimizedText: result.optimizedText,
      cost: result.cost,
      error: result.error || 'None'
    });
    
    if (result.method === 'smart_rewrite') {
      console.log('✅ Smart Rewrite SUCCESSFUL!');
      console.log('🎯 Comparison:');
      console.log('  Original:', testPrompt);
      console.log('  Rewritten:', result.optimizedText);
      return true;
    } else {
      console.error('❌ Smart Rewrite FAILED - fell back to:', result.method);
      if (result.error) {
        console.error('Error details:', result.error);
      }
      return false;
    }
    
  } catch (error) {
    console.error('❌ Smart rewrite test failed:', error);
    return false;
  }
}

// Fix integration with content script
function fixContentScriptIntegration() {
  console.log('\n=== FIXING CONTENT SCRIPT INTEGRATION ===');
  
  try {
    // Ensure PromptOptimizer is globally available
    if (typeof PromptOptimizer !== 'undefined' && !window.PromptOptimizer) {
      window.PromptOptimizer = PromptOptimizer;
      console.log('✅ PromptOptimizer attached to window');
    }
    
    // Update monitor's redaction mode if available
    if (window.complyzeMonitor) {
      window.complyzeMonitor.redactionMode = 'smart_rewrite';
      console.log('✅ Monitor redaction mode set to smart_rewrite');
    }
    
    // Trigger sidebar to update redaction mode
    if (window.complyzeSidebar) {
      // Dispatch redaction mode change event
      const event = new CustomEvent('complyzeRedactionModeChanged', {
        detail: { mode: 'smart_rewrite' }
      });
      window.dispatchEvent(event);
      console.log('✅ Dispatched redaction mode change event');
    }
    
    return true;
    
  } catch (error) {
    console.error('❌ Failed to fix content script integration:', error);
    return false;
  }
}

// Master fix function
async function fixAllOpenRouterIssues() {
  console.log('🚀 STARTING COMPREHENSIVE OPENROUTER FIX...\n');
  
  let allFixed = true;
  
  // Step 1: Fix PromptOptimizer configuration
  const configFixed = await fixPromptOptimizerConfiguration();
  if (!configFixed) {
    console.error('❌ Failed to fix PromptOptimizer configuration');
    allFixed = false;
  }
  
  // Step 2: Test OpenRouter API
  const workingModel = await testOpenRouterAPI();
  if (!workingModel) {
    console.error('❌ No working OpenRouter models found');
    allFixed = false;
  } else {
    console.log(`✅ Found working model: ${workingModel}`);
    // Update storage with working model
    await chrome.storage.local.set({ openRouterModel: workingModel });
    if (window.debugOptimizer) {
      window.debugOptimizer.model = workingModel;
    }
  }
  
  // Step 3: Test Smart Rewrite end-to-end
  const rewriteWorks = await testSmartRewriteEndToEnd();
  if (!rewriteWorks) {
    console.error('❌ Smart Rewrite still not working');
    allFixed = false;
  }
  
  // Step 4: Fix content script integration
  const integrationFixed = fixContentScriptIntegration();
  if (!integrationFixed) {
    console.error('❌ Failed to fix content script integration');
    allFixed = false;
  }
  
  console.log('\n🏁 FIX COMPLETE');
  if (allFixed) {
    console.log('✅ ALL ISSUES FIXED! Smart Rewrite should now work.');
  } else {
    console.log('⚠️ Some issues remain. Check individual test results above.');
  }
  
  return allFixed;
}

// Enhanced test function for manual usage
window.testSmartRewriteNow = async function() {
  console.log('🧪 MANUAL SMART REWRITE TEST');
  
  if (!window.debugOptimizer) {
    console.log('🔧 Creating optimizer instance...');
    await fixPromptOptimizerConfiguration();
  }
  
  if (!window.debugOptimizer) {
    console.error('❌ Still no optimizer available');
    return false;
  }
  
  const testText = prompt('Enter text to test Smart Rewrite with:', 
    'My name is John Doe, email john@company.com, phone 555-1234, API key sk-test123');
  
  if (!testText) {
    console.log('❌ No test text provided');
    return false;
  }
  
  const mockPII = [
    { type: 'NAME', description: 'Personal Name' },
    { type: 'EMAIL', description: 'Email Address' },
    { type: 'PHONE', description: 'Phone Number' },
    { type: 'API_KEY', description: 'API Key' }
  ];
  
  try {
    const result = await window.debugOptimizer.smartRewrite(testText, mockPII);
    console.log('🎯 Test Result:', result);
    
    if (result.method === 'smart_rewrite') {
      alert(`Smart Rewrite SUCCESS!\n\nOriginal: ${testText}\n\nRewritten: ${result.optimizedText}`);
      return true;
    } else {
      alert(`Smart Rewrite FAILED - Method: ${result.method}\nError: ${result.error || 'Unknown'}`);
      return false;
    }
  } catch (error) {
    console.error('Test failed:', error);
    alert(`Test failed: ${error.message}`);
    return false;
  }
};

// Global debug functions
window.debugOpenRouterFix = {
  fixAll: fixAllOpenRouterIssues,
  fixConfig: fixPromptOptimizerConfiguration,
  testAPI: testOpenRouterAPI,
  testRewrite: testSmartRewriteEndToEnd,
  fixIntegration: fixContentScriptIntegration,
  manualTest: window.testSmartRewriteNow
};

// Auto-run the fix
fixAllOpenRouterIssues();

console.log('\n💡 Available debug functions:');
console.log('- debugOpenRouterFix.fixAll() // Run all fixes');
console.log('- debugOpenRouterFix.testAPI() // Test OpenRouter API');
console.log('- debugOpenRouterFix.testRewrite() // Test Smart Rewrite');
console.log('- testSmartRewriteNow() // Manual interactive test'); 