/**
 * Fix Smart Rewrite Issues
 * Diagnose and fix the PromptOptimizer initialization problems causing fallback
 */

console.log('🔧 Loading Smart Rewrite Fix Tool...');

async function diagnoseProblem() {
  console.log('\n🔍 DIAGNOSING SMART REWRITE ISSUE');
  console.log('=' + '='.repeat(35));
  
  // Check if PromptOptimizer is available
  if (!window.PromptOptimizer) {
    console.error('❌ PromptOptimizer class not found in window object');
    return false;
  }
  
  console.log('✅ PromptOptimizer class found');
  
  // Create instance and check initial state
  const optimizer = new window.PromptOptimizer();
  
  console.log('📊 Initial state before initialization:', {
    apiKey: optimizer.apiKey,
    enabled: optimizer.enabled,
    model: optimizer.model,
    initialized: optimizer.initialized,
    hasLoadingPromise: !!optimizer.loadingPromise
  });
  
  // Test storage access directly
  console.log('\n📋 Testing storage access...');
  try {
    const testStorageSet = await StorageManager.set({ testKey: 'testValue123' });
    const testStorageGet = await StorageManager.get(['testKey']);
    console.log('✅ Storage working:', testStorageGet);
  } catch (storageError) {
    console.error('❌ Storage access failed:', storageError);
    return false;
  }
  
  // Now ensure initialization
  console.log('\n⏳ Ensuring initialization...');
  await optimizer.ensureInitialized();
  
  console.log('📊 State after initialization:', {
    apiKey: optimizer.apiKey ? (optimizer.apiKey.substring(0, 12) + '...') : null,
    enabled: optimizer.enabled,
    model: optimizer.model,
    initialized: optimizer.initialized
  });
  
  // Check the specific conditions that cause fallback
  const wouldFallback = !optimizer.enabled || !optimizer.apiKey;
  console.log('\n🚨 Fallback Analysis:', {
    enabled: optimizer.enabled,
    hasApiKey: !!optimizer.apiKey,
    wouldFallback: wouldFallback,
    enabledType: typeof optimizer.enabled,
    apiKeyType: typeof optimizer.apiKey
  });
  
  if (wouldFallback) {
    console.error('❌ FALLBACK WOULD OCCUR!');
    console.error('Reasons:');
    if (!optimizer.enabled) console.error('  - enabled is false/falsy');
    if (!optimizer.apiKey) console.error('  - apiKey is missing/falsy');
    return false;
  } else {
    console.log('✅ Would NOT fallback - conditions look good');
    return true;
  }
}

async function fixSmartRewrite() {
  console.log('\n🔧 FIXING SMART REWRITE CONFIGURATION');
  console.log('=' + '='.repeat(40));
  
  try {
    // Create fresh instance
    const optimizer = new window.PromptOptimizer();
    
    // Force the correct values before initialization
    console.log('⚙️  Setting correct configuration values...');
    
    // Force enable
    optimizer.enabled = true;
    
    // Force API key
    const workingApiKey = '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';
    optimizer.apiKey = workingApiKey;
    
    // Set initialized flag
    optimizer.initialized = true;
    
    // Save to storage to persist the fix
    await StorageManager.set({
      openRouterApiKey: workingApiKey,
      openRouterModel: 'meta-llama/llama-3.3-8b-instruct:free',
      promptOptimizationEnabled: true
    });
    
    console.log('✅ Configuration fixed and saved to storage');
    
    // Test the fix
    console.log('\n🧪 Testing the fix...');
    const testPrompt = 'My email is test@example.com and my API key is sk-test123';
    const testPII = [
      { type: 'EMAIL', description: 'Email Address' },
      { type: 'API_KEY', description: 'API Key' }
    ];
    
    const result = await optimizer.smartRewrite(testPrompt, testPII);
    
    console.log('📊 Test result:', {
      method: result.method,
      success: result.method === 'smart_rewrite',
      optimizedTextPreview: result.optimizedText.substring(0, 100) + '...',
      error: result.error || 'None'
    });
    
    if (result.method === 'smart_rewrite') {
      console.log('🎉 SMART REWRITE FIXED SUCCESSFULLY!');
      
      // Store the working optimizer instance globally
      window.fixedOptimizer = optimizer;
      
      return true;
    } else {
      console.error('❌ Fix failed - still falling back to:', result.method);
      if (result.error) {
        console.error('Error details:', result.error);
      }
      return false;
    }
    
  } catch (error) {
    console.error('❌ Fix process failed:', error);
    return false;
  }
}

