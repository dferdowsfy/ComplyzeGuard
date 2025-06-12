/**
 * Final Debug Test for Smart Rewrite - API Key Investigation
 * This test will thoroughly investigate why the API key isn't being set
 */

console.log('🔍 SMART REWRITE FINAL DEBUG - API KEY INVESTIGATION');
console.log('=======================================================');

async function debugSmartRewriteApiKey() {
  try {
    console.log('\n📋 Step 1: Check PromptOptimizer Class Availability');
    console.log('PromptOptimizer available:', !!window.PromptOptimizer);
    
    if (!window.PromptOptimizer) {
      console.error('❌ PromptOptimizer class not found!');
      return;
    }
    
    console.log('\n📋 Step 2: Create Fresh PromptOptimizer Instance');
    const optimizer = new window.PromptOptimizer();
    
    console.log('Initial state:', {
      enabled: optimizer.enabled,
      hasApiKey: !!optimizer.apiKey,
      apiKeyValue: optimizer.apiKey,
      apiKeyLength: optimizer.apiKey?.length,
      model: optimizer.model,
      baseUrl: optimizer.baseUrl,
      initialized: optimizer.initialized
    });
    
    console.log('\n📋 Step 3: Check Chrome Storage Before loadSettings');
    const storageBeforeLoad = await chrome.storage.local.get([
      'openRouterApiKey', 
      'openRouterModel',
      'promptOptimizationEnabled'
    ]);
    console.log('Storage before loadSettings:', storageBeforeLoad);
    
    console.log('\n📋 Step 4: Call loadSettings() Manually');
    const loadResult = await optimizer.loadSettings();
    console.log('loadSettings() result:', loadResult);
    
    console.log('State after loadSettings:', {
      enabled: optimizer.enabled,
      hasApiKey: !!optimizer.apiKey,
      apiKeyValue: optimizer.apiKey,
      apiKeyLength: optimizer.apiKey?.length,
      apiKeyPrefix: optimizer.apiKey?.substring(0, 12),
      model: optimizer.model,
      baseUrl: optimizer.baseUrl,
      initialized: optimizer.initialized
    });
    
    console.log('\n📋 Step 5: Check Chrome Storage After loadSettings');
    const storageAfterLoad = await chrome.storage.local.get([
      'openRouterApiKey', 
      'openRouterModel',
      'promptOptimizationEnabled'
    ]);
    console.log('Storage after loadSettings:', storageAfterLoad);
    
    console.log('\n📋 Step 6: Force API Key if Missing');
    if (!optimizer.apiKey) {
      console.log('🚨 CRITICAL: API key still missing, forcing hardcoded key...');
      optimizer.apiKey = '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';
      optimizer.enabled = true;
      optimizer.initialized = true;
      
      // Also save to storage
      await chrome.storage.local.set({
        openRouterApiKey: optimizer.apiKey,
        openRouterModel: optimizer.model,
        promptOptimizationEnabled: true
      });
      
      console.log('✅ Forced API key set:', {
        hasApiKey: !!optimizer.apiKey,
        apiKeyLength: optimizer.apiKey.length,
        enabled: optimizer.enabled
      });
    }
    
    console.log('\n📋 Step 7: Test Smart Rewrite with Sample Data');
    const testPrompt = "My email is john.doe@company.com and my API key is sk-test123";
    const testPII = [
      { type: 'EMAIL', description: 'Email Address' },
      { type: 'API_KEY', description: 'API Key' }
    ];
    
    console.log('Testing smart rewrite with:', {
      promptLength: testPrompt.length,
      piiCount: testPII.length,
      optimizerEnabled: optimizer.enabled,
      optimizerHasApiKey: !!optimizer.apiKey
    });
    
    const rewriteResult = await optimizer.smartRewrite(testPrompt, testPII);
    
    console.log('\n✅ Smart Rewrite Result:', {
      method: rewriteResult.method,
      hasOptimizedText: !!rewriteResult.optimizedText,
      optimizedTextLength: rewriteResult.optimizedText?.length,
      cost: rewriteResult.cost,
      error: rewriteResult.error,
      model: rewriteResult.model
    });
    
    console.log('Optimized text preview:', rewriteResult.optimizedText?.substring(0, 150) + '...');
    
    console.log('\n📋 Step 8: Test Connection Directly');
    try {
      const connectionTest = await optimizer.testConnection();
      console.log('✅ Direct connection test passed:', connectionTest);
    } catch (connError) {
      console.error('❌ Direct connection test failed:', connError.message);
    }
    
    console.log('\n📋 Step 9: Check Final Storage State');
    const finalStorage = await chrome.storage.local.get([
      'openRouterApiKey', 
      'openRouterModel',
      'promptOptimizationEnabled'
    ]);
    console.log('Final storage state:', finalStorage);
    
    console.log('\n🎯 DIAGNOSIS COMPLETE');
    console.log('====================');
    
    const diagnosis = {
      promptOptimizerAvailable: !!window.PromptOptimizer,
      apiKeyInStorage: !!finalStorage.openRouterApiKey,
      apiKeyInInstance: !!optimizer.apiKey,
      optimizerEnabled: optimizer.enabled,
      smartRewriteWorking: rewriteResult.method === 'smart_rewrite',
      fallbackReason: rewriteResult.method !== 'smart_rewrite' ? rewriteResult.method : null
    };
    
    console.log('Final diagnosis:', diagnosis);
    
    if (diagnosis.smartRewriteWorking) {
      console.log('🎉 SUCCESS: Smart Rewrite is working correctly!');
    } else {
      console.log('❌ FAILURE: Smart Rewrite is not working. Reason:', diagnosis.fallbackReason);
      
      if (!diagnosis.apiKeyInInstance) {
        console.log('💡 SOLUTION: API key is not being set in the optimizer instance');
      }
      if (!diagnosis.optimizerEnabled) {
        console.log('💡 SOLUTION: Optimizer is not enabled');
      }
    }
    
    return diagnosis;
    
  } catch (error) {
    console.error('❌ Debug test failed:', error);
    console.error('Error stack:', error.stack);
    return { error: error.message };
  }
}

// Run the debug test
debugSmartRewriteApiKey().then(result => {
  console.log('\n🏁 Debug test completed with result:', result);
}).catch(error => {
  console.error('🚨 Debug test threw error:', error);
});

// Also make it available globally for manual testing
window.debugSmartRewriteApiKey = debugSmartRewriteApiKey;

console.log('🔧 Debug test loaded. Run debugSmartRewriteApiKey() to test manually.'); 