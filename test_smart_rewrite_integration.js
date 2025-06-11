/**
 * Comprehensive Smart Rewrite & Supabase Integration Test
 * Run this in the browser console on any AI platform (ChatGPT, Claude, etc.)
 */

async function testSmartRewriteIntegration() {
  console.log('🚀 TESTING SMART REWRITE & SUPABASE INTEGRATION');
  console.log('===============================================');
  
  const results = {
    optimizerInitialized: false,
    apiKeyConfigured: false,
    connectionTest: false,
    smartRewriteTest: false,
    supabaseLogging: false,
    errorDetails: []
  };
  
  try {
    // Step 1: Initialize PromptOptimizer
    console.log('\n📋 Step 1: Initializing PromptOptimizer...');
    
    if (typeof PromptOptimizer === 'undefined') {
      throw new Error('PromptOptimizer class not found. Make sure promptOptimizer.js is loaded.');
    }
    
    const optimizer = new PromptOptimizer();
    await optimizer.ensureInitialized();
    results.optimizerInitialized = true;
    
    console.log('✅ PromptOptimizer initialized successfully');
    console.log('   - API Key:', optimizer.apiKey ? `${optimizer.apiKey.substring(0, 12)}...` : 'NOT SET');
    console.log('   - Model:', optimizer.model);
    console.log('   - Enabled:', optimizer.enabled);
    console.log('   - Base URL:', optimizer.baseUrl);
    
    // Step 2: Verify API Key
    console.log('\n📋 Step 2: Verifying API Key Configuration...');
    
    if (!optimizer.apiKey) {
      throw new Error('API key not configured. Please set openRouterApiKey in Chrome storage.');
    }
    
    if (!optimizer.apiKey.startsWith('sk-or-v1-')) {
      throw new Error('Invalid API key format. Should start with "sk-or-v1-"');
    }
    
    results.apiKeyConfigured = true;
    console.log('✅ API key configured correctly');
    console.log('   - Key length:', optimizer.apiKey.length);
    console.log('   - Expected model:', optimizer.model);
    
    // Step 3: Test OpenRouter API Connection
    console.log('\n📋 Step 3: Testing OpenRouter API Connection...');
    
    try {
      const connectionResult = await optimizer.testConnection();
      results.connectionTest = true;
      console.log('✅ OpenRouter API connection successful');
      console.log('   - Response:', connectionResult.response);
      console.log('   - Usage:', connectionResult.usage);
      console.log('   - Model:', connectionResult.model);
    } catch (connectionError) {
      results.errorDetails.push(`Connection test failed: ${connectionError.message}`);
      console.error('❌ Connection test failed:', connectionError.message);
      throw connectionError;
    }
    
    // Step 4: Test Smart Rewrite with Sample Data
    console.log('\n📋 Step 4: Testing Smart Rewrite Functionality...');
    
    const testPrompt = "Hi, I need help with authentication. My email is john.doe@company.com and my API key is sk-test123456789abcdef. Can you help me debug this issue on server 192.168.1.100?";
    
    const testPII = [
      { type: 'EMAIL', description: 'Email Address', confidence: 'high' },
      { type: 'API_KEY', description: 'API Key', confidence: 'high' },
      { type: 'IP_ADDRESS', description: 'IP Address', confidence: 'medium' }
    ];
    
    console.log('📝 Original prompt:', testPrompt);
    console.log('🔍 Detected PII:', testPII.map(pii => pii.type));
    
    try {
      console.log('🤖 Calling smartRewrite...');
      const rewriteResult = await optimizer.smartRewrite(testPrompt, testPII);
      results.smartRewriteTest = true;
      
      console.log('✅ Smart rewrite successful!');
      console.log('   - Method:', rewriteResult.method);
      console.log('   - Original length:', testPrompt.length);
      console.log('   - Optimized length:', rewriteResult.optimizedText.length);
      console.log('   - Cost:', rewriteResult.cost);
      console.log('   - Model used:', rewriteResult.model);
      console.log('📝 Optimized prompt:', rewriteResult.optimizedText);
      
      if (rewriteResult.usage) {
        console.log('📊 Token usage:', rewriteResult.usage);
      }
      
    } catch (rewriteError) {
      results.errorDetails.push(`Smart rewrite failed: ${rewriteError.message}`);
      console.error('❌ Smart rewrite failed:', rewriteError.message);
      throw rewriteError;
    }
    
    // Step 5: Test Direct Prompt Event Logging
    console.log('\n📋 Step 5: Testing Direct Prompt Event Logging...');
    
    try {
      // Test logging a flagged prompt
      console.log('📤 Testing flagged prompt logging...');
      const flaggedResult = await optimizer.logPromptEvent(testPrompt, testPII, {
        model: optimizer.model,
        cost: 0.001,
        promptTokens: Math.ceil(testPrompt.length / 4)
      });
      
      if (flaggedResult) {
        console.log('✅ Flagged prompt logged successfully');
        console.log('   - Result:', flaggedResult);
      } else {
        console.warn('⚠️ Flagged prompt logging returned null (check authentication)');
      }
      
      // Test logging a clean prompt
      console.log('📤 Testing clean prompt logging...');
      const cleanPrompt = "Write a simple Python hello world program";
      const cleanResult = await optimizer.logPromptEvent(cleanPrompt, [], {
        model: optimizer.model,
        cost: 0,
        promptTokens: Math.ceil(cleanPrompt.length / 4)
      });
      
      if (cleanResult) {
        console.log('✅ Clean prompt logged successfully');
        console.log('   - Result:', cleanResult);
        results.supabaseLogging = true;
      } else {
        console.warn('⚠️ Clean prompt logging returned null (check authentication)');
      }
      
    } catch (loggingError) {
      results.errorDetails.push(`Supabase logging failed: ${loggingError.message}`);
      console.error('❌ Supabase logging failed:', loggingError.message);
    }
    
    // Step 6: Check Authentication Status
    console.log('\n📋 Step 6: Checking User Authentication...');
    
    try {
      const storage = await chrome.storage.local.get(['complyzeUserUUID', 'complyzeUserEmail']);
      
      if (storage.complyzeUserUUID && storage.complyzeUserEmail) {
        console.log('✅ User authenticated');
        console.log('   - Email:', storage.complyzeUserEmail);
        console.log('   - UUID:', storage.complyzeUserUUID.substring(0, 8) + '...');
      } else {
        console.warn('⚠️ User not authenticated - this may affect Supabase logging');
        console.warn('💡 Please login through the Complyze sidebar to enable full logging');
      }
      
      // Check sidebar authentication as backup
      if (window.complyzeSidebar && window.complyzeSidebar.isUserAuthenticated()) {
        console.log('✅ Sidebar authentication also active');
        console.log('   - Sidebar email:', window.complyzeSidebar.userEmail);
      }
      
    } catch (authError) {
      console.warn('⚠️ Could not check authentication status:', authError.message);
    }
    
    // Step 7: Summary and Recommendations
    console.log('\n📋 Step 7: Test Summary & Recommendations');
    console.log('==========================================');
    
    console.log('📊 Test Results:');
    console.log('   ✅ Optimizer Initialized:', results.optimizerInitialized);
    console.log('   ✅ API Key Configured:', results.apiKeyConfigured);
    console.log('   ✅ Connection Test:', results.connectionTest);
    console.log('   ✅ Smart Rewrite Test:', results.smartRewriteTest);
    console.log('   ✅ Supabase Logging:', results.supabaseLogging);
    
    if (results.errorDetails.length > 0) {
      console.log('\n❌ Errors encountered:');
      results.errorDetails.forEach((error, index) => {
        console.log(`   ${index + 1}. ${error}`);
      });
    }
    
    const allTestsPassed = results.optimizerInitialized && 
                          results.apiKeyConfigured && 
                          results.connectionTest && 
                          results.smartRewriteTest;
    
    if (allTestsPassed) {
      console.log('\n🎉 ALL CORE TESTS PASSED!');
      console.log('🔗 Check your Supabase dashboard:');
      console.log('   https://supabase.com/dashboard/project/likskioavtpnskrfxbqa/editor');
      
      if (results.supabaseLogging) {
        console.log('✅ Smart rewrite + Supabase logging is working perfectly!');
      } else {
        console.log('⚠️ Smart rewrite works, but check Supabase logging (may need authentication)');
      }
    } else {
      console.log('\n❌ Some tests failed. Check the errors above.');
    }
    
    return results;
    
  } catch (error) {
    console.error('❌ Test suite failed:', error.message);
    results.errorDetails.push(`Test suite error: ${error.message}`);
    return results;
  }
}