// Test function with the fixed optimizer
async function testFixedSmartRewrite() {
  console.log('\n🧪 TESTING FIXED SMART REWRITE');
  console.log('=' + '='.repeat(30));
  
  const optimizer = window.fixedOptimizer || new window.PromptOptimizer();
  
  const testCases = [
    {
      name: 'Email and API Key',
      prompt: 'My email is john.doe@company.com and my API key is sk-abc123. Can you help?',
      pii: [
        { type: 'EMAIL', description: 'Email Address' },
        { type: 'API_KEY', description: 'API Key' }
      ]
    },
    {
      name: 'Phone and Name',
      prompt: 'Hi, I am Sarah Johnson and my phone is 555-123-4567. Need assistance.',
      pii: [
        { type: 'NAME', description: 'Personal Name' },
        { type: 'PHONE', description: 'Phone Number' }
      ]
    }
  ];
  
  let allPassed = true;
  
  for (const testCase of testCases) {
    console.log(`\n📝 Testing: ${testCase.name}`);
    console.log(`Input: ${testCase.prompt}`);
    
    try {
      const result = await optimizer.smartRewrite(testCase.prompt, testCase.pii);
      
      const success = result.method === 'smart_rewrite';
      console.log(`Result: ${success ? '✅ SUCCESS' : '❌ FAILED'}`);
      console.log(`Method: ${result.method}`);
      console.log(`Output: ${result.optimizedText}`);
      
      if (!success) {
        allPassed = false;
        if (result.error) console.log(`Error: ${result.error}`);
      }
      
    } catch (error) {
      console.error(`❌ Test failed:`, error);
      allPassed = false;
    }
  }
  
  console.log(`\n🎯 Overall Result: ${allPassed ? '✅ ALL TESTS PASSED' : '❌ SOME TESTS FAILED'}`);
  return allPassed;
}

// Main execution function
async function runSmartRewriteFix() {
  console.log('🚀 SMART REWRITE FIX TOOL');
  console.log('========================');
  
  try {
    // Step 1: Diagnose the problem
    const diagnosisOk = await diagnoseProblem();
    
    if (!diagnosisOk) {
      console.log('\n🔧 Problem detected, attempting fix...');
      
      // Step 2: Apply the fix
      const fixSuccessful = await fixSmartRewrite();
      
      if (!fixSuccessful) {
        console.error('❌ Fix failed - unable to resolve smart rewrite issues');
        return false;
      }
    } else {
      console.log('✅ No fix needed - smart rewrite should be working');
    }
    
    // Step 3: Test the fixed functionality
    console.log('\n🧪 Running comprehensive tests...');
    const testResults = await testFixedSmartRewrite();
    
    if (testResults) {
      console.log('\n🎉 SMART REWRITE IS NOW WORKING CORRECTLY!');
      console.log('You can now use the smart rewrite feature.');
      console.log('The fixed optimizer is available as window.fixedOptimizer');
      return true;
    } else {
      console.error('\n❌ Tests failed after fix attempt');
      return false;
    }
    
  } catch (error) {
    console.error('❌ Fix tool failed:', error);
    return false;
  }
}

// Make functions available globally
window.smartRewriteFix = {
  diagnose: diagnoseProblem,
  fix: fixSmartRewrite,
  test: testFixedSmartRewrite,
  runAll: runSmartRewriteFix
};

// Auto-run the fix
console.log('🔧 Running automatic Smart Rewrite fix...');
runSmartRewriteFix().then(success => {
  if (success) {
    console.log('\n✅ Smart Rewrite fix completed successfully!');
    console.log('💡 You can manually run tests with: smartRewriteFix.test()');
  } else {
    console.log('\n❌ Smart Rewrite fix failed. Check the logs above for details.');
  }
});

console.log('🔧 Smart Rewrite Fix Tool loaded. Available functions:');
console.log('  - smartRewriteFix.diagnose() - Diagnose issues');
console.log('  - smartRewriteFix.fix() - Apply fixes');
console.log('  - smartRewriteFix.test() - Test functionality');
console.log('  - smartRewriteFix.runAll() - Run complete fix process'); 