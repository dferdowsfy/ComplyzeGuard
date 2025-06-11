/**
 * Smart Rewrite Debug Test
 * Comprehensive test to identify and fix smart rewrite issues
 */

console.log('🔧 Loading Smart Rewrite Debug Test...');

// First, let's enhance the PII detection patterns to catch all the missing data
const ENHANCED_PII_PATTERNS = {
  CREDIT_CARD: {
    pattern: /\b(?:4[0-9]{12}(?:[0-9]{3})?|5[1-5][0-9]{14}|3[47][0-9]{13}|3[0-9]{13}|6(?:011|5[0-9]{2})[0-9]{12})\b/g,
    description: 'Credit Card Number',
    riskLevel: 'high',
    riskType: 'financial'
  },
  SSN: {
    pattern: /\b(?:\d{3}-?\d{2}-?\d{4})\b/g,
    description: 'Social Security Number',
    riskLevel: 'high',
    riskType: 'personal_id'
  },
  EMAIL: {
    pattern: /\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b/g,
    description: 'Email Address',
    riskLevel: 'medium',
    riskType: 'contact'
  },
  PHONE: {
    pattern: /\b(?:\+?1[-.\s]?)?\(?([0-9]{3})\)?[-.\s]?([0-9]{3})[-.\s]?([0-9]{4})\b/g,
    description: 'Phone Number',
    riskLevel: 'medium',
    riskType: 'contact'
  },
  IP_ADDRESS: {
    pattern: /\b(?:(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.){3}(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\b/g,
    description: 'IP Address',
    riskLevel: 'low',
    riskType: 'technical'
  },
  API_KEY: {
    pattern: /\b(?:sk-|pk_|rk_|ak_|ey_|key_)[a-zA-Z0-9]{10,64}\b/g,
    description: 'API Key',
    riskLevel: 'high',
    riskType: 'security'
  },
  // Enhanced patterns for missing detections
  INTERNAL_REPO: {
    pattern: /\b(?:git|repo|repository)\.[\w\-]+\.(?:local|internal|corp|company)\b/gi,
    description: 'Internal Repository',
    riskLevel: 'medium',
    riskType: 'company_internal'
  },
  VAULT_PATH: {
    pattern: /\/[\w\-\/]+(?:secrets|vault|token|creds?)[\w\-\/]*/gi,
    description: 'Vault/Secret Path',
    riskLevel: 'high',
    riskType: 'security'
  },
  INTERNAL_DOMAIN: {
    pattern: /\b[\w\-]+\.(?:local|internal|corp|company)\b/gi,
    description: 'Internal Domain',
    riskLevel: 'medium',
    riskType: 'company_internal'
  }
};

async function debugSmartRewrite() {
  console.log('\n🔍 SMART REWRITE DEBUG ANALYSIS');
  console.log('=' + '='.repeat(35));
  
  // Test prompt with all types of sensitive data
  const testPrompt = "Hey ChatGPT, can you review this Python script? It connects to our internal repo at git.acme-corp.local, uses the API key sk-test-9843ghfs73, and sends a notification to julia.roberts@acme-corp.com. The server IP is 192.168.10.42, and our vault path is /secrets/prod/token.";
  
  console.log('📝 Test prompt:', testPrompt);
  console.log('');
  
  // Step 1: Test enhanced PII detection
  console.log('🔍 Step 1: Enhanced PII Detection');
  const enhancedPII = [];
  for (const [type, config] of Object.entries(ENHANCED_PII_PATTERNS)) {
    const matches = testPrompt.match(config.pattern);
    if (matches) {
      console.log(`✅ Found ${type}:`, matches);
      enhancedPII.push({
        type: type,
        description: config.description,
        riskLevel: config.riskLevel,
        riskType: config.riskType,
        matches: matches
      });
    }
  }
  console.log('📊 Total Enhanced PII detected:', enhancedPII.length);
  console.log('');
  
  // Step 2: Check PromptOptimizer availability and initialization
  console.log('🔧 Step 2: PromptOptimizer Status Check');
  if (!window.PromptOptimizer) {
    console.error('❌ PromptOptimizer class not found');
    return false;
  }
  
  const optimizer = new window.PromptOptimizer();
  console.log('✅ PromptOptimizer instance created');
  
  // Force initialization and debug
  console.log('⏳ Forcing initialization...');
  await optimizer.ensureInitialized();
  
  console.log('📊 Post-initialization status:', {
    enabled: optimizer.enabled,
    hasApiKey: !!optimizer.apiKey,
    apiKeyLength: optimizer.apiKey?.length,
    apiKeyPrefix: optimizer.apiKey?.substring(0, 12),
    model: optimizer.model,
    baseUrl: optimizer.baseUrl,
    initialized: optimizer.initialized
  });
  
  // Step 3: Test API connection directly
  console.log('\n🌐 Step 3: Direct API Connection Test');
  try {
    const connectionTest = await optimizer.testConnection();
    console.log('✅ API connection successful:', {
      model: connectionTest.model,
      response: connectionTest.response?.substring(0, 50)
    });
  } catch (error) {
    console.error('❌ API connection failed:', {
      error: error.message,
      name: error.name,
      stack: error.stack?.substring(0, 200)
    });
    return false;
  }
  
  // Step 4: Test Smart Rewrite with debug logging
  console.log('\n🤖 Step 4: Smart Rewrite Execution Test');
  
  // Enable detailed logging
  const originalConsoleLog = console.log;
  let logBuffer = [];
  
  console.log = function(...args) {
    logBuffer.push(args.join(' '));
    originalConsoleLog.apply(console, args);
  };
  
  try {
    const rewriteResult = await optimizer.smartRewrite(testPrompt, enhancedPII);
    
    // Restore console.log
    console.log = originalConsoleLog;
    
    console.log('📊 Smart Rewrite Result:', {
      method: rewriteResult.method,
      hasOptimizedText: !!rewriteResult.optimizedText,
      optimizedLength: rewriteResult.optimizedText?.length,
      cost: rewriteResult.cost,
      model: rewriteResult.model,
      error: rewriteResult.error
    });
    
    if (rewriteResult.method === 'smart_rewrite') {
      console.log('✅ SUCCESS: Smart rewrite worked correctly');
      console.log('📝 Result preview:', rewriteResult.optimizedText.substring(0, 150) + '...');
      
      // Check if all PII was removed
      const remainingPII = [];
      for (const [type, config] of Object.entries(ENHANCED_PII_PATTERNS)) {
        const matches = rewriteResult.optimizedText.match(config.pattern);
        if (matches) {
          remainingPII.push({ type, matches });
        }
      }
      
      if (remainingPII.length === 0) {
        console.log('✅ All PII successfully removed');
      } else {
        console.log('⚠️ Some PII still present:', remainingPII);
      }
      
    } else {
      console.log('❌ FAILURE: Smart rewrite fell back to:', rewriteResult.method);
      console.log('🔍 Debug logs from execution:');
      logBuffer.forEach((log, i) => console.log(`  ${i + 1}: ${log}`));
      
      // Analyze why fallback occurred
      if (rewriteResult.method.includes('fallback')) {
        console.log('💡 Fallback Analysis:');
        console.log('  - Check enabled status:', optimizer.enabled);
        console.log('  - Check API key presence:', !!optimizer.apiKey);
        console.log('  - Check initialization:', optimizer.initialized);
        console.log('  - Check error:', rewriteResult.error);
      }
    }
    
    return rewriteResult;
    
  } catch (error) {
    // Restore console.log
    console.log = originalConsoleLog;
    
    console.error('❌ Smart rewrite threw an error:', {
      name: error.name,
      message: error.message,
      stack: error.stack?.substring(0, 300)
    });
    
    console.log('🔍 Debug logs from failed execution:');
    logBuffer.forEach((log, i) => console.log(`  ${i + 1}: ${log}`));
    
    return false;
  }
}

// Manual test function with step-by-step debugging
async function manualSmartRewriteTest() {
  console.log('\n🧪 MANUAL SMART REWRITE TEST');
  console.log('=' + '='.repeat(30));
  
  const testText = "Hey ChatGPT, can you review this Python script? It connects to our internal repo at git.acme-corp.local, uses the API key sk-test-9843ghfs73, and sends a notification to julia.roberts@acme-corp.com. The server IP is 192.168.10.42, and our vault path is /secrets/prod/token.";
  
  // Test enhanced PII detection
  const enhancedPII = [];
  for (const [type, config] of Object.entries(ENHANCED_PII_PATTERNS)) {
    const matches = testText.match(config.pattern);
    if (matches) {
      enhancedPII.push({
        type: type,
        description: config.description,
        riskLevel: config.riskLevel,
        riskType: config.riskType,
        matches: matches
      });
    }
  }
  
  console.log('🔍 Enhanced PII Detection Results:');
  enhancedPII.forEach(pii => {
    console.log(`  - ${pii.type}: ${pii.description} (${pii.matches.join(', ')})`);
  });
  
  if (enhancedPII.length === 0) {
    console.log('❌ No PII detected with enhanced patterns - this is the problem!');
    return false;
  }
  
  // Test if PromptOptimizer is properly configured
  if (window.PromptOptimizer) {
    const optimizer = new window.PromptOptimizer();
    await optimizer.ensureInitialized();
    
    console.log('\n🤖 Testing with properly detected PII...');
    const result = await optimizer.smartRewrite(testText, enhancedPII);
    
    console.log('📊 Result:', {
      method: result.method,
      preview: result.optimizedText?.substring(0, 100) + '...'
    });
    
    return result;
  }
  
  return false;
}

// Export enhanced patterns to global scope
window.ENHANCED_PII_PATTERNS = ENHANCED_PII_PATTERNS;

// Test functions
window.debugSmartRewrite = debugSmartRewrite;
window.manualSmartRewriteTest = manualSmartRewriteTest;

console.log('🔧 Debug functions loaded:');
console.log('  - debugSmartRewrite() - Full diagnostic test');
console.log('  - manualSmartRewriteTest() - Manual test with enhanced PII detection');
console.log('  - window.ENHANCED_PII_PATTERNS - Enhanced detection patterns');

// Auto-run the debug
setTimeout(() => {
  console.log('\n🚀 Auto-running Smart Rewrite Debug...');
  debugSmartRewrite().then(result => {
    console.log('\n🏁 Debug Complete. Result:', !!result);
  }).catch(error => {
    console.error('🔥 Debug failed:', error);
  });
}, 1000); 