// Quick test function for just smart rewrite
async function quickSmartRewriteTest() {
  console.log('🚀 QUICK SMART REWRITE TEST');
  console.log('===========================');
  
  try {
    const optimizer = new PromptOptimizer();
    await optimizer.ensureInitialized();
    
    const testText = "My email is test@example.com and my API key is sk-abc123";
    const testPII = [
      { type: 'EMAIL', description: 'Email Address' },
      { type: 'API_KEY', description: 'API Key' }
    ];
    
    console.log('📝 Original:', testText);
    
    const result = await optimizer.smartRewrite(testText, testPII);
    
    console.log('✅ Rewritten:', result.optimizedText);
    console.log('💰 Cost:', result.cost);
    console.log('🔧 Method:', result.method);
    
    return result;
    
  } catch (error) {
    console.error('❌ Quick test failed:', error);
    return null;
  }
}

// Make functions available globally
window.testSmartRewriteIntegration = testSmartRewriteIntegration;
window.quickSmartRewriteTest = quickSmartRewriteTest;

console.log('🧪 Smart Rewrite Integration Test Loaded!');
console.log('📋 Available functions:');
console.log('   - testSmartRewriteIntegration() - Full integration test');
console.log('   - quickSmartRewriteTest() - Quick rewrite test');
console.log('');
console.log('💡 Run testSmartRewriteIntegration() to start the full test'); 