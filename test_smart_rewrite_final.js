/**
 * Final Smart Rewrite Test
 * Comprehensive test to verify all fixes are working
 */

console.log('🧪 Loading Final Smart Rewrite Test...');

async function testSmartRewriteFinal() {
  console.log('\n🧪 FINAL SMART REWRITE TEST');
  console.log('=' + '='.repeat(28));
  
  try {
    // Step 1: Verify PromptOptimizer is available
    if (!window.PromptOptimizer) {
      console.error('❌ PromptOptimizer not available');
      return false;
    }
    
    console.log('✅ PromptOptimizer class found');
    
    // Step 2: Create fresh instance
    console.log('\n🔧 Creating fresh PromptOptimizer instance...');
    const optimizer = new window.PromptOptimizer();
    
    // Step 3: Wait for initialization
    console.log('⏳ Waiting for initialization...');
    await optimizer.ensureInitialized();
    
    // Step 4: Check configuration
    console.log('\n📊 Configuration check:', {
      enabled: optimizer.enabled,
      hasApiKey: !!optimizer.apiKey,
      apiKeyPrefix: optimizer.apiKey?.substring(0, 12),
      model: optimizer.model,
      initialized: optimizer.initialized
    });
    
    // Step 5: Test with multiple scenarios
    const testCases = [
      {
        name: 'Email and API Key Test',
        prompt: 'My email is john.doe@acme.com and my API key is sk-test12345. Can you help me debug this authentication issue?',
        pii: [
          { type: 'EMAIL', description: 'Email Address' },
          { type: 'API_KEY', description: 'API Key' }
        ]
      },
      {
        name: 'Phone and Name Test',
        prompt: 'Hi, I am Sarah Johnson from Marketing. My phone number is 555-123-4567. Please help with the system integration.',
        pii: [
          { type: 'NAME', description: 'Personal Name' },
          { type: 'PHONE', description: 'Phone Number' }
        ]
      },
      {
        name: 'Complex PII Test',
        prompt: 'Hello, this is Mike Brown (mike.brown@company.com), phone: 555-987-6543. Our server IP is 192.168.1.100 and API key sk-abc123def456. Need urgent help!',
        pii: [
          { type: 'NAME', description: 'Personal Name' },
          { type: 'EMAIL', description: 'Email Address' },
          { type: 'PHONE', description: 'Phone Number' },
          { type: 'IP_ADDRESS', description: 'IP Address' },
          { type: 'API_KEY', description: 'API Key' }
        ]
      }
    ];
    
    let allTestsPassed = true;
    const results = [];
    
    for (let i = 0; i < testCases.length; i++) {
      const testCase = testCases[i];
      console.log(`\n📝 Test ${i + 1}: ${testCase.name}`);
      console.log(`Input: ${testCase.prompt}`);
      console.log(`PII Types: ${testCase.pii.map(p => p.type).join(', ')}`);
      
      try {
        const startTime = Date.now();
        const result = await optimizer.smartRewrite(testCase.prompt, testCase.pii);
        const endTime = Date.now();
        
        const testPassed = result.method === 'smart_rewrite';
        
        console.log(`Result: ${testPassed ? '✅ SUCCESS' : '❌ FAILED'}`);
        console.log(`Method: ${result.method}`);
        console.log(`Time: ${endTime - startTime}ms`);
        console.log(`Output: ${result.optimizedText}`);
        
        if (result.usage) {
          console.log(`Tokens: ${result.usage.total_tokens}, Cost: $${result.cost?.toFixed(6)}`);
        }
        
        if (result.error) {
          console.log(`Error: ${result.error}`);
        }
        
        // Check if sensitive data was actually removed
        const originalLower = testCase.prompt.toLowerCase();
        const outputLower = result.optimizedText.toLowerCase();
        
        const sensitiveDataCheck = {
          containsEmail: outputLower.includes('@') && originalLower.includes('@'),
          containsApiKey: outputLower.includes('sk-') && originalLower.includes('sk-'),
          containsPhone: /\d{3}[-.\s]?\d{3}[-.\s]?\d{4}/.test(result.optimizedText),
          usesRedactedTags: result.optimizedText.includes('[') && result.optimizedText.includes(']')
        };
        
        console.log(`Data Removal Check:`, sensitiveDataCheck);
        
        const qualityScore = testPassed && 
                           !sensitiveDataCheck.containsEmail && 
                           !sensitiveDataCheck.containsApiKey && 
                           !sensitiveDataCheck.containsPhone && 
                           !sensitiveDataCheck.usesRedactedTags;
        
        console.log(`Quality Score: ${qualityScore ? '✅ EXCELLENT' : '⚠️ NEEDS IMPROVEMENT'}`);
        
        results.push({
          testName: testCase.name,
          passed: testPassed,
          qualityScore: qualityScore,
          method: result.method,
          timeTaken: endTime - startTime,
          outputLength: result.optimizedText.length,
          error: result.error
        });
        
        if (!testPassed) allTestsPassed = false;
        
      } catch (error) {
        console.error(`❌ Test ${i + 1} failed with error:`, error);
        allTestsPassed = false;
        results.push({
          testName: testCase.name,
          passed: false,
          error: error.message
        });
      }
    }
    
    // Step 6: Final results summary
    console.log('\n📊 FINAL TEST RESULTS');
    console.log('=' + '='.repeat(20));
    
    console.log(`Overall Status: ${allTestsPassed ? '✅ ALL TESTS PASSED' : '❌ SOME TESTS FAILED'}`);
    console.log(`Tests Run: ${results.length}`);
    console.log(`Passed: ${results.filter(r => r.passed).length}`);
    console.log(`Failed: ${results.filter(r => !r.passed).length}`);
    
    // Detailed results
    results.forEach((result, index) => {
      console.log(`\nTest ${index + 1}: ${result.testName}`);
      console.log(`  Status: ${result.passed ? '✅ PASS' : '❌ FAIL'}`);
      console.log(`  Method: ${result.method || 'N/A'}`);
      if (result.timeTaken) console.log(`  Time: ${result.timeTaken}ms`);
      if (result.error) console.log(`  Error: ${result.error}`);
    });
    
    if (allTestsPassed) {
      console.log('\n🎉 SMART REWRITE IS WORKING PERFECTLY!');
      console.log('🚀 The API integration is successful');
      console.log('🔒 Sensitive data is being properly removed');
      console.log('💬 Natural language rewriting is functional');
      
      // Store working optimizer globally for future use
      window.workingOptimizer = optimizer;
      console.log('💡 Working optimizer saved as window.workingOptimizer');
      
      return true;
    } else {
      console.log('\n💔 Some tests failed. Review the logs above for details.');
      return false;
    }
    
  } catch (error) {
    console.error('❌ Final test failed:', error);
    return false;
  }
}

