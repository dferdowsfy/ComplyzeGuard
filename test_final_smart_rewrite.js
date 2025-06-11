/**
 * Final Smart Rewrite Test
 * Comprehensive test with enhanced PII detection and forced initialization
 */

console.log('🧪 Loading Final Smart Rewrite Test...');

async function finalSmartRewriteTest() {
  console.log('\n🎯 FINAL SMART REWRITE TEST');
  console.log('=' + '='.repeat(30));
  
  // Test prompt with all the problematic content from user's example
  const testPrompt = "Hey ChatGPT, can you review this Python script? It connects to our internal repo at git.acme-corp.local, uses the API key sk-test-9843ghfs73, and sends a notification to julia.roberts@acme-corp.com. The server IP is 192.168.10.42, and our vault path is /secrets/prod/token.";
  
  console.log('📝 Test prompt:', testPrompt);
  console.log('📏 Length:', testPrompt.length);
  console.log('');
  
  // Step 1: Enhanced PII Detection
  console.log('🔍 Step 1: Enhanced PII Detection');
  const detectedPII = [];
  
  // Use the enhanced patterns from our debug script
  const enhancedPatterns = {
    EMAIL: {
      pattern: /\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b/g,
      description: 'Email Address'
    },
    IP_ADDRESS: {
      pattern: /\b(?:(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.){3}(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\b/g,
      description: 'IP Address'
    },
    API_KEY: {
      pattern: /\b(?:sk-|pk_|rk_|ak_|ey_|key_)[a-zA-Z0-9]{10,64}\b/g,
      description: 'API Key'
    },
    INTERNAL_REPO: {
      pattern: /\b(?:git|repo|repository)\.[\w\-]+\.(?:local|internal|corp|company)\b/gi,
      description: 'Internal Repository'
    },
    VAULT_PATH: {
      pattern: /\/[\w\-\/]+(?:secrets|vault|token|creds?)[\w\-\/]*/gi,
      description: 'Vault/Secret Path'
    },
    INTERNAL_DOMAIN: {
      pattern: /\b[\w\-]+\.(?:local|internal|corp|company)\b/gi,
      description: 'Internal Domain'
    }
  };
  
  for (const [type, config] of Object.entries(enhancedPatterns)) {
    const matches = testPrompt.match(config.pattern);
    if (matches) {
      console.log(`✅ Found ${type}:`, matches);
      detectedPII.push({
        type: type,
        description: config.description,
        riskLevel: 'high',
        riskType: 'security'
      });
    }
  }
  
  console.log('📊 Total PII detected:', detectedPII.length);
  console.log('🏷️ PII Types:', detectedPII.map(p => p.type).join(', '));
  console.log('');
  
  if (detectedPII.length === 0) {
    console.error('❌ CRITICAL: No PII detected! This explains the fallback.');
    console.log('💡 The PII detection patterns need to be updated in content.js');
    return false;
  }
  
  // Step 2: PromptOptimizer Test
  console.log('🤖 Step 2: PromptOptimizer Test');
  
  if (!window.PromptOptimizer) {
    console.error('❌ PromptOptimizer not available');
    return false;
  }
  
  const optimizer = new window.PromptOptimizer();
  console.log('✅ PromptOptimizer instance created');
  
  // Force initialization
  console.log('⏳ Ensuring initialization...');
  await optimizer.ensureInitialized();
  
  // Check status
  console.log('📊 Optimizer Status:', {
    enabled: optimizer.enabled,
    hasApiKey: !!optimizer.apiKey,
    apiKeyLength: optimizer.apiKey?.length,
    model: optimizer.model,
    initialized: optimizer.initialized
  });
  
  // Step 3: API Connection Test
  console.log('\n🌐 Step 3: API Connection Test');
  try {
    const connectionResult = await optimizer.testConnection();
    console.log('✅ API Connection Successful:', {
      model: connectionResult.model,
      response: connectionResult.response?.substring(0, 30) + '...'
    });
  } catch (error) {
    console.error('❌ API Connection Failed:', error.message);
    console.log('💡 This may be the reason for fallback');
    return false;
  }
  
  // Step 4: Smart Rewrite Test
  console.log('\n🚀 Step 4: Smart Rewrite Execution');
  
  try {
    console.log('🔄 Calling smartRewrite with detected PII...');
    const result = await optimizer.smartRewrite(testPrompt, detectedPII);
    
    console.log('📊 Smart Rewrite Results:');
    console.log('  - Method:', result.method);
    console.log('  - Success:', result.method === 'smart_rewrite');
    console.log('  - Original Length:', testPrompt.length);
    console.log('  - Rewritten Length:', result.optimizedText?.length || 0);
    console.log('  - Cost:', '$' + (result.cost || 0).toFixed(4));
    console.log('  - Model:', result.model || 'N/A');
    
    if (result.error) {
      console.log('  - Error:', result.error);
    }
    
    console.log('');
    console.log('📝 Original Text:');
    console.log(testPrompt);
    console.log('');
    console.log('📝 Rewritten Text:');
    console.log(result.optimizedText);
    console.log('');
    
    // Verification: Check if sensitive data was properly handled
    console.log('🔍 Step 5: Verification');
    
    if (result.method === 'smart_rewrite') {
      console.log('✅ SUCCESS: Smart Rewrite executed successfully!');
      
      // Check for remaining sensitive data
      let hasRemainingSensitiveData = false;
      const remainingIssues = [];
      
      for (const [type, config] of Object.entries(enhancedPatterns)) {
        const matches = result.optimizedText.match(config.pattern);
        if (matches) {
          hasRemainingSensitiveData = true;
          remainingIssues.push({ type, matches });
        }
      }
      
      if (hasRemainingSensitiveData) {
        console.log('⚠️ Some sensitive data still present:', remainingIssues);
      } else {
        console.log('✅ All sensitive data successfully removed');
      }
      
      // Check for [REDACTED] tags (should not be present in smart rewrite)
      const hasRedactedTags = result.optimizedText.includes('[') && result.optimizedText.includes('_REDACTED]');
      if (hasRedactedTags) {
        console.log('❌ Found [REDACTED] tags in smart rewrite output - this suggests fallback occurred');
      } else {
        console.log('✅ No [REDACTED] tags found - proper natural language rewrite');
      }
      
      return {
        success: true,
        method: result.method,
        originalLength: testPrompt.length,
        rewrittenLength: result.optimizedText.length,
        cost: result.cost,
        hasSensitiveData: hasRemainingSensitiveData,
        hasRedactedTags: hasRedactedTags
      };
      
    } else {
      console.log('❌ FAILURE: Smart Rewrite fell back to:', result.method);
      console.log('🔍 This means the smart rewrite is not working properly');
      
      if (result.method.includes('fallback')) {
        console.log('💡 Possible reasons for fallback:');
        console.log('  - API key not properly initialized');
        console.log('  - OpenRouter API error or rate limit');
        console.log('  - Network connectivity issue');
        console.log('  - PromptOptimizer.enabled = false');
      }
      
      return {
        success: false,
        method: result.method,
        error: result.error,
        fallbackReason: 'smart_rewrite_not_triggered'
      };
    }
    
  } catch (error) {
    console.error('❌ Smart Rewrite Error:', {
      name: error.name,
      message: error.message,
      stack: error.stack?.substring(0, 200)
    });
    
    return {
      success: false,
      error: error.message,
      fallbackReason: 'exception_thrown'
    };
  }
}

// Quick test function for the exact user scenario
async function testUserScenario() {
  console.log('\n🎯 USER SCENARIO TEST');
  console.log('=' + '='.repeat(20));
  
  const userPrompt = "Hey ChatGPT, can you review this Python script? It connects to our internal repo at git.acme-corp.local, uses the API key sk-test-9843ghfs73, and sends a notification to julia.roberts@acme-corp.com. The server IP is 192.168.10.42, and our vault path is /secrets/prod/token.";
  
  console.log('🔍 Testing exact user scenario...');
  
  // Test with current PII_PATTERNS from content.js
  if (typeof PIIDetector !== 'undefined') {
    const currentDetection = PIIDetector.detectSensitiveData(userPrompt);
    console.log('📊 Current PII Detection:', currentDetection.map(p => p.type));
    
    if (currentDetection.length === 0) {
      console.log('❌ PROBLEM: Current PII patterns are not detecting the sensitive data!');
      console.log('💡 This explains why smart rewrite is not being triggered');
    }
  }
  
  // Test smart rewrite
  if (window.PromptOptimizer) {
    const optimizer = new window.PromptOptimizer();
    await optimizer.ensureInitialized();
    
    // Use enhanced PII detection for testing
    const enhancedPII = [
      { type: 'EMAIL', description: 'Email Address' },
      { type: 'API_KEY', description: 'API Key' },
      { type: 'IP_ADDRESS', description: 'IP Address' },
      { type: 'INTERNAL_REPO', description: 'Internal Repository' },
      { type: 'VAULT_PATH', description: 'Vault Path' }
    ];
    
    const result = await optimizer.smartRewrite(userPrompt, enhancedPII);
    
    console.log('📊 Result:', {
      method: result.method,
      success: result.method === 'smart_rewrite',
      preview: result.optimizedText?.substring(0, 100) + '...'
    });
    
    return result;
  }
  
  return false;
}

// Export test functions
window.finalSmartRewriteTest = finalSmartRewriteTest;
window.testUserScenario = testUserScenario;

console.log('🎯 Final test functions loaded:');
console.log('  - finalSmartRewriteTest() - Complete diagnostic');
console.log('  - testUserScenario() - Test exact user case');

// Auto-run the final test
setTimeout(() => {
  console.log('\n🚀 Auto-running Final Smart Rewrite Test...');
  finalSmartRewriteTest().then(result => {
    console.log('\n🏁 Final Test Complete. Success:', result?.success || false);
    if (!result?.success) {
      console.log('🔧 Recommendation: Run testUserScenario() to debug further');
    }
  }).catch(error => {
    console.error('🔥 Final test failed:', error);
  });
}, 2000); 