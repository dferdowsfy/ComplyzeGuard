/**
 * Quick Smart Rewrite Test & Fix
 * Immediate testing and fixing of Smart Rewrite functionality
 */

console.log('🚀 Loading Quick Smart Rewrite Test...');

// Immediate test function
window.testSmartRewriteNow = async function() {
  console.log('🧪 IMMEDIATE SMART REWRITE TEST');
  console.log('=' + '='.repeat(32));
  
  try {
    // Step 1: Force load PromptOptimizer
    if (!window.PromptOptimizer) {
      console.error('❌ PromptOptimizer not available - check if promptOptimizer.js is loaded');
      return false;
    }
    
    // Step 2: Create and configure optimizer
    console.log('🔧 Creating PromptOptimizer instance...');
    const optimizer = new window.PromptOptimizer();
    
    // Force initialization with hardcoded values
    optimizer.apiKey = 'sk-or-v1-a40a8b7c4a68decedb3dce0d9e9aa358d2f203d9f';
    optimizer.enabled = true;
    optimizer.model = 'meta-llama/llama-3.1-8b-instruct:free';
    optimizer.baseUrl = 'https://openrouter.ai/api/v1';
    optimizer.initialized = true;
    
    console.log('✅ Optimizer configured:', {
      hasApiKey: !!optimizer.apiKey,
      enabled: optimizer.enabled,
      model: optimizer.model
    });
    
    // Step 3: Test API connection directly
    console.log('📡 Testing direct API connection...');
    
    const testResponse = await fetch(`${optimizer.baseUrl}/chat/completions`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${optimizer.apiKey}`,
        'Content-Type': 'application/json',
        'HTTP-Referer': 'https://complyze.co',
        'X-Title': 'Complyze AI Guard - Direct Test'
      },
      body: JSON.stringify({
        model: optimizer.model,
        messages: [
          {
            role: 'user',
            content: 'Just say "TEST OK" to confirm API is working.'
          }
        ],
        max_tokens: 10,
        temperature: 0
      })
    });
    
    console.log('📊 API Response:', {
      status: testResponse.status,
      statusText: testResponse.statusText,
      ok: testResponse.ok
    });
    
    if (!testResponse.ok) {
      const errorText = await testResponse.text();
      console.error('❌ API Test Failed:', errorText);
      
      // Specific error diagnosis
      if (testResponse.status === 401) {
        console.error('🔑 AUTHENTICATION ERROR - API key may be invalid or expired');
        console.error('   Visit: https://openrouter.ai/keys to check your API key');
      } else if (testResponse.status === 402) {
        console.error('💳 PAYMENT REQUIRED - Check your OpenRouter credits');
        console.error('   Visit: https://openrouter.ai/credits to add credits');
      } else if (testResponse.status === 429) {
        console.error('🚦 RATE LIMIT - Too many requests, wait and retry');
      } else if (testResponse.status === 400) {
        console.error('📝 BAD REQUEST - Check model name or request format');
      }
      
      return false;
    }
    
    const apiData = await testResponse.json();
    console.log('✅ Direct API test successful!');
    console.log('📄 Response:', apiData.choices?.[0]?.message?.content);
    
    // Step 4: Test Smart Rewrite function
    console.log('🤖 Testing Smart Rewrite function...');
    
    const testText = "Please help me. My email is john.doe@company.com and my phone number is 555-123-4567.";
    const testPII = [
      { type: 'EMAIL', description: 'Email Address' },
      { type: 'PHONE', description: 'Phone Number' }
    ];
    
    console.log('📝 Test input:', {
      text: testText,
      piiCount: testPII.length,
      piiTypes: testPII.map(p => p.type)
    });
    
    const rewriteResult = await optimizer.smartRewrite(testText, testPII);
    
    console.log('📊 Smart Rewrite Result:', {
      method: rewriteResult.method,
      success: rewriteResult.method === 'smart_rewrite',
      originalLength: testText.length,
      rewrittenLength: rewriteResult.optimizedText?.length,
      cost: rewriteResult.cost,
      hasError: !!rewriteResult.error
    });
    
    console.log('📝 Original:', testText);
    console.log('📝 Rewritten:', rewriteResult.optimizedText);
    
    if (rewriteResult.method === 'smart_rewrite') {
      console.log('🎉 SUCCESS! Smart Rewrite is working correctly!');
      
      // Save working configuration to storage
      await chrome.storage.local.set({
        openRouterApiKey: optimizer.apiKey,
        openRouterModel: optimizer.model,
        promptOptimizationEnabled: true
      });
      
      console.log('💾 Working configuration saved to storage');
      return true;
      
    } else {
      console.error('❌ Smart Rewrite failed, using fallback method:', rewriteResult.method);
      if (rewriteResult.error) {
        console.error('   Error details:', rewriteResult.error);
      }
      return false;
    }
    
  } catch (error) {
    console.error('❌ Test failed with error:', error);
    console.error('Stack trace:', error.stack);
    return false;
  }
};

// Quick enable function
window.enableSmartRewrite = async function() {
  console.log('🔧 ENABLING SMART REWRITE...');
  
  try {
    // Set configuration in storage
    await chrome.storage.local.set({
      openRouterApiKey: 'sk-or-v1-a40a8b7c4a68decedb3dce0d9e9aa358d2f203d9f',
      openRouterModel: 'meta-llama/llama-3.1-8b-instruct:free',
      promptOptimizationEnabled: true
    });
    
    console.log('✅ Smart Rewrite configuration saved to storage');
    
    // Test if it works
    const testResult = await window.testSmartRewriteNow();
    
    if (testResult) {
      console.log('🎉 Smart Rewrite is now enabled and working!');
      console.log('💡 Try triggering PII detection in your chat to see Smart Rewrite in action');
    } else {
      console.log('❌ Smart Rewrite configuration saved but still not working');
    }
    
    return testResult;
    
  } catch (error) {
    console.error('❌ Failed to enable Smart Rewrite:', error);
    return false;
  }
};

// Force reload optimizer function
window.reloadPromptOptimizer = function() {
  console.log('🔄 Reloading PromptOptimizer...');
  
  if (window.PromptOptimizer) {
    // Create new instance
    const optimizer = new window.PromptOptimizer();
    
    // Force settings reload
    optimizer.loadSettings().then(() => {
      console.log('✅ PromptOptimizer reloaded');
      console.log('📊 New configuration:', {
        hasApiKey: !!optimizer.apiKey,
        enabled: optimizer.enabled,
        model: optimizer.model
      });
    });
    
    return true;
  } else {
    console.error('❌ PromptOptimizer class not available');
    return false;
  }
};

// Check current redaction mode in content script
window.checkRedactionMode = function() {
  console.log('🔍 Checking current redaction mode...');
  
  if (window.complyzeMonitor) {
    const currentMode = window.complyzeMonitor.getRedactionMode();
    console.log('📊 Current redaction mode:', currentMode);
    
    if (currentMode !== 'smart_rewrite') {
      console.log('💡 Changing redaction mode to smart_rewrite...');
      window.complyzeMonitor.redactionMode = 'smart_rewrite';
      
      // Trigger storage update
      chrome.storage.local.set({ redactionMode: 'smart_rewrite' });
      
      console.log('✅ Redaction mode changed to smart_rewrite');
    }
    
    return currentMode;
  } else {
    console.log('❌ complyzeMonitor not available');
    return null;
  }
};

// Test the complete flow
window.testCompleteSmartRewriteFlow = async function() {
  console.log('🎯 TESTING COMPLETE SMART REWRITE FLOW');
  console.log('=' + '='.repeat(40));
  
  try {
    // Step 1: Enable Smart Rewrite
    console.log('1️⃣ Enabling Smart Rewrite...');
    const enableResult = await window.enableSmartRewrite();
    
    if (!enableResult) {
      console.error('❌ Failed to enable Smart Rewrite');
      return false;
    }
    
    // Step 2: Set redaction mode
    console.log('2️⃣ Setting redaction mode...');
    window.checkRedactionMode();
    
    // Step 3: Test with actual content script
    console.log('3️⃣ Testing with content script...');
    
    if (window.complyzeMonitor && window.complyzeMonitor.inputElement) {
      const testInput = "My email address is test@company.com";
      
      // Set input text
      if (window.complyzeMonitor.inputElement.tagName === 'TEXTAREA') {
        window.complyzeMonitor.inputElement.value = testInput;
      } else {
        window.complyzeMonitor.inputElement.textContent = testInput;
      }
      
      // Trigger input event
      window.complyzeMonitor.inputElement.dispatchEvent(new Event('input', { bubbles: true }));
      
      console.log('📝 Test text inserted into input element');
      console.log('💡 PII should be detected and Smart Rewrite modal should appear');
      
      // Check if PII is detected
      setTimeout(() => {
        if (window.complyzeMonitor.isBlocked) {
          console.log('✅ PII detected and submission blocked - Smart Rewrite modal should appear');
        } else {
          console.log('❌ PII not detected or not blocking');
        }
      }, 1000);
      
    } else {
      console.log('⚠️ Content script monitor not available - test completed at API level');
    }
    
    console.log('🎉 Complete flow test finished');
    return true;
    
  } catch (error) {
    console.error('❌ Complete flow test failed:', error);
    return false;
  }
};

console.log('✅ Quick Smart Rewrite Test loaded!');
console.log('');
console.log('🚀 Available functions:');
console.log('  - testSmartRewriteNow() - Immediate API test');
console.log('  - enableSmartRewrite() - Enable and configure Smart Rewrite');
console.log('  - checkRedactionMode() - Check/set redaction mode');
console.log('  - testCompleteSmartRewriteFlow() - Full end-to-end test');
console.log('');
console.log('💡 Start with: enableSmartRewrite()'); 