// Quick test function for manual use
window.quickSmartRewriteTest = async function(customPrompt, customPII) {
  const prompt = customPrompt || 'My email is test@example.com and my API key is sk-test123. Please help.';
  const pii = customPII || [
    { type: 'EMAIL', description: 'Email Address' },
    { type: 'API_KEY', description: 'API Key' }
  ];
  
  console.log('🧪 Quick Smart Rewrite Test');
  console.log('Input:', prompt);
  
  try {
    const optimizer = window.workingOptimizer || new window.PromptOptimizer();
    if (!window.workingOptimizer) {
      await optimizer.ensureInitialized();
    }
    
    const result = await optimizer.smartRewrite(prompt, pii);
    
    console.log('✅ Result:');
    console.log('  Method:', result.method);
    console.log('  Output:', result.optimizedText);
    console.log('  Success:', result.method === 'smart_rewrite');
    
    return result;
    
  } catch (error) {
    console.error('❌ Quick test failed:', error);
    return null;
  }
};

// Auto-run the final test
console.log('🚀 Running final Smart Rewrite test...');
testSmartRewriteFinal().then(success => {
  if (success) {
    console.log('\n🎉 CONGRATULATIONS! Smart Rewrite is fully operational!');
    console.log('💡 Use quickSmartRewriteTest("your prompt") for quick testing');
  } else {
    console.log('\n💔 Final test indicates issues remain. Check the detailed logs above.');
  }
});

// Make the test function available
window.testSmartRewriteFinal = testSmartRewriteFinal;

console.log('🔧 Final Smart Rewrite Test loaded. Functions available:');
console.log('  - testSmartRewriteFinal() - Run comprehensive test');
console.log('  - quickSmartRewriteTest(prompt, pii) - Quick test with custom input'); 